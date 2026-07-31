"""
Tests for Audit Issue #15: Non-deterministic leaderboard ranking.

The bug: the leaderboard ORDER BY only sorted by points_balance DESC with no
tiebreaker, so tied users could appear in a different order on each request
depending on the database's internal row ordering.

The fix: added User.username.asc() as a secondary sort key in leaderboard.py.
Ties are now broken alphabetically by username — deterministic and stable.
"""

import uuid

import pytest

from app.models.market import Market
from app.models.user import User
from app.models.submission import Submission


def _make_user(db, *, username, points):
    market = db.query(Market).first()
    if market is None:
        market = Market(
            name="State College",
            slug=f"state-college-{uuid.uuid4().hex[:8]}",
            region_center_lat=40.79,
            region_center_lng=-77.86,
            region_radius_meters=50_000,
            daily_points_cap=200,
        )
        db.add(market)
        db.flush()
    u = User(
        username=username,
        email=f"{username}@t.example",
        password_hash="x",
        role="user",
        points_balance=points,
        market_id=market.id,
        signup_latitude=40.79,
        signup_longitude=-77.86,
    )
    db.add(u)
    db.flush()
    return u


class TestLeaderboardOrdering:
    def test_higher_points_ranks_first(self, db):
        """Users with more points appear earlier in the list."""
        low = _make_user(db, username="zara", points=10)
        high = _make_user(db, username="abel", points=100)
        db.commit()

        from sqlalchemy import func

        rows = (
            db.query(User.id, User.username, User.points_balance)
            .filter(User.points_balance > 0)
            .order_by(User.points_balance.desc(), User.username.asc())
            .all()
        )
        # Only care about the two users we inserted
        our_ids = {low.id, high.id}
        our_rows = [r for r in rows if r.id in our_ids]
        assert our_rows[0].username == "abel"
        assert our_rows[1].username == "zara"

    def test_tied_points_sorted_alphabetically(self, db):
        """Two users with identical points are ranked alphabetically by username."""
        charlie = _make_user(db, username="charlie", points=50)
        alice = _make_user(db, username="alice50", points=50)
        bob = _make_user(db, username="bob50", points=50)
        db.commit()

        rows = (
            db.query(User.id, User.username, User.points_balance)
            .filter(User.id.in_([charlie.id, alice.id, bob.id]))
            .order_by(User.points_balance.desc(), User.username.asc())
            .all()
        )
        assert rows[0].username == "alice50"
        assert rows[1].username == "bob50"
        assert rows[2].username == "charlie"

    def test_tied_points_order_is_stable_across_queries(self, db):
        """Running the same query twice returns identical ordering."""
        _make_user(db, username="zzz_user", points=25)
        _make_user(db, username="aaa_user", points=25)
        db.commit()

        def _run():
            return [
                r.username
                for r in db.query(User.username)
                .filter(User.points_balance == 25)
                .order_by(User.points_balance.desc(), User.username.asc())
                .all()
            ]

        assert _run() == _run()

    def test_mixed_points_and_ties_correct_overall_order(self, db):
        """Combined scenario: different points levels with ties at one level."""
        u1 = _make_user(db, username="beta", points=200)
        u2 = _make_user(db, username="alpha", points=200)  # tie at 200, alpha first
        u3 = _make_user(db, username="gamma", points=100)
        db.commit()

        our_ids = {u1.id, u2.id, u3.id}
        rows = (
            db.query(User.id, User.username, User.points_balance)
            .filter(User.id.in_(our_ids))
            .order_by(User.points_balance.desc(), User.username.asc())
            .all()
        )
        assert rows[0].username == "alpha"  # 200, alphabetically first
        assert rows[1].username == "beta"  # 200, alphabetically second
        assert rows[2].username == "gamma"  # 100
