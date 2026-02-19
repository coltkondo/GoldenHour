# Setup Guide

How to get Golden Hour running on your machine.

## Option A: Quick Local Development (No Database)

This is the fastest way to get started. The local dev server reads CSV files directly and serves the same API endpoints the mobile app expects.

### Requirements

- Python 3.11+
- Node.js 18+ with npm
- Expo Go app on your phone

### Steps

1. Install Python dependencies for the local server:

```bash
pip3 install fastapi uvicorn
```

2. Start the local API server from the project root:

```bash
python3 serve_local.py
```

You should see output like:

```
Loaded: 12 venues, 84 deals, 67 schedules
Golden Hour Local Dev Server
Serving 12 State College venues, 84 deals, 67 schedules
API at http://localhost:8000/api/v1
Docs at http://localhost:8000/docs
```

3. In a separate terminal, start the mobile app:

```bash
cd mobile
npm install
npx expo start
```

4. Open Expo Go on your phone and scan the QR code displayed in the terminal.

The mobile app automatically detects your computer's local network IP address using Expo's `hostUri`, so the phone can reach the API server without any manual configuration.

### Troubleshooting

- Make sure your phone and computer are on the same Wi-Fi network.
- If the API does not connect, check that `serve_local.py` is running and listening on port 8000.
- The local server binds to `0.0.0.0`, which means it accepts connections from any device on your network.

---

## Option B: Full Stack with Docker

This runs the complete backend with PostgreSQL and Redis.

### Requirements

- Docker and Docker Compose
- Python 3.11+
- Node.js 18+

### Steps

1. Start the database and Redis:

```bash
docker-compose up -d db redis
```

2. Wait for the containers to become healthy:

```bash
docker ps
```

Look for `golden-hour-db` and `golden-hour-redis` with status `healthy`.

3. Set up the backend:

```bash
cd backend
pip install -r requirements.txt
```

4. Create a `.env` file at `backend/.env`:

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/goldenhour
REDIS_URL=redis://localhost:6379
SECRET_KEY=dev-secret-key-change-in-production
ENVIRONMENT=development
```

5. Run database migrations:

```bash
cd backend
alembic upgrade head
```

6. Start the backend API:

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

The backend will automatically create tables and seed data from the CSV files on first startup.

7. Start the mobile app (in a separate terminal):

```bash
cd mobile
npm install
npx expo start
```

---

## Option C: Docker Compose (Everything Containerized)

Run the entire backend stack in Docker:

```bash
docker-compose up --build
```

This starts PostgreSQL, Redis, and the FastAPI backend together. The backend is accessible at http://localhost:8000.

Then start the mobile app separately:

```bash
cd mobile
npm install
npx expo start
```

---

## Production Environment

The production backend is deployed on Railway at:

```
https://goldenhour-production.up.railway.app
```

The mobile app uses this URL automatically when built in release mode. In development mode (`__DEV__ === true`), it uses the local API server instead.

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `REDIS_URL` | No | Redis connection string (defaults to localhost:6379) |
| `SECRET_KEY` | Yes | Secret key for JWT tokens |
| `ENVIRONMENT` | No | `development` or `production` |

### Mobile

The mobile app does not use environment variables. API URLs are configured in `mobile/src/config/constants.ts` and switch automatically based on `__DEV__`.

---

## Verifying the Setup

After starting the API server (either local or full stack):

1. Open http://localhost:8000 in a browser. You should see a JSON response with venue, deal, and schedule counts.
2. Open http://localhost:8000/docs for the interactive Swagger UI.
3. Test an endpoint: http://localhost:8000/api/v1/venues/

After starting the mobile app:

1. The loading screen should appear briefly, then transition to the home screen.
2. The home screen should display today's deals and featured venues.
3. The map screen should show venue markers around State College, PA.
