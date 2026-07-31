"""Corroboration business logic.

A corroboration confirms an existing deal is still accurate. It awards
points instantly (no admin review) and is limited to one per user per deal
per calendar day, plus a daily cap of CORROBORATION_DAILY_CAP total
corroborations per deal across all users.

Race safety: the deal row is locked with SELECT ... FOR UPDATE before the
cap is checked, serializing concurrent corroborations for the same deal so
exactly CORROBORATION_DAILY_CAP can commit per day.
"""

from datetime import date, datetime, timezone
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import func as sa_func, update as sa_update
from sqlalchemy.orm import Session

from app.core.points_config import CORROBORATION_DAILY_CAP, POINTS_CONFIG
from app.models.corroboration import Corroboration
from app.models.deal import Deal
from app.models.point_transaction import PointTransaction
from app.models.submission import Submission
from app.models.user import User


def corroborate_deal(db: Session, current_user: User, deal_id: UUID) -> int:
    """Confirm a deal is still accurate. Awards points instantly, once per user per day,
    capped at CORROBORATION_DAILY_CAP total corroborations per deal per day.

    Returns the number of points awarded (may be 0 if the user's daily points cap
    is reached).
    """
    deal = (
        db.query(Deal)
        .filter(Deal.id == deal_id, Deal.active == True)
        .with_for_update()
        .first()
    )
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found or inactive")

    # Self-corroboration guard — block if user has an approved submission linked to this deal
    self_sub = (
        db.query(Submission)
        .filter(
            Submission.user_id == current_user.id,
            Submission.related_deal_id == deal_id,
            Submission.status == "approved",
        )
        .first()
    )
    if self_sub:
        raise HTTPException(
            status_code=403, detail="You cannot corroborate a deal you submitted"
        )

    today = date.today()
    existing = (
        db.query(Corroboration)
        .filter(
            Corroboration.user_id == current_user.id,
            Corroboration.deal_id == deal_id,
            Corroboration.corroborated_date == today,
        )
        .first()
    )
    if existing:
        raise HTTPException(status_code=409, detail="Already corroborated today")

    # Daily cap across all users for this deal
    count = (
        db.query(sa_func.count(Corroboration.id))
        .filter(
            Corroboration.deal_id == deal_id,
            Corroboration.corroborated_date == today,
        )
        .scalar()
        or 0
    )
    if count >= CORROBORATION_DAILY_CAP:
        raise HTTPException(
            status_code=409,
            detail="Daily corroboration limit reached for this deal",
        )

    # Award points subject to daily cap
    points = POINTS_CONFIG.get("corroborate", 2)
    today_start = datetime.now(timezone.utc).replace(
        hour=0, minute=0, second=0, microsecond=0
    )
    earned_today = (
        db.query(sa_func.coalesce(sa_func.sum(PointTransaction.points), 0))
        .filter(
            PointTransaction.user_id == current_user.id,
            PointTransaction.created_at >= today_start,
            PointTransaction.points > 0,
        )
        .scalar()
    )

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
        db.add(
            PointTransaction(
                user_id=current_user.id,
                submission_id=None,
                points=points,
                transaction_type="submission_approved",
                description="Corroborated deal",
            )
        )

    db.commit()
    return points
