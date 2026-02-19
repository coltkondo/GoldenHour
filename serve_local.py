"""
Local development API server that serves State College data directly from CSV files.
No database required!

Usage: python3 serve_local.py
Then run: cd mobile && npx expo start
"""
import csv
import uuid
from datetime import datetime
from math import radians, cos, sin, asin, sqrt, pi
from pathlib import Path

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional

DATA_DIR = Path(__file__).parent / "data"

# ---------- Data Loading ----------

DAY_MAP = {
    "Monday": 0, "Tuesday": 1, "Wednesday": 2, "Thursday": 3,
    "Friday": 4, "Saturday": 5, "Sunday": 6,
}


def parse_float(val: str):
    if not val or val.strip() == "":
        return None
    val = val.strip().replace("$", "")
    try:
        return float(val)
    except ValueError:
        return None


def parse_bool(val: str) -> bool:
    return val.strip().upper() == "TRUE"


def load_data():
    venues = {}
    deals = {}
    schedules = []
    venue_csv_to_uuid = {}
    deal_csv_to_uuid = {}
    now = datetime.now().isoformat()

    # Load venues
    with open(DATA_DIR / "pennstate_venues.csv", newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            csv_id = row["venue_id"].strip()
            lat = parse_float(row.get("latitude", ""))
            lng = parse_float(row.get("longitude", ""))
            if lat is None or lng is None:
                continue

            tags_raw = row.get("tags", "")
            tags = [t.strip() for t in tags_raw.split(",") if t.strip()] if tags_raw else []

            vid = str(uuid.uuid4())
            venue_csv_to_uuid[csv_id] = vid
            venues[vid] = {
                "id": vid,
                "name": row["name"].strip(),
                "nickname": row.get("nickname", "").strip() or None,
                "address": row["address"].strip() if row.get("address") else "State College, PA",
                "latitude": lat,
                "longitude": lng,
                "phone": row.get("phone", "").strip() or None,
                "website": row.get("website", "").strip() or None,
                "neighborhood": row.get("neighborhood", "Downtown").strip(),
                "venue_type": row.get("venue_type", "").strip() or "Bar",
                "tags": tags,
                "cash_only": parse_bool(row.get("cash_only", "FALSE")),
                "google_place_id": None,
                "price_level": None,
                "rating": None,
                "verified": True,
                "active": parse_bool(row.get("is_active", "TRUE")),
                "description": None,
                "created_at": now,
                "updated_at": now,
            }

    # Load deals
    with open(DATA_DIR / "pennstate_deals.csv", newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            csv_deal_id = row["deal_id"].strip()
            csv_venue_id = row["venue_id"].strip()
            venue_uuid = venue_csv_to_uuid.get(csv_venue_id)
            if venue_uuid is None:
                continue

            is_food = parse_bool(row.get("is_food", "FALSE"))
            is_drink = parse_bool(row.get("is_drink", "FALSE"))
            if is_food and is_drink:
                category = "both"
            elif is_food:
                category = "food"
            else:
                category = "drinks"

            deal_price = parse_float(row.get("deal_price", ""))
            original_price = parse_float(row.get("original_price", ""))
            discount_pct = None
            if deal_price is not None and original_price is not None and original_price > 0:
                discount_pct = round((1 - deal_price / original_price) * 100, 1)

            did = str(uuid.uuid4())
            deal_csv_to_uuid[csv_deal_id] = did
            deals[did] = {
                "id": did,
                "venue_id": venue_uuid,
                "title": row["deal_name"].strip(),
                "description": row.get("description", "").strip() or None,
                "category": category,
                "deal_type": "special_price",
                "original_price": original_price,
                "deal_price": deal_price,
                "discount_percentage": discount_pct,
                "items": [],
                "active": parse_bool(row.get("is_active", "TRUE")),
                "verified": True,
                "source": "import",
                "created_at": now,
                "updated_at": now,
            }

    # Load schedules - group by (venue, day, start, end)
    schedule_groups = {}
    with open(DATA_DIR / "pennstate_schedules.csv", newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            csv_deal_id = row["deal_id"].strip()
            csv_venue_id = row["venue_id"].strip()
            venue_uuid = venue_csv_to_uuid.get(csv_venue_id)
            deal_uuid = deal_csv_to_uuid.get(csv_deal_id)
            if venue_uuid is None or deal_uuid is None:
                continue

            day = DAY_MAP.get(row["day_of_week"].strip())
            if day is None:
                continue

            start = row["start_time"].strip()
            end = row["end_time"].strip()
            # Normalize times
            if start == "0:00":
                start = "00:00"
            if end == "23:59":
                end = "23:59"
            if end == "0:00":
                end = "00:00"

            key = (venue_uuid, day, start, end)
            if key not in schedule_groups:
                schedule_groups[key] = {
                    "venue_uuid": venue_uuid,
                    "day": day,
                    "start": start,
                    "end": end,
                    "deal_ids": [],
                }
            schedule_groups[key]["deal_ids"].append(deal_uuid)

    for key, group in schedule_groups.items():
        sid = str(uuid.uuid4())
        schedules.append({
            "id": sid,
            "venue_id": group["venue_uuid"],
            "day_of_week": group["day"],
            "start_time": group["start"],
            "end_time": group["end"],
            "deal_ids": group["deal_ids"],
            "notes": None,
            "restrictions": None,
            "active": True,
            "created_at": now,
            "updated_at": now,
        })

    return venues, deals, schedules


# ---------- Load data on startup ----------
VENUES, DEALS, SCHEDULES = load_data()

print(f"Loaded: {len(VENUES)} venues, {len(DEALS)} deals, {len(SCHEDULES)} schedules")


# ---------- Geo helpers ----------
EARTH_RADIUS_M = 6371000.0

def haversine_distance(lat1, lon1, lat2, lon2):
    lat1, lon1, lat2, lon2 = map(radians, (lat1, lon1, lat2, lon2))
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2
    return EARTH_RADIUS_M * 2 * asin(sqrt(a))


# ---------- FastAPI App ----------
app = FastAPI(title="Golden Hour Local Dev API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {
        "message": "Golden Hour Local Dev API",
        "venues": len(VENUES),
        "deals": len(DEALS),
        "schedules": len(SCHEDULES),
    }


@app.get("/health")
def health():
    return {"status": "healthy"}


# ---------- Venue Endpoints ----------

@app.get("/api/v1/venues/")
@app.get("/api/v1/venues")
def list_venues(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    neighborhood: Optional[str] = None,
    active_only: bool = True,
):
    results = list(VENUES.values())
    if active_only:
        results = [v for v in results if v["active"]]
    if neighborhood:
        results = [v for v in results if v.get("neighborhood") == neighborhood]
    return results[skip:skip + limit]


@app.get("/api/v1/venues/nearby")
def get_nearby_venues(
    latitude: float = Query(...),
    longitude: float = Query(...),
    radius_meters: int = Query(10000, ge=100, le=50000),
    limit: int = Query(50, ge=1, le=100),
):
    nearby = []
    for v in VENUES.values():
        if not v["active"] or v["latitude"] is None:
            continue
        dist = haversine_distance(latitude, longitude, v["latitude"], v["longitude"])
        if dist <= radius_meters:
            nearby.append((v, dist))
    nearby.sort(key=lambda t: t[1])
    return [t[0] for t in nearby[:limit]]


@app.get("/api/v1/venues/neighborhoods/list")
def list_neighborhoods():
    hoods = set()
    for v in VENUES.values():
        if v["active"] and v.get("neighborhood"):
            hoods.add(v["neighborhood"])
    return sorted(hoods)


@app.get("/api/v1/venues/{venue_id}")
def get_venue(venue_id: str):
    venue = VENUES.get(venue_id)
    if not venue:
        return {"detail": "Venue not found"}, 404
    return venue


@app.get("/api/v1/venues/{venue_id}/schedules")
def get_venue_schedules(venue_id: str):
    return [s for s in SCHEDULES if s["venue_id"] == venue_id and s["active"]]


# ---------- Deal Endpoints ----------

@app.get("/api/v1/deals/active")
def get_active_deals(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    category: Optional[str] = None,
    venue_id: Optional[str] = None,
):
    results = [d for d in DEALS.values() if d["active"]]
    if category:
        results = [d for d in results if d["category"] == category]
    if venue_id:
        results = [d for d in results if d["venue_id"] == venue_id]
    return results[skip:skip + limit]


@app.get("/api/v1/deals/today")
def get_todays_deals():
    today = datetime.now().weekday()  # 0=Monday

    # Collect deal IDs from today's schedules
    today_deal_ids = set()
    for s in SCHEDULES:
        if s["day_of_week"] == today and s["active"]:
            for did in s.get("deal_ids", []):
                today_deal_ids.add(did)

    return [d for d in DEALS.values() if d["id"] in today_deal_ids and d["active"]]


@app.get("/api/v1/deals/nearby")
def get_nearby_deals(
    latitude: float = Query(...),
    longitude: float = Query(...),
    radius_meters: int = Query(10000, ge=100, le=50000),
    active_now: bool = Query(False),
):
    # Find nearby venue IDs
    nearby_venue_ids = set()
    for v in VENUES.values():
        if not v["active"] or v["latitude"] is None:
            continue
        dist = haversine_distance(latitude, longitude, v["latitude"], v["longitude"])
        if dist <= radius_meters:
            nearby_venue_ids.add(v["id"])

    results = [d for d in DEALS.values() if d["active"] and d["venue_id"] in nearby_venue_ids]

    if active_now:
        today = datetime.now().weekday()
        today_deal_ids = set()
        for s in SCHEDULES:
            if s["day_of_week"] == today and s["active"]:
                for did in s.get("deal_ids", []):
                    today_deal_ids.add(did)
        results = [d for d in results if d["id"] in today_deal_ids]

    return results


@app.get("/api/v1/deals/{deal_id}")
def get_deal(deal_id: str):
    deal = DEALS.get(deal_id)
    if not deal:
        return {"detail": "Deal not found"}, 404
    return deal


if __name__ == "__main__":
    import uvicorn
    print("\n🌅 Golden Hour Local Dev Server")
    print(f"📍 Serving {len(VENUES)} State College venues, {len(DEALS)} deals, {len(SCHEDULES)} schedules")
    print(f"🔗 API at http://localhost:8000/api/v1")
    print(f"📖 Docs at http://localhost:8000/docs\n")
    uvicorn.run(app, host="0.0.0.0", port=8000)
