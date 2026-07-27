"""
Bulk-set venue logo_url from docs/logos.md.

Usage:
    python scripts/seed_logos.py --db-url "postgresql://..."

Parses every "Venue Name = https://..." line in logos.md and updates
the matching venue row. Matches on case-insensitive name. Reports
hits, skips (no URL), and misses (name not found in DB).
"""

import argparse
import re
import sys
from pathlib import Path

try:
    import psycopg2
except ImportError:
    print("Missing dependency: pip install psycopg2-binary")
    sys.exit(1)

LOGOS_MD = Path(__file__).parent.parent / "docs" / "logos.md"


def parse_logos(path: Path) -> dict[str, str]:
    """Return {venue_name: url} for lines that have a non-empty URL."""
    logos = {}
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if "=" not in line or line.startswith("#"):
            continue
        name, _, url = line.partition("=")
        name = name.strip()
        url = url.strip()
        if name and url:
            logos[name] = url
    return logos


def main():
    parser = argparse.ArgumentParser(description="Seed venue logo_url from docs/logos.md")
    parser.add_argument("--db-url", required=True, help="PostgreSQL connection string")
    args = parser.parse_args()

    logos = parse_logos(LOGOS_MD)
    if not logos:
        print("No logo entries found in logos.md. Nothing to do.")
        sys.exit(0)

    print(f"Found {len(logos)} logo entries in logos.md\n")

    conn = psycopg2.connect(args.db_url)
    conn.autocommit = False
    cur = conn.cursor()

    hits, skips, misses = [], [], []

    for name, url in logos.items():
        cur.execute(
            "SELECT id, name FROM venues WHERE LOWER(name) = LOWER(%s)",
            (name,),
        )
        row = cur.fetchone()
        if not row:
            misses.append(name)
            continue

        venue_id, db_name = row
        cur.execute(
            "UPDATE venues SET logo_url = %s, updated_at = NOW() WHERE id = %s",
            (url, venue_id),
        )
        hits.append(db_name)

    conn.commit()
    cur.close()
    conn.close()

    print(f"✓ Updated ({len(hits)}):")
    for n in hits:
        print(f"    {n}")

    if misses:
        print(f"\n✗ Not found in DB ({len(misses)}) — check spelling against venue names:")
        for n in misses:
            print(f"    {n}")

    print(f"\nDone. {len(hits)} logos set.")


if __name__ == "__main__":
    main()
