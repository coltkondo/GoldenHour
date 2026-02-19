# Points awarded per submission type on admin approval.
# Change values here — they are the single source of truth.
POINTS_CONFIG: dict[str, int] = {
    "new_deal": 50,
    "new_bar": 50,
    "deal_expired": 25,
    "bar_closed": 25,
    "deal_update": 15,
    "bar_update": 15,
}
