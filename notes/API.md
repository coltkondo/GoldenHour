# API Reference

All API endpoints used by the Golden Hour mobile app and admin dashboard.

Base URL (local development): `http://localhost:8000`
Base URL (production): `https://goldenhour-production-45a5.up.railway.app`

All endpoints are prefixed with `/api/v1`. Admin endpoints additionally require an `Authorization: Bearer <token>` header with an admin-role JWT.

The interactive Swagger UI at `/docs` documents every endpoint with request/response schemas.

_Last updated: 2026-07-30_

---

## Authentication

### Register

```
POST /api/v1/auth/register
```

Rate limited: 5 requests/minute per IP.

Request body:
```json
{
  "username": "alice",
  "email": "alice@example.com",
  "password": "SecurePass1!",
  "latitude": 40.7934,
  "longitude": -77.86
}
```

`latitude`/`longitude` are required — used to resolve `market_id` against every active market's radius. Registration returns 422 if the location doesn't fall inside any market.

Password requirements: 8+ characters, at least one uppercase letter, one lowercase letter, one digit, one special character.

Response: `Token` object with `access_token` (JWT) and `user`.

### Login

```
POST /api/v1/auth/login
```

Rate limited: 10 requests/minute per IP.

Request body:
```json
{
  "email": "alice@example.com",
  "password": "SecurePass1!"
}
```

Response: `Token` object.

### Current user

```
GET /api/v1/auth/me
```

Requires: `Authorization: Bearer <token>`

