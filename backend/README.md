# Golden Hour Backend

FastAPI REST API serving venue, deal, schedule, auth, and submission data for the Golden Hour mobile app and admin dashboard.

## Technology

- **Framework**: FastAPI 0.128
- **ORM**: SQLAlchemy 2.0
- **Database**: PostgreSQL 15 with PostGIS (`postgis/postgis:15-3.3` Docker image)
- **Migrations**: Alembic
- **Validation**: Pydantic v2
- **Rate limiting**: slowapi
- **Caching**: Redis 7 (connected; caching not yet wired up)
- **Server**: Uvicorn

## Project Structure

```
backend/
  app/
    main.py              Application entry point, lifespan handler, rate limiter wiring
    core/
      config.py          Settings from environment variables (production guards)
      database.py        SQLAlchemy engine and session factory
      security.py        JWT encode/decode, get_current_user, require_admin
      limiter.py         slowapi rate limiter singleton
      points_config.py   Points awarded per submission type
    models/
      base.py            Base model with UUID pk and timestamp mixin
      venue.py           Venue model
      deal.py            Deal model
      happy_hour.py      HappyHourSchedule model
      user.py            User model (role: user/admin, points_balance)
      submission.py      Submission model (type, status, submitted_data, admin_notes)
      point_transaction.py  PointTransaction model
    schemas/
      venue.py           Venue Pydantic schemas
      deal.py            Deal Pydantic schemas
      happy_hour.py      Schedule schemas with HH:MM time serialization
      user.py            UserCreate, UserLogin, UserResponse, Token
      submission.py      Submission schemas
      submission_data.py Submitted_data validation per submission_type
    api/
      v1/
        auth.py          register (5/min), login (10/min), refresh, me
        venues.py        Public venue endpoints (list, nearby, schedules, neighborhoods)
        deals.py         Public deal endpoints (active, today, nearby)
        submissions.py   User submission endpoints (create, list own)
        points.py        Points balance and transaction history
        leaderboard.py   Top contributors
        happy_hours.py   Stub (not yet implemented)
      admin/
        __init__.py      Admin router aggregation
        venues.py        Admin venue CRUD + toggle-active
        deals.py         Admin deal CRUD + toggle-active
        export.py        Authenticated CSV export
        submissions.py   Admin submission review (approve/reject + auto-apply)
    services/
      search.py          Haversine geo query logic
      submission_review.py  Auto-apply logic for approved submissions
  scripts/
    import_csv.py        Penn State CSV import (auto-called on fresh startup)
  alembic/               Database migration files
  tests/                 pytest test suite
  requirements.txt       Python dependencies
  Dockerfile             Container build file
  .env.example           Template for environment variables
```

## Running Locally

### With Docker (recommended)

```bash
# From project root
docker compose build backend   # first time only
docker compose up -d
```

Backend runs at http://localhost:8000. Tables are created and Penn State data seeded automatically on first startup.

### Without Docker (read-only, no auth)

```bash
# From project root — serves CSV data directly, no database
pip3 install fastapi uvicorn
python3 serve_local.py
```

This is useful for quickly browsing venue data. Login, signup, and submissions are not supported.

### With PostgreSQL manually

1. Start the database:
```bash
docker compose up -d db
```

2. Install dependencies:
```bash
cd backend
pip install -r requirements.txt
```

3. Create `backend/.env`:
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/goldenhour
REDIS_URL=redis://localhost:6379
SECRET_KEY=dev-secret-key-change-in-production
ENVIRONMENT=development
DEBUG=false
```

4. Run migrations and start:
```bash
alembic upgrade head
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

## API Documentation

When running, interactive docs are at:

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Key Design Decisions

**Auto-seed on startup**: The `main.py` lifespan handler runs Alembic migrations, then calls `seed_if_empty()` from `scripts/import_csv.py`. If seeding fails, startup is halted — the app will not start in a broken state.

**Production guards**: `config.py` uses a Pydantic `model_validator` to block `DEBUG=True`, wildcard CORS, and known dev `SECRET_KEY` values when `ENVIRONMENT=production`.

**Rate limiting**: `slowapi` middleware limits register to 5/minute and login to 10/minute per IP.

**Time serialization**: `HappyHourScheduleResponse` converts Python `time` objects to `"HH:MM"` strings via `field_validator`.

**Soft deletes**: Venues and deals use an `active` boolean flag instead of hard deletes.

**UUID primary keys**: All models use UUIDs. The CSV import maps short IDs (SC001, D001) to generated UUIDs.

**Auto-apply on approval**: When an admin approves a submission, `submission_review.py` automatically creates/updates/deactivates the relevant venue or deal and awards points to the submitter.

## Data Import

```bash
# Standard import (skips if data exists)
python -m scripts.import_csv

# Force re-import (clears and re-seeds)
python -m scripts.import_csv --force
```

Source CSVs in `data/`: `pennstate_venues.csv`, `pennstate_deals.csv`, `pennstate_schedules.csv`.

## Running Tests

```bash
cd backend
pip install -r requirements.txt
pytest tests/ -v
```

## Production Deployment

The backend is deployed on Railway. The Dockerfile runs Alembic migrations on startup, then starts Uvicorn. Environment variables are set in the Railway dashboard.

Required Railway env vars:

| Variable | Value |
|----------|-------|
| `SECRET_KEY` | 32+ char random string |
| `DEBUG` | `false` |
| `ENVIRONMENT` | `production` |
| `DATABASE_URL` | Railway-injected |
| `ALLOWED_ORIGINS` | Your frontend domain |
