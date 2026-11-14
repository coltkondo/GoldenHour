"""
Usernames are public (leaderboard) without admin review, so they're
filtered for App Review guideline 1.2: charset/length, reserved names
(impersonating the app or staff), and objectionable terms, without
blocking real names that merely contain a substring.
"""

import pytest
from pydantic import ValidationError

from app.core.username_rules import username_problem
from app.schemas.user import UserCreate

_OK = {"email": "a@example.com", "password": "Qwerty12!", "latitude": 40.79, "longitude": -77.86}


@pytest.mark.parametrize(
    "name",
    ["andes", "Andes_E", "colt.k", "bar_hopper_99", "Dickson", "Cockburn", "Scunthorpe",
     "classic_ale", "assistant", "Hancock", "Rick_Grayson"],
)
def test_normal_names_allowed(name):
    assert username_problem(name) is None


@pytest.mark.parametrize("name", ["ab", "a" * 31])
def test_length_limits(name):
    assert "characters" in username_problem(name)


@pytest.mark.parametrize("name", ["has space", "emoji🍺", "semi;colon", "[deleted_1234]", "zero​width"])
def test_charset(name):
    assert "only contain" in username_problem(name)


@pytest.mark.parametrize(
    "name", ["admin", "Admin", "GoldenHour", "golden_hour", "GoldenHourOfficial", "gldnhr_team", "support", "Moderator"]
)
def test_reserved_and_impersonation(name):
    assert username_problem(name) == "That username is reserved"


@pytest.mark.parametrize("name", ["fuckthis", "sh1thead", "big_dick", "b1tch", "nazi_88", "rape", "ass_man"])
def test_objectionable_blocked(name):
    assert username_problem(name) == "Please choose a different username"


def test_schema_rejects_bad_username_with_readable_message():
    with pytest.raises(ValidationError, match="reserved"):
        UserCreate(username="admin", **_OK)


def test_schema_strips_whitespace():
    assert UserCreate(username="  andes  ", **_OK).username == "andes"


def test_register_rejects_case_insensitive_duplicate(db, market):
    from fastapi import HTTPException
    from app.api.v1.auth import register

    register(request=None, data=UserCreate(username="andes", **_OK), db=db)
    other = dict(_OK, email="b@example.com")
    with pytest.raises(HTTPException) as exc:
        register(request=None, data=UserCreate(username="Andes", **other), db=db)
    assert exc.value.status_code == 409
