from difflib import SequenceMatcher

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session, joinedload
from typing import List
from uuid import UUID

from app.core.database import get_db
from app.core.limiter import limiter
from app.core.security import get_current_user
from app.models.deal import Deal
from app.models.submission import Submission
from app.models.user import User
from app.models.venue import Venue
from app.schemas.submission import SubmissionCreate, SubmissionResponse
from app.services.corroboration_service import (
    corroborate_deal as corroborate_deal_service,
)


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
    active_deals = (
        db.query(Deal)
        .filter(Deal.venue_id == matched_venue.id, Deal.active == True)
        .all()
    )
    for deal in active_deals:
        if _similarity(title, deal.title) >= 0.80:
            return True

    # Check other pending new_deal submissions for the same bar + title
    pending = (
        db.query(Submission)
        .filter(
            Submission.submission_type == "new_deal",
            Submission.status == "pending",
        )
        .all()
    )
    for sub in pending:
        sub_bar = (sub.submitted_data.get("bar_name") or "").strip()
        sub_title = (sub.submitted_data.get("title") or "").strip()
        if (
            _similarity(bar_name, sub_bar) >= 0.75
            and _similarity(title, sub_title) >= 0.80
        ):
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
    """Confirm a deal is still accurate. Awards 2 pts instantly, once per user per day,
    capped at CORROBORATION_DAILY_CAP total corroborations per deal per day."""
    points = corroborate_deal_service(db, current_user, deal_id)
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
