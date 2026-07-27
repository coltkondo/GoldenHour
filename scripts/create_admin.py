"""
Create or promote an admin user in the Golden Hour database.

Usage:
    python scripts/create_admin.py --db-url "postgresql://..." --username admin --email you@example.com --password secret

If the email already exists, the script promotes that account to admin instead of creating a new one.
"""

import argparse
import sys
import uuid
import bcrypt

try:
    import psycopg2
except ImportError:
    print("Missing dependency: pip install psycopg2-binary")
    sys.exit(1)


def hash_password(plain: str) -> str:
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(plain.encode(), salt).decode("utf-8")


def get_market_id(cur, slug: str):
    cur.execute("SELECT id FROM markets WHERE slug = %s", (slug,))
    row = cur.fetchone()
    if not row:
        cur.execute("SELECT id, slug FROM markets")
        markets = cur.fetchall()
        print(f"No market with slug '{slug}'. Available markets:")
        for m in markets:
            print(f"  {m[1]}  ({m[0]})")
        sys.exit(1)
    return row[0]


def main():
    parser = argparse.ArgumentParser(description="Create or promote a Golden Hour admin user")
    parser.add_argument("--db-url", required=True, help="PostgreSQL connection string")
    parser.add_argument("--username", required=True)
    parser.add_argument("--email", required=True)
    parser.add_argument("--password", required=True)
    parser.add_argument("--market", default="arlington", help="Market slug for new accounts (default: arlington)")
    args = parser.parse_args()

    conn = psycopg2.connect(args.db_url)
    conn.autocommit = False
    cur = conn.cursor()

    # Check if user already exists
    cur.execute("SELECT id, username, email, role FROM users WHERE email = %s", (args.email,))
    existing = cur.fetchone()

    if existing:
        user_id, username, email, role = existing
        if role == "admin":
            print(f"User '{username}' ({email}) is already an admin. Nothing to do.")
        else:
            cur.execute("UPDATE users SET role = 'admin' WHERE id = %s", (user_id,))
            conn.commit()
            print(f"Promoted '{username}' ({email}) to admin.")
    else:
        market_id = get_market_id(cur, args.market)
        user_id = str(uuid.uuid4())
        pw_hash = hash_password(args.password)

        cur.execute(
            """
            INSERT INTO users (id, market_id, username, email, password_hash, role,
                               signup_latitude, signup_longitude, points_balance, active,
                               created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, 'admin', 38.8816, -77.091, 0, true, NOW(), NOW())
            """,
            (user_id, market_id, args.username, args.email, pw_hash),
        )
        conn.commit()
        print(f"Created admin user '{args.username}' ({args.email}).")

    cur.close()
    conn.close()
    print("Done. Log into the admin portal with these credentials.")


if __name__ == "__main__":
    main()
