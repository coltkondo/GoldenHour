# Data Models

Database schema and model definitions used throughout the Golden Hour application.

## Overview

The application uses three core models:

- **Venue** -- A bar, restaurant, or other establishment that offers happy hour deals.
- **Deal** -- A specific food or drink deal offered at a venue.
- **HappyHourSchedule** -- A time window on a given day when deals are active at a venue.

All models use UUID primary keys and include `created_at` and `updated_at` timestamps.

---

## Venue

Database table: `venues`

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | UUID | No | Primary key |
| name | String(255) | No | Venue name |
| nickname | String(100) | Yes | Common short name |
| address | String(500) | No | Street address |
| latitude | Float | No | GPS latitude |
| longitude | Float | No | GPS longitude |
| phone | String(20) | Yes | Phone number |
| website | String(500) | Yes | Website URL |
| neighborhood | String(100) | Yes | Neighborhood name (indexed) |
| venue_type | String(50) | Yes | Type: "Bar", "Restaurant", "Brewery", etc. |
| tags | ARRAY(String) | Yes | Descriptive tags like "dive-bar", "rooftop" |
| cash_only | Boolean | No | Whether the venue only accepts cash |
| google_place_id | String(255) | Yes | Google Places ID for deduplication |
| price_level | Integer | Yes | Price level (1-4) |
| rating | Float | Yes | Average rating |
| verified | Boolean | No | Whether the venue data has been verified |
| active | Boolean | No | Soft delete flag |
| description | Text | Yes | Venue description |
| created_at | DateTime | No | Record creation timestamp |
| updated_at | DateTime | No | Last update timestamp |

Indexes: `neighborhood`, `active`, `google_place_id`.

### Relationships

- A venue has many deals (`deals` backref).
- A venue has many schedules (`schedules` backref).

---

## Deal

Database table: `deals`

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | UUID | No | Primary key |
| venue_id | UUID (FK) | No | References `venues.id` |
| title | String(255) | No | Deal title, e.g. "$3 Draft Beers" |
| description | Text | Yes | Longer description |
| category | String(50) | Yes | "food", "drinks", or "both" |
| deal_type | String(50) | Yes | "special_price", "discount", "bogo", "free" |
| original_price | Float | Yes | Regular price before deal |
| deal_price | Float | Yes | Discounted price |
| discount_percentage | Float | Yes | Calculated percentage off |
| items | ARRAY(String) | Yes | List of items included |
| active | Boolean | No | Soft delete flag |
| verified | Boolean | No | Whether the deal has been verified |
| source | String(50) | Yes | Data source, e.g. "import", "manual" |
| created_at | DateTime | No | Record creation timestamp |
| updated_at | DateTime | No | Last update timestamp |

Indexes: `venue_id`, `active`, `category`.

---

## HappyHourSchedule

Database table: `happy_hour_schedules`

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | UUID | No | Primary key |
| venue_id | UUID (FK) | No | References `venues.id` |
| day_of_week | Integer | No | 0=Monday through 6=Sunday |
| start_time | Time | No | Start time of happy hour |
| end_time | Time | No | End time of happy hour |
| deal_ids | ARRAY(UUID) | Yes | UUIDs of deals active during this window |
| notes | Text | Yes | Additional info like "Patio only" |
| restrictions | Text | Yes | Restrictions like "Dine-in only" |
| active | Boolean | No | Soft delete flag |
| created_at | DateTime | No | Record creation timestamp |
| updated_at | DateTime | No | Last update timestamp |

Indexes: `venue_id`, `day_of_week`.

A schedule entry represents a single time window on a single day. Multiple deals can share the same schedule window. For example, a venue might have both food and drink deals available Monday from 4pm to 7pm -- those deals would be listed in the same schedule entry's `deal_ids` array.

---

## CSV Source Data

The raw data is stored in `data/` as three CSV files. The import process maps CSV IDs (like SC001, D001) to UUIDs and normalizes fields.

### pennstate_venues.csv

Key columns: `venue_id`, `name`, `nickname`, `address`, `latitude`, `longitude`, `phone`, `website`, `neighborhood`, `venue_type`, `tags`, `cash_only`, `is_active`.

### pennstate_deals.csv

Key columns: `deal_id`, `venue_id`, `deal_name`, `description`, `deal_price`, `original_price`, `is_food`, `is_drink`, `is_active`.

The `is_food` and `is_drink` boolean columns are converted to a `category` value: both true = "both", only food = "food", otherwise = "drinks".

### pennstate_schedules.csv

Key columns: `venue_id`, `deal_id`, `day_of_week`, `start_time`, `end_time`.

During import, schedule entries are grouped by (venue, day, start_time, end_time) so that multiple deals sharing the same time window are combined into a single schedule record.

---

## Pydantic Schemas

The backend uses Pydantic schemas for request validation and response serialization. These are defined in `backend/app/schemas/`.

### Venue Schemas

- `VenueCreate` -- Fields required to create a new venue.
- `VenueUpdate` -- Optional fields for partial updates.
- `VenueResponse` -- Full venue object returned by the API.
- `VenueWithDeals` -- Venue with `deals_count` and `active_deals_count` (admin only).

### Deal Schemas

- `DealCreate` -- Fields required to create a new deal (includes `venue_id`).
- `DealUpdate` -- Optional fields for partial updates.
- `DealResponse` -- Full deal object returned by the API.
- `DealWithVenue` -- Deal with `venue_name` attached (admin only).

### HappyHour Schemas

- `HappyHourScheduleResponse` -- Schedule with `start_time` and `end_time` serialized as "HH:MM" strings.

Time fields use a `field_validator` to convert Python `time` objects to "HH:MM" formatted strings for JSON serialization.
