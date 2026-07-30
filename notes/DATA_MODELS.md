# Data Models

Database schema for the Golden Hour application. Generated from the live SQLAlchemy models — treat this as the source of truth for CSV import, direct SQL, and API work.

_Last updated: 2026-07-30_

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
| region_radius_meters | INTEGER | No | | Radius around the centroid defining the market's zone. Required for signup-time market assignment (see `User.market_id`) — a point alone can't answer "is this user inside the market," a radius can. CHECK > 0. |
| daily_points_cap | INTEGER | No | 200 | Per-market override capability. CHECK > 0. |
| monthly_burn_cap_cents | INTEGER | Yes | | Nullable — if null, falls back to a global default. |
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
| nickname | VARCHAR(100) | Yes | | Short display name shown in UI (e.g. "Champs" for "Champs Downtown Bar & Grill") |
| address | VARCHAR(500) | No | | |
| latitude | FLOAT | Yes | | Required for map pin. CHECK -90 to 90. |
| longitude | FLOAT | Yes | | Required for map pin. CHECK -180 to 180. |
| phone | VARCHAR(20) | Yes | | |
| website | VARCHAR(500) | Yes | | |
| neighborhood | VARCHAR(100) | Yes | | Indexed |
| venue_type | VARCHAR(50) | Yes | | "bar", "restaurant", "rooftop", etc. |
| tags | ARRAY(VARCHAR) | Yes | | e.g. `["Sports Bar","Karaoke"]` |
| cash_only | BOOLEAN | No | false | |
| google_place_id | VARCHAR(255) | Yes | | Unique; used for dedup |
| price_level | INTEGER | Yes | | 1–4 |
| rating | FLOAT | Yes | | |
| logo_url | TEXT | Yes | | Direct image URL for venue logo; rendered with initials fallback in VenueLogo component |
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
| original_price | FLOAT | Yes | | CHECK >= 0 |
| deal_price | FLOAT | Yes | | CHECK >= 0 |
| discount_percentage | FLOAT | Yes | | CHECK 0–100; auto-calculated on import if both prices given |
| items | ARRAY(VARCHAR) | Yes | | e.g. `["Draft beer","House wine"]` |
| active | BOOLEAN | No | true | Soft delete |
| verified | BOOLEAN | No | false | |
| valid_through | DATE | Yes | null | Auto-expires deal after this date (excluded from `/deals/active` and `/deals/today` once passed). Use for time-limited specials like Arts Fest one-offs. |
| source | VARCHAR(50) | Yes | "manual" | `"import"` / `"manual"` / `"user"` |
| created_at | TIMESTAMPTZ | No | now() | |
| updated_at | TIMESTAMPTZ | No | now() | |

**CSV ref key:** `deal_id` (e.g. `D001`) — used as a join key in the schedules CSV.

**Import note:** `category` and `deal_type` are derived from `is_food` / `is_drink` boolean columns in the CSV, not set directly.

**Relationship to Events:** there is no `Deal.event_id` column. The link runs the other way — `Event.deal_ids` is an array of deal UUIDs, mirroring the `HappyHourSchedule.deal_ids` pattern. A deal isn't "owned" by an event; an event optionally references existing deals.

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
| deal_ids | ARRAY(UUID) | Yes | | UUIDs of deals in this window — the link between deals and times. DB triggers enforce referential integrity on insert/update/delete. |
| notes | TEXT | Yes | | e.g. "Patio only" |
| restrictions | TEXT | Yes | | e.g. "Dine-in only" |
| active | BOOLEAN | No | true | |
| created_at | TIMESTAMPTZ | No | now() | |
| updated_at | TIMESTAMPTZ | No | now() | |

**Import note:** The CSV has one row per deal. The script groups rows with the same `(venue_id, day_of_week, start_time, end_time)` into a single schedule record, combining their `deal_ids`. One deal can appear in multiple schedule rows (Mon + Tue = two rows → two schedule records).

