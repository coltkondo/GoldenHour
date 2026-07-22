# Golden Hour — Session Context
_Last updated: July 21, 2026. Covers the full July 17–21 build sprint._

This file exists so future Claude sessions can pick up with full context immediately. Read this before doing anything else.

---

## What this app is

Golden Hour is a community-driven happy hour discovery app. Users browse drink and food deals at local bars, submit new deals or corrections, and earn points redeemable for cash ($20 per 1,000 points, paid via Venmo manually by the team). The data is community-maintained — users submit, admins review and approve, approved submissions update the live map.

**Current markets:** Arlington, VA and State College, PA.
**TestFlight target:** ~10 friends (8 Arlington, 2 State College), cofounder returns ~July 28, deploy and TestFlight happens then.

---

## Stack

| Layer | Technology |
|---|---|
| Mobile | React Native + Expo |
| Backend API | FastAPI + SQLAlchemy |
| Database | PostgreSQL + Alembic migrations |
| Admin portal | React + Vite (`admin-web/`) |
| Hosting (planned) | Railway (backend + DB), Vercel (admin portal) |
| Privacy policy | GitHub Pages from `/docs` folder |

---

## Repo structure

```
GoldenHour/
├── backend/                  FastAPI app
│   ├── app/
│   │   ├── api/v1/          Route handlers
│   │   ├── models/          SQLAlchemy ORM models
│   │   ├── schemas/         Pydantic request/response schemas
│   │   ├── services/        Business logic (submission_review.py, geocoding, etc.)
│   │   └── core/            Config, security, DB connection, points_config
│   └── alembic/versions/    Migration files
├── mobile/src/              React Native app
│   ├── api/endpoints.ts     All API calls (authAPI, venuesAPI, dealsAPI, submissionsAPI)
│   ├── screens/             Main screens
│   ├── calendar/            Calendar feature (DayView, WeekView, CalendarContext)
│   ├── context/AuthContext  JWT auth, user state
│   └── config/constants.ts  API URL detection, points constants
├── admin-web/src/           React admin portal
│   ├── config.ts            VITE_API_URL env var (added this session)
│   └── services/adminApi    All admin API calls
├── data/
│   ├── arlington/           CSV source files for Arlington market
│   └── state_college/       CSV source files for State College market
└── docs/
    ├── TODO.md              Master backlog (25 open items)
    ├── APP_REVIEW_NOTES.md  Apple review notes with demo account credentials
    ├── privacy/index.html   Privacy policy page for GitHub Pages
    └── SESSION_CONTEXT.md   This file
```

---

## Key architectural decisions (with reasons)

**Multi-market:** `market_id` FK on both `users` and `venues`. Every meaningful query is market-scoped. Guest market stored in `AsyncStorage` key `gh_guest_market`. Logged-in market comes from `user.market_slug` on the JWT response. The `market_slug` param is passed to all venue/deal API calls.

**Account deletion = anonymize in place:** `DELETE /auth/me` scrubs email/username/password/location, sets `active=False`, keeps the row. Hard delete is impossible — `submissions.user_id` and `point_transactions.user_id` are FK references. Cascading would destroy community-submitted deal data.

**Corroboration = separate table, instant award:** `corroborations` table with `uq_corroboration_per_day` unique constraint. Points awarded immediately (2pts), no admin review queue. Routing through the submissions queue would flood it with low-value entries making real submissions invisible.

**Pessimistic lock on submission review:** `.with_for_update()` in `submission_review.py`. Two admins reviewing simultaneously without a lock would double-award points and create duplicate venue/deal records. Consequence of conflict is severe enough to justify blocking.

**In-memory rate limiter (slowapi):** Each Gunicorn worker has its own counter. Doesn't survive restarts. Doesn't work correctly with multiple workers. Acceptable for TestFlight, deferred to Redis at P3. See `infra/redis-rate-limiter` in TODO.

**Haversine in Python, not PostGIS:** All venues loaded from DB, distances computed in app layer. Simpler to ship, fine at current scale. PostGIS migration is in "explicitly not doing yet" list.

---

## Points system

| Action | Points |
|---|---|
| new_deal | 50 |
| new_bar | 100 |
| deal_expired | 50 |
| bar_closed | 100 |
| deal_update | 50 |
| bar_update | 50 |
| corroborate | 2 |

