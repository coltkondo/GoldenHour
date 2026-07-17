"""
Shared logic for approving/rejecting a submission.
Called by both the v1 submissions router and the admin submissions router.
"""

from datetime import datetime, timezone

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
from app.models.point_transaction import PointTransaction
from app.schemas.submission import ReviewAction, SubmissionResponse
from app.schemas.submission_data import VenueData, DealData
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
            _apply_submission(sub, db)
            logger.bind(submission_id=str(sub.id)).info("submission_applied")

            points = 0
            if settings.REWARDS_ENABLED:
                points = POINTS_CONFIG.get(sub.submission_type, 0)
                if points > 0:
                    submitter = db.query(User).filter(User.id == sub.user_id).first()
                    market = db.query(Market).filter(Market.id == submitter.market_id).first() if submitter else None
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


def _apply_submission(sub: Submission, db: Session) -> None:
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
        submitter = db.query(User).filter(User.id == sub.user_id).first()
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
        deal = Deal(**_validated_deal(data))
        db.add(deal)

    elif sub.submission_type == "deal_expired":
        deal = _get_deal(sub, db)
        deal.active = False

    elif sub.submission_type == "deal_update":
        deal = _get_deal(sub, db)
        for k, v in _validated_deal(data).items():
            setattr(deal, k, v)


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