**Recurrence model:** this table only expresses "every week on day X" — no calendar date, no start/end range. It's the right shape for a standing happy hour and the wrong shape for anything event-like (see Event / EventSchedule below).

---

## Event

Table: `events`

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | UUID | No | auto | Primary key |
| venue_id | UUID (FK→venues) | No | | The bar hosting the event. Indexed. |
| series_id | UUID | Yes | | Shared across all occurrences generated from one recurring submission or admin-created series (e.g. all 13 weeks of a weekly trivia night). NULL for one-off events. Indexed. |
| name | VARCHAR(255) | No | | e.g. "Monday Night Trivia", "UFC 300" |
| description | TEXT | Yes | | Free text |
| event_type | VARCHAR(50) | Yes | | `"ufc"` / `"nfl"` / `"cfb"` / `"nba"` / `"nhl"` / `"mlb"` / `"fifa"` / `"local"` / `"trivia"` / `"karaoke"` / `"live_music"` / `"flex"` / `"other"`. Indexed. |
| start_datetime | TIMESTAMPTZ | No | | Actual date + time this specific occurrence starts. Indexed. This is what the calendar sorts/filters/places on. |
| end_datetime | TIMESTAMPTZ | Yes | | Nullable — some events have no clean end. |
| deal_ids | ARRAY(UUID) | Yes | | Deals associated with this event. Same pattern as `HappyHourSchedule.deal_ids`, no FK enforced. |
| image_url | VARCHAR(500) | Yes | | Poster/flyer for the calendar card |
| is_sponsored | BOOLEAN | No | false | Bar-paid or brand-sponsored promotion flag — future monetization hook |
| is_recurring | BOOLEAN | No | false | True when this row was generated as part of a series (`series_id` set). Drives the "↻ Recurring" badge on calendar cards. |
| active | BOOLEAN | No | true | Soft delete. Admin can toggle a single occurrence off without touching the rest of its series. |
| verified | BOOLEAN | No | false | **The `/events/` list endpoint hard-filters on `verified == True` — an event invisible to users almost always means this is still false.** Submission approval and admin-created events both set it explicitly; it does not default true anywhere except the admin `EventCreate`/`SeriesCreate` schemas. |
| source | VARCHAR(50) | Yes | "manual" | `"manual"` / `"user"` |
| created_at | TIMESTAMPTZ | No | now() | |
| updated_at | TIMESTAMPTZ | No | now() | |

**One row per occurrence, not per "event concept."** A weekly trivia night isn't one row with a recurrence rule attached — approving a `new_event` submission with `recurrence_type: "weekly"` generates ~13 separate `Event` rows (one per week, ~3 months out), all sharing one `series_id`. Biweekly generates 7, monthly generates 3 months forward. A one-time or "custom" (irregular — "every home gameday," admin fills in the rest) submission generates exactly one row with `series_id = NULL`.

**Relationship to venues:** an event attaches to exactly one venue. The same real-world event airing at multiple bars (e.g. a UFC card showing at 8 different bars) is modeled as 8 separate rows sharing the same `name`, not a join table.

