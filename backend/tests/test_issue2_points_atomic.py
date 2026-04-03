"""
Tests for Audit Issue #2: Points balance increment converted to atomic SQL UPDATE.

The bug: submission_review.py used an ORM-level read-modify-write pattern:
    submitter.points_balance += points   # Python arithmetic after SELECT
This works under WITH_FOR_UPDATE locking but is fragile — it relies on the
ORM lock being held correctly and can silently lose updates if sessions are
misconfigured.

The fix: replaced with an atomic SQL-level UPDATE:
    UPDATE users SET points_balance = points_balance + :x WHERE id = :id
This is atomic regardless of isolation level and needs no ORM-level locking.

These tests use a SQLite in-memory database (via conftest.py fixtures).
SQLite serialises all writes via its write lock, which means the concurrent
test validates correctness of logic (no lost updates in the SQL path) even
though true parallel I/O is not exercised. PostgreSQL-level lock semantics
are guaranteed by the SQL form of the UPDATE statement itself.
"""
import threading
import uuid

import pytest
from fastapi import HTTPException

from app.core.points_config import POINTS_CONFIG
from app.models.point_transaction import PointTransaction
from app.models.submission import Submission
from app.models.user import User
from app.schemas.submission import ReviewAction
from app.services.submission_review import review_submission


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_user(db, *, username, role="user"):
    user = User(
        username=username,
        email=f"{username}@test.example",
        password_hash="irrelevant_in_tests",
        role=role,
        points_balance=0,
    )
    db.add(user)
    db.flush()  # get id without full commit
    return user


def _make_submission(db, *, user_id, submission_type="new_bar"):
    sub = Submission(
        user_id=user_id,
        submission_type=submission_type,
        # Minimal data required by _apply_submission() for new_bar type
        submitted_data={"name": "Test Bar", "address": "123 College Ave"},
        status="pending",
    )
    db.add(sub)
    db.flush()
    return sub


# ---------------------------------------------------------------------------
# Tests: single approval
# ---------------------------------------------------------------------------

class TestSingleApproval:

    def test_approved_submission_awards_correct_points(self, db):
        """Approving a submission credits the correct point value to the submitter."""
        submitter = _make_user(db, username="submitter1")
        admin = _make_user(db, username="admin1", role="admin")
        sub = _make_submission(db, user_id=submitter.id)
        db.commit()

        expected_points = POINTS_CONFIG["new_bar"]  # 50

        review_submission(sub.id, ReviewAction(status="approved"), admin, db)

        db.expire(submitter)
        updated = db.query(User).filter(User.id == submitter.id).first()
        assert updated.points_balance == expected_points, (
            f"Expected {expected_points} points, got {updated.points_balance}"
        )

    def test_approved_submission_creates_one_point_transaction(self, db):
        """Exactly one PointTransaction row is written per approval."""
        submitter = _make_user(db, username="submitter2")
        admin = _make_user(db, username="admin2", role="admin")
        sub = _make_submission(db, user_id=submitter.id)
        db.commit()

        review_submission(sub.id, ReviewAction(status="approved"), admin, db)

        txns = (
            db.query(PointTransaction)
            .filter(PointTransaction.user_id == submitter.id)
            .all()
        )
        assert len(txns) == 1
        assert txns[0].points == POINTS_CONFIG["new_bar"]
        assert txns[0].transaction_type == "submission_approved"
        assert txns[0].submission_id == sub.id

    def test_rejected_submission_awards_no_points(self, db):
        """Rejecting a submission does not modify the submitter's balance."""
        submitter = _make_user(db, username="submitter3")
        admin = _make_user(db, username="admin3", role="admin")
        sub = _make_submission(db, user_id=submitter.id)
        db.commit()

        review_submission(sub.id, ReviewAction(status="rejected"), admin, db)

        db.expire(submitter)
        updated = db.query(User).filter(User.id == submitter.id).first()
        assert updated.points_balance == 0

        txn_count = (
            db.query(PointTransaction)
            .filter(PointTransaction.user_id == submitter.id)
            .count()
        )
        assert txn_count == 0

    def test_already_reviewed_submission_raises_409(self, db):
        """Attempting to review an already-reviewed submission raises HTTP 409."""
        submitter = _make_user(db, username="submitter4")
        admin = _make_user(db, username="admin4", role="admin")
        sub = _make_submission(db, user_id=submitter.id)
        db.commit()

        review_submission(sub.id, ReviewAction(status="approved"), admin, db)

        with pytest.raises(HTTPException) as exc_info:
            review_submission(sub.id, ReviewAction(status="approved"), admin, db)

        assert exc_info.value.status_code == 409

    def test_nonexistent_submission_raises_404(self, db):
        """Reviewing a submission that doesn't exist raises HTTP 404."""
        admin = _make_user(db, username="admin5", role="admin")
        db.commit()

        with pytest.raises(HTTPException) as exc_info:
            review_submission(uuid.uuid4(), ReviewAction(status="approved"), admin, db)

        assert exc_info.value.status_code == 404


