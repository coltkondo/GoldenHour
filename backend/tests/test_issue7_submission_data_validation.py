"""
Tests for Audit Issue #7: JSONB submission data not value-validated.

The bug: _apply_submission() in submission_review.py filtered submitted_data
keys against an allowlist but never validated the values. A user could submit
latitude=999 or deal_price=-50 and the invalid values would be written directly
to the database, relying on DB-level CHECK constraints to raise an error instead
of returning a clean 422 to the client.

The fix: introduced VenueData and DealData Pydantic models in
app/schemas/submission_data.py. Both use extra="ignore" (replacing the old
ALLOWED_VENUE/DEAL_FIELDS sets) and carry Field() constraints:
  - latitude: ge=-90, le=90
  - longitude: ge=-180, le=180
  - price_level: ge=1, le=4
  - rating: ge=0, le=5
  - original_price / deal_price: ge=0
  - discount_percentage: ge=0, le=100
  - String lengths capped at model-matching limits

Invalid data now raises HTTP 422 before any DB write.
"""
import pytest
from fastapi import HTTPException
from pydantic import ValidationError

from app.models.user import User
from app.models.submission import Submission
from app.schemas.submission import ReviewAction
from app.schemas.submission_data import VenueData, DealData
from app.services.submission_review import review_submission

_VALID_PASSWORD = "Qwerty12!"


# ---------------------------------------------------------------------------
# Unit tests for the Pydantic schemas (no DB)
# ---------------------------------------------------------------------------

class TestVenueDataSchema:

    def test_valid_venue_data_passes(self):
        v = VenueData(name="The Phyrst", address="101 W College Ave",
                      latitude=40.79, longitude=-77.86)
        assert v.name == "The Phyrst"

    def test_latitude_too_high_fails(self):
        with pytest.raises(ValidationError):
            VenueData(latitude=91)

    def test_latitude_too_low_fails(self):
        with pytest.raises(ValidationError):
            VenueData(latitude=-91)

    def test_longitude_too_high_fails(self):
        with pytest.raises(ValidationError):
            VenueData(longitude=181)

    def test_longitude_too_low_fails(self):
        with pytest.raises(ValidationError):
            VenueData(longitude=-181)

    def test_latitude_at_boundary_passes(self):
        VenueData(latitude=90)
        VenueData(latitude=-90)

    def test_longitude_at_boundary_passes(self):
        VenueData(longitude=180)
        VenueData(longitude=-180)

    def test_price_level_out_of_range_fails(self):
        with pytest.raises(ValidationError):
            VenueData(price_level=0)
        with pytest.raises(ValidationError):
            VenueData(price_level=5)

    def test_price_level_valid_range_passes(self):
        for level in (1, 2, 3, 4):
            VenueData(price_level=level)

    def test_rating_negative_fails(self):
        with pytest.raises(ValidationError):
            VenueData(rating=-0.1)

    def test_rating_above_max_fails(self):
        with pytest.raises(ValidationError):
            VenueData(rating=5.1)

    def test_rating_at_boundary_passes(self):
        VenueData(rating=0)
        VenueData(rating=5)

    def test_unknown_fields_are_stripped(self):
        """extra='ignore' replaces the old ALLOWED_VENUE_FIELDS set."""
        v = VenueData(name="Bar", verified=True, active=False, id="hax")
        assert not hasattr(v, "verified")
        assert not hasattr(v, "active")
        assert not hasattr(v, "id")

    def test_model_dump_excludes_none(self):
        v = VenueData(name="Bar")
        dumped = v.model_dump(exclude_none=True)
        assert "latitude" not in dumped
        assert dumped["name"] == "Bar"


class TestDealDataSchema:

    def test_valid_deal_data_passes(self):
        import uuid
        d = DealData(title="$3 drafts", venue_id=uuid.uuid4(),
                     original_price=6.0, deal_price=3.0)
        assert d.title == "$3 drafts"

    def test_original_price_negative_fails(self):
        with pytest.raises(ValidationError):
            DealData(original_price=-1)

    def test_deal_price_negative_fails(self):
        with pytest.raises(ValidationError):
            DealData(deal_price=-0.01)

    def test_discount_percentage_over_100_fails(self):
        with pytest.raises(ValidationError):
            DealData(discount_percentage=100.1)

    def test_discount_percentage_negative_fails(self):
        with pytest.raises(ValidationError):
            DealData(discount_percentage=-1)

    def test_discount_at_boundaries_passes(self):
        DealData(discount_percentage=0)
        DealData(discount_percentage=100)

    def test_prices_at_zero_pass(self):
        DealData(original_price=0, deal_price=0)

    def test_unknown_fields_stripped(self):
        d = DealData(title="Test", active=False, verified=True)
        assert not hasattr(d, "active")


