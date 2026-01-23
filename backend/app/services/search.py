from math import radians, cos, sin, asin, sqrt, pi


EARTH_RADIUS_M = 6371000.0


def bounding_box(latitude: float, longitude: float, radius_m: float):
    """Return (min_lat, max_lat, min_lng, max_lng) for a radius in meters."""
    lat_rad = radians(latitude)
    deg_lat = (radius_m / EARTH_RADIUS_M) * (180.0 / pi)
    deg_lng = (radius_m / (EARTH_RADIUS_M * cos(lat_rad))) * (180.0 / pi)

    return (
        latitude - deg_lat,
        latitude + deg_lat,
        longitude - deg_lng,
        longitude + deg_lng,
    )


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Return distance between two lat/lon points in meters using Haversine."""
    # convert decimal degrees to radians
    lat1, lon1, lat2, lon2 = map(radians, (lat1, lon1, lat2, lon2))
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2
    c = 2 * asin(sqrt(a))
    return EARTH_RADIUS_M * c
# deal search logic and filtering