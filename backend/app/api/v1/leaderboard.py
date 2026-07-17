from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from typing import List, Optional
from uuid import UUID

from app.core.database import get_db
from app.models.market import Market
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
    market_slug: Optional[str] = Query(None, description="Market slug to scope the leaderboard (e.g. 'state-college')"),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """Top contributors ranked by points. Scope to a market via market_slug."""
    approved_counts = (
        db.query(Submission.user_id, func.count(Submission.id).label("approved_count"))
        .filter(Submission.status == "approved")
        .group_by(Submission.user_id)
        .subquery()
    )

    query = (
        db.query(
            User.id,
            User.username,
            User.points_balance,
            func.coalesce(approved_counts.c.approved_count, 0).label("approved_count"),
        )
        .outerjoin(approved_counts, User.id == approved_counts.c.user_id)
        .filter(User.active == True, User.points_balance > 0)
    )

    if market_slug:
        market = db.query(Market).filter(Market.slug == market_slug, Market.active == True).first()
        if not market:
            raise HTTPException(status_code=404, detail=f"Market '{market_slug}' not found")
        query = query.filter(User.market_id == market.id)

    rows = (
        query
        .order_by(User.points_balance.desc(), User.username.asc())
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
