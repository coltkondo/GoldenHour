# Data Models

Database schema for the Golden Hour application. Generated from the live SQLAlchemy models — treat this as the source of truth for CSV import, direct SQL, and API work.

_Last updated: 2026-07-16_

---

## Market

Table: `markets`

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | UUID | No | auto | Primary key |
| name | VARCHAR(255) | No | | Display name e.g. "State College" |
| slug | VARCHAR(100) | No | | URL-safe key e.g. `state-college`. Unique, indexed. |
| region_center_lat | FLOAT | No | | Centroid latitude for geo-matching |
| region_center_lng | FLOAT | No | | Centroid longitude for geo-matching |
| region_radius_meters | INTEGER | No | | Radius of the market catchment area |
| daily_points_cap | INTEGER | No | 200 | Per-user per-day points ceiling for this market |
| monthly_burn_cap_cents | INTEGER | Yes | null | Optional monthly payout cap in cents |
| launch_status | VARCHAR(50) | No | "rehearsal" | `"rehearsal"` / `"public"` |
| active | BOOLEAN | No | true | |
| created_at | TIMESTAMPTZ | No | now() | |
| updated_at | TIMESTAMPTZ | No | now() | |

**Seeded markets:**

| slug | launch_status | center_lat | center_lng | radius_m |
|---|---|---|---|---|
| `state-college` | public | 40.794732 | -77.860230 | 3000 |
| `arlington` | rehearsal | 38.881600 | -77.091000 | 8000 |

---

## Venue

Table: `venues`

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | UUID | No | auto | Primary key |
| market_id | UUID (FK→markets) | No | | Indexed |
| name | VARCHAR(255) | No | | Indexed |
| nickname | VARCHAR(100) | Yes | | Short display name |
| address | VARCHAR(500) | No | | |
| latitude | FLOAT | Yes | | Required for map pin |
| longitude | FLOAT | Yes | | Required for map pin |
| phone | VARCHAR(20) | Yes | | |
| website | VARCHAR(500) | Yes | | |
| neighborhood | VARCHAR(100) | Yes | | Indexed |
| venue_type | VARCHAR(50) | Yes | | "bar", "restaurant", "rooftop", etc. |
| tags | ARRAY(VARCHAR) | Yes | | e.g. `["Sports Bar","Karaoke"]` |
| cash_only | BOOLEAN | No | false | |
| google_place_id | VARCHAR(255) | Yes | | Unique; used for dedup |
| price_level | INTEGER | Yes | | 1–4 |
| rating | FLOAT | Yes | | |
| verified | BOOLEAN | No | false | |
| active | BOOLEAN | No | true | Soft delete |
| description | TEXT | Yes | | |
| created_at | TIMESTAMPTZ | No | now() | |
| updated_at | TIMESTAMPTZ | No | now() | |

**CSV ref key:** `venue_id` (e.g. `SC001`) — maps to UUID on import, used as a join key in deals/schedules CSVs. `market_id` is set automatically by the import script from `--market <slug>`.

---

## Deal

Table: `deals`

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | UUID | No | auto | Primary key |
| venue_id | UUID (FK→venues) | No | | |
| title | VARCHAR(255) | No | | e.g. "$3 Miller Lites" |
| description | TEXT | Yes | | |
| category | VARCHAR(50) | Yes | | `"drinks"` / `"food"` / `"both"` |
| deal_type | VARCHAR(50) | Yes | | `"special_price"` / `"discount"` / `"bogo"` / `"free"` |
| original_price | FLOAT | Yes | | Must be ≥ deal_price if both set |
| deal_price | FLOAT | Yes | | |
| discount_percentage | FLOAT | Yes | | 0–100; auto-calculated on import if both prices given |
| items | ARRAY(VARCHAR) | Yes | | e.g. `["Draft beer","House wine"]` |
| active | BOOLEAN | No | true | Soft delete |
| verified | BOOLEAN | No | false | |
| source | VARCHAR(50) | Yes | "manual" | `"import"` / `"manual"` / `"user"` |
| valid_through | DATE | Yes | null | Auto-expires deal after this date. Use for Arts Fest one-offs. |
| created_at | TIMESTAMPTZ | No | now() | |
| updated_at | TIMESTAMPTZ | No | now() | |

**CSV ref key:** `deal_id` (e.g. `D001`) — used as a join key in the schedules CSV.

**Import note:** `category` and `deal_type` are derived from `is_food` / `is_drink` boolean columns in the CSV, not set directly.

---

## HappyHourSchedule

Table: `happy_hour_schedules`

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | UUID | No | auto | Primary key |
| venue_id | UUID (FK→venues) | No | | Indexed |
| day_of_week | INTEGER | No | | 0=Mon, 1=Tue, 2=Wed, 3=Thu, 4=Fri, 5=Sat, 6=Sun. Indexed. |
| start_time | TIME | No | | 24hr, e.g. `16:00` |
| end_time | TIME | No | | Must be after start_time |
| deal_ids | ARRAY(UUID) | Yes | | UUIDs of deals in this window — the link between deals and times |
| notes | TEXT | Yes | | e.g. "Patio only" |
| restrictions | TEXT | Yes | | e.g. "Dine-in only" |
| active | BOOLEAN | No | true | |
| created_at | TIMESTAMPTZ | No | now() | |
| updated_at | TIMESTAMPTZ | No | now() | |

