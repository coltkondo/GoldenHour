"""
Approved event submissions: an end time at or before the start time means the
event runs past midnight, so its end must land on the next calendar day
instead of being stored before the start.
"""

from datetime import date, time, timedelta

from app.services.submission_review import _occurrence_window


def test_same_day_event_ends_same_day():
    start, end = _occurrence_window(date(2026, 11, 13), time(19, 0), time(22, 0))
    assert end.date() == date(2026, 11, 13)
    assert end - start == timedelta(hours=3)


def test_event_past_midnight_ends_next_day():
    start, end = _occurrence_window(date(2026, 11, 13), time(22, 0), time(2, 0))
    assert start.date() == date(2026, 11, 13)
    assert end.date() == date(2026, 11, 14)
    assert end - start == timedelta(hours=4)


def test_end_equal_to_start_is_treated_as_overnight():
    start, end = _occurrence_window(date(2026, 11, 13), time(21, 0), time(21, 0))
    assert end > start


def test_no_end_time():
    start, end = _occurrence_window(date(2026, 11, 13), time(20, 0), None)
    assert end is None
    assert start.hour == 20


def test_overnight_across_dst_fall_back_keeps_wall_clock_times():
    # 2026-11-01 is the US fall-back date; wall-clock 2am Eastern is preserved.
    start, end = _occurrence_window(date(2026, 10, 31), time(22, 0), time(2, 0))
    assert (end.month, end.day, end.hour) == (11, 1, 2)
