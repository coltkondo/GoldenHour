from math import radians, cos, sin, asin, sqrt, pi


EARTH_RADIUS_M = 6371000.0


def bounding_box(latitude: float, longitude: float, radius_m: float):
    """Return (min_lat, max_lat, min_lng, max_lng) for a radius in meters.

    Clamps latitude to [-90, 90], wraps longitude to [-180, 180],
    and handles the poles by returning full longitude range when
    the computed extent exceeds 180 degrees.
    """
    lat_rad = radians(latitude)
    deg_lat = (radius_m / EARTH_RADIUS_M) * (180.0 / pi)

    min_lat = max(-90.0, latitude - deg_lat)
    max_lat = min(90.0, latitude + deg_lat)

    cos_lat = cos(lat_rad)
    if abs(cos_lat) < 1e-10:
        # At/near the poles — longitude covers full circle
        min_lng = -180.0
        max_lng = 180.0
    else:
        deg_lng = (radius_m / (EARTH_RADIUS_M * cos_lat)) * (180.0 / pi)
        if deg_lng >= 180.0:
            # Extent covers full globe
            min_lng = -180.0
            max_lng = 180.0
        else:
            min_lng = ((longitude - deg_lng) + 180) % 360 - 180
            max_lng = ((longitude + deg_lng) + 180) % 360 - 180

    return (min_lat, max_lat, min_lng, max_lng)


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
