# Golden Hour

The best college happy hour discovery platform. Users find local happy hour deals, browse venues on a map, and contribute new information to earn points.

## What This App Does

Golden Hour helps people find cheap food and drink deals at bars and restaurants near them. The mobile app shows venues on a map, lists active deals, and lets users browse by neighborhood. Logged-in users can submit new deals, flag expired ones, and report bar closures — submissions go into a review queue that admins approve. Approved submissions automatically update the database and award points to the submitter.

The current dataset covers State College, PA.

## Quick Start

**Docker is required.** The app has user accounts, JWT auth, and a submission system that need a real database.

```bash
# 1. Build and start the backend (PostgreSQL + Redis + FastAPI)
docker compose build backend
docker compose up -d

# 2. Start the mobile app
cd mobile && npx expo start

# 3. (Optional) Start the admin web dashboard
cd admin-web && npm run dev
```

See [FIRSTSTEP.md](FIRSTSTEP.md) for the full walkthrough including how to create an admin account.

## Project Structure

```
GoldenHour/
  backend/           FastAPI REST API (Python, SQLAlchemy, PostgreSQL + PostGIS)
  mobile/            React Native mobile app (Expo, TypeScript)
  admin-web/         React admin dashboard (Vite)
  data/              CSV source files for venues, deals, and schedules
  docker-compose.yml PostgreSQL, Redis, and backend containers
  docs/              Additional documentation
```

## Architecture

### Backend

- **Framework**: FastAPI with Pydantic v2 validation
- **Database**: PostgreSQL 15 with PostGIS
- **ORM**: SQLAlchemy 2.0
- **Auth**: JWT via `python-jose`, passwords hashed with `passlib[bcrypt]`
- **Migrations**: Alembic (tables also auto-created on startup via `create_all`)

### Mobile

- **Framework**: React Native with Expo SDK 54
- **Language**: TypeScript
- **Auth**: JWT stored in `AsyncStorage`, injected on every API request
- **Navigation**: React Navigation (anonymous browse enabled; auth gated at contribute actions, not the root)
- **Maps**: react-native-maps (Apple Maps on iOS)
- **HTTP**: Axios with request interceptor for auth

### Admin Web

- **Framework**: React with Vite
- **Auth**: JWT stored in `localStorage`
- **Purpose**: CRUD management of venues/deals, submission review queue

## API Endpoints

### Public

| Endpoint | Description |
|----------|-------------|
| `GET /api/v1/venues/` | List all active venues |
| `GET /api/v1/venues/nearby` | Find venues within a radius |
| `GET /api/v1/venues/{id}/schedules` | Get schedules for a venue |
| `GET /api/v1/deals/active` | Get all active deals |
| `GET /api/v1/deals/today` | Get deals available today |
| `GET /api/v1/leaderboard/` | Top contributors by points |

### Auth (requires account)

| Endpoint | Description |
|----------|-------------|
| `POST /api/v1/auth/register` | Create account, returns JWT |
| `POST /api/v1/auth/login` | Sign in, returns JWT |
| `GET /api/v1/auth/me` | Current user info |
| `POST /api/v1/submissions/` | Submit a deal/bar/update/report |
| `GET /api/v1/submissions/mine` | Your submission history |
| `GET /api/v1/points/users/{id}` | Points balance and history |

### Admin only

| Endpoint | Description |
|----------|-------------|
| `GET /api/v1/submissions/` | All submissions with filters |
| `PATCH /api/v1/submissions/{id}/review` | Approve or reject, auto-applies change |
| `GET /api/v1/admin/venues/` | CRUD for venues |
| `GET /api/v1/admin/deals/` | CRUD for deals |

## User Roles

| Role | Capabilities |
|------|-------------|
| `user` | Browse, submit deals/reports, view own submissions and points |
| `admin` | Everything above + review queue, immediate publish, full CRUD in admin web |

New accounts default to `user`. Promote to admin via psql:

```sql
UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
```

## Points System

Submitting information that gets approved earns points. The authoritative values are in [docs/ECONOMY_SPEC.md](docs/ECONOMY_SPEC.md).

| Submission type | Points |
|-----------------|--------|
| New deal or deal correction | 50 |
| Deal marked expired | 50 |
| New bar added | 100 |
| Bar marked closed | 100 |
| Bar info correction | 50 |
| Corroborate an existing deal | 2 |

1,000 points = $20 cash via Venmo, requested by the user. Daily cap: 200 pts/user.

> **Arts Fest build:** The economy layer is disabled via `REWARDS_ENABLED=false` in `backend/.env` and `mobile/src/config/constants.ts`. Points are not awarded and rewards UI is hidden. Flip both flags to `true` for the August public launch.

## Data

All source data lives in `data/` as CSV files:

- `pennstate_venues.csv` — venues
- `pennstate_deals.csv` — deals
- `pennstate_schedules.csv` — schedule entries (one row per deal-per-slot; grouped into schedule records on import)

To wipe the database and re-import from the CSVs:

```bash
docker compose run --rm backend_image python -m scripts.import_csv --force
```

Always use `docker compose run --rm backend_image` for this — not `exec backend`. See [docs/DATA_MODELS.md](docs/DATA_MODELS.md) for the full CSV column reference.

## Production

The backend is deployed to Railway. The mobile app automatically switches between local dev and production based on build mode (`__DEV__`).

```
https://goldenhour-production.up.railway.app
```

## Documentation

- [FIRSTSTEP.md](FIRSTSTEP.md) — Full setup walkthrough for new developers
- [docs/SETUP.md](docs/SETUP.md) — Detailed environment setup
- [docs/API.md](docs/API.md) — Full API reference
- [docs/DATA_MODELS.md](docs/DATA_MODELS.md) — Database schema and CSV import reference
- [docs/ECONOMY_SPEC.md](docs/ECONOMY_SPEC.md) — Points economy: values, cap, payout threshold
- [docs/APP_STORE_COMPLIANCE.md](docs/APP_STORE_COMPLIANCE.md) — Apple App Store review checklist and known gaps
- [docs/admin-guide.md](docs/admin-guide.md) — Admin dashboard guide
