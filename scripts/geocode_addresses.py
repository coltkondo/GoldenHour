"""
Geocode a list of addresses to latitude/longitude using OpenStreetMap's
free Nominatim service (no API key required).

Usage:
    python scripts/geocode_addresses.py

Output:
    - Prints a tab-separated table to the console (paste directly into Excel)
    - Writes scripts/geocoded_addresses.csv
"""

import csv
import re
import sys
import time
from pathlib import Path

from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut, GeocoderServiceError

ADDRESSES = [
    "1776 Wilson Blvd, Arlington, VA 22209",
    "4001 Fairfax Dr, Arlington, VA 22203",
    "4100 Fairfax Dr, Arlington, VA 22203",
    "900 N Glebe Rd, Arlington, VA 22203",
    "3185 Wilson Blvd, Arlington, VA 22201",
    "3165 Wilson Blvd, Arlington, VA 22201",
    "2854 Wilson Blvd Suite B, Arlington, VA 22201",
    "2300 Clarendon Blvd, Arlington, VA 22201",
    "3100 Clarendon Blvd, Arlington, VA 22201",
    "3181 Wilson Blvd, Arlington, VA 22201",
    "900 N Glebe Rd, Arlington, VA 22203",
    "2051 Wilson Blvd, Arlington, VA 22201",
    "4213 Fairfax Dr, Arlington, VA 22203",
]

OUTPUT_CSV = Path(__file__).parent / "geocoded_addresses.csv"


def try_geocode(geolocator, address):
    for attempt in range(3):
        try:
            location = geolocator.geocode(address, country_codes="us")
            return (location.latitude, location.longitude) if location else (None, None)
        except (GeocoderTimedOut, GeocoderServiceError):
            time.sleep(2)
    return None, None


def geocode_all(addresses):
    geolocator = Nominatim(user_agent="goldenhour-address-geocoder")
    results = []

    for address in addresses:
        lat, lon = try_geocode(geolocator, address)
        time.sleep(1)  # Nominatim usage policy: max 1 request/second

        if lat is None:
            # Suite/unit numbers often confuse the geocoder; strip and retry
            stripped = re.sub(r",?\s*(suite|ste|unit|apt)\.?\s*\S+", "", address, flags=re.IGNORECASE)
            if stripped != address:
                lat, lon = try_geocode(geolocator, stripped)
                time.sleep(1)

        if lat is None:
            print(f"WARNING: no result found for: {address}", file=sys.stderr)

        results.append((address, lat, lon))

    return results


def main():
    results = geocode_all(ADDRESSES)

    with open(OUTPUT_CSV, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["address", "latitude", "longitude"])
        writer.writerows(results)

    print(f"\nSaved to {OUTPUT_CSV}\n")

    print("address\tlatitude\tlongitude")
    for address, lat, lon in results:
        lat_str = "" if lat is None else lat
        lon_str = "" if lon is None else lon
        print(f"{address}\t{lat_str}\t{lon_str}")


if __name__ == "__main__":
    main()
