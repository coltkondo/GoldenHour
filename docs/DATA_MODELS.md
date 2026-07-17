# Data Models

Database schema for the Golden Hour application. Generated from the live SQLAlchemy models — treat this as the source of truth for CSV import, direct SQL, and API work.

_Last updated: 2026-07-15_

---

## Market

Table: `markets`

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | UUID | No | auto | Primary key |
| name | VARCHAR(255) | No | | e.g. "State College", "Arlington". Unique. |
| slug | VARCHAR(100) | No | | URL/code-safe identifier, e.g. `"state-college"`, `"arlington"`. Unique. |
| region_center_lat | FLOAT | No | | Centroid of the market's zone. Used both for admin/map default-zoom AND as the anchor point for the proximity radius check below — NOT a substitute for per-venue PostGIS filtering, which stays on `venues`. |
| region_center_lng | FLOAT | No | | Same. |
| region_radius_meters | INTEGER | No | | Radius around the centroid defining the market's zone. Required for signup-time market assignment (see `User.market_id`) — a point alone can't answer "is this user inside the market," a radius can. |
| daily_points_cap | INTEGER | No | 200 | Per-market override capability. Defaults to match the global economy spec; exists so a market COULD diverge later without a schema change, even though markets are identical by design today. |
| monthly_burn_cap_cents | INTEGER | Yes | | Nullable — if null, falls back to a global default. Same reasoning as above. |
| launch_status | VARCHAR(50) | No | "rehearsal" | `"rehearsal"` / `"beta"` / `"public"` — lets the app/admin panel distinguish a market like Arlington (rehearsal) from State College (public launch) without a separate flag per feature. |
| active | BOOLEAN | No | true | Soft delete / disable a market entirely |
| created_at | TIMESTAMPTZ | No | now() | |
| updated_at | TIMESTAMPTZ | No | now() | |

**Seed data:** two rows are inserted inline by the Alembic migration — State College (`launch_status = "public"`) and Arlington (`launch_status = "rehearsal"`). Markets are not imported from CSV; they're managed directly in the database.

**Design note — signup-time assignment, not live recalculation:** `User.market_id` is set ONCE at account creation by checking the user's required signup location against each market's `(region_center_lat, region_center_lng, region_radius_meters)`, and is NOT recomputed on subsequent logins or submissions. If it were recalculated live, a user's market — and therefore their leaderboard position and cap accounting — would silently shift every time they travel between cities, which breaks the exact accounting integrity (ambassador comp scoping, per-market burn caps, fraud analytics) this table exists to protect. A user who signs up in State College and later submits a deal while visiting Arlington still counts as a State College user for all aggregate purposes.

---

## Venue

Table: `venues`

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | UUID | No | auto | Primary key |
| market_id | UUID (FK→markets) | No | | Which market this venue belongs to. Set by the import script from `--market <slug>` — do not include in CSV. Indexed. |
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

**CSV ref key:** `venue_id` (e.g. `SC001`, `ARL001`) — maps to UUID on import, used as a join key in deals/schedules CSVs. `market_id` is set automatically by the import script from `--market <slug>`.

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
| ~~event_id~~ | _(planned)_ | | | Will link a deal to a specific dated event once the `events` table is built. A deal will be either recurring (has `happy_hour_schedules` rows) or event-bound (has `event_id`). `ON DELETE SET NULL` — deleting an event must not cascade to deals. **Not yet in the schema.** |
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

## Event _(planned — not yet implemented)_

