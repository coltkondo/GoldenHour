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

> **Docker is required.** The app has user accounts and a submission system that need a real database. The old `serve_local.py` script still works for browsing venues but does not support login, signup, or submissions.

---

## Step 1: Configure the Backend Environment

Copy the example env file and confirm it looks right:

**Mac/Linux:**
```bash
cp backend/.env.example backend/.env
```

**Windows (PowerShell):**
```powershell
Copy-Item backend\.env.example backend\.env
```

Open `backend/.env` and verify the values. The defaults work for local Docker development — you do not need to change anything to get started. The `SECRET_KEY` default is fine for local dev only; change it before deploying.

---

## Step 2: Start the Backend

From the project root:

**Mac/Linux/Windows (all the same):**
```bash
# First time only: build the backend image to install Python dependencies
docker compose build backend

# Start PostgreSQL, Redis, and the backend API
docker compose up -d
```

The backend starts on **http://localhost:8000**. Database tables are created automatically on first startup, and the Penn State venue/deal data is seeded if the database is empty.

Verify it is running:

**Mac/Linux:**
```bash
# Should return {"status":"healthy"}
curl http://localhost:8000/health

# Open interactive API docs in browser
open http://localhost:8000/docs
```

**Windows (PowerShell):**
```powershell
# Should return {"status":"healthy"}
Invoke-RestMethod http://localhost:8000/health

# Open interactive API docs in browser
start http://localhost:8000/docs
```

**Windows (Command Prompt):**
```cmd
curl http://localhost:8000/health
start http://localhost:8000/docs
```

Watch the logs if something looks wrong:
```bash
docker compose logs -f backend
```

---

## Step 3: Start the Mobile App

In a separate terminal:

```bash
cd mobile
npm install       # first time only
npx expo start
```

- **Physical device**: Install Expo Go, scan the QR code. Your phone must be on the same Wi-Fi network as your computer.
- **iOS Simulator**: Press `i` (requires Xcode on macOS only).
- **Android Emulator**: Press `a` (requires Android Studio).

---

## Step 4: Seed the Database

The database auto-seeds on first startup if it is empty. To wipe and re-import at any time (e.g. after updating the CSVs in `data/`):

```bash
docker compose run --rm backend_image python -m scripts.import_csv --force
```

This clears venues, deals, and schedules, then re-imports from the three CSV files in `data/`. Use this command every time you update the source data — it is safe to run repeatedly.

> **Always use `docker compose run --rm backend_image`** for the import, not `docker compose exec backend`. The `run` form spins up a dedicated one-off container for the job; `exec` is a side door into the live server process.

---

## Step 5: Create Your Account

The app supports anonymous browsing — you can view deals and the map without an account. To submit deals or access the admin dashboard, you need an account.

**Option A — terminal (fastest):**

```bash
curl.exe -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "yourname", "email": "you@email.com", "password": "yourpassword"}'
```

**Option B — mobile app:** open the app, tap any contribute action, and tap **Sign Up**.

Every new account starts as a regular `user` role.

---

## Step 6: Create an Admin Account

To use the admin review queue and admin web dashboard, promote an account to `admin`:

```bash
docker compose exec db psql -U postgres -d goldenhour -c \
  "UPDATE users SET role = 'admin' WHERE email = 'you@email.com';"
```

Sign out and back in on the mobile app to pick up the new role.

---

## Step 7: Start the Admin Web (Optional)

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

> **Arts Fest build:** rewards are disabled (`REWARDS_ENABLED=false`). Points are not awarded until the August public launch.

| Action | Points |
|--------|--------|
| New deal or deal correction approved | 50 pts |
| Deal marked expired, approved | 50 pts |
| New bar added, approved | 100 pts |
| Bar marked closed, approved | 100 pts |
| Bar info correction approved | 50 pts |
| Corroborate an existing deal | 2 pts |

1,000 pts = $20 cash. Daily cap: 200 pts/user. See [docs/ECONOMY_SPEC.md](docs/ECONOMY_SPEC.md).

---

## Daily Development Workflow

```bash
# Terminal 1 — backend + database (all platforms)
docker compose up -d

# Terminal 2 — mobile app (all platforms)
cd mobile && npx expo start

# Terminal 3 — admin web (if needed, all platforms)
cd admin-web && npm run dev
```

Hot reload is active for all three:
- **Mobile app**: Expo reloads on save automatically.
- **Admin web**: Vite HMR reloads on save automatically.
- **Backend**: `--reload` is passed to uvicorn, so Python changes restart the server automatically (the `./backend` directory is bind-mounted into the container).

---

## Stopping Everything

```bash
docker compose down
```

Data persists in a Docker volume (`postgres_data`) between restarts. To also wipe the database:

```bash
docker compose down -v
```

---

## Common Issues

**"Sign up failed — try again"**
The backend is not running. Run `docker compose up -d` and wait for the health check to pass, then try `curl http://localhost:8000/health`.

**App shows API errors on physical device**
Your phone and computer must be on the same Wi-Fi network. The app auto-detects your machine's IP via Expo's `hostUri`.

**Map is blank on Android**
Android uses Google Maps which requires an API key in `mobile/app.json`. The current beta is iOS-only — Apple Maps works without a key on iOS.

**Location permission denied**
The app falls back to a default State College, PA location. All data still loads normally.

**Port 8000 already in use**

Mac/Linux:
```bash
lsof -i :8000
```
Windows (PowerShell):
```powershell
netstat -ano | findstr :8000
```
Or just stop whatever is using it and run `docker compose up -d` again.

**Backend logs show "table does not exist"**
Tables are auto-created on startup. If they're missing, run:
```bash
docker compose restart backend
```
Or force a migration manually:
```bash
docker compose exec backend alembic upgrade head
```

**`alembic upgrade head` fails with "Multiple head revisions"**
This was a known bug and has been fixed. If you're seeing it, pull the latest code.

**Windows: `docker compose` says daemon not running**
Open Docker Desktop from the Start menu and wait for it to fully start (the whale icon in the system tray stops animating). Then retry.

**Windows: line ending issues in shell scripts**
If you get `\r: command not found` errors, the shell scripts have Windows line endings. Fix with:
```bash
docker compose exec backend sed -i 's/\r//' docker-entrypoint.sh
```

---

## Python Version

- **Docker image**: Python 3.11 (defined in `backend/Dockerfile`)
- **Local development**: Any Python 3.10+ works. Python 3.14 is used on the dev machine.
- The code uses `dict[str, Any]` and `X | Y` union syntax which require Python 3.10+.

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
    alembic/           Database migrations
    scripts/           CSV import / seed script
    .env.example       Template for backend environment variables

  mobile/              React Native app (Expo, TypeScript)
  admin-web/           React admin dashboard (Vite)
  data/                CSV source files (venues, deals, schedules)
  docker-compose.yml   PostgreSQL + Redis + backend containers
  serve_local.py       No-database dev server (read-only, no auth)
  docs/                Additional documentation
```
