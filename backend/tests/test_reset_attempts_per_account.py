"""
Password-reset codes are 6 digits, so guesses must be limited per ACCOUNT, not
just per IP (a distributed attacker has many IPs, and many real users share
one campus/carrier IP). After RESET_MAX_ATTEMPTS wrong codes the code is burned.
"""

import pytest
from fastapi import HTTPException

import app.api.v1.auth as auth
from app.models.user import User
from app.schemas.user import ForgotPasswordRequest, ResetPasswordRequest, UserCreate

EMAIL = "reset@example.com"
NEW_PW = "NewPassw0rd!"


@pytest.fixture
def user(db, market, monkeypatch):
    monkeypatch.setattr(auth, "send_password_reset_email", lambda *a, **k: None)
    auth.register(
        request=None,
        data=UserCreate(username="resetter", email=EMAIL, password="Qwerty12!", latitude=40.79, longitude=-77.86),
        db=db,
    )
    return db.query(User).filter(User.email == EMAIL).first()


def _issue_code(db, monkeypatch, code):
    monkeypatch.setattr(auth, "_generate_reset_code", lambda: code)
    auth.forgot_password(request=None, data=ForgotPasswordRequest(email=EMAIL), db=db)


def _reset(db, code):
    auth.reset_password(request=None, data=ResetPasswordRequest(email=EMAIL, code=code, new_password=NEW_PW), db=db)


def test_wrong_codes_burn_the_code_at_the_limit(db, user, monkeypatch):
    _issue_code(db, monkeypatch, "123456")
    for _ in range(auth.RESET_MAX_ATTEMPTS - 1):
        with pytest.raises(HTTPException, match="Invalid or expired"):
            _reset(db, "000000")
    with pytest.raises(HTTPException, match="Too many incorrect codes"):
        _reset(db, "000000")
    # Even the right code no longer works: it was burned.
    with pytest.raises(HTTPException, match="Invalid or expired"):
        _reset(db, "123456")


def test_new_code_resets_the_counter(db, user, monkeypatch):
    _issue_code(db, monkeypatch, "111111")
    for _ in range(auth.RESET_MAX_ATTEMPTS - 1):
        with pytest.raises(HTTPException):
            _reset(db, "000000")
    _issue_code(db, monkeypatch, "222222")
    db.refresh(user)
    assert user.reset_attempts == 0
    _reset(db, "222222")  # succeeds


def test_success_clears_state(db, user, monkeypatch):
    _issue_code(db, monkeypatch, "333333")
    with pytest.raises(HTTPException):
        _reset(db, "000000")
    _reset(db, "333333")
    db.refresh(user)
    assert user.reset_attempts == 0 and user.reset_token_hash is None