# ---------------------------------------------------------------------------
# Integration tests: invalid data rejected at review time (with DB)
# ---------------------------------------------------------------------------

def _make_user(db, *, username, role="user"):
    from app.models.user import User
    u = User(username=username, email=f"{username}@t.example",
             password_hash="x", role=role, points_balance=0)
    db.add(u)
    db.flush()
    return u


def _make_submission(db, *, user_id, submission_type, submitted_data):
    s = Submission(user_id=user_id, submission_type=submission_type,
                   submitted_data=submitted_data, status="pending")
    db.add(s)
    db.flush()
    return s


class TestInvalidDataRaisesOnApproval:

    def test_out_of_range_latitude_raises_422(self, db):
        submitter = _make_user(db, username="sub_lat")
        admin = _make_user(db, username="adm_lat", role="admin")
        sub = _make_submission(db, user_id=submitter.id,
                               submission_type="new_bar",
                               submitted_data={"name": "Bad Bar",
                                               "address": "1 St",
                                               "latitude": 999})
        db.commit()
        with pytest.raises(HTTPException) as exc:
            review_submission(sub.id, ReviewAction(status="approved"), admin, db)
        assert exc.value.status_code == 422

    def test_out_of_range_longitude_raises_422(self, db):
        submitter = _make_user(db, username="sub_lon")
        admin = _make_user(db, username="adm_lon", role="admin")
        sub = _make_submission(db, user_id=submitter.id,
                               submission_type="new_bar",
                               submitted_data={"name": "Bad Bar",
                                               "address": "1 St",
                                               "longitude": -999})
        db.commit()
        with pytest.raises(HTTPException) as exc:
            review_submission(sub.id, ReviewAction(status="approved"), admin, db)
        assert exc.value.status_code == 422

    def test_negative_deal_price_raises_422(self, db):
        submitter = _make_user(db, username="sub_price")
        admin = _make_user(db, username="adm_price", role="admin")
        sub = _make_submission(db, user_id=submitter.id,
                               submission_type="new_deal",
                               submitted_data={"title": "Bad Deal",
                                               "deal_price": -10})
        db.commit()
        with pytest.raises(HTTPException) as exc:
            review_submission(sub.id, ReviewAction(status="approved"), admin, db)
        assert exc.value.status_code == 422

    def test_valid_data_approves_cleanly(self, db):
        submitter = _make_user(db, username="sub_valid")
        admin = _make_user(db, username="adm_valid", role="admin")
        sub = _make_submission(db, user_id=submitter.id,
                               submission_type="new_bar",
                               submitted_data={"name": "Good Bar",
                                               "address": "1 College Ave",
                                               "latitude": 40.79,
                                               "longitude": -77.86})
        db.commit()
        # Should not raise
        result = review_submission(sub.id, ReviewAction(status="approved"), admin, db)
        assert result.status == "approved"

    def test_injected_privileged_fields_are_silently_stripped(self, db):
        """
        A user attempting to set verified=True or active=False via submitted_data
        must not succeed — extra='ignore' drops those fields before the DB write.
        """
        submitter = _make_user(db, username="sub_priv")
        admin = _make_user(db, username="adm_priv", role="admin")
        sub = _make_submission(db, user_id=submitter.id,
                               submission_type="new_bar",
                               submitted_data={"name": "Sneaky Bar",
                                               "address": "2 St",
                                               "verified": True,
                                               "active": False,
                                               "id": "00000000-0000-0000-0000-000000000001"})
        db.commit()
        # Approval must succeed (privileged fields silently ignored)
        result = review_submission(sub.id, ReviewAction(status="approved"), admin, db)
        assert result.status == "approved"

        from app.models.venue import Venue
        venue = db.query(Venue).filter(Venue.name == "Sneaky Bar").first()
        assert venue is not None
        assert venue.verified is False  # default, not overridden by submission
