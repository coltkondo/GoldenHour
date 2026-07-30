"""
Shared logic for approving/rejecting a submission.
Called by both the v1 submissions router and the admin submissions router.
"""

from datetime import datetime, timezone, date as dt_date, timedelta, time as dt_time
import uuid as uuid_module
import calendar as _calendar

from fastapi import HTTPException
from pydantic import ValidationError as PydanticValidationError
from sqlalchemy import update as sa_update, func as sa_func
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.points_config import POINTS_CONFIG

from app.models.market import Market
from app.models.submission import Submission
from app.models.user import User
from app.models.venue import Venue
from app.models.deal import Deal
from app.models.happy_hour import HappyHourSchedule
from app.models.event import Event
from app.models.event_schedule import EventSchedule
from app.models.point_transaction import PointTransaction
from app.schemas.submission import ReviewAction, SubmissionResponse
from app.schemas.submission_data import VenueData, DealData, EventData
from app.core.logging import logger
from app.services.geocoding import geocode


def _points_earned_today(user_id, db: Session) -> int:
    """Sum points awarded to a user since midnight UTC today."""
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    total = db.query(sa_func.coalesce(sa_func.sum(PointTransaction.points), 0)).filter(
        PointTransaction.user_id == user_id,
        PointTransaction.created_at >= today_start,
        PointTransaction.points > 0,
    ).scalar()
    return total


def _validated_venue(data: dict) -> dict:
    """Validate and allowlist venue fields from submitted_data.

    VenueData.extra='ignore' strips unknown keys; Field constraints enforce
    lat/lon ranges, string lengths, and price_level/rating bounds.
    Raises HTTP 422 with a structured message on invalid values.
    """
    try:
        return VenueData(**data).model_dump(exclude_none=True)
    except PydanticValidationError as exc:
        raise HTTPException(status_code=422, detail=exc.errors())


def _validated_deal(data: dict) -> dict:
    """Validate and allowlist deal fields from submitted_data."""
    try:
        return DealData(**data).model_dump(exclude_none=True)
    except PydanticValidationError as exc:
        raise HTTPException(status_code=422, detail=exc.errors())


def review_submission(
    submission_id, action: ReviewAction, reviewer: User, db: Session
) -> SubmissionResponse:
    logger.bind(
        submission_id=str(submission_id),
        reviewer_id=str(reviewer.id),
        reviewer_role=reviewer.role,
        action=action.status,
    ).info("review_action_initiated")

    sub = (
        db.query(Submission)
        .filter(Submission.id == submission_id)
        .with_for_update()
        .first()
    )
    if not sub:
        logger.bind(submission_id=str(submission_id)).warning("submission_not_found")
        raise HTTPException(status_code=404, detail="Submission not found")

    if sub.status != "pending":
        logger.bind(
            submission_id=str(submission_id), current_status=sub.status
        ).warning("submission_already_reviewed")
        raise HTTPException(
            status_code=409, detail="Submission has already been reviewed"
        )

    try:
        sub.status = action.status
        sub.admin_notes = action.admin_notes
        sub.reviewed_by = reviewer.id
        sub.reviewed_at = datetime.now(timezone.utc)

        if action.status == "approved":
            logger.bind(
                submission_id=str(sub.id), submission_type=sub.submission_type
            ).info("approving_submission")

            submitter = db.query(User).filter(User.id == sub.user_id).first()
            market = db.query(Market).filter(Market.id == submitter.market_id).first() if submitter else None

            _apply_submission(sub, db, submitter)
            logger.bind(submission_id=str(sub.id)).info("submission_applied")

            points = 0
            if settings.REWARDS_ENABLED:
                points = POINTS_CONFIG.get(sub.submission_type, 0)
                if sub.is_flagged_duplicate:
                    points = POINTS_CONFIG.get("corroborate", 2)
                if points > 0:
                    daily_cap = market.daily_points_cap if market else 200
                    earned_today = _points_earned_today(sub.user_id, db)
                    if earned_today >= daily_cap:
                        points = 0
                        logger.bind(
                            user_id=str(sub.user_id),
                            earned_today=earned_today,
                            cap=daily_cap,
                        ).info("daily_cap_reached")
                    elif earned_today + points > daily_cap:
                        points = daily_cap - earned_today
                        logger.bind(
                            user_id=str(sub.user_id),
                            reduced_to=points,
                        ).info("daily_cap_partial")

            sub.points_awarded = points

            if points > 0:
                result = db.execute(
                    sa_update(User)
                    .where(User.id == sub.user_id)
                    .values(points_balance=User.points_balance + points)
                    .execution_options(synchronize_session="fetch")
                )
                if result.rowcount > 0:
                    tx = PointTransaction(
                        user_id=sub.user_id,
                        submission_id=sub.id,
                        points=points,
                        transaction_type="submission_approved",
                        description=f"Approved: {sub.submission_type.replace('_', ' ').title()}",
                    )
                    db.add(tx)
                    logger.bind(
                        user_id=str(sub.user_id),
                        submission_id=str(sub.id),
                        points=points,
                    ).info("points_awarded")

        db.commit()
        db.refresh(sub)
        return SubmissionResponse.from_orm_with_username(sub)
    except Exception as e:
        db.rollback()
        logger.bind(
            submission_id=str(submission_id), error=str(e), traceback=True
        ).error("submission_review_failed")
        raise


