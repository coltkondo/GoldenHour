"""
Location must not be mandatory to create an account (App Review 5.1.1).
Sign-up accepts either coordinates (radius match) or an explicit market_slug
from the city picker, which also covers people outside every market's radius.
"""

import pytest
from fastapi import HTTPException
from pydantic import ValidationError

import app.api.v1.auth as auth
from app.models.user import User
from app.schemas.user import UserCreate

BASE = {"email": "city@example.com", "password": "Qwerty12!"}


def _register(db, **kw):
    return auth.register(request=None, data=UserCreate(**{**BASE, **kw}), db=db)


def test_city_choice_without_location(db, market):
    _register(db, username="nolocation", market_slug=market.slug)
    u = db.query(User).filter(User.username == "nolocation").first()
    assert u.market_id == market.id
    # NOT NULL columns get the market's center.
    assert (u.signup_latitude, u.signup_longitude) == (market.region_center_lat, market.region_center_lng)


def test_city_choice_wins_over_far_away_coordinates(db, market):
    # Outside every radius (San Francisco) but picked a city: allowed.
    _register(db, username="faraway", latitude=37.77, longitude=-122.42, market_slug=market.slug)
    u = db.query(User).filter(User.username == "faraway").first()
    assert u.market_id == market.id and u.signup_latitude == 37.77


def test_coordinates_alone_still_work(db, market):
    _register(db, username="gpsuser", latitude=40.79, longitude=-77.86)
    assert db.query(User).filter(User.username == "gpsuser").first().market_id == market.id


def test_outside_area_without_city_uses_the_contract_message(db, market):
    with pytest.raises(HTTPException) as exc:
        _register(db, username="faraway2", latitude=37.77, longitude=-122.42)
    assert exc.value.status_code == 422
    # The mobile app keys off this text to show the city picker.
    assert exc.value.detail == auth.OUTSIDE_AREA_DETAIL
    assert "available in your area" in exc.value.detail


def test_unknown_city_rejected(db, market):
    with pytest.raises(HTTPException) as exc:
        _register(db, username="badcity", market_slug="atlantis")
    assert exc.value.status_code == 422


def test_neither_location_nor_city_is_a_validation_error():
    with pytest.raises(ValidationError, match="Choose a city or allow location"):
        UserCreate(username="nothing", **BASE)


def test_half_coordinates_need_a_city():
    with pytest.raises(ValidationError):
        UserCreate(username="halfway", latitude=40.79, **BASE)
