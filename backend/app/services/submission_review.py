"""
Shared logic for approving/rejecting a submission.
Called by both the v1 submissions router and the admin submissions router.
"""
from datetime import datetime

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.core.points_config import POINTS_CONFIG
from app.models.submission import Submission
from app.models.user import User
from app.models.venue import Venue
from app.models.deal import Deal
from app.models.point_transaction import PointTransaction
from app.schemas.submission import ReviewAction, SubmissionResponse


def review_submission(
    submission_id,
    action: ReviewAction,
    reviewer: User,
    db: Session,
) -> SubmissionResponse:
    sub = db.query(Submission).filter(Submission.id == submission_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found")
    if sub.status != "pending":
        raise HTTPException(status_code=409, detail="Submission has already been reviewed")

    sub.status = action.status
    sub.admin_notes = action.admin_notes
    sub.reviewed_by = reviewer.id
    sub.reviewed_at = datetime.utcnow()

    if action.status == "approved":
        _apply_submission(sub, db)
        points = POINTS_CONFIG.get(sub.submission_type, 0)
        sub.points_awarded = points

        # Credit points to submitter
        submitter = db.query(User).filter(User.id == sub.user_id).first()
        if submitter and points > 0:
            submitter.points_balance += points
            tx = PointTransaction(
                user_id=submitter.id,
                submission_id=sub.id,
                points=points,
                transaction_type="submission_approved",
                description=f"Approved: {sub.submission_type.replace('_', ' ').title()}",
            )
            db.add(tx)

    db.commit()
    db.refresh(sub)
    return SubmissionResponse.from_orm_with_username(sub)


def _apply_submission(sub: Submission, db: Session) -> None:
    """Auto-apply the change described by the approved submission."""
    data = sub.submitted_data or {}

    if sub.submission_type == "new_bar":
        venue = Venue(**{k: v for k, v in data.items() if hasattr(Venue, k)})
        db.add(venue)

    elif sub.submission_type == "bar_closed":
        venue = _get_venue(sub, db)
        venue.active = False

    elif sub.submission_type == "bar_update":
        venue = _get_venue(sub, db)
        for k, v in data.items():
            if hasattr(Venue, k) and k not in ("id", "created_at"):
                setattr(venue, k, v)

    elif sub.submission_type == "new_deal":
        deal = Deal(**{k: v for k, v in data.items() if hasattr(Deal, k)})
        db.add(deal)

    elif sub.submission_type == "deal_expired":
        deal = _get_deal(sub, db)
        deal.active = False

    elif sub.submission_type == "deal_update":
        deal = _get_deal(sub, db)
        for k, v in data.items():
            if hasattr(Deal, k) and k not in ("id", "created_at"):
                setattr(deal, k, v)


def _get_venue(sub: Submission, db: Session) -> Venue:
    venue_id = sub.related_bar_id or sub.submitted_data.get("venue_id")
    if not venue_id:
        raise HTTPException(status_code=422, detail="related_bar_id required for this submission type")
    venue = db.query(Venue).filter(Venue.id == venue_id).first()
    if not venue:
        raise HTTPException(status_code=404, detail="Related venue not found")
    return venue


def _get_deal(sub: Submission, db: Session) -> Deal:
    deal_id = sub.related_deal_id or sub.submitted_data.get("deal_id")
    if not deal_id:
        raise HTTPException(status_code=422, detail="related_deal_id required for this submission type")
    deal = db.query(Deal).filter(Deal.id == deal_id).first()
    if not deal:
        raise HTTPException(status_code=404, detail="Related deal not found")
    return deal
