# Golden Hour

A community-driven happy hour discovery platform. Users find local happy hour deals, browse venues on a map, and explore what is available nearby -- all from their phone.

## What This App Does

Golden Hour helps people find cheap food and drink deals at bars and restaurants near them. The mobile app shows venues on a map, lists active deals for the current day, and lets users explore by neighborhood or category. The initial dataset covers State College, PA (Penn State area) with 12 venues and 84 deals.

## Project Structure

```
GoldenHour/
  backend/           FastAPI REST API (Python, SQLAlchemy, PostgreSQL)
  mobile/            React Native mobile app (Expo, TypeScript)
  admin-web/         React admin dashboard for managing venues and deals
  data/              CSV source files for venues, deals, and schedules
  serve_local.py     Lightweight local dev server (no database required)
  docker-compose.yml PostgreSQL and Redis containers
  docs/              Additional documentation
```

## Quick Start (Local Development)

### Prerequisites

- Python 3.11 or later
- Node.js 18 or later with npm
- Expo Go app installed on your phone (iOS App Store or Google Play)

### 1. Start the local API server

The local server reads data directly from CSV files. No database setup required.

```bash
pip3 install fastapi uvicorn
python3 serve_local.py
```

This starts the API at http://localhost:8000 serving 12 venues, 84 deals, and 67 schedules.

### 2. Start the mobile app

```bash
cd mobile
npm install
npx expo start
```

Scan the QR code with Expo Go on your phone. The app automatically detects your machine's IP address so the phone can reach the local API server.

### 3. Verify the API

Open http://localhost:8000/docs in a browser to see the interactive API documentation.

## Architecture

### Backend

- **Framework**: FastAPI with Pydantic validation
- **Database**: PostgreSQL 15 with PostGIS (for production)
- **ORM**: SQLAlchemy 2.0
- **Migrations**: Alembic
- **Caching**: Redis (optional, for production)

### Mobile

- **Framework**: React Native with Expo SDK 54
- **Language**: TypeScript
- **Navigation**: React Navigation (bottom tabs + native stack)
- **Maps**: react-native-maps (Apple Maps on iOS, default on Android)
- **HTTP**: Axios
- **Animations**: react-native-reanimated, @gorhom/bottom-sheet

### Admin Web

- **Framework**: React with Vite
- **Purpose**: CRUD management of venues and deals

## Data

All source data lives in the `data/` directory as CSV files:

- `pennstate_venues.csv` -- 13 venues (12 with valid coordinates)
- `pennstate_deals.csv` -- 97 deals (84 linked to valid venues)
- `pennstate_schedules.csv` -- 167 schedule entries (grouped into 67 unique time slots)

## API Endpoints

The mobile app uses these endpoints (served by both `serve_local.py` and the full backend):

| Endpoint | Description |
|----------|-------------|
| `GET /api/v1/venues/` | List all active venues |
| `GET /api/v1/venues/nearby` | Find venues within a radius |
| `GET /api/v1/venues/{id}` | Get a single venue |
| `GET /api/v1/venues/{id}/schedules` | Get schedules for a venue |
| `GET /api/v1/venues/neighborhoods/list` | List all neighborhoods |
| `GET /api/v1/deals/active` | Get all active deals |
| `GET /api/v1/deals/today` | Get deals available today |
| `GET /api/v1/deals/nearby` | Find deals near a location |

## Mobile App Screens

- **Home** -- Time-based greeting, today's deals, featured venues
- **Map** -- Interactive map with venue markers and bottom sheet details
- **Explorer** -- Browse venues by neighborhood with search and filters
- **Profile** -- User preferences and settings (placeholder)

## Production Deployment

The backend is deployed to Railway with a PostgreSQL database. The production API is at:

```
https://goldenhour-production.up.railway.app
```

The mobile app automatically switches between the local dev server and production based on whether it is running in development or release mode.

## Documentation

- [docs/SETUP.md](docs/SETUP.md) -- Detailed setup instructions
- [docs/API.md](docs/API.md) -- Full API reference
- [docs/DATA_MODELS.md](docs/DATA_MODELS.md) -- Database schema and model definitions
- [docs/admin-guide.md](docs/admin-guide.md) -- Admin dashboard usage guide
- [backend/README.md](backend/README.md) -- Backend-specific documentation
- [admin-web/README.md](admin-web/README.md) -- Admin web app documentation
