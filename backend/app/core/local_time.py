"""Calendar-day helpers in the app's business timezone.

"Today" for daily limits (points cap, corroboration caps) means the venues'
local calendar day, not the server's. Railway runs in UTC, so UTC midnight is
7-8pm Eastern, which is the middle of happy hour.
"""

from datetime import date, datetime, timezone
from zoneinfo import ZoneInfo

from app.core.config import settings


def _tz() -> ZoneInfo:
    return ZoneInfo(settings.APP_TIMEZONE)


def local_today(now: datetime | None = None) -> date:
    """Today's calendar date in APP_TIMEZONE."""
    now = now or datetime.now(timezone.utc)
    return now.astimezone(_tz()).date()


def local_day_start(now: datetime | None = None) -> datetime:
    """Local midnight at the start of today, as a timezone-aware UTC datetime."""
    d = local_today(now)
    return datetime(d.year, d.month, d.day, tzinfo=_tz()).astimezone(timezone.utc)
