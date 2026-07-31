"""
Tests for the daily corroboration cap: at most CORROBORATION_DAILY_CAP
corroborations per deal per calendar day, summed across all users.

The cap is enforced in app/services/corroboration_service.py, which locks the
deal row (SELECT ... FOR UPDATE) before checking the count so concurrent
corroborations for the same deal serialize and exactly CORROBORATION_DAILY_CAP
can commit per day on PostgreSQL. SQLite (used in tests) serialises writes, so
the sequential tests below verify the counting logic directly.
"""

import threading

import pytest
from fastapi import HTTPException
from datetime import date, timedelta

from app.core.points_config import CORROBORATION_DAILY_CAP, POINTS_CONFIG
from app.models.corroboration import Corroboration
from app.models.deal import Deal
from app.models.market import Market
from app.models.user import User
from app.models.venue import Venue
from app.services.corroboration_service import corroborate_deal


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _make_market(db, slug="test_market"):
    market = Market(
        name="Test Market",
        slug=slug,
        region_center_lat=40.79,
        region_center_lng=-77.86,
        region_radius_meters=10000,
        daily_points_cap=200,
    )
    db.add(market)
    db.flush()
    return market


def _make_user(db, market, username, role="user"):
    user = User(
        username=username,
        email=f"{username}@test.example",
        password_hash="irrelevant_in_tests",
        role=role,
        market_id=market.id,
        signup_latitude=40.79,
        signup_longitude=-77.86,
        points_balance=0,
    )
    db.add(user)
    db.flush()
    return user


def _make_venue(db, market):
    venue = Venue(
        market_id=market.id,
        name="Test Bar",
        address="123 College Ave",
        latitude=40.79,
        longitude=-77.86,
    )
    db.add(venue)
    db.flush()
    return venue


def _make_deal(db, venue, title="Happy Hour Deal"):
    deal = Deal(venue_id=venue.id, title=title)
    db.add(deal)
    db.flush()
    return deal


def _count_for_deal(db, deal_id, day=None):
    q = db.query(Corroboration).filter(Corroboration.deal_id == deal_id)
    if day is not None:
        q = q.filter(Corroboration.corroborated_date == day)
    return q.count()


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------


class TestDailyCapSequential:
    def test_five_corroborations_allowed(self, db):
        """Up to CORROBORATION_DAILY_CAP distinct users may corroborate the same deal in a day."""
        market = _make_market(db)
        venue = _make_venue(db, market)
        deal = _make_deal(db, venue)
        users = [
            _make_user(db, market, f"user{i}") for i in range(CORROBORATION_DAILY_CAP)
        ]
        db.commit()

        for user in users:
            points = corroborate_deal(db, user, deal.id)
            assert points == POINTS_CONFIG["corroborate"]

        assert _count_for_deal(db, deal.id) == CORROBORATION_DAILY_CAP

    def test_sixth_corroboration_rejected(self, db):
        """The (CAP + 1)-th corroboration on the same deal/day is rejected with 409."""
        market = _make_market(db)
        venue = _make_venue(db, market)
        deal = _make_deal(db, venue)
        users = [
            _make_user(db, market, f"user{i}")
            for i in range(CORROBORATION_DAILY_CAP + 1)
        ]
        db.commit()

        for user in users[:CORROBORATION_DAILY_CAP]:
            corroborate_deal(db, user, deal.id)

        with pytest.raises(HTTPException) as exc_info:
            corroborate_deal(db, users[CORROBORATION_DAILY_CAP], deal.id)
        assert exc_info.value.status_code == 409
        assert "limit" in exc_info.value.detail.lower()

        assert _count_for_deal(db, deal.id) == CORROBORATION_DAILY_CAP

    def test_cap_resets_next_day(self, db):
        """Yesterday's corroborations do not count toward today's cap."""
        market = _make_market(db)
        venue = _make_venue(db, market)
        deal = _make_deal(db, venue)
        users = [
            _make_user(db, market, f"user{i}")
            for i in range(CORROBORATION_DAILY_CAP + 1)
        ]
        yesterday = date.today() - timedelta(days=1)
        for user in users[:CORROBORATION_DAILY_CAP]:
            db.add(
                Corroboration(
                    user_id=user.id,
                    deal_id=deal.id,
                    points_awarded=POINTS_CONFIG["corroborate"],
                    corroborated_date=yesterday,
                )
            )
        db.commit()

        points = corroborate_deal(db, users[CORROBORATION_DAILY_CAP], deal.id)
        assert points == POINTS_CONFIG["corroborate"]
        assert _count_for_deal(db, deal.id, day=date.today()) == 1

    def test_cap_scoped_per_deal_not_per_bar(self, db):
        """A deal at cap does not block corroborating a different deal at the same bar."""
        market = _make_market(db)
        venue = _make_venue(db, market)
        deal_a = _make_deal(db, venue, title="Deal A")
        deal_b = _make_deal(db, venue, title="Deal B")
        users = [
            _make_user(db, market, f"user{i}") for i in range(CORROBORATION_DAILY_CAP)
        ]
        db.commit()

        for user in users:
            corroborate_deal(db, user, deal_a.id)

        # Same bar, second deal: all users can still corroborate
        for user in users:
            points = corroborate_deal(db, user, deal_b.id)
            assert points == POINTS_CONFIG["corroborate"]

        assert _count_for_deal(db, deal_b.id) == CORROBORATION_DAILY_CAP

    def test_per_user_dedupe_still_enforced(self, db):
        """The cap does not replace the one-per-user-per-deal-per-day rule."""
        market = _make_market(db)
        venue = _make_venue(db, market)
        deal = _make_deal(db, venue)
        user = _make_user(db, market, "solo")
        db.commit()

        corroborate_deal(db, user, deal.id)
        with pytest.raises(HTTPException) as exc_info:
            corroborate_deal(db, user, deal.id)
        assert exc_info.value.status_code == 409

        assert _count_for_deal(db, deal.id) == 1


