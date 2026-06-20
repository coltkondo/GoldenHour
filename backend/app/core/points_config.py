# Points awarded per submission type on admin approval.
# Change values here — they are the single source of truth.
POINTS_CONFIG: dict[str, int] = {
    "new_deal": 5,
    "new_bar": 10,
    "deal_expired": 5,
    "bar_closed": 10,
    "deal_update": 5,
    "bar_update": 5,
}
