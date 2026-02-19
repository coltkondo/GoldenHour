# Golden Hour -- Getting Started

This guide covers everything you need to run the app for the first time.

---

## Step 1: Clone and Install

```bash
git clone <repo-url>
cd GoldenHour
```

Install mobile dependencies:

```bash
cd mobile
npm install
cd ..
```

Install Python dependencies for the local API server:

```bash
pip3 install fastapi uvicorn
```

---

## Step 2: Start the Local API Server

From the project root:

```bash
python3 serve_local.py
```

This starts a lightweight FastAPI server on port 8000 that reads venue, deal, and schedule data directly from CSV files in the `data/` directory. No database setup is required.

You should see:

```
Loaded: 12 venues, 84 deals, 67 schedules
```

Verify by opening http://localhost:8000/docs in a browser.

---

## Step 3: Start the Mobile App

In a separate terminal:

```bash
cd mobile
npx expo start
```

This launches the Expo development server. You have several options:

- **Physical device**: Install Expo Go on your phone, then scan the QR code. Your phone must be on the same Wi-Fi network as your computer. The app automatically detects your computer's IP address.
- **iOS Simulator**: Press `i` in the terminal (requires Xcode on macOS).
- **Android Emulator**: Press `a` in the terminal (requires Android Studio).

---

## Step 4: Explore the App

The app has four main screens:

**Home** -- Shows a time-based greeting (morning, afternoon, golden hour, evening, late night), today's active deals, and featured venues.

**Map** -- Displays all venues as markers on an interactive map centered on State College, PA. Tap a marker to see venue details in a bottom sheet, including the venue name, address, type, and associated deals.

**Explorer** -- Browse venues by neighborhood. Includes a search bar and category filters. Tap a venue to see its details and deals.

**Profile** -- Placeholder screen for future user preferences and settings.

---

## What You Need Installed

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | 18+ | Running the mobile app and admin dashboard |
| npm | 8+ | Package management |
| Python | 3.11+ | Running the local API server |
| Expo Go | Latest | Running the mobile app on a physical device |

Optional (for full stack development):

| Tool | Version | Purpose |
|------|---------|---------|
| Docker | Latest | Running PostgreSQL and Redis containers |
| PostgreSQL | 15+ | Production database (with PostGIS) |
| Redis | 7+ | Caching layer |

---

## Project Architecture

```
GoldenHour/
  mobile/              React Native app (Expo, TypeScript)
    src/
      screens/         Home, Map, Explorer, Profile, HappyHour, Loading
      components/      DealCard, VenueCard, VenueMarker, MiniMap, BottomSheet
      api/             Axios client and endpoint functions
      hooks/           useLocation hook
      config/          API URL and default location constants
      types/           TypeScript type definitions
      navigation/      Tab and stack navigators
      theme/           Time-based color themes

  backend/             FastAPI API (Python)
    app/
      api/v1/          Public endpoints (venues, deals)
      api/admin/       Admin CRUD endpoints
      models/          SQLAlchemy models (Venue, Deal, HappyHourSchedule)
      schemas/         Pydantic request/response schemas
      services/        Search and geo query logic
      core/            Database and config
    scripts/           CSV import script

  admin-web/           React admin dashboard (Vite)
  data/                CSV source files (venues, deals, schedules)
  serve_local.py       Standalone local dev API server
  docker-compose.yml   PostgreSQL + Redis containers
  docs/                Additional documentation
```

---

## Data Overview

The current dataset covers State College, PA (Penn State area):

- **12 venues** -- Bars, restaurants, and breweries in the downtown and campus areas
- **84 deals** -- Food and drink specials with pricing information
- **67 schedules** -- Day and time windows when deals are active

Data is stored as CSV files in `data/` and loaded by the local API server on startup.

---

## Development Workflow

### Day-to-day development

1. Start the local API server: `python3 serve_local.py`
2. Start the mobile app: `cd mobile && npx expo start`
3. Make changes to mobile code -- Expo hot-reloads automatically
4. Test on your phone via Expo Go

### Adding new data

Edit the CSV files in `data/`:
- `pennstate_venues.csv` for new venues
- `pennstate_deals.csv` for new deals
- `pennstate_schedules.csv` for new schedule entries

Restart `serve_local.py` to pick up changes.

### Full stack development

If you need PostgreSQL for testing database-dependent features:

```bash
docker-compose up -d db redis
cd backend
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

---

## Common Issues

**App shows API errors on Expo Go**: Make sure `serve_local.py` is running and your phone is on the same Wi-Fi network as your computer.

**Map is blank**: The app uses Apple Maps on iOS (no API key needed). On Android, Google Maps requires a valid API key in `mobile/app.json`.

**Location permission denied**: The app falls back to a default State College location. All data will still load.

**Port 8000 already in use**: Another process is using the port. Find it with `lsof -i :8000` and stop it, or change the port in `serve_local.py`.

---

## Next Steps

See the full documentation in `docs/`:

- [SETUP.md](docs/SETUP.md) -- Detailed setup for all environments
- [API.md](docs/API.md) -- Complete API endpoint reference
- [DATA_MODELS.md](docs/DATA_MODELS.md) -- Database schema documentation
- [admin-guide.md](docs/admin-guide.md) -- Admin dashboard usage
