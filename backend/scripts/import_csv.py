"""
Import venues, deals, and schedules from a market's CSV files.

Usage:
    python -m scripts.import_csv --market <slug>           # seed if empty
    python -m scripts.import_csv --market <slug> --force  # wipe market + re-import

CSVs must live at:
    data/<slug>/venues.csv
    data/<slug>/deals.csv
    data/<slug>/schedules.csv

The market slug must match an existing row in the markets table.
"""

import sys
import csv
import argparse
from pathlib import Path
from datetime import time, date

sys.path.append(str(Path(__file__).parent.parent))

from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.database import SessionLocal
from app.models.market import Market
from app.models.venue import Venue
from app.models.deal import Deal
from app.models.happy_hour import HappyHourSchedule

REPO_ROOT = Path(__file__).parent.parent.parent

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


def parse_date(val: str):
    if not val or val.strip() == "":
        return None
    try:
        return date.fromisoformat(val.strip())
    except ValueError:
        return None


def parse_float(val: str):
    if not val or val.strip() == "":
        return None
    val = val.strip().replace("$", "")
    try:
        return float(val)
    except ValueError:
        return None


def parse_time(val: str, is_end: bool = False) -> time:
    val = val.strip()
    parts = val.split(":")
    hour = int(parts[0])
    minute = int(parts[1]) if len(parts) > 1 else 0
    if hour >= 24:
        hour, minute = 23, 59
    # End times before 6 AM mean "past midnight / until close" — clamp to 23:59
    # so they satisfy the DB constraint (end_time > start_time, same calendar day).
    if is_end and hour < 6:
        hour, minute = 23, 59
    return time(hour, minute)


def categorize_deal(is_food: str, is_drink: str, category_raw: str) -> tuple[str, str]:
    food = parse_bool(is_food)
    drink = parse_bool(is_drink)
    if food and drink:
        category = "both"
    elif food:
        category = "food"
    else:
        category = "drinks"
    deal_type = "special_price"
    cat_lower = category_raw.lower() if category_raw else ""
    if "half" in cat_lower or "1/2" in cat_lower:
        deal_type = "discount"
    return category, deal_type


def resolve_market(db: Session, slug: str) -> Market:
    market = db.query(Market).filter(Market.slug == slug).first()
    if market is None:
        available = [m.slug for m in db.query(Market.slug).all()]
        print(f"Error: no market with slug '{slug}' found in the database.")
        print(f"  Available: {available or ['(none — run migration first)']}")
        sys.exit(1)
    return market


def clear_market(db: Session, market: Market) -> None:
    venue_ids = db.execute(
        text("SELECT id FROM venues WHERE market_id = :mid"),
        {"mid": market.id}
    ).scalars().all()

    n_venues = len(venue_ids)
    if n_venues == 0:
        print(f"  No existing data for market '{market.slug}' — nothing to clear.")
        return

    # Schedules and deals are linked via venue → must clear by venue_id
    n_sched = db.execute(
        text("SELECT COUNT(*) FROM happy_hour_schedules WHERE venue_id = ANY(:ids)"),
        {"ids": list(venue_ids)}
    ).scalar()
    n_deals = db.execute(
        text("SELECT COUNT(*) FROM deals WHERE venue_id = ANY(:ids)"),
        {"ids": list(venue_ids)}
    ).scalar()

    print(f"  Clearing {n_sched} schedules, {n_deals} deals, {n_venues} venues "
          f"for market '{market.slug}'...")

    db.execute(
        text("DELETE FROM happy_hour_schedules WHERE venue_id = ANY(:ids)"),
        {"ids": list(venue_ids)}
    )
    db.execute(
        text("DELETE FROM deals WHERE venue_id = ANY(:ids)"),
        {"ids": list(venue_ids)}
    )
    db.execute(
        text("DELETE FROM venues WHERE market_id = :mid"),
        {"mid": market.id}
    )
    db.commit()
    print("  Cleared.")