- Daily cap: 200pts (stored per-market in `markets.daily_points_cap`, not hardcoded)
- 1,000pts = $20 cash, paid via Venmo manually
- Payout flow not yet built in-app (P3)

---

## What was built this session (July 17–21)

### Bugs fixed
- **`app.json` hardcoded `10.0.2.2`** — Android emulator loopback blocked all physical-device API calls. Fixed by removing `extra.apiUrl`, letting `constants.ts` dynamic LAN IP detection take over.
- **Calendar `TimelineGrid` offset** — was hardcoded to `(h - 11)`. After expanding timeline to 00:00, needed `const HOUR_OFFSET = TIMELINE_START_MIN / 60`.
- **Calendar event heights** — `EventBlock` and `ClusterBlock` had no `flex: 1`, so they sized to content (~50px) instead of filling their computed wrapper height.
- **Calendar event widths** — single-pass column layout gave `columns: colsEnd.length` at placement time, so first item in a conflict zone got `columns: 1` (full width) even when later items required `columns: 3`. Fixed with two-pass normalization.
- **Admin portal hardcoded `/api/v1` relative URLs** — would route to Vercel domain in production, not Railway. Fixed with `admin-web/src/config.ts` exporting `API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/v1'`. Updated `adminApi.tsx`, `AuthContext.tsx`, `dashboard.tsx`, `Layout.tsx`.

### Features shipped
- **`feature/calendar`** — simplified filters (Venue + Day of Week only), 00:00–23:59 timeline at 72px/hr, pre-scrolled to 11am, market-filtered venues, cluster threshold raised to 9, two-pass column layout. Merged to main.
- **App Store gate — account deletion** — `DELETE /auth/me` backend endpoint + `authAPI.deleteAccount()` in mobile + Delete Account button with Alert confirmation in ProfileScreen.
- **App Store gate — privacy + support links** — "LEGAL & SUPPORT" section in ProfileScreen with Privacy Policy row (→ GitHub Pages URL) and Contact Support row (→ `mailto:gldnhr.app@gmail.com`).
- **Privacy policy page** — `docs/privacy/index.html`, branded HTML, self-contained, dark/light mode. Pushed to main. Goes live when GitHub Pages is enabled.
- **App Review Notes** — `docs/APP_REVIEW_NOTES.md` with demo account (`gldnhr.app@gmail.com`, password filled in), key flows to test, content moderation explanation, age rating note.
- **`feature/corroboration`** — `POST /submissions/corroborate/{deal_id}`, `corroborations` table, Alembic migration `h1i2j3k4l5m6`, self-corroboration guard, one-per-day DB constraint, instant 2pt award, mobile "Still accurate? +2 pts" chip on each deal card in `HappyHourScreen`.

### Data fixes
- Spider Kelly's (ARL011): DB had duplicate weekend schedule rows (16:00–17:00 and 16:00–19:00). Fixed via psql to single correct 12:00–17:00. Arlington CSV corrected to match.
- AD078 description: removed internal flag reference ("IDENTICAL menu to First Down Sports Bar (ARL006)"). Fixed in DB and CSV.

---

## Infrastructure status and plan

**Current:** Backend runs on localhost only. Mobile app uses dynamic LAN IP detection from Expo's `hostUri` — works on physical device when on same WiFi as dev machine.

**Blocked on:** Cofounder is in Cabo until ~July 28. He is the GitHub repo admin. Needs to:
1. Enable GitHub Pages (Settings → Pages → Source: main, /docs) → unlocks privacy policy URL
2. No other blockers specific to him — Railway and Vercel can be set up independently

**Railway setup sequence (do in this order):**
1. Create Railway project → add PostgreSQL service
2. Connect GitHub repo (`coltkondo/GoldenHour`, root: `backend/`, branch: `main`)
3. Set env vars: `SECRET_KEY`, `DEBUG=False`, `ALLOWED_ORIGINS` (add Vercel URL after step 5)
4. First deploy triggers → run `alembic upgrade head` in Railway shell
5. Run `python scripts/import_csv.py` for both markets
6. Deploy admin portal to Vercel (root: `admin-web/`, env: `VITE_API_URL=https://<railway-url>/api/v1`)
7. Add Vercel URL to Railway `ALLOWED_ORIGINS`
8. Set `EXPO_PUBLIC_API_URL=https://<railway-url>/api/v1` in EAS build secrets

