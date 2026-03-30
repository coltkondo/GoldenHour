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
from app.core.logging import logger


# Fields users are allowed to propose via submissions.
# Excludes: id, verified, active, created_at, updated_at (set by system/admin only).
ALLOWED_VENUE_FIELDS = {
    "name",
    "nickname",
    "address",
    "latitude",
    "longitude",
    "phone",
    "website",
    "neighborhood",
    "venue_type",
    "tags",
    "cash_only",
    "description",
    "google_place_id",
    "price_level",
    "rating",
}

ALLOWED_DEAL_FIELDS = {
    "venue_id",
    "title",
    "description",
    "category",
    "deal_type",
    "original_price",
    "deal_price",
    "discount_percentage",
    "items",
}


def review_submission(
    submission_id, action: ReviewAction, reviewer: User, db: Session
) -> SubmissionResponse:
    logger.bind(
        submission_id=str(submission_id),
        reviewer_id=str(reviewer.id),
        reviewer_role=reviewer.role,
        action=action.status,
    ).info("review_action_initiated")

    sub = db.query(Submission).filter(Submission.id == submission_id).first()
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
        sub.reviewed_at = datetime.utcnow()

        if action.status == "approved":
            logger.bind(
                submission_id=str(sub.id), submission_type=sub.submission_type
            ).info("approving_submission")
            _apply_submission(sub, db)
            logger.bind(submission_id=str(sub.id)).info("submission_applied")

            points = POINTS_CONFIG.get(sub.submission_type, 0)
            sub.points_awarded = points

            if points > 0:
                submitter = db.query(User).filter(User.id == sub.user_id).first()
                if submitter:
                    submitter.points_balance += points
                    tx = PointTransaction(
                        user_id=submitter.id,
                        submission_id=sub.id,
                        points=points,
                        transaction_type="submission_approved",
                        description=f"Approved: {sub.submission_type.replace('_', ' ').title()}",
                    )
                    db.add(tx)
                    logger.bind(
                        user_id=str(submitter.id),
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
        filtered = {k: v for k, v in data.items() if k in ALLOWED_VENUE_FIELDS}
        venue = Venue(**filtered)
        db.add(venue)

    elif sub.submission_type == "bar_closed":
        venue = _get_venue(sub, db)
        venue.active = False

    elif sub.submission_type == "bar_update":
        venue = _get_venue(sub, db)
        for k, v in data.items():
            if k in ALLOWED_VENUE_FIELDS:
                setattr(venue, k, v)

    elif sub.submission_type == "new_deal":
        filtered = {k: v for k, v in data.items() if k in ALLOWED_DEAL_FIELDS}
        deal = Deal(**filtered)
        db.add(deal)

    elif sub.submission_type == "deal_expired":
        deal = _get_deal(sub, db)
        deal.active = False

    elif sub.submission_type == "deal_update":
        deal = _get_deal(sub, db)
        for k, v in data.items():
            if k in ALLOWED_DEAL_FIELDS:
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
