"""
Tests for Audit Issue #5: Weak password validation.

The bug: validate_password_strength() only required uppercase, lowercase, and
a digit. "Qwerty12" (no special character) passed validation, making it easy
to register weak but technically "valid" passwords.

The fix:
- Added special character requirement (any of: !@#$%^&*()-_=+[]{}|;:',.<>?/\`~)
- Added max_length=128 to the Field — bcrypt silently truncates at 72 bytes, so
  hashing a 100 KB password is an intentional DoS vector against the server.
"""
import pytest
from pydantic import ValidationError

from app.schemas.user import UserCreate

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

_VALID_BASE = {
    "username": "testuser",
    "email": "test@example.com",
}


def _create(**kwargs) -> UserCreate:
    return UserCreate(**{**_VALID_BASE, **kwargs})


def _assert_fails(password: str, fragment: str = ""):
    """Assert that the given password raises a ValidationError."""
    with pytest.raises(ValidationError) as exc_info:
        _create(password=password)
    if fragment:
        assert fragment.lower() in str(exc_info.value).lower(), (
            f"Expected error message to contain {fragment!r}, "
            f"got: {exc_info.value}"
        )


# ---------------------------------------------------------------------------
# Special character requirement (new in this fix)
# ---------------------------------------------------------------------------

class TestSpecialCharacterRequirement:

    def test_password_without_special_char_fails(self):
        """'Qwerty12' was the audit's example — must now be rejected."""
        _assert_fails("Qwerty12", "special character")

    def test_password_with_exclamation_passes(self):
        user = _create(password="Qwerty12!")
        assert user.password == "Qwerty12!"

    def test_password_with_at_sign_passes(self):
        _create(password="Qwerty12@")

    def test_password_with_hash_passes(self):
        _create(password="Qwerty12#")

    def test_password_with_dollar_passes(self):
        _create(password="Qwerty12$")

    def test_password_with_hyphen_passes(self):
        _create(password="Qwerty12-")

    def test_password_with_underscore_passes(self):
        _create(password="Qwerty12_")

    def test_all_special_no_digit_still_fails(self):
        """Special char alone is not enough — digit is still required."""
        _assert_fails("Qwerty!!", "digit")


# ---------------------------------------------------------------------------
# Max length (DoS protection — new in this fix)
# ---------------------------------------------------------------------------

class TestMaxLength:

    def test_password_at_max_length_passes(self):
        # 128 chars: satisfies all requirements
        pw = "A1!" + "a" * 125  # 3 + 125 = 128
        _create(password=pw)

    def test_password_one_over_max_fails(self):
        pw = "A1!" + "a" * 126  # 3 + 126 = 129
        _assert_fails(pw)

    def test_very_long_password_fails(self):
        _assert_fails("A1!" + "a" * 10_000)


# ---------------------------------------------------------------------------
# Pre-existing requirements (regression guard)
# ---------------------------------------------------------------------------

class TestExistingRequirements:

    def test_missing_uppercase_fails(self):
        _assert_fails("qwerty12!", "uppercase")

    def test_missing_lowercase_fails(self):
        _assert_fails("QWERTY12!", "lowercase")

    def test_missing_digit_fails(self):
        _assert_fails("Qwerty!!!", "digit")

    def test_too_short_fails(self):
        # 7 chars — below min_length=8
        _assert_fails("Qw1!")

    def test_minimum_valid_password_passes(self):
        # Exactly 8 chars, all requirements met
        _create(password="Qwerty1!")

    def test_strong_password_passes(self):
        _create(password="H0rse#Battery-Staple99")
