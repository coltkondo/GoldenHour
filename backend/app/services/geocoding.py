"""
Geocoding via OpenStreetMap Nominatim.

Free, no API key required. Nominatim usage policy: max 1 req/sec,
identify with a User-Agent. This is only called on admin approval
of new_bar submissions, so volume is very low.
"""

import urllib.request
import urllib.parse
import json
from typing import Optional

from app.core.logging import logger

_NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
_USER_AGENT = "GoldenHour/1.0 (happy-hour-app)"


def geocode(name: str, address: str) -> Optional[tuple[float, float]]:
    """Resolve a bar name + address to (latitude, longitude).

    Tries name + address first, falls back to address-only.
    Returns None if geocoding fails (caller should handle gracefully).
    """
    for query in [f"{name}, {address}", address]:
        coords = _nominatim_search(query)
        if coords:
            return coords

    logger.bind(name=name, address=address).warning("geocoding_failed")
    return None


def _nominatim_search(query: str) -> Optional[tuple[float, float]]:
    params = urllib.parse.urlencode({
        "q": query,
        "format": "json",
        "limit": 1,
    })
    url = f"{_NOMINATIM_URL}?{params}"

    req = urllib.request.Request(url, headers={"User-Agent": _USER_AGENT})
    try:
        with urllib.request.urlopen(req, timeout=5) as resp:
            results = json.loads(resp.read())
    except Exception as exc:
        logger.bind(query=query, error=str(exc)).warning("nominatim_request_failed")
        return None

    if not results:
        return None

    lat = float(results[0]["lat"])
    lon = float(results[0]["lon"])
    return (lat, lon)