Response: User object with `id`, `username`, `email`, `role`, `points_balance`, `market_slug`, `active`, plus `approved_count` (count of this user's approved submissions, computed on read — not a stored column).

### Refresh token

```
POST /api/v1/auth/refresh
```

Requires: `Authorization: Bearer <token>`

Response: New `Token` object. Access tokens are valid 30 days (`ACCESS_TOKEN_EXPIRE_MINUTES = 43200`) — the mobile client refreshes silently on 401, not on a timer.

### Delete account

```
DELETE /api/v1/auth/me
```

Requires: `Authorization: Bearer <token>`. Status 204.

Anonymizes the account in place — scrubs email/username/password/location, sets `active=False`. Does not hard-delete the row; submissions and point history stay (anonymized) for data integrity.

### Forgot password

```
POST /api/v1/auth/forgot-password
```

Rate limited: 3 requests/minute per IP. Status 204 always, regardless of whether the email is registered (no account enumeration).

Request body:
```json
{ "email": "alice@example.com" }
```

If the email belongs to an active account, sends a 6-digit OTP via Resend (SHA-256 hashed server-side, 15-minute expiry). Email send failures are swallowed silently for the same anti-enumeration reason.

### Reset password

```
POST /api/v1/auth/reset-password
```

Rate limited: 5 requests/minute per IP.

Request body:
```json
{
  "email": "alice@example.com",
  "code": "123456",
  "new_password": "NewSecurePass1!"
}
```

400 on invalid/expired/mismatched code. Same password strength rules as registration.

---

## Public Endpoints

These endpoints are used by the mobile app and do not require authentication.

### Venues

#### List all venues

```
GET /api/v1/venues/
```

Query parameters:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `skip` | int | 0 | Pagination offset |
| `limit` | int | 100 | Max results (1-500) |
| `neighborhood` | string | none | Filter by neighborhood |
| `active_only` | bool | true | Only return active venues |
| `market_slug` | string | none | Scope to one market. **No market-boundary enforcement happens without this** — omitting it returns venues across every market. |

Response: Array of venue objects.

#### Get nearby venues

```
GET /api/v1/venues/nearby
```

Query parameters:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `latitude` | float | required | User latitude |
| `longitude` | float | required | User longitude |
| `radius_meters` | int | 1000 | Search radius in meters (100–10000) |
| `limit` | int | 20 | Max results (1–50) |

PostGIS `ST_DWithin`/`ST_Distance` — index-accelerated, not an in-memory haversine loop. Response: array of venue objects sorted by distance.

#### Get a single venue

```
GET /api/v1/venues/{venue_id}
```

Response: Single venue object.

#### Get venue schedules

```
GET /api/v1/venues/{venue_id}/schedules
```

Response: Array of active happy hour schedule objects for the venue, ordered by day/time.

#### List neighborhoods

```
GET /api/v1/venues/neighborhoods/list
```

Response: Array of distinct neighborhood name strings (active venues only).

### Deals

#### Get active deals

```
GET /api/v1/deals/active
```

Query parameters:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `skip` | int | 0 | Pagination offset |
| `limit` | int | 50 | Max results (1-200) |
| `category` | string | none | Filter: "drinks", "food", or "both" |
| `venue_id` | UUID | none | Filter by venue |

Excludes deals whose `valid_through` date has passed. No `market_slug` filter on this endpoint.

Response: Array of deal objects.

#### Get today's deals

```
GET /api/v1/deals/today
```

Query parameters: `market_slug` (optional).

Returns deals that have an active `HappyHourSchedule` entry for the current day of week, evaluated in `America/New_York` (`APP_TIMEZONE`), not server local time. Excludes expired (`valid_through`) deals.

Response: Array of deal objects.

#### Get nearby deals

```
GET /api/v1/deals/nearby
```

Query parameters:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `latitude` | float | required | User latitude |
| `longitude` | float | required | User longitude |
| `radius_meters` | int | 1000 | Search radius (100–10000) |
| `active_now` | bool | false | Only deals with a schedule window covering right now |

Note: unlike `/venues/nearby`, this one filters by an in-memory bounding box + haversine distance, not PostGIS — a candidate set is pulled by lat/lng bounding box first, then filtered exactly.

Response: Array of deal objects.

#### Get a single deal

```
GET /api/v1/deals/{deal_id}
```

Response: Single deal object.

### Events

#### List events

```
GET /api/v1/events/
```

Query parameters:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `market_slug` | string | none | Scope to one market |
| `venue_id` | UUID | none | Filter by venue |
| `from_dt` / `to_dt` | ISO datetime | none | Date range |
| `event_type` | string | none | Filter by type |
| `upcoming_only` | bool | true | Only `start_datetime >= now`. Set `false` with an explicit `from_dt` to include past events. |
| `skip` / `limit` | int | 0 / 100 | Pagination (limit max 200) |

**Hard-filters `active == True` and `verified == True`** — an approved event submission that isn't showing up almost always means `verified` didn't get set (see the Event table note in DATA_MODELS.md). Sorted by `start_datetime` ascending.

Response: Array of event objects (see shape below).

#### Get events for a venue

```
GET /api/v1/events/by-venue/{venue_id}
```

Query parameters: `upcoming_only` (default true), `limit` (default 20, max 50).

Response: Array of event objects for that venue.

### Leaderboard

```
GET /api/v1/leaderboard/
```

Query parameters: `market_slug` (optional — 404 if the slug doesn't match an active market), `limit` (default 50, max 100).

Only includes users with `points_balance > 0`. Sorted by points descending, username ascending as a tiebreaker (stable ordering across repeated queries with tied scores).

Response:
```json
[
  { "rank": 1, "user_id": "uuid", "username": "alice", "points_balance": 340, "approved_count": 12 }
]
```

---

## User Endpoints (auth required)

These require `Authorization: Bearer <token>`.

### Submissions

#### Submit a tip

```
POST /api/v1/submissions/
```

Rate limited: 10 requests/minute per IP.

Request body:
```json
{
  "submission_type": "new_deal",
  "submitted_data": {
    "bar_id": "uuid",
    "title": "$2 Coors Light",
    "deal_price": 2.00,
    "category": "drinks"
  },
  "related_bar_id": null,
  "related_deal_id": null
}
```

`submission_type` options: `new_deal`, `deal_update`, `deal_expired`, `new_bar`, `bar_closed`, `bar_update`, `new_event`.

For `new_event`, `submitted_data` additionally supports `recurrence_type` (`once`/`weekly`/`biweekly`/`monthly`/`custom`), `days` (array of day names, for weekly/biweekly), `day_of_month` (1–28, for monthly), `event_date` (MM/DD/YYYY or ISO, for once/custom), and `notes` (free text, for custom).

`new_deal` submissions are checked for duplicates at submission time (fuzzy match on bar name + deal title) — see `is_flagged_duplicate` in DATA_MODELS.md. This doesn't block the submission, it just changes the point payout on approval.

Response: Created submission object.

#### Corroborate a deal

```
POST /api/v1/submissions/corroborate/{deal_id}
```

Rate limited: 30 requests/minute per IP.

Instant — no admin review. Awards 2 pts (subject to the market's daily cap), once per user per deal per day (409 on a repeat same-day attempt). Blocked with 403 if the user has an approved submission linked to that deal (can't corroborate your own submission).

Response:
```json
{ "points_awarded": 2 }
```

#### View your submissions

```
GET /api/v1/submissions/mine
```

Query parameters: `skip` (default 0), `limit` (default 50, max 100).

Response: Array of your submission objects, newest first.

### Points

```
GET /api/v1/points/users/{user_id}
```

Query parameters: `limit` (default 50, max 100).

403 unless `user_id` matches the caller or the caller is an admin.

Response: `{ user_id, username, points_balance, transactions: [...] }`.

---

## Admin Endpoints

All admin endpoints require `Authorization: Bearer <admin_token>` where the token belongs to a user with `role = "admin"`.

### Admin Submissions

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/admin/submissions/` | List all submissions with filters |
| GET | `/api/v1/admin/submissions/{id}` | Get single submission |
| PATCH | `/api/v1/admin/submissions/{id}/review` | Approve or reject; auto-applies change to DB |

List submissions query parameters: `status` (pending/approved/rejected), `submission_type`.

Review request body:
```json
{
  "status": "approved",
  "admin_notes": "Verified on site"
}
```

On approval, `submitted_data` is automatically applied to the database (creates/updates the Venue, Deal, HappyHourSchedule, or Event rows as appropriate — see the Submission table note in DATA_MODELS.md) and points are awarded to the submitter, subject to their market's daily cap.

### Admin Venues

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/admin/venues/` | List venues with search, filter, sort |
| GET | `/api/v1/admin/venues/count` | Get total venue count |
| GET | `/api/v1/admin/venues/neighborhoods` | List distinct neighborhoods |
| GET | `/api/v1/admin/venues/venue-types` | List distinct venue types |
| GET | `/api/v1/admin/venues/{id}` | Get single venue |
| POST | `/api/v1/admin/venues/` | Create new venue |
| PUT | `/api/v1/admin/venues/{id}` | Update venue |
| PATCH | `/api/v1/admin/venues/{id}/toggle-active` | Toggle active status |

List venues query parameters: `skip`, `limit`, `search`, `neighborhood`, `venue_type`, `active_only`, `sort_by` (name, neighborhood, created_at, updated_at), `sort_order` (asc, desc).

### Admin Deals

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/admin/deals/` | List deals with search, filter, sort |
| GET | `/api/v1/admin/deals/count` | Get total deal count |
| GET | `/api/v1/admin/deals/categories` | List distinct categories |
| GET | `/api/v1/admin/deals/deal-types` | List distinct deal types |
| GET | `/api/v1/admin/deals/{id}` | Get single deal with venue name |
| POST | `/api/v1/admin/deals/` | Create new deal |
| PUT | `/api/v1/admin/deals/{id}` | Update deal |
| PATCH | `/api/v1/admin/deals/{id}/toggle-active` | Toggle active status |

### Admin Events

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/admin/events/` | List events with filters |
| GET | `/api/v1/admin/events/event-types` | List valid event type values |
| GET | `/api/v1/admin/events/{id}` | Get single event |
| POST | `/api/v1/admin/events/` | Create a single event (defaults `verified=true`) |
| POST | `/api/v1/admin/events/series` | Batch-create multiple occurrences sharing a new `series_id` |
| PUT | `/api/v1/admin/events/{id}` | Update one event |
| PUT | `/api/v1/admin/events/series/{series_id}` | Update all events in a series (name/description/type/active/etc. — not `start_datetime`/`end_datetime`, each occurrence keeps its own) |
| PATCH | `/api/v1/admin/events/{id}/toggle-active` | Flip `active` on one occurrence — does not touch the rest of its series |
| DELETE | `/api/v1/admin/events/{id}` | Hard delete |

List events query parameters: `skip`, `limit`, `venue_id`, `series_id`, `event_type`, `active_only`, `upcoming_only`.

`POST /admin/events/series` request body:
```json
{
  "venue_id": "uuid",
  "name": "Home Gameday Watch Party",
  "event_type": "cfb",
  "start_datetimes": ["2026-09-06T15:00:00Z", "2026-09-13T15:00:00Z"],
  "end_time_offset_minutes": 180
}
```
`start_datetimes` is an explicit list, not a recurrence rule — this is the path for irregular schedules an automated rule can't compute (used to fill in the rest of a "custom" recurrence submission once the admin has found the actual dates).

### Admin Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/admin/users/` | List users with submission counts |
| GET | `/api/v1/admin/users/{id}` | Get single user with submission counts |
| GET | `/api/v1/admin/users/{id}/points` | Full point transaction history for a user |
| PATCH | `/api/v1/admin/users/{id}/deactivate` | Deactivate — blocks login and all API access. 400 if targeting yourself, 409 if already deactivated. |
| PATCH | `/api/v1/admin/users/{id}/reactivate` | Reactivate a deactivated account |

List users query parameters: `skip`, `limit`, `active_only`.

### Admin Analytics

```
GET /api/v1/admin/analytics/summary
```

Query parameters: `period_days` (default 7, 1–90).

Returns submission volume (by status, by type, approval rate, duplicate rate, daily series), signup volume (daily series), corroboration volume (daily series), top 10 submitters, top 10 corroborators, and a per-market breakdown of submissions + signups in the period.

### Admin Export

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/admin/export/venues.csv` | Download venues as CSV |
| GET | `/api/v1/admin/export/deals.csv` | Download deals as CSV |

Note: Export endpoints require the `Authorization` header. In the admin dashboard, the export buttons use an authenticated `fetch()` call — not plain `<a>` links.

---

## Response Object Shapes

### Venue

```json
{
  "id": "uuid",
  "name": "The Phyrst",
  "nickname": null,
  "address": "111 E Beaver Ave, State College, PA",
  "latitude": 40.7934,
  "longitude": -77.8564,
  "phone": null,
  "website": null,
  "neighborhood": "Downtown",
  "venue_type": "Bar",
  "tags": ["dive-bar", "cash-only"],
  "cash_only": true,
  "google_place_id": null,
  "price_level": null,
  "rating": null,
  "logo_url": null,
  "verified": true,
  "active": true,
  "description": null,
  "created_at": "2026-02-15T12:00:00",
  "updated_at": "2026-02-15T12:00:00"
}
```

### Deal

```json
{
  "id": "uuid",
  "venue_id": "uuid",
  "title": "$2 Yuengling Pints",
  "description": "Draft pints of Yuengling",
  "category": "drinks",
  "deal_type": "special_price",
  "original_price": 5.00,
  "deal_price": 2.00,
  "discount_percentage": 60.0,
  "items": [],
  "active": true,
  "verified": true,
  "valid_through": null,
  "source": "import",
  "created_at": "2026-02-15T12:00:00",
  "updated_at": "2026-02-15T12:00:00"
}
```

### HappyHourSchedule

```json
{
  "id": "uuid",
  "venue_id": "uuid",
  "day_of_week": 0,
  "start_time": "16:00",
  "end_time": "19:00",
  "deal_ids": ["uuid", "uuid"],
  "notes": null,
  "restrictions": null,
  "active": true,
  "created_at": "2026-02-15T12:00:00",
  "updated_at": "2026-02-15T12:00:00"
}
```

`day_of_week` values: 0 = Monday, 1 = Tuesday, 2 = Wednesday, 3 = Thursday, 4 = Friday, 5 = Saturday, 6 = Sunday.

### Event

```json
{
  "id": "uuid",
  "venue_id": "uuid",
  "venue_name": "The Phyrst",
  "venue_neighborhood": "Downtown",
  "series_id": "uuid",
  "name": "Monday Night Trivia",
  "description": null,
  "event_type": "trivia",
  "start_datetime": "2026-08-03T19:00:00-04:00",
  "end_datetime": "2026-08-03T21:00:00-04:00",
  "deal_ids": [],
  "image_url": null,
  "is_sponsored": false,
  "is_recurring": true,
  "active": true,
  "verified": true,
  "source": "user",
  "created_at": "2026-07-30T10:00:00"
}
```

### Submission

```json
{
  "id": "uuid",
  "submitter_username": "alice",
  "submission_type": "new_deal",
  "status": "pending",
  "submitted_data": { "title": "$2 Coors Light", "deal_price": 2.00 },
  "related_bar_id": null,
  "related_deal_id": null,
  "admin_notes": null,
  "points_awarded": 0,
  "created_at": "2026-02-15T12:00:00",
  "reviewed_at": null
}
```

---

## Health Check

```
GET /health
```

Response: `{"status": "healthy", "database": "ok", "redis": "ok|unavailable"}`

## Interactive Documentation

When the backend is running, Swagger UI is available at `/docs` and ReDoc at `/redoc`.