class TestDailyCapConcurrent:
    def test_concurrent_corroborations_never_exceed_cap(self, db, db_session_factory):
        """
        Six users corroborating simultaneously must never exceed the cap.

        The deal-row lock (SELECT ... FOR UPDATE) serializes these on PostgreSQL:
        exactly five commit and the sixth is rejected with 409. SQLite ignores
        FOR UPDATE, so the read-then-write count check races there — the 6th
        request can slip through (all 6 rows commit). The concurrency guarantee
        therefore requires PostgreSQL and is validated only against a real
        Postgres database, matching the repo's Postgres-only test convention.
        """
        if db.get_bind().dialect.name != "postgresql":
            pytest.skip(
                "Requires PostgreSQL row locking; FOR UPDATE is a no-op on SQLite"
            )

        market = _make_market(db)
        venue = _make_venue(db, market)
        deal = _make_deal(db, venue)
        users = [
            _make_user(db, market, f"user{i}")
            for i in range(CORROBORATION_DAILY_CAP + 1)
        ]
        db.commit()

        deal_id = deal.id
        user_ids = [u.id for u in users]

        results = []
        barrier = threading.Barrier(CORROBORATION_DAILY_CAP + 1)

        def work(user_id):
            session = db_session_factory()
            try:
                user = session.query(User).filter(User.id == user_id).first()
                barrier.wait()
                points = corroborate_deal(session, user, deal_id)
                results.append(("ok", points))
            except HTTPException as exc:
                results.append(("rejected", exc.status_code))
            finally:
                session.close()

        threads = [
            threading.Thread(target=work, args=(user_id,)) for user_id in user_ids
        ]
        for t in threads:
            t.start()
        for t in threads:
            t.join()

        ok = [r for r in results if r[0] == "ok"]
        rejected = [r for r in results if r[0] == "rejected"]

        assert len(ok) == CORROBORATION_DAILY_CAP, (
            f"expected {CORROBORATION_DAILY_CAP} ok, got {ok}"
        )
        assert len(rejected) == 1, f"expected exactly 1 rejection, got {rejected}"
        assert rejected[0][1] == 409, f"expected 409 rejection, got {rejected}"

        db.expire_all()
        assert _count_for_deal(db, deal_id) == CORROBORATION_DAILY_CAP
