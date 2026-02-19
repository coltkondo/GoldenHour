# API Reference

All API endpoints used by the Golden Hour mobile app and admin dashboard.

Base URL (local development): `http://localhost:8000`
Base URL (production): `https://goldenhour-production.up.railway.app`

All public endpoints are prefixed with `/api/v1`. Admin endpoints are prefixed with `/api/v1/admin`.

---

## Public Endpoints

These endpoints are used by the mobile app. They are served by both the full backend and the lightweight `serve_local.py` dev server.

### Venues

#### List all venues

```
GET /api/v1/venues/
```

Query parameters:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `skip` | int | 0 | Pagination offset |
| `limit` | int | 100 | Max results (1-200) |
| `neighborhood` | string | none | Filter by neighborhood |
| `active_only` | bool | true | Only return active venues |

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
| `radius_meters` | int | 10000 | Search radius in meters |
| `limit` | int | 50 | Max results |

Response: Array of venue objects sorted by distance.

#### Get a single venue

```
GET /api/v1/venues/{venue_id}
```

Response: Single venue object.

#### Get venue schedules

```
GET /api/v1/venues/{venue_id}/schedules
```

Response: Array of happy hour schedule objects for the venue.

#### List neighborhoods

```
GET /api/v1/venues/neighborhoods/list
```

Response: Array of neighborhood name strings.

### Deals

#### Get active deals

```
GET /api/v1/deals/active
```

Query parameters:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `skip` | int | 0 | Pagination offset |
| `limit` | int | 100 | Max results |
| `category` | string | none | Filter: "food", "drinks", or "both" |
| `venue_id` | string | none | Filter by venue |

Response: Array of deal objects.

#### Get today's deals

```
GET /api/v1/deals/today
```

Returns deals that have a schedule entry for the current day of the week.

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
| `radius_meters` | int | 10000 | Search radius |
| `active_now` | bool | false | Only deals with today's schedule |

Response: Array of deal objects.

#### Get a single deal

```
GET /api/v1/deals/{deal_id}
```

Response: Single deal object.

---

## Admin Endpoints

These endpoints are used by the admin dashboard (admin-web). They provide full CRUD operations with search, filtering, and sorting.

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

List deals query parameters: `skip`, `limit`, `search`, `venue_id`, `category`, `deal_type`, `active_only`, `sort_by` (title, category, deal_type, created_at, updated_at), `sort_order` (asc, desc).

### Admin Export

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/admin/export/venues.csv` | Download venues as CSV |
| GET | `/api/v1/admin/export/deals.csv` | Download deals as CSV |

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

---

## Health Check

```
GET /health
```

Response: `{"status": "healthy"}`

## Interactive Documentation

When the backend is running, Swagger UI is available at `/docs` and ReDoc at `/redoc`.
