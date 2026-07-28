# Golden Hour

Happy hour discovery app for college towns. Find real-time drink and food deals at nearby bars, submit new deals, and earn points for verified contributions.

**Live markets:** State College, PA · Arlington, VA

---

## Stack

| Layer | Tech | Hosting |
|---|---|---|
| Mobile | React Native + Expo (TypeScript) | TestFlight / App Store |
| Backend API | FastAPI + SQLAlchemy + PostgreSQL | Railway |
| Admin portal | React + Vite | Vercel |

---

## Live URLs

| Service | URL |
|---|---|
| Backend API | `https://goldenhour-production-45a5.up.railway.app` |
| API docs (Swagger) | `https://goldenhour-production-45a5.up.railway.app/docs` |
| Admin portal | `https://goldenhour-smoky.vercel.app` |
| Privacy policy | `https://coltkondo.github.io/GoldenHour/privacy/` |

---

## Repo Structure

```
GoldenHour/
├── mobile/          React Native app (Expo)
│   ├── src/
│   │   ├── screens/ App screens
│   │   ├── components/ Shared UI components
│   │   ├── api/     API client + endpoints
│   │   └── context/ Auth + theme context
│   ├── assets/      App icon, splash, logo files
│   └── eas.json     EAS Build config
├── backend/         FastAPI backend
│   ├── app/
│   │   ├── api/     Route handlers (v1 + admin)
│   │   ├── models/  SQLAlchemy models
│   │   ├── schemas/ Pydantic schemas
│   │   ├── services/ Business logic
│   │   └── core/    Config, auth, rate limiter
│   └── alembic/     Database migrations
├── admin-web/       React admin portal (Vite)
├── scripts/         Utility scripts (see below)
├── docs/            GitHub Pages content (privacy policy only)
└── notes/           Internal documentation
```

---

## Local Development

**Option A — Mobile only, pointed at Railway (simplest):**

```bash
cd mobile
npm install
npx expo start
```

The app hits the Railway backend automatically. Scan the QR code in Expo Go.

**Option B — Full local stack:**

```bash
# 1. Start database
docker-compose up -d db

# 2. Backend
cd backend
pip install -r requirements.txt
# Create backend/.env (see notes/SETUP.md for variables)
alembic upgrade head
uvicorn app.main:app --reload --port 8000

# 3. Mobile (new terminal)
cd mobile
npm install
npx expo start

# 4. Admin portal (optional, new terminal)
cd admin-web
npm install
npm run dev
```

See [notes/SETUP.md](notes/SETUP.md) for full environment variable reference.

---

## Deployment

### Backend (Railway)
- Auto-deploys from `main` branch, root directory `backend/`
- Runs `alembic upgrade head` on every deploy via `docker-entrypoint.sh`
- Environment variables managed in Railway dashboard

### Admin Portal (Vercel)
- Auto-deploys from `main` branch, root directory `admin-web/`
- `VITE_API_URL` → Railway backend URL

### Mobile (EAS Build → TestFlight)
```bash
cd mobile
eas build --platform ios --profile production --auto-submit
```
Builds on Expo's cloud servers and submits directly to TestFlight. No Mac or Xcode needed.

---

## Key Scripts

Run from repo root with `--db-url "postgresql://..."` (Railway connection string).

| Script | Purpose |
|---|---|
| `scripts/create_admin.py` | Create or promote an admin user |
| `scripts/seed_logos.py` | Bulk-set venue `logo_url` from `notes/logos.md` |
| `scripts/geocode_addresses.py` | Geocode venue addresses via Nominatim |

---

## User Roles

| Role | Capabilities |
|---|---|
| `user` | Browse, submit deals/reports, corroborate deals, view points |
| `admin` | Everything above + submission review queue, venue/deal CRUD in admin portal |

New accounts default to `user`. Use `scripts/create_admin.py` to create or promote an admin.

---

## Points Economy

Users earn points when their submissions are approved by an admin:

| Action | Points |
|---|---|
| New bar submitted | 100 |
| Bar closed report | 100 |
| New event submitted | 75 |
| New deal / deal update / deal expired | 50 |
| Corroborate an existing deal | 2 |

Daily cap: 200 pts (configurable per market). Payout threshold: 1,000 pts = $20.

Full spec: [notes/ECONOMY_SPEC.md](notes/ECONOMY_SPEC.md)

---

## Documentation

| File | Contents |
|---|---|
| [notes/SETUP.md](notes/SETUP.md) | Full environment setup and variables |
| [notes/API.md](notes/API.md) | API endpoint reference |
| [notes/DATA_MODELS.md](notes/DATA_MODELS.md) | Database schema |
| [notes/ECONOMY_SPEC.md](notes/ECONOMY_SPEC.md) | Points economy spec |
| [notes/admin-guide.md](notes/admin-guide.md) | Admin portal guide |
| [notes/APP_STORE_COMPLIANCE.md](notes/APP_STORE_COMPLIANCE.md) | App Store review checklist |
| [notes/TODO.md](notes/TODO.md) | Build backlog and sequencing |