**Two creation paths:**
1. **User submission** (`new_event` submission type, approved by an admin) → `submission_review.py` generates the occurrence row(s) as described above.
2. **Admin-direct** (`POST /admin/events/` or `POST /admin/events/series`) → admin creates an event or a whole series without any user submission. `SeriesCreate` takes an explicit list of `start_datetimes`, not a recurrence rule — the admin supplies every date up front (used for irregular schedules like "every home gameday," which the system can't compute on its own).

---

## EventSchedule

Table: `event_schedules`

Stores the *recurrence rule* behind a series — one row per recurring slot, separate from the generated `Event` occurrence rows themselves. Mirrors the two-table Deal + HappyHourSchedule pattern.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | UUID | No | auto | Primary key |
| venue_id | UUID (FK→venues) | No | | Indexed |
| series_id | UUID | Yes | | Matches the `series_id` on the `Event` rows this rule generated. Indexed. |
| name | VARCHAR(255) | No | | |
| event_type | VARCHAR(50) | Yes | | |
| description | TEXT | Yes | | |
| recurrence_type | VARCHAR(20) | No | | `"weekly"` / `"biweekly"` / `"monthly"` |
| day_of_week | INTEGER | Yes | | 0=Monday…6=Sunday. Set for weekly/biweekly, null for monthly. |
| day_of_month | INTEGER | Yes | | 1–28. Set for monthly, null otherwise. |
| start_time | TIME | Yes | | |
| end_time | TIME | Yes | | |
| created_at | TIMESTAMPTZ | No | now() | |
| updated_at | TIMESTAMPTZ | No | now() | |

**This table is a record of the rule, not something re-evaluated on read.** Occurrence generation happens once, at approval time — the `Event` rows are the source of truth for what the calendar actually renders. If the rule changes later (e.g. the bar moves trivia from Monday to Tuesday), nothing currently regenerates already-created future occurrences from an edited `EventSchedule` row; that would need to happen through admin editing the individual `Event` rows or via `PUT /admin/events/series/{series_id}`.

**Two weekly-recurring days on one submission = two `EventSchedule` rows.** If a user submits "Trivia every Monday and Thursday," that's `recurrence_type="weekly"` with two `EventSchedule` rows (one per `day_of_week`), both sharing the same `series_id`, generating 13 `Event` rows each (26 total).

---

## Corroboration

Table: `corroborations`

Instant, admin-review-free confirmation that an existing deal is still accurate — the "Still Accurate? +2 pts" button on a deal card. Distinct from the submission/review pipeline; there's no `Submission` row backing this.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | UUID | No | auto | Primary key |
| user_id | UUID (FK→users) | No | | Indexed |
| deal_id | UUID (FK→deals) | No | | Indexed |
| points_awarded | INTEGER | No | 0 | 0 if the daily points cap was already hit at corroboration time |
| corroborated_date | DATE | No | | Calendar date of the corroboration, used for the one-per-day constraint below |
| created_at | TIMESTAMPTZ | No | now() (Python-side default, not a DB server_default) | |

**Unique constraint:** `(user_id, deal_id, corroborated_date)` — one corroboration per user per deal per day. A second attempt the same day gets a 409.

**Self-corroboration guard:** blocked at the API level (not a DB constraint) if the user has an *approved* submission linked to that same `deal_id` — you can't corroborate a deal you got points for submitting.

**Points land in `point_transactions` with `transaction_type="submission_approved"`** — corroboration doesn't get its own transaction type; it's distinguished only by `description="Corroborated deal"` and `submission_id=NULL`. Worth knowing if you're ever aggregating by `transaction_type` and expect corroborations to show up separately.

---

## User

Table: `users`

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | UUID | No | auto | Primary key |
| username | VARCHAR(50) | No | | Unique |
| email | VARCHAR(255) | No | | Unique; lowercased on write and compared case-insensitively via `func.lower()` on login/register |
| password_hash | VARCHAR(255) | No | | bcrypt |
| role | VARCHAR(20) | No | "user" | `"user"` or `"admin"` |
| points_balance | INTEGER | No | 0 | CHECK >= 0 |
| market_id | UUID (FK→markets) | No | | The market this user belongs to. Set ONCE at signup — see design note on the Market table above. Indexed. |
| signup_latitude | FLOAT | No | | Captured at registration to compute `market_id`. Required — signup cannot complete without a resolvable location. |
| signup_longitude | FLOAT | No | | Same. |
| active | BOOLEAN | No | true | Soft disable. Also what `DELETE /auth/me` (account deletion) sets to false after anonymizing the row. |
| reset_token_hash | VARCHAR(64) | Yes | | SHA-256 hash of the current forgot-password OTP. Set on `/auth/forgot-password`, cleared on successful `/auth/reset-password`. Never store the raw code. |
| reset_token_expires | TIMESTAMPTZ | Yes | | 15 minutes from OTP send. |
| created_at | TIMESTAMPTZ | No | now() | |
| updated_at | TIMESTAMPTZ | No | now() | |

**Signup requirement:** location is mandatory at registration (`signup_latitude`/`signup_longitude`), specifically to resolve `market_id` via haversine distance against every active market's radius. If no market matches, registration is rejected with a 422 ("Golden Hour isn't available in your area yet") rather than silently defaulting to a market.

**Account deletion is anonymization, not a row delete.** `DELETE /auth/me` scrubs `email`/`username`/`password_hash`/`signup_latitude`/`signup_longitude`/`points_balance` and sets `active=False`, but the row stays — submissions and point history are retained (anonymized) since they're part of the community-maintained map data and deleting them would degrade accuracy for other users.

---

## Submission

Table: `submissions`

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | UUID | No | auto | Primary key |
| user_id | UUID (FK→users) | No | | The submitter |
| submission_type | ENUM | No | | `new_deal`, `deal_update`, `deal_expired`, `new_bar`, `bar_closed`, `bar_update`, `new_event` |
| submitted_data | JSONB | No | `{}` | Type-specific payload, allowlisted and validated against a Pydantic schema (`VenueData`/`DealData`/`EventData`) before being applied on approval — extra keys are silently dropped, not stored as-is |
| related_bar_id | UUID (FK→venues) | Yes | | Venue this submission references |
| related_deal_id | UUID (FK→deals) | Yes | | Deal this submission references |
| status | ENUM | No | "pending" | `"pending"` / `"approved"` / `"rejected"` |
| admin_notes | TEXT | Yes | | Reviewer notes |
| points_awarded | INTEGER | No | 0 | Set on approval; reduced or zeroed if the submitter already hit their market's daily cap; 0 when REWARDS_ENABLED=false |
| is_flagged_duplicate | BOOLEAN | No | false | Set at submission time (not review time) by fuzzy-matching `bar_name` (≥0.75 similarity) then `title` against active deals or other pending submissions at that venue (≥0.80 similarity). Flagged submissions earn the 2pt corroboration rate on approval instead of the full new_deal rate. |
| reviewed_by | UUID (FK→users) | Yes | | Admin who reviewed |
| reviewed_at | TIMESTAMPTZ | Yes | | |
| created_at | TIMESTAMPTZ | No | now() | |
| updated_at | TIMESTAMPTZ | No | now() | |

**On approval, `submitted_data` gets applied automatically** — the specifics differ per `submission_type` and live in `backend/app/services/submission_review.py`. Worth knowing before assuming a checked "approved" box means the content is live: `new_deal` also creates `HappyHourSchedule` rows from `days`/`start_time`/`end_time` in the payload; `new_event` generates one or many `Event` rows depending on `recurrence_type` (see Event above); `deal_expired` removes the deal from any schedule it's in and deactivates schedules that become empty as a result.

---

## PointTransaction

Table: `point_transactions`

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | UUID | No | auto | Primary key |
| user_id | UUID (FK→users) | No | | |
| submission_id | UUID (FK→submissions) | Yes | | Null for corroborations and manual adjustments |
| points | INTEGER | No | | Positive = awarded |
| transaction_type | ENUM | No | | `"submission_approved"`, `"bonus"`, `"redemption"`, `"adjustment"` — see the Corroboration note above; corroboration points also use `"submission_approved"`, not a distinct value |
| description | TEXT | No | `""` | Human-readable reason |
| created_at | TIMESTAMPTZ | No | now() | |

---

## CSV Import Column Reference

CSVs live in a per-market subdirectory: `data/<slug>/venues.csv`, `data/<slug>/deals.csv`, `data/<slug>/schedules.csv`. There is no CSV import path for events — event data enters exclusively through user submissions (approved by an admin) or direct admin creation via `/admin/events/`, both described above.

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