**Import note:** The CSV has one row per deal. The script groups rows with the same `(venue_id, day_of_week, start_time, end_time)` into a single schedule record, combining their `deal_ids`. One deal can appear in multiple schedule rows (Mon + Tue = two rows → two schedule records).

---

## User

Table: `users`

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | UUID | No | auto | Primary key |
| market_id | UUID (FK→markets) | No | | Set at signup by geo-matching against market centroids. Indexed. Never recomputed. |
| username | VARCHAR(50) | No | | Unique |
| email | VARCHAR(255) | No | | Unique; lowercased on write |
| password_hash | VARCHAR | No | | bcrypt |
| signup_latitude | FLOAT | No | | Location at time of registration |
| signup_longitude | FLOAT | No | | Location at time of registration |
| role | VARCHAR(20) | No | "user" | `"user"` or `"admin"` |
| points_balance | INTEGER | No | 0 | CHECK >= 0 |
| active | BOOLEAN | No | true | Soft disable |
| created_at | TIMESTAMPTZ | No | now() | |
| updated_at | TIMESTAMPTZ | No | now() | |

---

## Submission

Table: `submissions`

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | UUID | No | auto | Primary key |
| user_id | UUID (FK→users) | No | | The submitter |
| submission_type | ENUM | No | | `new_deal`, `deal_update`, `deal_expired`, `new_bar`, `bar_closed`, `bar_update` |
| submitted_data | JSONB | No | `{}` | Type-specific payload validated against Pydantic schema |
| related_bar_id | UUID (FK→venues) | Yes | | Venue this submission references |
| related_deal_id | UUID (FK→deals) | Yes | | Deal this submission references |
| status | ENUM | No | "pending" | `"pending"` / `"approved"` / `"rejected"` |
| admin_notes | TEXT | Yes | | Reviewer notes |
| points_awarded | INTEGER | No | 0 | Set on approval; 0 when REWARDS_ENABLED=false |
| reviewed_by | UUID (FK→users) | Yes | | Admin who reviewed |
| reviewed_at | TIMESTAMPTZ | Yes | | |
| created_at | TIMESTAMPTZ | No | now() | |
| updated_at | TIMESTAMPTZ | No | now() | |

---

## PointTransaction

Table: `point_transactions`

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | UUID | No | auto | Primary key |
| user_id | UUID (FK→users) | No | | |
| submission_id | UUID (FK→submissions) | Yes | | Null for manual adjustments |
| points | INTEGER | No | | Positive = awarded |
| transaction_type | ENUM | No | | `"submission_approved"`, `"bonus"`, `"redemption"`, `"adjustment"` |
| description | TEXT | No | `""` | Human-readable reason |
| created_at | TIMESTAMPTZ | No | now() | |

---

## CSV Import Column Reference

CSVs live in a per-market subdirectory: `data/<slug>/venues.csv`, `data/<slug>/deals.csv`, `data/<slug>/schedules.csv`.

### `venues.csv`
```
venue_id, name, nickname, address, latitude, longitude, phone, website,
neighborhood, venue_type, tags, cash_only, is_active
```
- `tags`: comma-separated string inside quotes: `"Sports Bar,Karaoke,Dive"`
- `cash_only`, `is_active`: `TRUE` / `FALSE`
- Rows with no `latitude` or `longitude` are skipped
- `market_id` is set automatically from `--market <slug>` — do not include it in the CSV

### `deals.csv`
```
deal_id, venue_id, deal_name, description, category, deal_price,
original_price, is_food, is_drink, is_active, valid_through
```
- `venue_id` must match a `venue_id` from the venues file
- `is_food` / `is_drink`: `TRUE` / `FALSE` — determines `category` field
- `deal_price` / `original_price`: optional, leave blank if no price to show
- `category` column: only checked for `"half"` / `"1/2"` → sets `deal_type="discount"`, otherwise `"special_price"`
- `valid_through`: optional, `YYYY-MM-DD` format. Leave blank for permanent deals.

### `schedules.csv`
```
schedule_id, deal_id, venue_id, day_of_week, start_time, end_time, is_active
```
- `deal_id` + `venue_id` must match their respective files
- `day_of_week`: full English name — `Monday`, `Tuesday`, `Wednesday`, `Thursday`, `Friday`, `Saturday`, `Sunday`
- `start_time` / `end_time`: 24hr format — `16:00`, `21:30`. Use `0:00` as end to mean "until close" (script converts to `23:59`)
- One deal per row — duplicate `(venue_id, day, start, end)` combos are merged into one schedule record

### Running the import
```bash
# Seed a market (skips if already has data):
docker compose exec backend python -m scripts.import_csv --market state-college

# Wipe a market's data and re-import:
docker compose exec backend python -m scripts.import_csv --market state-college --force

# Same for Arlington once CSVs are in data/arlington/:
docker compose exec backend python -m scripts.import_csv --market arlington --force
```

`--force` deletes only the venues/deals/schedules belonging to the specified market. Other markets are untouched.