def _apply_submission(sub: Submission, db: Session, submitter: User | None = None) -> None:
    """Auto-apply the change described by the approved submission.

    Only fields in the whitelists are accepted from submitted_data.
    Fields like verified, active, id, created_at, updated_at are excluded
    to prevent privilege escalation through crafted submissions.
    """
    data = sub.submitted_data or {}

    if sub.submission_type == "new_bar":
        venue_fields = _validated_venue(data)
        if not venue_fields.get("latitude") and venue_fields.get("name") and venue_fields.get("address"):
            coords = geocode(venue_fields["name"], venue_fields["address"])
            if coords:
                venue_fields["latitude"], venue_fields["longitude"] = coords
                logger.bind(name=venue_fields["name"], lat=coords[0], lon=coords[1]).info("venue_geocoded")
        if submitter:
            venue_fields["market_id"] = submitter.market_id
        venue = Venue(**venue_fields)
        db.add(venue)

    elif sub.submission_type == "bar_closed":
        venue = _get_venue(sub, db)
        venue.active = False

    elif sub.submission_type == "bar_update":
        venue = _get_venue(sub, db)
        for k, v in _validated_venue(data).items():
            setattr(venue, k, v)

    elif sub.submission_type == "new_deal":
        deal_fields = _validated_deal(data)
        # Mobile sends bar_id; DealData allowlists venue_id — resolve whichever is present
        if not deal_fields.get("venue_id"):
            raw_venue_id = data.get("bar_id") or sub.related_bar_id
            if raw_venue_id:
                deal_fields["venue_id"] = str(raw_venue_id)
        if not deal_fields.get("venue_id"):
            raise HTTPException(status_code=422, detail="venue_id or bar_id required for new_deal submission")
        deal = Deal(**deal_fields)
        db.add(deal)
        db.flush()  # populate deal.id before schedule rows reference it
        _create_deal_schedules(deal, data, db)

    elif sub.submission_type == "deal_expired":
        deal = _get_deal(sub, db)
        deal.active = False
        _remove_deal_from_schedules(deal.id, deal.venue_id, db)

    elif sub.submission_type == "deal_update":
        deal = _get_deal(sub, db)
        for k, v in _validated_deal(data).items():
            setattr(deal, k, v)

    elif sub.submission_type == "new_event":
        try:
            event_data = EventData(**data)
        except Exception as exc:
            raise HTTPException(status_code=422, detail=str(exc))

        if not event_data.bar_id:
            raise HTTPException(status_code=422, detail="bar_id required for new_event submission")
        if not event_data.event_name:
            raise HTTPException(status_code=422, detail="event_name required for new_event submission")
        if not event_data.start_time:
            raise HTTPException(status_code=422, detail="start_time required for new_event submission")

        venue = db.query(Venue).filter(Venue.id == event_data.bar_id).first()
        if not venue:
            raise HTTPException(status_code=404, detail="Venue not found for new_event submission")

        recurrence_type = (event_data.recurrence_type or "once").lower()

        if recurrence_type in ("weekly", "biweekly"):
            valid_days = [d for d in (event_data.days or []) if d.lower() in _DAY_NAME_TO_INT]
            if not valid_days:
                raise HTTPException(status_code=422, detail="At least one valid day is required for weekly/biweekly events")
        elif recurrence_type == "monthly":
            if event_data.day_of_month is None:
                raise HTTPException(status_code=422, detail="day_of_month required for monthly events")
        else:
            if not event_data.event_date:
                raise HTTPException(status_code=422, detail="event_date required for one-time/custom event submission")

        try:
            if recurrence_type in ("weekly", "biweekly", "monthly"):
                _create_recurring_events(event_data, venue, recurrence_type, db)
            else:
                _create_event_occurrence(event_data, venue, db)
        except ValueError as exc:
            raise HTTPException(status_code=422, detail=f"Invalid date/time format: {exc}")

        logger.bind(venue_id=str(venue.id), event_name=event_data.event_name, recurrence=recurrence_type).info("event_created_from_submission")


