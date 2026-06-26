"""
Admin user management — list users, view point history, deactivate accounts.
Primary fraud-response tool during beta.
"""

from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from uuid import UUID

from app.core.database import get_db
from app.core.security import require_admin
from app.core.logging import logger
from app.models.user import User
from app.models.submission import Submission
from app.models.point_transaction import PointTransaction
from app.schemas.user import UserResponse

from pydantic import BaseModel
from datetime import datetime


class AdminUserResponse(BaseModel):
    id: UUID
    username: str
    email: str
    role: str
    points_balance: int
    active: bool
    created_at: datetime
    submission_count: int
    approved_count: int

    class Config:
        from_attributes = True


class PointTransactionResponse(BaseModel):
    id: UUID
    submission_id: UUID | None
    points: int
    transaction_type: str
    description: str
    created_at: datetime

    class Config:
        from_attributes = True


router = APIRouter(prefix="/users", tags=["admin-users"])


@router.get("/", response_model=List[AdminUserResponse])
def list_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    active_only: bool = Query(False),
    _admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """List all users with submission counts."""
    query = db.query(
        User,
        func.count(Submission.id).label("submission_count"),
        func.count(Submission.id).filter(Submission.status == "approved").label("approved_count"),
    ).outerjoin(Submission, Submission.user_id == User.id).group_by(User.id)

    if active_only:
        query = query.filter(User.active == True)

    query = query.order_by(User.created_at.desc())
    results = query.offset(skip).limit(limit).all()

    return [
        AdminUserResponse(
            id=user.id,
            username=user.username,
            email=user.email,
            role=user.role,
            points_balance=user.points_balance,
            active=user.active,
            created_at=user.created_at,
            submission_count=sub_count,
            approved_count=approved,
        )
        for user, sub_count, approved in results
    ]


@router.get("/{user_id}/points", response_model=List[PointTransactionResponse])
def get_user_point_history(
    user_id: UUID,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    _admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """View a user's full point transaction history."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    transactions = (
        db.query(PointTransaction)
        .filter(PointTransaction.user_id == user_id)
        .order_by(PointTransaction.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return transactions


@router.patch("/{user_id}/deactivate")
def deactivate_user(
    user_id: UUID,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Deactivate a user account. Blocks login and all API access."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot deactivate your own account")

    if not user.active:
        raise HTTPException(status_code=409, detail="User is already deactivated")

    user.active = False
    db.commit()
    logger.bind(user_id=str(user_id), admin_id=str(admin.id)).info("user_deactivated")
    return {"detail": f"User {user.username} deactivated"}


@router.patch("/{user_id}/reactivate")
def reactivate_user(
    user_id: UUID,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Reactivate a previously deactivated user account."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.active:
        raise HTTPException(status_code=409, detail="User is already active")

    user.active = True
    db.commit()
    logger.bind(user_id=str(user_id), admin_id=str(admin.id)).info("user_reactivated")
    return {"detail": f"User {user.username} reactivated"}
