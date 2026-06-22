# Points awarded per submission type on admin approval.
# Change values here — they are the single source of truth.
POINTS_CONFIG: dict[str, int] = {
    "new_deal": 50,
    "new_bar": 100,
    "deal_expired": 50,
    "bar_closed": 100,
    "deal_update": 50,
    "bar_update": 50,
    "corroborate": 2,
}
