"""
Admin submissions review queue — list and approve/reject.
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import List, Optional
from uuid import UUID

from app.core.database import get_db
from app.core.security import require_admin
from app.models.submission import Submission
from app.models.user import User
from app.schemas.submission import SubmissionResponse, ReviewAction
from app.services.submission_review import review_submission

router = APIRouter(prefix="/submissions", tags=["admin-submissions"])


@router.get("/", response_model=List[SubmissionResponse])
def list_submissions(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    status: Optional[str] = Query(None),
    submission_type: Optional[str] = Query(None),
    _admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """List all submissions with optional status/type filters."""
    query = db.query(Submission).options(joinedload(Submission.submitter)).order_by(Submission.created_at.desc())
    if status:
        query = query.filter(Submission.status == status)
    if submission_type:
        query = query.filter(Submission.submission_type == submission_type)
    subs = query.offset(skip).limit(limit).all()
    return [SubmissionResponse.from_orm_with_username(s) for s in subs]


@router.get("/count")
def count_submissions(
    status: Optional[str] = Query(None),
    _admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Return count of submissions, optionally filtered by status."""
    query = db.query(func.count(Submission.id))
    if status:
        query = query.filter(Submission.status == status)
    return {"count": query.scalar()}


@router.get("/{submission_id}", response_model=SubmissionResponse)
def get_submission(
    submission_id: UUID,
    _admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Get a single submission by ID."""
    from fastapi import HTTPException
    sub = db.query(Submission).options(joinedload(Submission.submitter)).filter(Submission.id == submission_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found")
    return SubmissionResponse.from_orm_with_username(sub)


@router.patch("/{submission_id}/review", response_model=SubmissionResponse)
def review(
    submission_id: UUID,
    action: ReviewAction,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Approve or reject a submission. Auto-applies changes on approval."""
    return review_submission(submission_id, action, admin, db)
