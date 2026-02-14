#!/usr/bin/env python3
"""
Import Penn State bar, deal, and schedule data from CSV into Golden Hour DB.

Usage:
    # Dry run (validate only, no DB writes)
    python scripts/import_data.py --dry-run

    # Full import (venues → deals → schedules, in order)
    python scripts/import_data.py

    # Import specific files
    python scripts/import_data.py --venues data/pennstate_venues.csv
    python scripts/import_data.py --venues data/pennstate_venues.csv --deals data/pennstate_deals.csv --schedules data/pennstate_schedules.csv

CSV Formats:
    venues:    venue_id, name, nickname, address, phone, website, latitude, longitude, venue_type, tags, cash_only, neighborhood, ...
    deals:     deal_id, venue_id, deal_name, description, category, deal_price, original_price, is_food, is_drink, is_active
    schedules: schedule_id, deal_id, venue_id, day_of_week, start_time, end_time, is_all_day, is_happy_hour, is_active
"""
import argparse
import csv
import sys
import os
from datetime import time
from pathlib import Path

# Add backend to Python path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

from dotenv import load_dotenv
load_dotenv(Path(__file__).resolve().parent.parent / "backend" / ".env")

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.base import Base
from app.models.venue import Venue
from app.models.deal import Deal
from app.models.happy_hour import HappyHourSchedule


# Default file paths (relative to project root)
PROJECT_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_VENUES = PROJECT_ROOT / "data" / "pennstate_venues.csv"
DEFAULT_DEALS = PROJECT_ROOT / "data" / "pennstate_deals.csv"
DEFAULT_SCHEDULES = PROJECT_ROOT / "data" / "pennstate_schedules.csv"

# Day name → integer mapping (model uses 0=Monday, 6=Sunday)
DAY_MAP = {
    "monday": 0, "tuesday": 1, "wednesday": 2, "thursday": 3,
    "friday": 4, "saturday": 5, "sunday": 6,
}


def read_csv(filepath: Path) -> list[dict]:
    """Read CSV file, return list of row dicts."""
    with open(filepath, newline="", encoding="utf-8-sig") as f:
        return list(csv.DictReader(f))


def clean(value, field_type="str"):
    """Clean and cast a value."""
    if value is None or (isinstance(value, str) and value.strip() == ""):
        return None
    if field_type == "float":
        # Handle non-numeric values like "Varies", "1/2 off"
        s = str(value).strip().replace("$", "").replace(",", "")
        try:
            return float(s)
        except (ValueError, TypeError):
            return None
    if field_type == "int":
        try:
            return int(float(value))
        except (ValueError, TypeError):
            return None
    if field_type == "bool":
        if isinstance(value, bool):
            return value
        return str(value).strip().upper() in ("TRUE", "1", "YES")
    return str(value).strip() if isinstance(value, str) else str(value)


def parse_time(time_str: str) -> time:
    """Parse time string like '21:00' or '0:00' into a time object."""
    parts = time_str.strip().split(":")
    h = int(parts[0]) % 24
    m = int(parts[1]) if len(parts) > 1 else 0
    return time(h, m)


def derive_category(is_food, is_drink) -> str:
    """Derive deal category from is_food/is_drink booleans."""
    if is_food and is_drink:
        return "both"
    if is_food:
        return "food"
    return "drinks"


def import_venues(filepath: Path, session, dry_run: bool = False) -> dict:
    """Import venues. Returns mapping of CSV venue_id (SC001) → DB UUID."""
    rows = read_csv(filepath)
    stats = {"total": len(rows), "created": 0, "skipped_inactive": 0, "skipped_invalid": 0, "errors": []}
    id_map = {}  # SC001 → UUID

    for i, row in enumerate(rows, start=2):
        csv_id = clean(row.get("venue_id"))
        name = clean(row.get("name"))
        address = clean(row.get("address"))
        is_active = clean(row.get("is_active"), "bool")

        if not name:
            stats["skipped_invalid"] += 1
            stats["errors"].append(f"Row {i}: Missing name")
            continue

        # Skip venues without address (like Jax Pub with no info)
        if not address:
            if not is_active:
                stats["skipped_inactive"] += 1
                continue
            stats["skipped_invalid"] += 1
            stats["errors"].append(f"Row {i}: Missing address for '{name}'")
            continue

        # Parse tags from comma-separated string
        tags_raw = clean(row.get("tags"))
        tags = [t.strip() for t in tags_raw.split(",") if t.strip()] if tags_raw else None

        # Check for existing venue by name+address
        existing = session.query(Venue).filter(Venue.name == name, Venue.address == address).first()
        if existing:
            id_map[csv_id] = existing.id
            stats["created"] += 0  # already exists
            continue

        venue = Venue(
            name=name,
            nickname=clean(row.get("nickname")),
            address=address,
            latitude=clean(row.get("latitude"), "float"),
            longitude=clean(row.get("longitude"), "float"),
            phone=clean(row.get("phone")),
            website=clean(row.get("website")),
            neighborhood=clean(row.get("neighborhood")),
            venue_type=clean(row.get("venue_type")),
            tags=tags,
            cash_only=clean(row.get("cash_only"), "bool"),
            active=is_active if is_active is not None else True,
        )

        if not dry_run:
            session.add(venue)
            session.flush()  # get the UUID assigned
            id_map[csv_id] = venue.id
        else:
            # For dry run, use csv_id as placeholder
            id_map[csv_id] = csv_id

        stats["created"] += 1

    if not dry_run:
        session.commit()

    return stats, id_map


