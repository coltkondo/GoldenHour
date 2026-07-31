# Points awarded per submission type on admin approval.
# Change values here — they are the single source of truth.
POINTS_CONFIG: dict[str, int] = {
    "new_deal": 25,
    "new_bar": 50,
    "deal_expired": 25,
    "bar_closed": 50,
    "deal_update": 25,
    "bar_update": 25,
    "new_event": 50,
    "corroborate": 2,
}

# Maximum number of corroborations a single deal can receive per calendar day,
# summed across all users. Enforced in app/services/corroboration_service.py.
CORROBORATION_DAILY_CAP: int = 5
