"""
A deactivated account must not be issued a token at login. Previously login
succeeded and every follow-up request 403'd in get_current_user, leaving the
app "signed in" with nothing working.
"""

import pytest
from fastapi import HTTPException

from app.api.v1.auth import login, register
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin

_PASSWORD = "Qwerty12!"


def _register(db, username, email):
    data = UserCreate(
        username=username, email=email, password=_PASSWORD, latitude=40.79, longitude=-77.86
    )
    register(request=None, data=data, db=db)
    return db.query(User).filter(User.username == username).first()


def test_deactivated_user_cannot_log_in(db, market):
    user = _register(db, "banned", "banned@example.com")
    user.active = False
    db.commit()

    with pytest.raises(HTTPException) as exc:
        login(request=None, data=UserLogin(email="banned@example.com", password=_PASSWORD), db=db)
    assert exc.value.status_code == 403
    assert "deactivated" in exc.value.detail.lower()


def test_deactivated_user_wrong_password_gets_generic_401(db, market):
    """Without the right password, don't reveal the account is deactivated."""
    user = _register(db, "banned2", "banned2@example.com")
    user.active = False
    db.commit()

    with pytest.raises(HTTPException) as exc:
        login(request=None, data=UserLogin(email="banned2@example.com", password="WrongPass1!"), db=db)
    assert exc.value.status_code == 401


def test_active_user_still_logs_in(db, market):
    _register(db, "fine", "fine@example.com")
    result = login(request=None, data=UserLogin(email="fine@example.com", password=_PASSWORD), db=db)
    assert result.access_token