Table: `events`

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | UUID | No | auto | Primary key |
| venue_id | UUID (FK→venues) | No | | The bar hosting the event. Indexed. |
| name | VARCHAR(255) | No | | e.g. "UFC 300", "Eagles vs Cowboys", "World Cup: USA v England" |
| description | TEXT | Yes | | Free text: what's happening, who's playing |
| event_type | VARCHAR(50) | Yes | | `"ufc"` / `"nfl"` / `"cfb"` / `"fifa"` / `"nba"` / `"local"` / `"flex"` / `"other"`. Indexed. |
| start_datetime | TIMESTAMPTZ | No | | Actual date + time the event starts. Indexed. This is what the calendar sorts/filters on. |
| end_datetime | TIMESTAMPTZ | Yes | | When it ends. Nullable — some events have no clean end. |
| image_url | VARCHAR(500) | Yes | | Poster/flyer for the calendar card |
| is_sponsored | BOOLEAN | No | false | Bar-paid or brand-sponsored promotion flag (e.g. a tournament sponsor like Michelob Ultra/Stella Artois) — future monetization hook |
| active | BOOLEAN | No | true | Soft delete |
| verified | BOOLEAN | No | false | Admin-verified, same gate as deals |
| source | VARCHAR(50) | Yes | "manual" | `"import"` / `"manual"` / `"user"` |
| created_at | TIMESTAMPTZ | No | now() | |
| updated_at | TIMESTAMPTZ | No | now() | |

**CSV ref key:** `event_id` (e.g. `E001`) — maps to UUID on import, used as a join key for event-bound deals.

**Relationship to deals:** An event's specials are regular `deals` rows with `event_id` set (see `Deal.event_id` above). An event with no attached deals is still valid — it can exist purely as a "this is happening here" calendar entry (e.g. "showing the fight on every screen, no special") with no specific price special.

**Relationship to venues:** an event attaches to exactly one venue. The same real-world event airing at multiple bars (e.g. a UFC card showing at 8 different bars) is modeled as 8 separate `events` rows sharing the same `name` — each bar's showing has its own deals, its own verification, its own `is_sponsored` flag. A "who's showing this tonight" rollup is a query grouping on `(name, start_datetime)`, not a join table.

**Why this is separate from `happy_hour_schedules`:** schedules model *recurring weekly* patterns (`day_of_week` 0–6, no calendar date) — a standing happy hour with no start/end date. Events are *point-in-time* on a specific calendar date. The two never share a time model; an event on a specific date cannot be expressed as a `day_of_week`, and a recurring Tuesday happy hour has no single `start_datetime`.

---

## User

Table: `users`

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | UUID | No | auto | Primary key |
| username | VARCHAR(50) | No | | Unique |
| email | VARCHAR(255) | No | | Unique; lowercased on write |
| password_hash | VARCHAR | No | | bcrypt |
| role | VARCHAR(20) | No | "user" | `"user"` or `"admin"` |
| points_balance | INTEGER | No | 0 | CHECK >= 0 |
| market_id | UUID (FK→markets) | No | | The market this user belongs to. Set ONCE at signup by checking the user's required signup location against each market's proximity zone (`markets.region_center_lat/lng` + `region_radius_meters`) — NOT recomputed on later logins or submissions. Anchors leaderboard scoping, daily/monthly point cap accounting, and fraud analytics. See design notes on the Market table above. Indexed. |
| signup_latitude | FLOAT | No | | Captured at registration to compute `market_id`. Required — signup cannot complete without a resolvable location. |
| signup_longitude | FLOAT | No | | Same. |
| active | BOOLEAN | No | true | Soft disable |
| created_at | TIMESTAMPTZ | No | now() | |
| updated_at | TIMESTAMPTZ | No | now() | |

**Signup requirement:** location is mandatory at registration (`signup_latitude`/`signup_longitude`), specifically to resolve `market_id`. If a user's signup location doesn't fall within any market's radius, registration should be rejected with a clear "not available in your area yet" message rather than silently defaulting to a market — an unresolved market would corrupt exactly the aggregation integrity this column exists to protect.

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

# Arlington:
docker compose exec backend python -m scripts.import_csv --market arlington --force
```

`--force` deletes only that market's venues/deals/schedules. Other markets are untouched.

### `data/events.csv` _(planned — not yet built)_
```
event_id, venue_id, name, description, event_type, start_datetime, end_datetime,
image_url, is_sponsored, is_active
```
- `venue_id` must match a `venue_id` from the venues file
- `start_datetime` / `end_datetime`: full ISO 8601 datetime, not just a time — this is the key difference from `happy_hour_schedules`, which only stores a day-of-week + time-of-day
- Same real-world event at multiple venues = multiple rows, one per venue, sharing `name`
- Deals tied to an event go in the deals CSV as normal, with an `event_id` column added there referencing this file's `event_id`