# Golden Hour Admin -- Data Management Guide

## Prerequisites

- Docker Desktop installed and running (for PostgreSQL)
- Python 3.11+ with pip
- Node.js 18+ with npm

---

## 1. Start the Database

```bash
docker-compose up -d db
```

Verify it is running:

```bash
docker ps
```

You should see `golden-hour-db` with status `healthy`.

---

## 2. Environment Setup

The backend needs a `.env` file at `backend/.env`:

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/goldenhour
REDIS_URL=redis://localhost:6379
SECRET_KEY=dev-secret-key-change-in-production
ENVIRONMENT=development
```

---

## 3. Install Dependencies

Backend (Python):

```bash
cd backend
pip install -r requirements.txt
```

Admin Dashboard (Node):

```bash
cd admin-web
npm install
```

---

## 4. Run Database Migrations

From the `backend/` directory:

```bash
cd backend
alembic upgrade head
```

This creates all tables: `venues`, `deals`, `happy_hour_schedules`.

---

## 5. Import Data from CSV

The CSV source files live in the `data/` directory:

```
data/
  pennstate_venues.csv
  pennstate_deals.csv
  pennstate_schedules.csv
```

### Using the import script

The import script at `backend/scripts/import_csv.py` reads all three CSV files and loads them into PostgreSQL.

Standard import (skips if data already exists):

```bash
cd backend
python -m scripts.import_csv
```

Force re-import (clears existing data first):

```bash
cd backend
python -m scripts.import_csv --force
```

The script imports in order: venues, then deals, then schedules. Deals reference venues by `venue_id` (e.g. SC001), and schedules reference both. The import groups schedule entries by (venue, day, start_time, end_time) to combine deal IDs.

### Auto-seed on startup

The backend also auto-seeds the database when it starts up. If the venues table is empty, it runs the import automatically. See `backend/app/main.py` for the lifespan handler.

---

## 6. Start the Backend API

```bash
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

API docs available at: http://localhost:8000/docs

---

## 7. Start the Admin Dashboard

```bash
cd admin-web
npm run dev
```

Open http://localhost:5173 in your browser. Log in with your admin account credentials.

If you do not have an admin account yet, create any account via the mobile app, then promote it via psql:

```bash
docker compose exec db psql -U postgres -d goldenhour
```
```sql
UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
\q
```

The admin dashboard validates your token server-side on every page load. Storing a random string in localStorage will not grant access — the backend's `/auth/me` endpoint must confirm you are an active admin.

---

## 8. Admin API Endpoints

All admin endpoints are under `/api/v1/admin/`.

### Venues

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/admin/venues/` | List all venues (search, filter, sort) |
| GET | `/api/v1/admin/venues/{id}` | Get single venue |
| POST | `/api/v1/admin/venues/` | Create new venue |
| PUT | `/api/v1/admin/venues/{id}` | Update venue |
| PATCH | `/api/v1/admin/venues/{id}/toggle-active` | Toggle active/inactive |
| GET | `/api/v1/admin/venues/count` | Get venue count |
| GET | `/api/v1/admin/venues/neighborhoods` | List all neighborhoods |
| GET | `/api/v1/admin/venues/venue-types` | List all venue types |

### Deals

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/admin/deals/` | List all deals (search, filter, sort) |
| GET | `/api/v1/admin/deals/{id}` | Get single deal |
| POST | `/api/v1/admin/deals/` | Create new deal |
| PUT | `/api/v1/admin/deals/{id}` | Update deal |
| PATCH | `/api/v1/admin/deals/{id}/toggle-active` | Toggle active/inactive |
| GET | `/api/v1/admin/deals/count` | Get deal count |
| GET | `/api/v1/admin/deals/categories` | List all categories |
| GET | `/api/v1/admin/deals/deal-types` | List all deal types |

### Export

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/admin/export/venues.csv` | Download all venues as CSV |
| GET | `/api/v1/admin/export/deals.csv` | Download all deals as CSV |

---

## 8a. Submission Review Queue

The **Submissions** page shows all user-submitted tips. Each submission can be:

- **Approved** — The change is automatically applied to the database (venue created/updated, deal created/updated, etc.) and points are awarded to the submitter.
- **Rejected** — The submission is marked rejected. You can add admin notes explaining why.

Both actions show a confirmation dialog before executing.

---

## 9. Export Data for Backup

Export buttons in the admin dashboard download CSVs using authenticated requests. To export via curl, include your token:

```bash
TOKEN="your-jwt-token-here"
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/v1/admin/export/venues.csv -o backup_venues.csv
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/v1/admin/export/deals.csv -o backup_deals.csv
```

---

## Quick Start (All Steps)

```bash
# 1. Start database
docker-compose up -d db

# 2. Install dependencies
cd backend && pip install -r requirements.txt && cd ..
cd admin-web && npm install && cd ..

# 3. Run migrations
cd backend && alembic upgrade head && cd ..

# 4. Start backend (terminal 1)
cd backend && uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# 5. Start admin dashboard (terminal 2)
cd admin-web && npm run dev

# 6. Open http://localhost:5173
```
