from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID

from app.core.database import get_db
from app.core.security import get_current_user, require_admin
from app.models.submission import Submission
from app.models.user import User
from app.schemas.submission import SubmissionCreate, SubmissionResponse, ReviewAction
from app.services.submission_review import review_submission

router = APIRouter(prefix="/submissions", tags=["submissions"])


@router.post("/", response_model=SubmissionResponse, status_code=201)
def create_submission(
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
    )
    db.add(sub)
    db.commit()
    db.refresh(sub)
    return SubmissionResponse.from_orm_with_username(sub)


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
        .filter(Submission.user_id == current_user.id)
        .order_by(Submission.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return [SubmissionResponse.from_orm_with_username(s) for s in subs]


@router.get("/", response_model=List[SubmissionResponse])
def list_submissions(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    status: Optional[str] = None,
    submission_type: Optional[str] = None,
    _admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Admin: list all submissions with optional filters."""
    query = db.query(Submission).order_by(Submission.created_at.desc())
    if status:
        query = query.filter(Submission.status == status)
    if submission_type:
        query = query.filter(Submission.submission_type == submission_type)
    subs = query.offset(skip).limit(limit).all()
    return [SubmissionResponse.from_orm_with_username(s) for s in subs]


@router.patch("/{submission_id}/review", response_model=SubmissionResponse)
def review(
    submission_id: UUID,
    action: ReviewAction,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Admin: approve or reject a submission. Auto-applies changes on approval."""
    return review_submission(submission_id, action, admin, db)
