# Golden Hour — Getting Started

This guide covers everything you need to run the full app for the first time.

---

## What You Need Installed

| Tool | Version | Purpose |
|------|---------|---------|
| Docker Desktop | Latest | Runs PostgreSQL, Redis, and the backend API |
| Node.js | 18+ | Mobile app and admin web |
| npm | 8+ | Package management |
| Expo Go | Latest | Run the mobile app on a physical device |

> **Docker is required.** The app now has user accounts and a submission system that need a real database. The old `serve_local.py` script still works for browsing venues but does not support login, signup, or submissions.

---

## Step 1: Start the Backend

From the project root:

```bash
# First time only: build the backend image to install Python dependencies
docker compose build backend

# Start PostgreSQL, Redis, and the backend API
docker compose up -d
```

The backend starts on **http://localhost:8000**. Database tables are created automatically on first startup.

Verify it is running:

```bash
# Should return {"status": "healthy"}
curl http://localhost:8000/health

# Or open the interactive API docs
open http://localhost:8000/docs
```

Watch the logs if something looks wrong:

```bash
docker compose logs -f backend
```

---

## Step 2: Start the Mobile App

In a separate terminal:

```bash
cd mobile
npm install       # first time only
npx expo start
```

- **Physical device**: Install Expo Go, scan the QR code. Your phone must be on the same Wi-Fi network as your computer.
- **iOS Simulator**: Press `i` (requires Xcode on macOS).
- **Android Emulator**: Press `a` (requires Android Studio).

---

## Step 3: Create Your Account

Open the app on your phone or simulator. You will land on the **Sign In** screen. Tap **Sign Up** to create an account.

The account is created in your local PostgreSQL database. Every new account starts as a regular `user` role.

---

## Step 4: Create an Admin Account

To use the admin review queue (approve/reject submissions), one account needs the `admin` role. Promote an account like this:

```bash
# Open a psql shell inside the running database container
docker compose exec db psql -U postgres -d goldenhour

# Inside psql, run:
UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
\q
```

Sign out and back in on the mobile app to pick up the new role. The **Review Queue** option will appear in your Profile.

---

## Step 5: Start the Admin Web (Optional)

The admin web dashboard is used for managing venues, deals, and reviewing the submission queue from a browser.

```bash
cd admin-web
npm install       # first time only
npm run dev
```

Open **http://localhost:5173** in a browser and log in with your admin account credentials.

---

## App Features

### Mobile screens

| Screen | Description |
|--------|-------------|
| Home | Time-based greeting, today's deals, featured venues |
| Map | Interactive map with venue markers |
| Explorer | Browse and filter venues by neighborhood |
| Happy Hour | Full venue detail: deals, schedule, info |
| Profile | Account info, points balance, and navigation to contribute screens |
| Quick Submit | Submit a new bar, deal, update, or closure report |
| My Submissions | View your submission history and points earned |
| Leaderboard | Top contributors ranked by points |
| Admin Review | (Admin only) Approve or reject pending submissions |

### Points system

| Action | Points |
|--------|--------|
| New bar or new deal submitted and approved | 50 pts |
| Deal expired or bar closed report approved | 25 pts |
| Deal update or bar update approved | 15 pts |

---

## Daily Development Workflow

```bash
# Terminal 1 — backend + database
docker compose up -d

# Terminal 2 — mobile app
cd mobile && npx expo start

# Terminal 3 — admin web (if needed)
cd admin-web && npm run dev
```

Hot reload is active for both the mobile app and the admin web. Backend changes reload automatically because the `./backend` directory is bind-mounted into the container.

---

## Stopping Everything

```bash
docker compose down
```

Data persists in a Docker volume (`postgres_data`) between restarts.

---

## Common Issues

**"Sign up failed — try again"**: The backend is not running. Make sure `docker compose up -d` has been run and `curl http://localhost:8000/health` returns healthy.

**App shows API errors**: Your phone and computer must be on the same Wi-Fi network. The app auto-detects your machine's IP via Expo's `hostUri`.

**Map is blank on Android**: Google Maps requires an API key in `mobile/app.json`. On iOS, Apple Maps works without a key.

**Location permission denied**: The app falls back to a default State College, PA location. All data still loads.

**Port 8000 in use**: `lsof -i :8000` to find the conflicting process, or stop it with `docker compose down`.

**Backend logs show "table does not exist"**: This should not happen since tables are auto-created on startup. If it does, run `docker compose restart backend`.

---

## Project Structure

```
GoldenHour/
  backend/             FastAPI API (Python, SQLAlchemy, PostgreSQL + PostGIS)
    app/
      api/v1/          Public + auth endpoints (venues, deals, auth, submissions, points, leaderboard)
      api/admin/       Admin CRUD + submission review endpoints
      models/          SQLAlchemy models (Venue, Deal, User, Submission, PointTransaction)
      schemas/         Pydantic request/response schemas
      services/        Shared business logic (submission review, auto-apply)
      core/            Database, config, JWT security, points config

  mobile/              React Native app (Expo, TypeScript)
    src/
      screens/         All app screens including auth, submit, leaderboard
      context/         AuthContext (JWT token + user state)
      api/             Axios client with JWT interceptor and all endpoint functions
      navigation/      Auth-gated stack + tab navigators
      components/      Cards, FlagReportModal, common components
      types/           TypeScript type definitions
      config/          API URL detection, constants, points config

  admin-web/           React admin dashboard (Vite)
    src/
      context/         AuthContext (admin JWT)
      pages/           Login, Submissions (PendingReview, ReviewDetail), Venues, Deals
      services/        Admin API client

  data/                CSV source files (venues, deals, schedules)
  docker-compose.yml   PostgreSQL + Redis + backend containers
  docs/                Additional documentation
```
