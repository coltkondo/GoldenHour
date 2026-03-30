from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List
from datetime import datetime
from uuid import UUID

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.point_transaction import PointTransaction

router = APIRouter(prefix="/points", tags=["points"])


class PointTransactionResponse(BaseModel):
    id: UUID
    submission_id: UUID | None
    points: int
    transaction_type: str
    description: str
    created_at: datetime

    class Config:
        from_attributes = True


class PointsBalanceResponse(BaseModel):
    user_id: UUID
    username: str
    points_balance: int
    transactions: List[PointTransactionResponse]


@router.get("/users/{user_id}", response_model=PointsBalanceResponse)
def get_user_points(
    user_id: UUID,
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get a user's points balance and recent transactions.
    Users can only see their own; admins can see any."""
    if current_user.role != "admin" and str(current_user.id) != str(user_id):
        raise HTTPException(status_code=403, detail="Access denied")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    txs = (
        db.query(PointTransaction)
        .filter(PointTransaction.user_id == user_id)
        .order_by(PointTransaction.created_at.desc())
        .limit(limit)
        .all()
    )
    return PointsBalanceResponse(
        user_id=user.id,
        username=user.username,
        points_balance=user.points_balance,
        transactions=txs,
    )