# ---------------------------------------------------------------------------
# Tests: cumulative / sequential approvals
# ---------------------------------------------------------------------------

class TestMultipleApprovals:

    def test_sequential_approvals_accumulate_correctly(self, db):
        """
        Approve multiple submissions for the same user one after another.
        Balance must equal the exact sum — no lost or doubled updates.
        """
        submitter = _make_user(db, username="multi_submitter")
        admin = _make_user(db, username="multi_admin", role="admin")

        subs = [_make_submission(db, user_id=submitter.id) for _ in range(3)]
        db.commit()

        for sub in subs:
            review_submission(sub.id, ReviewAction(status="approved"), admin, db)

        db.expire(submitter)
        updated = db.query(User).filter(User.id == submitter.id).first()
        expected = POINTS_CONFIG["new_bar"] * 3  # 150
        assert updated.points_balance == expected, (
            f"Expected {expected} after 3 approvals, got {updated.points_balance}"
        )

        txn_count = (
            db.query(PointTransaction)
            .filter(PointTransaction.user_id == submitter.id)
            .count()
        )
        assert txn_count == 3


# ---------------------------------------------------------------------------
# Tests: concurrent approvals
# ---------------------------------------------------------------------------

class TestConcurrentApprovals:

    def test_concurrent_approvals_do_not_lose_points(self, db, db_session_factory):
        """
        Approve two submissions for the same user in two concurrent threads.

        Each thread uses its own SQLAlchemy session so that transactions are
        independent. The atomic SQL UPDATE (points_balance = points_balance + :x)
        means the database itself adds the increment — there is no Python-level
        read-modify-write that could race.

        SQLite serialises writes via its exclusive write lock, so both threads
        will complete in sequence rather than truly in parallel. That is fine:
        the goal here is to verify that the final balance is always the sum of
        both increments, not that of only one — which would happen with a
        corrupted ORM read-modify-write if both threads read the same initial
        value before either committed.
        """
        submitter = _make_user(db, username="concurrent_user")
        admin = _make_user(db, username="concurrent_admin", role="admin")
        sub1 = _make_submission(db, user_id=submitter.id)
        sub2 = _make_submission(db, user_id=submitter.id)
        db.commit()

        sub1_id = sub1.id
        sub2_id = sub2.id
        admin_id = admin.id
        user_id = submitter.id

        errors: list[Exception] = []
        barrier = threading.Barrier(2)  # both threads start at the same moment

        def approve(submission_id):
            session = db_session_factory()
            try:
                admin_obj = session.query(User).filter(User.id == admin_id).first()
                barrier.wait()
                review_submission(
                    submission_id, ReviewAction(status="approved"), admin_obj, session
                )
            except Exception as exc:
                errors.append(exc)
            finally:
                session.close()

        t1 = threading.Thread(target=approve, args=(sub1_id,))
        t2 = threading.Thread(target=approve, args=(sub2_id,))
        t1.start()
        t2.start()
        t1.join()
        t2.join()

        assert not errors, f"Thread(s) raised errors: {errors}"

        db.expire_all()
        final = db.query(User).filter(User.id == user_id).first()
        expected = POINTS_CONFIG["new_bar"] * 2  # 100
        assert final.points_balance == expected, (
            f"Expected {expected} (both increments applied), "
            f"got {final.points_balance} (one or both were lost)"
        )

        txns = (
            db.query(PointTransaction)
            .filter(PointTransaction.user_id == user_id)
            .all()
        )
        assert len(txns) == 2, (
            f"Expected 2 PointTransaction rows, got {len(txns)}"
        )
