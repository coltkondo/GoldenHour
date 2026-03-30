"""
Import Penn State State College venues, deals, and schedules from CSV files.
Run with: cd backend && python -m scripts.import_csv
"""

import sys
import csv
from pathlib import Path
from datetime import time

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.venue import Venue
from app.models.deal import Deal
from app.models.happy_hour import HappyHourSchedule

DATA_DIR = Path(__file__).parent.parent.parent / "data"

DAY_MAP = {
    "Monday": 0,
    "Tuesday": 1,
    "Wednesday": 2,
    "Thursday": 3,
    "Friday": 4,
    "Saturday": 5,
    "Sunday": 6,
}


def parse_bool(val: str) -> bool:
    return val.strip().upper() == "TRUE"


def parse_float(val: str):
    """Parse a float, returning None for empty or non-numeric values."""
    if not val or val.strip() == "":
        return None
    val = val.strip().replace("$", "")
    try:
        return float(val)
    except ValueError:
        return None


def parse_time(val: str, is_end: bool = False) -> time:
    """Parse time string like '21:00' or '0:00' into a time object.
    When is_end=True, converts midnight (0:00) to 23:59 for DB constraint.
    """
    val = val.strip()
    parts = val.split(":")
    hour = int(parts[0])
    minute = int(parts[1]) if len(parts) > 1 else 0
    # Handle hour=24 as 23:59
    if hour >= 24:
        hour = 23
        minute = 59
    # Handle midnight (0:00) used as end-of-day: clamp to 23:59
    if is_end and hour == 0 and minute == 0:
        hour = 23
        minute = 59
    return time(hour, minute)


def categorize_deal(is_food: str, is_drink: str, category_raw: str) -> tuple[str, str]:
    """Return (category, deal_type) for a deal."""
    food = parse_bool(is_food)
    drink = parse_bool(is_drink)

    if food and drink:
        category = "both"
    elif food:
        category = "food"
    else:
        category = "drinks"

    # Determine deal_type from the raw category or description
    deal_type = "special_price"
    cat_lower = category_raw.lower() if category_raw else ""
    if "half" in cat_lower or "1/2" in cat_lower:
        deal_type = "discount"

    return category, deal_type