_DAY_NAME_TO_INT = {
    "monday": 0, "tuesday": 1, "wednesday": 2, "thursday": 3,
    "friday": 4, "saturday": 5, "sunday": 6,
}


# ── Event occurrence helpers ──────────────────────────────────────────────────

def _parse_event_date(date_str: str) -> dt_date:
    """Accept YYYY-MM-DD (ISO) or MM/DD/YYYY."""
    try:
        return dt_date.fromisoformat(date_str)
    except ValueError:
        return datetime.strptime(date_str, "%m/%d/%Y").date()


def _parse_time_t(time_str: str) -> dt_time:
    h, m = map(int, time_str.split(":"))
    return dt_time(h, m)


def _eastern_today() -> dt_date:
    """Calendar date in the venues' local timezone, not the server's (Railway runs UTC)."""
    from zoneinfo import ZoneInfo
    return datetime.now(ZoneInfo("America/New_York")).date()


def _weekly_dates(day_of_week: int, count: int = 13) -> list[dt_date]:
    today = _eastern_today()
    diff = (day_of_week - today.weekday()) % 7
    first = today + timedelta(days=diff)
    return [first + timedelta(weeks=i) for i in range(count)]


def _biweekly_dates(day_of_week: int, count: int = 7) -> list[dt_date]:
    return _weekly_dates(day_of_week, count * 2)[::2][:count]


def _monthly_dates(day_of_month: int, count: int = 3) -> list[dt_date]:
    today = _eastern_today()
    results = []
    year, month = today.year, today.month
    while len(results) < count:
        last_day = _calendar.monthrange(year, month)[1]
        candidate = dt_date(year, month, min(day_of_month, last_day))
        if candidate >= today:
            results.append(candidate)
        if month == 12:
            year, month = year + 1, 1
        else:
            month += 1
    return results


def _build_event(venue_id, event_data, start_dt, end_dt, series_id=None) -> Event:
    desc = event_data.description or event_data.notes
    return Event(
        venue_id=venue_id,
        name=event_data.event_name,
        event_type=event_data.event_type,
        description=desc,
        start_datetime=start_dt,
        end_datetime=end_dt,
        series_id=series_id,
        is_recurring=series_id is not None,
        verified=True,
        source="user",
    )


def _create_event_occurrence(event_data, venue: Venue, db: Session, occurrence_date=None, series_id=None):
    from zoneinfo import ZoneInfo
    eastern = ZoneInfo("America/New_York")

    d = occurrence_date or _parse_event_date(event_data.event_date)
    start_t = _parse_time_t(event_data.start_time)
    start_dt = datetime(d.year, d.month, d.day, start_t.hour, start_t.minute, tzinfo=eastern)

    end_dt = None
    if event_data.end_time:
        end_t = _parse_time_t(event_data.end_time)
        end_dt = datetime(d.year, d.month, d.day, end_t.hour, end_t.minute, tzinfo=eastern)

    db.add(_build_event(venue.id, event_data, start_dt, end_dt, series_id))


def _create_recurring_events(event_data, venue: Venue, recurrence_type: str, db: Session):
    series_id = uuid_module.uuid4()
    start_t = _parse_time_t(event_data.start_time) if event_data.start_time else dt_time(19, 0)
    end_t = _parse_time_t(event_data.end_time) if event_data.end_time else None

    occurrence_dates: list[dt_date] = []

    if recurrence_type in ("weekly", "biweekly"):
        for day_name in [n.lower() for n in (event_data.days or [])]:
            day_int = _DAY_NAME_TO_INT.get(day_name)
            if day_int is None:
                continue
            dates = _weekly_dates(day_int) if recurrence_type == "weekly" else _biweekly_dates(day_int)
            occurrence_dates.extend(dates)
            db.add(EventSchedule(
                venue_id=venue.id,
                series_id=series_id,
                name=event_data.event_name,
                event_type=event_data.event_type,
                description=event_data.description or event_data.notes,
                recurrence_type=recurrence_type,
                day_of_week=day_int,
                start_time=start_t,
                end_time=end_t,
            ))

    elif recurrence_type == "monthly":
        day_of_month = event_data.day_of_month or 1
        occurrence_dates = _monthly_dates(day_of_month)
        db.add(EventSchedule(
            venue_id=venue.id,
            series_id=series_id,
            name=event_data.event_name,
            event_type=event_data.event_type,
            description=event_data.description or event_data.notes,
            recurrence_type="monthly",
            day_of_month=day_of_month,
            start_time=start_t,
            end_time=end_t,
        ))

    from zoneinfo import ZoneInfo
    eastern = ZoneInfo("America/New_York")
    for occ_date in sorted(set(occurrence_dates)):
        start_dt = datetime(occ_date.year, occ_date.month, occ_date.day, start_t.hour, start_t.minute, tzinfo=eastern)
        end_dt = None
        if end_t:
            end_dt = datetime(occ_date.year, occ_date.month, occ_date.day, end_t.hour, end_t.minute, tzinfo=eastern)
        db.add(_build_event(venue.id, event_data, start_dt, end_dt, series_id))