def import_deals(filepath: Path, session, venue_id_map: dict, dry_run: bool = False) -> dict:
    """Import deals. Returns mapping of CSV deal_id (D001) → DB UUID."""
    rows = read_csv(filepath)
    stats = {"total": len(rows), "created": 0, "skipped_no_venue": 0, "skipped_invalid": 0, "errors": []}
    deal_id_map = {}  # D001 → UUID

    for i, row in enumerate(rows, start=2):
        csv_deal_id = clean(row.get("deal_id"))
        csv_venue_id = clean(row.get("venue_id"))
        title = clean(row.get("deal_name"))
        description = clean(row.get("description"))

        if not title:
            stats["skipped_invalid"] += 1
            stats["errors"].append(f"Row {i}: Missing deal_name")
            continue

        # Resolve venue
        db_venue_id = venue_id_map.get(csv_venue_id)
        if not db_venue_id:
            stats["skipped_no_venue"] += 1
            stats["errors"].append(f"Row {i}: No venue for '{csv_venue_id}' (deal: '{title}')")
            continue

        # Derive category from is_food/is_drink
        is_food = clean(row.get("is_food"), "bool")
        is_drink = clean(row.get("is_drink"), "bool")
        category = derive_category(is_food, is_drink)

        # Use the CSV category as deal_type (Seltzer, Beer, Cocktails, etc.)
        deal_type = clean(row.get("category")) or "special_price"

        # Parse prices
        deal_price = clean(row.get("deal_price"), "float")
        original_price = clean(row.get("original_price"), "float")

        # Calculate discount percentage
        discount_pct = None
        if deal_price is not None and original_price is not None and original_price > 0:
            discount_pct = round((1 - deal_price / original_price) * 100, 1)

        is_active = clean(row.get("is_active"), "bool")

        deal = Deal(
            venue_id=db_venue_id,
            title=title,
            description=description,
            category=category,
            deal_type=deal_type,
            deal_price=deal_price,
            original_price=original_price,
            discount_percentage=discount_pct,
            items=[],
            source="import",
            active=is_active if is_active is not None else True,
        )

        if not dry_run:
            session.add(deal)
            session.flush()
            deal_id_map[csv_deal_id] = deal.id
        else:
            deal_id_map[csv_deal_id] = csv_deal_id

        stats["created"] += 1

    if not dry_run:
        session.commit()

    return stats, deal_id_map


def import_schedules(filepath: Path, session, venue_id_map: dict, deal_id_map: dict, dry_run: bool = False) -> dict:
    """Import happy hour schedules."""
    rows = read_csv(filepath)
    stats = {"total": len(rows), "created": 0, "skipped": 0, "errors": []}

    for i, row in enumerate(rows, start=2):
        csv_deal_id = clean(row.get("deal_id"))
        csv_venue_id = clean(row.get("venue_id"))
        day_name = clean(row.get("day_of_week"))

        db_venue_id = venue_id_map.get(csv_venue_id)
        db_deal_id = deal_id_map.get(csv_deal_id)

        if not db_venue_id:
            stats["skipped"] += 1
            stats["errors"].append(f"Row {i}: No venue for '{csv_venue_id}'")
            continue

        if not day_name or day_name.lower() not in DAY_MAP:
            stats["skipped"] += 1
            stats["errors"].append(f"Row {i}: Invalid day '{day_name}'")
            continue

        day_of_week = DAY_MAP[day_name.lower()]

        start_str = clean(row.get("start_time"))
        end_str = clean(row.get("end_time"))
        if not start_str or not end_str:
            stats["skipped"] += 1
            stats["errors"].append(f"Row {i}: Missing time")
            continue

        start = parse_time(start_str)
        end = parse_time(end_str)

        is_active = clean(row.get("is_active"), "bool")
        is_happy_hour = clean(row.get("is_happy_hour"), "bool")

        # Build notes from flags
        notes_parts = []
        if clean(row.get("is_all_day"), "bool"):
            notes_parts.append("All day")
        if is_happy_hour:
            notes_parts.append("Happy hour")
        notes = ", ".join(notes_parts) if notes_parts else None

        schedule = HappyHourSchedule(
            venue_id=db_venue_id,
            day_of_week=day_of_week,
            start_time=start,
            end_time=end,
            deal_ids=[db_deal_id] if db_deal_id else [],
            notes=notes,
            active=is_active if is_active is not None else True,
        )

        if not dry_run:
            session.add(schedule)
        stats["created"] += 1

    if not dry_run:
        session.commit()

    return stats