def import_data(db: Session):
    """Import all CSV data into the database."""
    venue_csv_to_uuid = {}
    deal_csv_to_uuid = {}

    # --- Import Venues ---
    venues_file = DATA_DIR / "pennstate_venues.csv"
    print(f"Reading venues from {venues_file}")
    with open(venues_file, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            csv_id = row["venue_id"].strip()
            lat = parse_float(row.get("latitude", ""))
            lng = parse_float(row.get("longitude", ""))
            is_active = parse_bool(row.get("is_active", "TRUE"))

            # Skip venues with no coordinates
            if lat is None or lng is None:
                print(f"  Skipping {row['name']} (no coordinates)")
                continue

            # Parse tags from comma-separated string
            tags_raw = row.get("tags", "")
            tags = (
                [t.strip() for t in tags_raw.split(",") if t.strip()]
                if tags_raw
                else None
            )

            venue = Venue(
                name=row["name"].strip(),
                nickname=row.get("nickname", "").strip() or None,
                address=row["address"].strip()
                if row.get("address")
                else f"State College, PA",
                latitude=lat,
                longitude=lng,
                phone=row.get("phone", "").strip() or None,
                website=row.get("website", "").strip() or None,
                neighborhood=row.get("neighborhood", "Downtown").strip(),
                venue_type=row.get("venue_type", "").strip() or "Bar",
                tags=tags,
                cash_only=parse_bool(row.get("cash_only", "FALSE")),
                active=is_active,
                verified=True,
                description=None,
            )
            db.add(venue)
            db.flush()  # Get UUID
            venue_csv_to_uuid[csv_id] = venue.id
            print(f"  + Venue: {venue.name} ({csv_id} -> {venue.id})")

    # --- Import Deals ---
    deals_file = DATA_DIR / "pennstate_deals.csv"
    print(f"\nReading deals from {deals_file}")
    with open(deals_file, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            csv_deal_id = row["deal_id"].strip()
            csv_venue_id = row["venue_id"].strip()

            venue_uuid = venue_csv_to_uuid.get(csv_venue_id)
            if venue_uuid is None:
                print(f"  Skipping deal {csv_deal_id} (venue {csv_venue_id} not found)")
                continue

            category, deal_type = categorize_deal(
                row.get("is_food", "FALSE"),
                row.get("is_drink", "FALSE"),
                row.get("category", ""),
            )

            deal_price = parse_float(row.get("deal_price", ""))
            original_price = parse_float(row.get("original_price", ""))

            # Calculate discount percentage if both prices exist
            discount_pct = None
            if (
                deal_price is not None
                and original_price is not None
                and original_price > 0
            ):
                discount_pct = round((1 - deal_price / original_price) * 100, 1)

            deal = Deal(
                venue_id=venue_uuid,
                title=row["deal_name"].strip(),
                description=row.get("description", "").strip() or None,
                category=category,
                deal_type=deal_type,
                deal_price=deal_price,
                original_price=original_price,
                discount_percentage=discount_pct,
                items=[],
                active=parse_bool(row.get("is_active", "TRUE")),
                verified=True,
                source="import",
            )
            db.add(deal)
            db.flush()
            deal_csv_to_uuid[csv_deal_id] = deal.id
            print(f"  + Deal: {deal.title} ({csv_deal_id})")

    # --- Import Schedules ---
    # Group by (venue, day, start, end) to combine deal_ids
    schedule_groups: dict[tuple, list] = {}

    schedules_file = DATA_DIR / "pennstate_schedules.csv"
    print(f"\nReading schedules from {schedules_file}")
    with open(schedules_file, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            csv_deal_id = row["deal_id"].strip()
            csv_venue_id = row["venue_id"].strip()

            venue_uuid = venue_csv_to_uuid.get(csv_venue_id)
            deal_uuid = deal_csv_to_uuid.get(csv_deal_id)

            if venue_uuid is None or deal_uuid is None:
                continue

            day = DAY_MAP.get(row["day_of_week"].strip())
            if day is None:
                print(f"  Skipping schedule (unknown day: {row['day_of_week']})")
                continue

            start = row["start_time"].strip()
            end = row["end_time"].strip()
            is_active = parse_bool(row.get("is_active", "TRUE"))

            key = (str(venue_uuid), day, start, end)
            if key not in schedule_groups:
                schedule_groups[key] = {
                    "venue_uuid": venue_uuid,
                    "day": day,
                    "start": start,
                    "end": end,
                    "deal_ids": [],
                    "is_active": is_active,
                }
            schedule_groups[key]["deal_ids"].append(deal_uuid)

    # Create schedule records
    for key, group in schedule_groups.items():
        schedule = HappyHourSchedule(
            venue_id=group["venue_uuid"],
            day_of_week=group["day"],
            start_time=parse_time(group["start"]),
            end_time=parse_time(group["end"], is_end=True),
            deal_ids=group["deal_ids"],
            active=group["is_active"],
        )
        db.add(schedule)

    print(f"\n  + Created {len(schedule_groups)} schedule entries")

    db.commit()
    print(f"\nDone! Imported:")
    print(f"  {len(venue_csv_to_uuid)} venues")
    print(f"  {len(deal_csv_to_uuid)} deals")
    print(f"  {len(schedule_groups)} schedules")


def seed_if_empty(db: Session) -> bool:
    """Seed database from CSV if venues table is empty. Returns True if seeded."""
    count = db.query(Venue).count()
    if count > 0:
        print(f"Database already has {count} venues, skipping seed.")
        return False

    print("Database is empty, seeding from CSV...")
    import_data(db)
    return True


if __name__ == "__main__":
    db = SessionLocal()
    try:
        # Check for --force flag to clear and re-import
        force = "--force" in sys.argv
        if force:
            print("Force mode: clearing existing data...")
            db.query(HappyHourSchedule).delete()
            db.query(Deal).delete()
            db.query(Venue).delete()
            db.commit()
            print("Cleared all data.")

        seed_if_empty(db)
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
        raise
    finally:
        db.close()
