# Golden Hour Backend

FastAPI REST API serving venue, deal, and schedule data for the Golden Hour mobile app.

## Technology

- **Framework**: FastAPI 0.128
- **ORM**: SQLAlchemy 2.0
- **Database**: PostgreSQL 15 with PostGIS
- **Migrations**: Alembic
- **Validation**: Pydantic 2.12
- **Caching**: Redis 7 (optional)
- **Server**: Uvicorn

## Project Structure

```
backend/
  app/
    main.py              Application entry point with lifespan handler
    core/
      config.py          Settings from environment variables
      database.py        SQLAlchemy engine and session factory
    models/
      base.py            Base model with timestamp mixin
      venue.py           Venue model
      deal.py            Deal model
      happy_hour.py      HappyHourSchedule model
    schemas/
      venue.py           Venue Pydantic schemas
      deal.py            Deal Pydantic schemas
      happy_hour.py      Schedule Pydantic schemas with time serialization
    api/
      v1/
        venues.py        Public venue endpoints
        deals.py         Public deal endpoints
      admin/
        __init__.py      Admin router aggregation
        venues.py        Admin venue CRUD
        deals.py         Admin deal CRUD
        export.py        CSV export endpoints
    services/
      search.py          Search and geo query logic
  scripts/
    import_csv.py        CSV data import script
  alembic/               Database migration files
  requirements.txt       Python dependencies
  Dockerfile             Container build file
  .env                   Environment variables (not committed)
```

## Running Locally

### With the lightweight dev server (no database)

From the project root:

```bash
pip3 install fastapi uvicorn
python3 serve_local.py
```

This reads CSV files from `data/` and serves the same API the mobile app expects.

### With PostgreSQL

1. Start the database:

```bash
docker-compose up -d db
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
SECRET_KEY=dev-secret-key
ENVIRONMENT=development
```

4. Run migrations and start:

```bash
alembic upgrade head
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

The server auto-seeds the database from CSV files on first startup if the venues table is empty.

## API Documentation

When running, interactive docs are at:

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Key Design Decisions

**Auto-seed on startup**: The `main.py` lifespan handler creates tables and calls `seed_if_empty()` from `scripts/import_csv.py`. This means the first time the backend starts with an empty database, it populates itself from the CSV files in `data/`.

**Time serialization**: The `HappyHourScheduleResponse` schema uses a `field_validator` to convert Python `time` objects to "HH:MM" strings. Without this, the default serialization produces formats the mobile app cannot parse.

**Soft deletes**: Venues and deals use an `active` boolean flag instead of hard deletes. The toggle-active admin endpoint flips this flag.

**UUID primary keys**: All models use UUIDs rather than auto-incrementing integers. The CSV import maps short IDs (SC001, D001) to generated UUIDs.

## Data Import

The import script at `scripts/import_csv.py` supports:

```bash
# Standard import (skip if data exists)
python -m scripts.import_csv

# Force re-import
python -m scripts.import_csv --force
```

## Production Deployment

The backend is deployed on Railway. The Dockerfile runs Alembic migrations on startup, then starts Uvicorn. Environment variables are configured in the Railway dashboard.
