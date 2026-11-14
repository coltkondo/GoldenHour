"""When is a happy-hour schedule in effect?

A schedule row belongs to `day_of_week` D (0=Mon..6=Sun) and runs start→end in
APP_TIMEZONE local time. If end <= start the window is *overnight*: it starts on
D and finishes on D+1 (e.g. Fri 22:00 → Sat 01:00). So "today's" happy hours
are today's rows plus yesterday's overnight rows that haven't ended yet.

These helpers build the SQL filters for that, so every endpoint agrees.
"""

from datetime import datetime

from sqlalchemy import and_, or_


def _yesterday(day: int) -> int:
    return (day - 1) % 7


def is_overnight(start, end) -> bool:
    return end <= start


def relevant_today_clause(day_col, start_col, end_col, now: datetime):
    """Rows that belong on today's list: today's, plus yesterday's overnight
    rows still running (before their end time this morning)."""
    today = now.weekday()
    t = now.time()
    return or_(
        day_col == today,
        and_(day_col == _yesterday(today), end_col <= start_col, end_col > t),
    )


def live_now_clause(day_col, start_col, end_col, now: datetime):
    """Rows whose window contains `now` (end exclusive)."""
    today = now.weekday()
    t = now.time()
    return or_(
        # Today's normal window.
        and_(day_col == today, start_col <= t, end_col > t, end_col > start_col),
        # Today's overnight window, before midnight.
        and_(day_col == today, start_col <= t, end_col <= start_col),
        # Yesterday's overnight window, after midnight.
        and_(day_col == _yesterday(today), end_col <= start_col, end_col > t),
    )
