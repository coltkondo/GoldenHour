"""
Tests for Audit Issue #6: Email case sensitivity.

The bug: UserCreate and UserLogin did not normalize email case, so
"User@Example.com" and "user@example.com" were treated as different accounts.
A user could register twice with the same address, and login would fail if
the case didn't exactly match what was stored.

The fix:
- Added @field_validator("email") to UserCreate and UserLogin that calls .lower()
- Updated auth.py register() and login() to use func.lower(User.email) in DB
  queries, protecting against any pre-existing mixed-case rows in the database.
"""

import pytest
from fastapi import HTTPException
from pydantic import ValidationError

from app.api.v1.auth import login, register
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin

# ---------------------------------------------------------------------------
# Schema-level normalization (no DB required)
# ---------------------------------------------------------------------------

_VALID_PASSWORD = "Qwerty12!"

_SIGNUP = {"latitude": 40.79, "longitude": -77.86}


class TestSchemaEmailNormalization:
    def test_user_create_lowercases_email(self):
        user = UserCreate(
            username="usr",
            email="User@EXAMPLE.COM",
            password=_VALID_PASSWORD,
            **_SIGNUP,
        )
        assert user.email == "user@example.com"

    def test_user_create_already_lowercase_unchanged(self):
        user = UserCreate(
            username="usr",
            email="user@example.com",
            password=_VALID_PASSWORD,
            **_SIGNUP,
        )
        assert user.email == "user@example.com"

    def test_user_create_mixed_subdomain_lowercased(self):
        user = UserCreate(
            username="usr",
            email="User@Mail.Example.COM",
            password=_VALID_PASSWORD,
            **_SIGNUP,
        )
        assert user.email == "user@mail.example.com"

    def test_user_login_lowercases_email(self):
        login_data = UserLogin(email="USER@EXAMPLE.COM", password=_VALID_PASSWORD)
        assert login_data.email == "user@example.com"

    def test_user_login_already_lowercase_unchanged(self):
        login_data = UserLogin(email="user@example.com", password=_VALID_PASSWORD)
        assert login_data.email == "user@example.com"

    def test_invalid_email_still_rejected(self):
        with pytest.raises(ValidationError):
            UserCreate(
                username="usr",
                email="not-an-email",
                password=_VALID_PASSWORD,
                **_SIGNUP,
            )


# ---------------------------------------------------------------------------
# DB-level deduplication (integration tests via auth functions directly)
# ---------------------------------------------------------------------------


class TestEmailDeduplication:
    def _register(self, db, *, username, email, password=_VALID_PASSWORD):
        data = UserCreate(username=username, email=email, password=password, **_SIGNUP)
        return register(request=None, data=data, db=db)

    def test_register_stores_email_as_lowercase(self, db, market):
        self._register(db, username="alice", email="Alice@Example.COM")
        stored = db.query(User).filter(User.username == "alice").first()
        assert stored.email == "alice@example.com"

    def test_register_duplicate_same_case_raises_409(self, db, market):
        self._register(db, username="bob1", email="bob@example.com")
        with pytest.raises(HTTPException) as exc:
            self._register(db, username="bob2", email="bob@example.com")
        assert exc.value.status_code == 409

    def test_register_duplicate_mixed_case_raises_409(self, db, market):
        """Registering with mixed-case version of an existing email must fail."""
        self._register(db, username="carol1", email="carol@example.com")
        with pytest.raises(HTTPException) as exc:
            self._register(db, username="carol2", email="CAROL@EXAMPLE.COM")
        assert exc.value.status_code == 409

    def test_login_with_mixed_case_email_succeeds(self, db, market):
        """User registered lowercase must be findable with any-case login email."""
        self._register(db, username="dave", email="dave@example.com")
        login_data = UserLogin(email="Dave@EXAMPLE.COM", password=_VALID_PASSWORD)
        # Should not raise — returns a Token
        result = login(request=None, data=login_data, db=db)
        assert result.user.username == "dave"

    def test_login_wrong_password_still_fails(self, db, market):
        self._register(db, username="eve", email="eve@example.com")
        login_data = UserLogin(email="Eve@Example.COM", password="WrongPass1!")
        with pytest.raises(HTTPException) as exc:
            login(request=None, data=login_data, db=db)
        assert exc.value.status_code == 401

    def test_two_different_emails_can_both_register(self, db, market):
        """Normalization must not collapse genuinely different addresses."""
        self._register(db, username="frank", email="frank@example.com")
        self._register(db, username="grace", email="grace@example.com")
        assert db.query(User).count() == 2

    def test_concurrent_duplicate_registration_yields_clean_409(
        self, db, db_session_factory, market
    ):
        """
        Two simultaneous registrations of the same email must produce exactly
        one success and one clean 409 — never an unhandled IntegrityError (500).

        The pre-check in register() is check-then-insert, so two concurrent
        requests can both pass it; the unique constraint is the backstop. The
        IntegrityError from that lost race is caught and surfaced as a 409.
        """
        import threading

        barrier = threading.Barrier(2)
        outcomes: list = []
        errors: list[Exception] = []

        def attempt(username):
            session = db_session_factory()
            try:
                barrier.wait()
                try:
                    self._register(session, username=username, email="race@example.com")
                    outcomes.append("ok")
                except HTTPException as exc:
                    outcomes.append(f"{exc.status_code}")
            except Exception as exc:  # noqa: BLE001
                errors.append(exc)
            finally:
                session.close()

        t1 = threading.Thread(target=attempt, args=("race1",))
        t2 = threading.Thread(target=attempt, args=("race2",))
        t1.start()
        t2.start()
        t1.join()
        t2.join()

        assert not errors, f"Unexpected errors: {errors}"
        assert sorted(outcomes) == ["409", "ok"]
        db.expire_all()
        assert db.query(User).filter(User.email == "race@example.com").count() == 1
