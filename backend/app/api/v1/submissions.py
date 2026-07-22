from datetime import date, datetime, timezone
from difflib import SequenceMatcher

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy import func as sa_func, update as sa_update
from sqlalchemy.orm import Session, joinedload
from typing import List
from uuid import UUID

from app.core.database import get_db
from app.core.limiter import limiter
from app.core.points_config import POINTS_CONFIG
from app.core.security import get_current_user
from app.models.corroboration import Corroboration
from app.models.deal import Deal
from app.models.point_transaction import PointTransaction
from app.models.submission import Submission
from app.models.user import User
from app.models.venue import Venue
from app.schemas.submission import SubmissionCreate, SubmissionResponse


def _similarity(a: str, b: str) -> float:
    return SequenceMatcher(None, a.lower().strip(), b.lower().strip()).ratio()


def _is_duplicate(data: SubmissionCreate, db: Session) -> bool:
    """Return True if this new_deal submission likely duplicates an existing deal or pending submission."""
    if data.submission_type != "new_deal":
        return False

    bar_name = (data.submitted_data.get("bar_name") or "").strip()
    title = (data.submitted_data.get("title") or "").strip()
    if not bar_name or not title:
        return False

    # Find the best-matching venue by name or nickname
    venues = db.query(Venue).filter(Venue.active == True).all()
    matched_venue = None
    best_score = 0.0
    for v in venues:
        score = max(
            _similarity(bar_name, v.name),
            _similarity(bar_name, v.nickname) if v.nickname else 0,
        )
        if score > best_score:
            best_score = score
            matched_venue = v

    if best_score < 0.75 or matched_venue is None:
        return False

    # Check active deals at that venue for a similar title
    active_deals = db.query(Deal).filter(Deal.venue_id == matched_venue.id, Deal.active == True).all()
    for deal in active_deals:
        if _similarity(title, deal.title) >= 0.80:
            return True

    # Check other pending new_deal submissions for the same bar + title
    pending = db.query(Submission).filter(
        Submission.submission_type == "new_deal",
        Submission.status == "pending",
    ).all()
    for sub in pending:
        sub_bar = (sub.submitted_data.get("bar_name") or "").strip()
        sub_title = (sub.submitted_data.get("title") or "").strip()
        if _similarity(bar_name, sub_bar) >= 0.75 and _similarity(title, sub_title) >= 0.80:
            return True

    return False

router = APIRouter(prefix="/submissions", tags=["submissions"])


@router.post("/", response_model=SubmissionResponse, status_code=201)
@limiter.limit("10/minute")
def create_submission(
    request: Request,
    data: SubmissionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Submit a new deal, flag, or report. Requires authentication."""
    sub = Submission(
        user_id=current_user.id,
        submission_type=data.submission_type,
        submitted_data=data.submitted_data,
        related_bar_id=data.related_bar_id,
        related_deal_id=data.related_deal_id,
        is_flagged_duplicate=_is_duplicate(data, db),
    )
    db.add(sub)
    db.commit()
    db.refresh(sub)
    return SubmissionResponse.from_orm_with_username(sub)


@router.post("/corroborate/{deal_id}", status_code=200)
@limiter.limit("30/minute")
def corroborate_deal(
    request: Request,
    deal_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Confirm a deal is still accurate. Awards 2 pts instantly, once per deal per day."""
    deal = db.query(Deal).filter(Deal.id == deal_id, Deal.active == True).first()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found or inactive")

    # Self-corroboration guard — block if user has an approved submission linked to this deal
    self_sub = db.query(Submission).filter(
        Submission.user_id == current_user.id,
        Submission.related_deal_id == deal_id,
        Submission.status == "approved",
    ).first()
    if self_sub:
        raise HTTPException(status_code=403, detail="You cannot corroborate a deal you submitted")

    today = date.today()
    existing = db.query(Corroboration).filter(
        Corroboration.user_id == current_user.id,
        Corroboration.deal_id == deal_id,
        Corroboration.corroborated_date == today,
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="Already corroborated today")

    # Award points subject to daily cap
    points = POINTS_CONFIG.get("corroborate", 2)
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    earned_today = db.query(sa_func.coalesce(sa_func.sum(PointTransaction.points), 0)).filter(
        PointTransaction.user_id == current_user.id,
        PointTransaction.created_at >= today_start,
        PointTransaction.points > 0,
    ).scalar()

    market = current_user.market
    daily_cap = market.daily_points_cap if market else 200
    if earned_today >= daily_cap:
        points = 0
    elif earned_today + points > daily_cap:
        points = daily_cap - earned_today

    corr = Corroboration(
        user_id=current_user.id,
        deal_id=deal_id,
        points_awarded=points,
        corroborated_date=today,
    )
    db.add(corr)

    if points > 0:
        db.execute(
            sa_update(User)
            .where(User.id == current_user.id)
            .values(points_balance=User.points_balance + points)
            .execution_options(synchronize_session="fetch")
        )
        db.add(PointTransaction(
            user_id=current_user.id,
            submission_id=None,
            points=points,
            transaction_type="submission_approved",
            description="Corroborated deal",
        ))

    db.commit()
    return {"points_awarded": points}


@router.get("/mine", response_model=List[SubmissionResponse])
def my_submissions(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return the current user's submission history."""
    subs = (
        db.query(Submission)
        .options(joinedload(Submission.submitter))
        .filter(Submission.user_id == current_user.id)
        .order_by(Submission.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return [SubmissionResponse.from_orm_with_username(s) for s in subs]
