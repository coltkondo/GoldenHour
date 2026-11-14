"""
Daily limits (points cap, corroboration caps) must roll over at local midnight
in APP_TIMEZONE, not at UTC midnight (7-8pm Eastern, mid happy hour).
"""

from datetime import date, datetime, timezone

from app.core.local_time import local_day_start, local_today


def _utc(*args) -> datetime:
    return datetime(*args, tzinfo=timezone.utc)


def test_evening_eastern_is_still_today_after_utc_midnight():
    # 2026-11-13 01:30 UTC == 2026-11-12 8:30pm EST
    now = _utc(2026, 11, 13, 1, 30)
    assert local_today(now) == date(2026, 11, 12)


def test_day_start_is_local_midnight_in_standard_time():
    now = _utc(2026, 11, 13, 1, 30)  # Nov 12, EST (UTC-5)
    assert local_day_start(now) == _utc(2026, 11, 12, 5, 0)


def test_day_start_is_local_midnight_in_daylight_time():
    now = _utc(2026, 7, 4, 23, 0)  # Jul 4, 7pm EDT (UTC-4)
    assert local_today(now) == date(2026, 7, 4)
    assert local_day_start(now) == _utc(2026, 7, 4, 4, 0)


def test_rolls_over_at_local_midnight():
    just_before = _utc(2026, 11, 13, 4, 59)  # 11:59pm EST Nov 12
    just_after = _utc(2026, 11, 13, 5, 0)    # 12:00am EST Nov 13
    assert local_today(just_before) == date(2026, 11, 12)
    assert local_today(just_after) == date(2026, 11, 13)