**Why Railway over AWS:** $5/month vs. weeks of DevOps setup. AWS is right when you have a DevOps engineer or when Railway costs hurt. Migration path is easy (Docker containers are portable). Render free tier was rejected because of 30–60 second cold starts that make the app look broken.

**Why Vercel for admin portal:** Static React build (Vite), auto-deploys from GitHub, free tier is real and permanent, 10-minute setup. Admin portal needed `VITE_API_URL` env var — was previously using relative URLs that only worked via Vite dev proxy.

---

## Demo / reviewer account

- **Email:** `gldnhr.app@gmail.com`
- **Password:** in `docs/APP_REVIEW_NOTES.md` (not stored here)
- **Market:** Arlington, VA
- **Notes:** Standard user account with submission history. Created in-app. Exists in production DB.

---

## Key files to know

| File | What it does |
|---|---|
| `backend/app/core/points_config.py` | Single source of truth for point values |
| `backend/app/services/submission_review.py` | All submission approval logic, point award, daily cap, pessimistic lock |
| `backend/app/api/v1/submissions.py` | Submission create + corroborate endpoints |
| `backend/app/api/v1/auth.py` | Register, login, refresh, me, delete account |
| `backend/alembic/versions/` | All DB migrations — run `alembic upgrade head` on fresh DB |
| `mobile/src/api/endpoints.ts` | All API calls — single source of truth for mobile→backend |
| `mobile/src/context/AuthContext.tsx` | JWT storage, user state, logout |
| `mobile/src/calendar/CalendarContext.tsx` | Calendar state, market-scoped venue fetch, filter logic |
| `mobile/src/calendar/utils/dateGrid.ts` | Timeline constants (HOUR_HEIGHT, TIMELINE_START_MIN), two-pass column layout |
| `mobile/src/screens/HappyHourScreen.tsx` | Venue detail screen — deals, schedule, corroborate buttons |
| `mobile/src/screens/ProfileScreen.tsx` | Auth state, dark mode, legal/support links, delete account |
| `admin-web/src/config.ts` | `VITE_API_URL` env var for Vercel deploy |
| `data/arlington/` | Arlington CSVs (venues, deals, schedules) — source of truth for data |
| `docs/TODO.md` | Master backlog — always check this first |
| `docs/APP_REVIEW_NOTES.md` | Copy-paste into App Store Connect "Notes for App Review" |
| `docs/privacy/index.html` | Privacy policy — goes live at `coltkondo.github.io/GoldenHour/privacy/` once Pages enabled |

---

## Pending P1 items (next things to build)

1. `feature/duplicate-handling` — flag likely duplicates in admin review queue
2. `feature/admin-analytics` — submission volume, signups, top submitters dashboard (urgent: corroboration is now live and farmable with no visibility)
3. `chore/admin-panel-user-wiring` — backend for user management (`admin/users.py`) is done, needs UI in admin portal
4. `feature/guest-city-change` — tappable city chip on HomeScreen for guests to change market without reinstalling

---

## System design context (from interview prep discussion)

These topics were discussed in depth using this codebase as the example:

- **Sharding:** `market_id` is the natural shard key. All queries already scoped to market. Pre-sharded by design.
- **Replication:** Read-heavy app (GET /deals, GET /venues, leaderboard). Redis cache on leaderboard is the first replication-adjacent optimization. Railway hobby has no read replicas.
- **Latency:** `10.0.2.2` bug = infinite latency. Render cold start = 30-60s latency cliff. Connection pool (`pool_size=10`) reduces per-request latency. PostGIS deferred but would reduce venue query latency at scale.
- **CAP Theorem:** Postgres is CP. Daily points cap calculation must be consistent — two concurrent approvals could both read `earned_today=0` and both award points without the `with_for_update()` lock. Leaderboard is an AP candidate (staleness fine, Redis cache appropriate).
- **Pessimistic locking:** `with_for_update()` in `submission_review.py` — two admins can't double-approve. Chosen over optimistic because conflict consequence (double points, duplicate records) is severe.
- **Optimistic locking:** `corroborations` unique constraint is a form — try insert, handle unique violation. Would also apply to venue/deal editing if multi-admin concurrent edits become a problem.

Key tradeoff pattern across the whole codebase: trading correctness/performance at scale for simplicity and speed of shipping now, with explicit plans (in TODO) to close gaps before scale arrives.