def print_stats(label: str, stats: dict):
    """Pretty-print import stats."""
    print(f"\n  {label}:")
    for key, val in stats.items():
        if key == "errors":
            continue
        print(f"    {key:>16}: {val}")
    if stats.get("errors"):
        print(f"    Errors ({len(stats['errors'])}):")
        for err in stats["errors"][:15]:
            print(f"      - {err}")
        if len(stats["errors"]) > 15:
            print(f"      ... and {len(stats['errors']) - 15} more")


def main():
    parser = argparse.ArgumentParser(description="Import Penn State bar data into Golden Hour DB")
    parser.add_argument("--venues", help="Path to venues CSV", default=str(DEFAULT_VENUES))
    parser.add_argument("--deals", help="Path to deals CSV", default=str(DEFAULT_DEALS))
    parser.add_argument("--schedules", help="Path to schedules CSV", default=str(DEFAULT_SCHEDULES))
    parser.add_argument("--skip-venues", action="store_true", help="Skip venue import")
    parser.add_argument("--skip-deals", action="store_true", help="Skip deal import")
    parser.add_argument("--skip-schedules", action="store_true", help="Skip schedule import")
    parser.add_argument("--dry-run", action="store_true", help="Validate without writing to DB")
    parser.add_argument("--database-url", help="Override DATABASE_URL")
    args = parser.parse_args()

    db_url = args.database_url or os.environ.get("DATABASE_URL")
    if not db_url:
        print("ERROR: DATABASE_URL not set. Use --database-url or set the env var.")
        sys.exit(1)

    engine = create_engine(db_url)
    Session = sessionmaker(bind=engine)
    session = Session()

    prefix = "[DRY RUN] " if args.dry_run else ""
    venue_id_map = {}
    deal_id_map = {}

    try:
        # --- Venues ---
        if not args.skip_venues and Path(args.venues).exists():
            print(f"\n{prefix}Importing venues from {args.venues}...")
            stats, venue_id_map = import_venues(Path(args.venues), session, args.dry_run)
            print_stats("Venues", stats)
            print(f"    ID mappings: {len(venue_id_map)} venues mapped")
        else:
            # Build mapping from existing DB venues if skipping import
            venues = session.query(Venue).all()
            # Can't map CSV IDs without the CSV, but deals will need venue UUIDs
            print("  Skipping venue import (using existing DB venues)")

        # --- Deals ---
        if not args.skip_deals and Path(args.deals).exists():
            if not venue_id_map:
                print("\n  WARNING: No venue ID mapping available. Deals need venues imported first.")
            else:
                print(f"\n{prefix}Importing deals from {args.deals}...")
                stats, deal_id_map = import_deals(Path(args.deals), session, venue_id_map, args.dry_run)
                print_stats("Deals", stats)
                print(f"    ID mappings: {len(deal_id_map)} deals mapped")

        # --- Schedules ---
        if not args.skip_schedules and Path(args.schedules).exists():
            if not venue_id_map or not deal_id_map:
                print("\n  WARNING: Need both venue and deal mappings for schedules.")
            else:
                print(f"\n{prefix}Importing schedules from {args.schedules}...")
                stats = import_schedules(Path(args.schedules), session, venue_id_map, deal_id_map, args.dry_run)
                print_stats("Schedules", stats)

        print(f"\n{'[DRY RUN] ' if args.dry_run else ''}Done!")

    except Exception as e:
        session.rollback()
        print(f"\nERROR: {e}")
        raise
    finally:
        session.close()


if __name__ == "__main__":
    main()
