from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from typing import List
from uuid import UUID

from app.core.database import get_db
from app.models.user import User
from app.models.submission import Submission

router = APIRouter(prefix="/leaderboard", tags=["leaderboard"])


class LeaderboardEntry(BaseModel):
    rank: int
    user_id: UUID
    username: str
    points_balance: int
    approved_count: int


@router.get("/", response_model=List[LeaderboardEntry])
def get_leaderboard(
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """Top contributors ranked by points. Public endpoint."""
    approved_counts = (
        db.query(Submission.user_id, func.count(Submission.id).label("approved_count"))
        .filter(Submission.status == "approved")
        .group_by(Submission.user_id)
        .subquery()
    )

    rows = (
        db.query(
            User.id,
            User.username,
            User.points_balance,
            func.coalesce(approved_counts.c.approved_count, 0).label("approved_count"),
        )
        .outerjoin(approved_counts, User.id == approved_counts.c.user_id)
        .filter(User.points_balance > 0)
        .order_by(User.points_balance.desc())
        .limit(limit)
        .all()
    )

    return [
        LeaderboardEntry(
            rank=i + 1,
            user_id=row.id,
            username=row.username,
            points_balance=row.points_balance,
            approved_count=row.approved_count,
        )
        for i, row in enumerate(rows)
    ]