def _remove_deal_from_schedules(deal_id, venue_id, db: Session) -> None:
    """Remove an expired deal from all schedule deal_ids arrays.
    Deactivates any schedule that becomes empty — keeps admin-managed
    schedules alive as long as they still have other deals.
    """
    schedules = (
        db.query(HappyHourSchedule)
        .filter(
            HappyHourSchedule.venue_id == venue_id,
            HappyHourSchedule.deal_ids.contains([deal_id]),
        )
        .all()
    )
    for schedule in schedules:
        remaining = [d for d in (schedule.deal_ids or []) if d != deal_id]
        if remaining:
            schedule.deal_ids = remaining
        else:
            schedule.active = False
            schedule.deal_ids = []
    if schedules:
        logger.bind(deal_id=str(deal_id), schedules_updated=len(schedules)).info(
            "deal_removed_from_schedules"
        )


def _create_deal_schedules(deal: Deal, data: dict, db: Session) -> None:
    """Create or update HappyHourSchedule rows from the schedule fields the mobile submitted."""
    from datetime import time as dt_time

    days = [d.lower() for d in (data.get("days") or [])]
    if not days:
        return

    is_all_day = data.get("is_all_day", False)
    start_str = data.get("start_time")
    end_str = data.get("end_time")

    if is_all_day or not start_str or not end_str:
        # No venue opening hours stored yet — default to a wide window
        start_t = dt_time(11, 0)
        end_t = dt_time(23, 59)
    else:
        try:
            sh, sm = map(int, start_str.split(":"))
            eh, em = map(int, end_str.split(":"))
            start_t, end_t = dt_time(sh, sm), dt_time(eh, em)
        except (ValueError, AttributeError):
            logger.bind(deal_id=str(deal.id), start=start_str, end=end_str).warning(
                "deal_schedule_unparseable_time"
            )
            return

    if start_t >= end_t:
        logger.bind(deal_id=str(deal.id), start=str(start_t), end=str(end_t)).warning(
            "deal_schedule_invalid_window"
        )
        return

    for day_name in days:
        day_int = _DAY_NAME_TO_INT.get(day_name)
        if day_int is None:
            continue

        existing = (
            db.query(HappyHourSchedule)
            .filter(
                HappyHourSchedule.venue_id == deal.venue_id,
                HappyHourSchedule.day_of_week == day_int,
                HappyHourSchedule.start_time == start_t,
                HappyHourSchedule.end_time == end_t,
                HappyHourSchedule.active.is_(True),
            )
            .first()
        )

        if existing:
            current_ids = list(existing.deal_ids or [])
            if deal.id not in current_ids:
                existing.deal_ids = current_ids + [deal.id]
        else:
            db.add(HappyHourSchedule(
                venue_id=deal.venue_id,
                day_of_week=day_int,
                start_time=start_t,
                end_time=end_t,
                deal_ids=[deal.id],
            ))

    logger.bind(deal_id=str(deal.id), days=days).info("deal_schedules_created")


def _get_venue(sub: Submission, db: Session) -> Venue:
    venue_id = sub.related_bar_id or sub.submitted_data.get("venue_id")
    if not venue_id:
        raise HTTPException(
            status_code=422, detail="related_bar_id required for this submission type"
        )
    venue = db.query(Venue).filter(Venue.id == venue_id).first()
    if not venue:
        raise HTTPException(status_code=404, detail="Related venue not found")
    return venue


def _get_deal(sub: Submission, db: Session) -> Deal:
    deal_id = sub.related_deal_id or sub.submitted_data.get("deal_id")
    if not deal_id:
        raise HTTPException(
            status_code=422, detail="related_deal_id required for this submission type"
        )
    deal = db.query(Deal).filter(Deal.id == deal_id).first()
    if not deal:
        raise HTTPException(status_code=404, detail="Related deal not found")
    return deal