def import_data(db: Session, market: Market, data_dir: Path) -> None:
    venue_csv_to_uuid: dict[str, object] = {}
    deal_csv_to_uuid: dict[str, object] = {}

    # ── Venues ───────────────────────────────────────────────────────────────
    venues_file = data_dir / "venues.csv"
    print(f"\nReading venues from {venues_file}")
    with open(venues_file, newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            csv_id = row["venue_id"].strip()
            lat = parse_float(row.get("latitude", ""))
            lng = parse_float(row.get("longitude", ""))
            if lat is None or lng is None:
                print(f"  Skipping {row['name']} (no coordinates)")
                continue
            tags_raw = row.get("tags", "")
            tags = [t.strip() for t in tags_raw.split(",") if t.strip()] if tags_raw else None
            venue = Venue(
                market_id=market.id,
                name=row["name"].strip(),
                nickname=row.get("nickname", "").strip() or None,
                address=row["address"].strip() if row.get("address") else "State College, PA",
                latitude=lat,
                longitude=lng,
                phone=row.get("phone", "").strip() or None,
                website=row.get("website", "").strip() or None,
                neighborhood=row.get("neighborhood", "Downtown").strip(),
                venue_type=row.get("venue_type", "").strip() or "Bar",
                tags=tags,
                cash_only=parse_bool(row.get("cash_only", "FALSE")),
                active=parse_bool(row.get("is_active", "TRUE")),
                verified=True,
            )
            db.add(venue)
            db.flush()
            venue_csv_to_uuid[csv_id] = venue.id
            print(f"  + Venue: {venue.name} ({csv_id})")

    # ── Deals ─────────────────────────────────────────────────────────────────
    deals_file = data_dir / "deals.csv"
    print(f"\nReading deals from {deals_file}")
    with open(deals_file, newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
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
            discount_pct = None
            if deal_price is not None and original_price is not None and original_price > 0:
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
                valid_through=parse_date(row.get("valid_through", "")),
            )
            db.add(deal)
            db.flush()
            deal_csv_to_uuid[csv_deal_id] = deal.id
            print(f"  + Deal: {deal.title} ({csv_deal_id})")

    # ── Schedules ─────────────────────────────────────────────────────────────
    schedule_groups: dict[tuple, dict] = {}
    schedules_file = data_dir / "schedules.csv"
    print(f"\nReading schedules from {schedules_file}")
    with open(schedules_file, newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
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
            key = (str(venue_uuid), day, start, end)
            if key not in schedule_groups:
                schedule_groups[key] = {
                    "venue_uuid": venue_uuid,
                    "day": day,
                    "start": start,
                    "end": end,
                    "deal_ids": [],
                    "is_active": parse_bool(row.get("is_active", "TRUE")),
                }
            schedule_groups[key]["deal_ids"].append(deal_uuid)

    for group in schedule_groups.values():
        db.add(HappyHourSchedule(
            venue_id=group["venue_uuid"],
            day_of_week=group["day"],
            start_time=parse_time(group["start"]),
            end_time=parse_time(group["end"], is_end=True),
            deal_ids=group["deal_ids"],
            active=group["is_active"],
        ))

    db.commit()
    print(f"\nDone! Imported into market '{market.slug}':")
    print(f"  {len(venue_csv_to_uuid)} venues")
    print(f"  {len(deal_csv_to_uuid)} deals")
    print(f"  {len(schedule_groups)} schedules")


def seed_if_empty(db: Session, market: Market, data_dir: Path) -> None:
    count = db.execute(
        text("SELECT COUNT(*) FROM venues WHERE market_id = :mid"),
        {"mid": market.id}
    ).scalar()
    if count > 0:
        print(f"Market '{market.slug}' already has {count} venues — skipping seed.")
        print("  Use --force to wipe and re-import.")
        return
    print(f"Market '{market.slug}' is empty — seeding from CSVs...")
    import_data(db, market, data_dir)


def main() -> None:
    parser = argparse.ArgumentParser(description="Import happy hour data for a market.")
    parser.add_argument(
        "--market",
        required=True,
        metavar="SLUG",
        help="Market slug (e.g. state-college, arlington). Must exist in the markets table.",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Clear existing venues/deals/schedules for this market before importing.",
    )
    args = parser.parse_args()

    data_dir = REPO_ROOT / "data" / args.market
    if not data_dir.is_dir():
        print(f"Error: data directory not found: {data_dir}")
        print(f"  Create it and add venues.csv, deals.csv, schedules.csv.")
        sys.exit(1)

    db = SessionLocal()
    try:
        market = resolve_market(db, args.market)
        print(f"Market: {market.name} ({market.slug}) — {market.launch_status}")

        if args.force:
            clear_market(db, market)

        seed_if_empty(db, market, data_dir)
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
