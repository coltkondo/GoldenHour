from collections import defaultdict
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy import cast, func
from sqlalchemy.dialects.postgresql import DATE
from sqlalchemy.orm import Session

from app.core.security import require_admin
from app.core.database import get_db
from app.models.corroboration import Corroboration
from app.models.market import Market
from app.models.submission import Submission
from app.models.user import User

router = APIRouter(prefix="/analytics", tags=["admin-analytics"])


@router.get("/summary")
def analytics_summary(
    period_days: int = Query(default=7, ge=1, le=90),
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    since = datetime.now(timezone.utc) - timedelta(days=period_days)

    # ── Submissions ──────────────────────────────────────────────────
    subs_in_period = db.query(Submission).filter(Submission.created_at >= since).all()

    by_status: dict[str, int] = {"pending": 0, "approved": 0, "rejected": 0}
    by_type: dict[str, int] = {}
    dupe_count = 0
    user_sub_stats: dict = defaultdict(lambda: {"approved": 0, "pending": 0, "points_earned": 0})

    for s in subs_in_period:
        by_status[s.status] = by_status.get(s.status, 0) + 1
        by_type[s.submission_type] = by_type.get(s.submission_type, 0) + 1
        if s.is_flagged_duplicate:
            dupe_count += 1
        stats = user_sub_stats[s.user_id]
        if s.status == "approved":
            stats["approved"] += 1
        elif s.status == "pending":
            stats["pending"] += 1
        stats["points_earned"] += s.points_awarded

    daily_subs = (
        db.query(
            cast(Submission.created_at, DATE).label("date"),
            func.count().label("count"),
        )
        .filter(Submission.created_at >= since)
        .group_by(cast(Submission.created_at, DATE))
        .order_by(cast(Submission.created_at, DATE))
        .all()
    )

    # ── Signups ──────────────────────────────────────────────────────
    daily_signups = (
        db.query(
            cast(User.created_at, DATE).label("date"),
            func.count().label("count"),
        )
        .filter(User.created_at >= since)
        .group_by(cast(User.created_at, DATE))
        .order_by(cast(User.created_at, DATE))
        .all()
    )

    # ── Corroborations ───────────────────────────────────────────────
    corr_in_period = db.query(Corroboration).filter(Corroboration.created_at >= since).all()

    user_corr_stats: dict = defaultdict(lambda: {"count": 0, "points": 0})
    for c in corr_in_period:
        user_corr_stats[c.user_id]["count"] += 1
        user_corr_stats[c.user_id]["points"] += c.points_awarded

    daily_corr = (
        db.query(
            Corroboration.corroborated_date.label("date"),
            func.count().label("count"),
        )
        .filter(Corroboration.created_at >= since)
        .group_by(Corroboration.corroborated_date)
        .order_by(Corroboration.corroborated_date)
        .all()
    )

    # ── Resolve usernames ─────────────────────────────────────────────
    all_user_ids = set(user_sub_stats.keys()) | set(user_corr_stats.keys())
    users = db.query(User.id, User.username).filter(User.id.in_(all_user_ids)).all()
    id_to_username = {u.id: u.username for u in users}

    top_submitters = sorted(
        [
            {
                "username": id_to_username.get(uid, "deleted"),
                "approved": s["approved"],
                "pending": s["pending"],
                "points_earned": s["points_earned"],
            }
            for uid, s in user_sub_stats.items()
        ],
        key=lambda x: x["approved"],
        reverse=True,
    )[:10]

    top_corroborators = sorted(
        [
            {
                "username": id_to_username.get(uid, "deleted"),
                "count": s["count"],
                "points": s["points"],
            }
            for uid, s in user_corr_stats.items()
        ],
        key=lambda x: x["count"],
        reverse=True,
    )[:10]

    # ── Market breakdown ─────────────────────────────────────────────
    market_subs = (
        db.query(Market.slug, func.count(Submission.id).label("count"))
        .join(User, User.id == Submission.user_id)
        .join(Market, Market.id == User.market_id)
        .filter(Submission.created_at >= since)
        .group_by(Market.slug)
        .all()
    )
    market_signups = (
        db.query(Market.slug, func.count(User.id).label("count"))
        .join(Market, Market.id == User.market_id)
        .filter(User.created_at >= since)
        .group_by(Market.slug)
        .all()
    )

    market_map: dict[str, dict] = {}
    for row in market_subs:
        market_map.setdefault(row.slug, {})["submissions"] = row.count
    for row in market_signups:
        market_map.setdefault(row.slug, {})["signups"] = row.count

    total_subs = len(subs_in_period)
    approval_rate = (
        round(by_status["approved"] / (by_status["approved"] + by_status["rejected"]), 3)
        if (by_status["approved"] + by_status["rejected"]) > 0
        else None
    )

    return {
        "period_days": period_days,
        "submissions": {
            "total": total_subs,
            "by_status": by_status,
            "by_type": by_type,
            "approval_rate": approval_rate,
            "duplicate_rate": round(dupe_count / total_subs, 3) if total_subs else 0,
            "daily": [{"date": str(r.date), "count": r.count} for r in daily_subs],
        },
        "signups": {
            "total": sum(r.count for r in daily_signups),
            "daily": [{"date": str(r.date), "count": r.count} for r in daily_signups],
        },
        "corroborations": {
            "total": len(corr_in_period),
            "daily": [{"date": str(r.date), "count": r.count} for r in daily_corr],
        },
        "top_submitters": top_submitters,
        "top_corroborators": top_corroborators,
        "markets": [
            {
                "market_slug": slug,
                "submissions": data.get("submissions", 0),
                "signups": data.get("signups", 0),
            }
            for slug, data in market_map.items()
        ],
    }
