"""
Tests for Audit Issue #1: Naive datetime.now() replaced with timezone-aware _now_eastern().

The bug: deals.py used datetime.now() (no timezone) to determine the current day
and time for happy hour filtering. On servers running in UTC (e.g. Railway), this
produces a time that is 4-5 hours off from Eastern business hours.

The fix: _now_eastern() returns datetime.now(ZoneInfo(settings.APP_TIMEZONE)), which
is always timezone-aware and anchored to the correct local time regardless of the
server's clock setting.
"""
from datetime import datetime
from zoneinfo import ZoneInfo
from unittest.mock import patch

import pytest

from app.api.v1.deals import _now_eastern
from app.core.config import settings


class TestNowEasternFunction:
    """Unit tests for the _now_eastern() helper introduced by the fix."""

    def test_returns_datetime(self):
        result = _now_eastern()
        assert isinstance(result, datetime)

    def test_is_timezone_aware(self):
        """The core fix: _now_eastern() must never return a naive datetime."""
        result = _now_eastern()
        assert result.tzinfo is not None, (
            "Expected a timezone-aware datetime. "
            "datetime.now() without a tz argument returns a naive datetime — "
            "that is the bug this fix resolves."
        )

    def test_utcoffset_is_not_none(self):
        result = _now_eastern()
        assert result.utcoffset() is not None

    def test_timezone_matches_app_setting(self):
        expected_tz = ZoneInfo(settings.APP_TIMEZONE)
        result = _now_eastern()
        assert result.tzinfo == expected_tz, (
            f"Expected timezone {settings.APP_TIMEZONE!r}, "
            f"got {result.tzinfo!r}"
        )

    def test_weekday_is_valid(self):
        result = _now_eastern()
        assert 0 <= result.weekday() <= 6

    def test_respects_app_timezone_setting(self):
        """APP_TIMEZONE is read at call time, so it is configurable."""
        for tz_name in ("America/New_York", "America/Chicago", "America/Los_Angeles"):
            with patch.object(settings, "APP_TIMEZONE", tz_name):
                result = _now_eastern()
                assert result.tzinfo == ZoneInfo(tz_name), (
                    f"When APP_TIMEZONE={tz_name!r}, expected that timezone"
                )


class TestNaiveDatetimeBugDemonstration:
    """Show that the old pattern (datetime.now()) produced a naive datetime."""

    def test_old_pattern_was_naive(self):
        """
        This test documents the root cause: datetime.now() has no tzinfo.
        If this assertion fails your Python version has changed default behaviour.
        """
        naive = datetime.now()
        assert naive.tzinfo is None, (
            "datetime.now() without tz arg should be naive — "
            "this confirms the bug that was fixed."
        )

    def test_fix_produces_aware_datetime(self):
        """_now_eastern() must differ from naive datetime.now() in tzinfo."""
        naive = datetime.now()
        aware = _now_eastern()
        assert naive.tzinfo is None
        assert aware.tzinfo is not None

    def test_utc_and_eastern_have_different_hours_at_non_zero_offset(self):
        """
        Eastern time is UTC-4 or UTC-5. If the server is in UTC, the old code
        would return the wrong hour, causing deals to appear active/inactive at
        the wrong times. This test verifies that _now_eastern() and a UTC-aware
        datetime can differ (i.e. they are not both UTC).
        """
        eastern = _now_eastern()
        utc = datetime.now(ZoneInfo("UTC"))

        # Both are aware; they represent the same moment but in different zones.
        eastern_utc_offset = eastern.utcoffset()
        utc_offset = utc.utcoffset()

        # UTC offset is always 0. Eastern is -4 or -5 hours — never 0.
        from datetime import timedelta
        assert eastern_utc_offset != timedelta(0), (
            "Eastern timezone must have a non-zero UTC offset. "
            "Got 0, which would mean APP_TIMEZONE is set to UTC."
        )
