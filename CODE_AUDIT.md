# Code Audit Findings — Golden Hour

> Audit date: 2026-04-07 (consolidated from 2026-03-29 and 2026-04-02 audits)  
> Auditors: Claude Code (claude-sonnet-4-6)  
> Scope: Full codebase — backend (FastAPI/Python), mobile (React Native/Expo), admin-web (React/Vite)  
> Target: Release readiness for 10–15 users

---

## Priority Legend

| Priority | Meaning |
|----------|---------|
| **P0** | Ship blocker — crashes, broken core features, failed deploys |
| **P1** | Pre-launch — security holes, features users notice broken in session 1 |
| **P2** | Sprint 2 — degraded UX but not catastrophic at this scale |
| **P3** | Backlog — code quality, scalability concerns that don't affect 15 users |
| ~~RESOLVED~~ | Already fixed — kept for traceability |

---

## Issue Tally

| Priority | Count |
|----------|-------|
| P0 | 8 |
| P1 | 11 |
| P2 | 13 |
| P3 | 18 |
| Resolved | 19 |
| **Total** | **69** |

---

## ~~RESOLVED~~ — Already Fixed

1. ~~**Naive `datetime()` — no UTC** (`deals.py:47,98`) — `datetime.now()` used without timezone; breaks happy hour filtering across timezones~~ **RESOLVED** in commit `fbbd212` — replaced with `_now_eastern()` using `ZoneInfo(settings.APP_TIMEZONE)`; 9 tests in `tests/test_issue1_deals_timezone.py`

2. ~~**Race condition on points balance** (`submission_review.py:99-119`) — non-atomic increment; concurrent approvals can silently lose points~~ **RESOLVED** in commit `fbbd212` — replaced ORM read-modify-write with atomic SQL `UPDATE users SET points_balance = points_balance + :x`; 7 tests in `tests/test_issue2_points_atomic.py`

3. ~~**Missing security headers** (`main.py`) — no HSTS, X-Frame-Options, Content-Security-Policy, or HTTPS redirect middleware~~ **RESOLVED** in commit `6b308a4` — added `add_security_headers` middleware to `main.py` injecting X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy, and Permissions-Policy on every response; 12 tests in `tests/test_issue4_security_headers.py`

4. ~~**Weak password validation** (`user.py:13-22`) — only checks for 1 uppercase/lowercase/digit; `Qwerty1` passes~~ **RESOLVED** in commit `1d153fb` — added special character requirement and `max_length=128` (bcrypt DoS protection); 13 tests in `tests/test_issue5_password_validation.py`

5. ~~**Email case sensitivity** — `User@Example.com` and `user@example.com` treated as distinct accounts; allows duplicate registration~~ **RESOLVED** in commit `1d153fb` — added `.lower()` normalizer to `UserCreate` and `UserLogin`; `func.lower()` used in all DB email queries; 12 tests in `tests/test_issue6_email_normalization.py`

6. ~~**JSONB submission data not value-validated** (`submission_review.py`) — lat/lon ranges not checked; malformed values applied directly to models~~ **RESOLVED** in commit `6b308a4` — created `app/schemas/submission_data.py` with `VenueData`/`DealData` Pydantic models (`extra="ignore"`, Field constraints on lat/lon/price/rating); `_apply_submission()` now validates all data through these schemas before any DB write, raising HTTP 422 on invalid values; 17 tests in `tests/test_issue7_submission_data_validation.py`

7. ~~**CORS too permissive** (`main.py:76-82`) — `allow_methods=["*"]` allows TRACE method; `allow_headers=["*"]` undermines CSRF protection~~ **RESOLVED** in commit `1a8e640` — replaced wildcards with explicit `allow_methods` (GET/POST/PUT/PATCH/DELETE/OPTIONS) and `allow_headers` (Authorization/Content-Type/Accept/Origin); 11 tests in `tests/test_issue10_cors.py`

8. ~~**Non-deterministic leaderboard ranking** — ties in `points_balance` sort in undefined order~~ **RESOLVED** in commit `1a8e640` — added `User.username.asc()` as secondary sort key; 4 tests in `tests/test_issue15_leaderboard_ranking.py`

9. ~~**`db.rollback()` missing in submission_review except block** (`submission_review.py:73-79`) — SQLAlchemy session left in dirty state after exception; subsequent requests encounter phantom mutations~~ **RESOLVED** in commit `724ef1d` — `db.rollback()` now called at `submission_review.py:118` before re-raise

10. ~~**`Base.metadata.create_all` ran on every startup** (`main.py`) — created tables outside Alembic's knowledge; schema drift caused "column already exists" errors on deploy~~ **RESOLVED** in commit `724ef1d` — removed from `main.py`; Alembic is now the sole schema authority

11. ~~**Deactivated user could still authenticate** (`security.py:18-21`) — `get_current_user` never checked `user.active`; banned users retained full API access~~ **RESOLVED** in commit `134d28d` — `if not user.active: raise 403` at `security.py:68`

12. ~~**`sys.stdout` globally replaced with custom `InterceptHandler`** (`logging.py:86-107`) — only implemented `write`/`flush`; broke third-party libraries and subprocess stdout capture~~ **RESOLVED** in commit `6a0b945` — logging now uses `logger.add(sys.stdout, ...)` as a loguru sink; original `sys.stdout` is untouched

13. ~~**JSON log format built via string concatenation** (`logging.py:73-81`) — `.replace('"', '\\"')` produced invalid JSON on messages with newlines/backslashes; log aggregators failed to parse~~ **RESOLVED** in commit `6a0b945` — JSON output now uses loguru's `serialize=True` which calls `json.dumps()` internally

14. ~~**Duplicate submission review endpoint** (`v1/submissions.py` and `admin/submissions.py`) — same logic at two routes; bug fixes had to be applied twice~~ **RESOLVED** in commit `6ba7248` — review route removed from `v1/submissions.py`; only `admin/submissions.py` exposes it

15. ~~**`POST /points/redeem` returned 501** (`v1/points.py`) — placeholder endpoint exposed in production API~~ **RESOLVED** in commit `6ba7248` — endpoint removed entirely

16. ~~**`bounding_box` division-by-zero near poles** (`services/search.py:6-12`) — `cos(lat_rad)` approaches 0 near poles; no guard caused `ZeroDivisionError`~~ **RESOLVED** in commit `6a0b945` — `if abs(cos_lat) < 1e-10:` guard returns full longitude range at poles; `search.py:21-24`

17. ~~**`backref` vs `back_populates` mixed** (`models/deal.py:37`) — one model used `backref`; all others used `back_populates`; inconsistent pattern with subtle behavioral differences~~ **RESOLVED** in commit `6a0b945` — `deal.py` now uses `back_populates="deals"` consistently

18. ~~**Search bar non-functional** (`mobile/src/screens/HomeScreen.tsx:333-353`) — `searchQuery` state was set but never used to filter results~~ **RESOLVED** — filtering logic extracted to `mobile/src/utils/homeFilters.ts`; `filteredDeals` and `nearbyVenues` both pass through `filterDealsBySearch` / `filterVenuesBySearch`; 43 tests in `mobile/src/__tests__/homeFilters.test.ts`

19. ~~**Filter button non-functional** (`mobile/src/screens/HomeScreen.tsx:350-352`) — `onPress` did nothing~~ **RESOLVED** — filter button now toggles a sort panel with "Nearest" and "Best Deal" modes; `sortVenuesByMode` applied to `nearbyVenues` pipeline; covered by tests in `mobile/src/__tests__/homeFilters.test.ts`

---

## P0 — Ship Blockers

*Must fix before any user touches the app.*

### Mobile

**P0-1. Wrong day-of-week mapping** (`mobile/src/screens/ExplorerScreen.tsx:32-34`)  
JS `getDay()` returns Sunday=0; backend uses Monday=0. Happy hour schedules display the wrong day to every user.

**P0-2. `JSON.parse(storedUser)` not in try-catch** (`mobile/src/context/AuthContext.tsx:40-52`)  
Corrupted AsyncStorage crashes auth initialization, soft-bricking the app. Any user with storage corruption cannot open the app.

**P0-3. `route.params.venue` accessed without null guard** (`mobile/src/screens/HappyHourScreen.tsx:59`)  
App hard-crashes if navigation params are missing. Any deep-link or back-navigation race condition triggers this.

**P0-4. `deal.items` accessed without null guard** (`mobile/src/screens/HomeScreen.tsx:409`, `DealCard.tsx:131`)  
`items` is nullable per API types. Accessing it without a guard throws a runtime error.

**P0-5. Google Maps API key is a placeholder** (`mobile/app.json:18,28-30`)  
`"YOUR_GOOGLE_MAPS_API_KEY"` still in config. The map screen will not render for any user.

**P0-6. `ThemeContext` returns `null` while loading** (`mobile/src/context/ThemeContext.tsx:68-70`)  
Causes a blank white screen on every cold start until theme resolves.

### Backend / Infrastructure

**P0-7. Health endpoint always returns healthy** (`backend/app/main.py:162`)  
`GET /health` returns `{"status": "healthy"}` without checking DB or Redis connectivity. Railway/Render routes traffic to a completely broken backend; a failed DB connection is invisible to the orchestrator.

**P0-8. Dockerfile: runs as root, no `.dockerignore`, no `HEALTHCHECK`** (`backend/Dockerfile`)  
Three separate issues:
- No non-root `USER` directive — container escape grants root host access
- `COPY . .` without `.dockerignore` can bake `.env` files with real secrets into image layers
- No `HEALTHCHECK` instruction — orchestrators cannot detect a crashed-but-running container

---

## P1 — Pre-Launch

*Security holes and features users will notice broken within the first session.*

### Security

**P1-1. No rate limiting on any endpoint** (`backend/app/api/`)  
Zero rate limiting, including on `/auth/login` and `/auth/register`. Open to brute-force, credential stuffing, and scraping. Minimum fix: 5 attempts/minute on auth endpoints via `slowapi`.

**P1-2. JWT stored in `localStorage` in admin-web** (`admin-web/src/context/AuthContext.tsx:25`)  
Any XSS payload on the admin domain reads `localStorage` and steals the token, gaining full admin access (approve submissions, delete venues, export all data). Should use httpOnly cookies.

**P1-3. `console.log` logs full JWT in mobile production builds** (`mobile/src/api/client.ts:24`)  
`console.log('API Request:', config)` fires on every API request and logs the full `Authorization: Bearer <token>` header. Exposes user sessions in crash logs, Expo diagnostics, and any console capture tool.

**P1-4. `docker-compose.yml` exposes database with default credentials** (`docker-compose.yml:5-10,19-28`)  
PostgreSQL port 5432 bound to host with `postgres:postgres`. Redis port 6379 bound to host with no password. On any shared or cloud machine this is full DB compromise and Redis RCE via `CONFIG SET`.

**P1-5. `DEBUG=True` is the default** (`backend/app/core/config.py:32`, `backend/app/core/database.py:9`)  
If `DEBUG` env var is not explicitly set in production, SQLAlchemy `echo=True` dumps every SQL statement (including password hash queries) to stdout. Set default to `False`.

### Mobile — Broken Features Users Notice in Session 1

**P1-6. No error boundary** (entire mobile app)  
A single component crash brings down the entire app with no recovery path. Users must force-quit and reopen. Add a top-level error boundary with a "Something went wrong — tap to retry" screen.

**P1-7. Bookmarks not persisted** (`mobile/src/screens/HomeScreen.tsx`)  
`toggleSave()` only updates local React state. Saved venues are lost on every app restart. Users who save venues will find them gone immediately.

**P1-8. Notification toggle is purely cosmetic** (`mobile/src/screens/ProfileScreen.tsx:154-159`)  
Switch does not register for push notifications. Users who toggle it on receive no notifications; users who toggle it off expect it worked.

**P1-9. Points balance not refreshed after submission** (`mobile/src/screens/`)  
User sees "+50 pts" toast but the profile total doesn't update until manual refresh. Breaks the core engagement loop.

### Admin Web — Broken Flows

**P1-10. No 401 → logout handling in admin-web** (`admin-web/src/services/adminApi.tsx:10-20`, `admin-web/src/context/AuthContext.tsx:24-29`)  
Expired/revoked tokens produce repeated error dialogs instead of redirecting to login. Token is never re-validated on page load — stale tokens persist until a request fails.

**P1-11. Silent API failures in admin-web forms** (`admin-web/src/pages/Deals/DealForm.tsx:40-45`, `VenueForm.tsx:44-65`, `DealList.tsx:45-57`)  
Dropdown data for categories, deal types, and venues loads via `.catch(() => {})` with no error state. Admins see empty dropdowns with no indication of why. Dashboard stats fail silently and show `0` for all counts.

---

## P2 — Sprint 2

*Noticeable degradation but not catastrophic at 10–15 users.*

**P2-1. No request body size limit** (`backend/app/api/`)  
`submitted_data` JSONB accepts arbitrarily large payloads. No global body size limit middleware. DoS vector even with 15 users if abused.

**P2-2. Soft delete has no audit trail** (`backend/app/models/`)  
`active=False` flip has no `deleted_at` timestamp or `deleted_by` FK. Impossible to audit who deactivated a venue/deal or when.

**P2-3. N+1 queries in admin venue list** (`backend/app/api/admin/venues.py:66-71`)  
Two separate `COUNT` queries per venue for `deals_count` and `active_deals_count`. 50 venues = 101 queries. Replace with subquery aggregation in one pass.

**P2-4. Redis declared dependency but `cache.py` is empty** (`backend/app/core/cache.py`)  
Redis is running as a service dependency but the cache module has zero implementation. Every read-heavy endpoint (`/venues`, `/deals/active`, `/leaderboard`) hits the DB on every request.

**P2-5. `request_id` uses `id(request)` — not unique** (`backend/app/main.py:106`)  
Python's `id()` returns a memory address. Not unique across requests, not unique across processes. Replace with `str(uuid.uuid4())`. Also returned as `trace_id` in error responses — unsearchable in logs.

**P2-6. Error states set but no retry offered** (`mobile/src/screens/MapScreen.tsx`, `LeaderboardScreen.tsx`)  
Error banners are shown but there is no retry button. Users are permanently stuck on the error state until they restart the app.

**P2-7. Hardcoded happy hour start time** (`mobile/src/screens/HomeScreen.tsx:541-546`)  
`Math.max(hour + 1, 17)` ignores actual schedule times from the API. Incorrect "next happy hour" display for venues with non-5pm schedules.

**P2-8. Hardcoded `localhost:8000` in Vite config** (`admin-web/vite.config.ts:8-12`)  
Admin web cannot be deployed anywhere other than a local machine without a code change. No `VITE_API_BASE_URL` environment variable.

**P2-9. No network retry or offline detection in mobile** (all API screens)  
Single request timeout = permanent failure. No exponential backoff, no "you are offline" message, no cached data fallback.

**P2-10. `pool_recycle=1800` may exceed DB idle timeout** (`backend/app/core/database.py:13`)  
If Postgres closes idle connections at 10 min (common on Railway/PgBouncer), recycling at 30 min is too late. Requests encounter dead-connection errors.

**P2-11. Missing DB indexes on high-traffic queries** (`backend/app/models/`)  
`Submission.status`, `Submission.user_id`, and `PointTransaction.submission_id` lack explicit indexes. Admin submissions list will full-table-scan even at modest data volumes.

**P2-12. `SECRET_KEY` placeholder not rejected at startup** (`backend/app/core/config.py:13`)  
`.env.example` ships `SECRET_KEY=dev-secret-key-change-in-production`. No runtime check rejects known placeholder values. JWT tokens are trivially forgeable if deployed with the default.

**P2-13. `token_preview` logs first 10 chars of JWT** (`backend/app/core/security.py:28`)  
Even partial JWT material in logs aids token reconstruction. Log the token type or user ID instead.

---

## P3 — Backlog

*Code quality and scalability concerns. None of these affect 15 users.*

**P3-1. Redundant/empty Alembic migrations** (`backend/alembic/versions/`)  
`11cfbfc180c0`, `86849ca32f7b` are no-ops; `4da5183dc371` duplicates earlier work. Hard to trace the upgrade path. Squash when convenient.

**P3-2. 7 empty stub files in backend** (`moderation.py`, `geocoding.py`, `validation.py`, `happy_hours.py`, `public.py`, `admin/users.py`, `admin/analytics.py`)  
Comment-only stubs. Crash or return nothing if routes are accidentally registered. Delete or implement.

**P3-3. ExplorerScreen uses non-virtualized `ScrollView`** (`mobile/src/screens/ExplorerScreen.tsx`)  
Renders all venues simultaneously. Fine for 10–20 venues; degrades with more. Replace with `FlatList` eventually.

**P3-4. `calculateDistance` and `formatTime` duplicated across 3+ files** (mobile)  
`HomeScreen.tsx`, `MapScreen.tsx`, `VenueCard.tsx`. Calculations can silently diverge. Extract to `src/utils/`.

**P3-5. `deal_ids` ARRAY lacks FK constraint** (`backend/app/models/happy_hour.py:19`)  
`ARRAY(UUID)` references `deals.id` with no FK constraint. Deleting a deal leaves stale UUIDs — silent data corruption.

**P3-6. No `CHECK` constraints on schedule times/days** (`backend/app/models/happy_hour.py:12-14`)  
`end_time > start_time` and `day_of_week BETWEEN 0 AND 6` not enforced at DB level. Inverted schedules produce wrong "active now" results.

**P3-7. `datetime.utcnow` deprecated** (`backend/app/models/base.py:8-9`)  
Deprecated since Python 3.12. `onupdate=datetime.utcnow` does not fire on raw SQL; naive datetime breaks timezone-aware operations.

**P3-8. `bcrypt` not declared as a direct dependency** (`backend/requirements.txt`)  
`security.py` imports `bcrypt` directly but it is only a transitive dependency of `passlib`. If `passlib` is removed, the import breaks without warning.

**P3-9. `ThemedTabBar` not memoized** (`mobile/src/navigation/TabNavigator.tsx`)  
Re-renders on every 60-second theme tick. May cause visible tab bar flicker.

**P3-10. 8 looping animations in `FeaturedCardBackground`** (`mobile/src/screens/HomeScreen.tsx:66-117`)  
All run simultaneously on the main thread. May cause frame drops on older devices.

**P3-11. `noUnusedLocals: false`, `noUnusedParameters: false`** (`tsconfig.json` in both `mobile/` and `admin-web/`)  
Partially defeats strict TypeScript mode. Dead code accumulates without compiler warnings.

**P3-12. `console.log` in `endpoints.ts` not wrapped in `__DEV__`** (`mobile/src/api/endpoints.ts:8`)  
`console.log('Fetched venues:', response)` always fires in production. Wrap in `if (__DEV__)`.

**P3-13. Version string hardcoded in `LoadingScreen`** (`mobile/src/screens/LoadingScreen.tsx:126`)  
`v1.0.0` not tied to `package.json`. Will drift immediately.

**P3-14. No accessibility labels** on interactive elements throughout mobile  
No `accessibilityLabel` on buttons, toggles, or map markers. Fails basic screen reader support.

**P3-15. `pool_size` not configured** (`backend/app/core/database.py`)  
Defaults to `pool_size=5, max_overflow=10`. Fine for 15 users but worth setting explicitly before scaling.

**P3-16. Website/URL fields have no format validation** (backend schema + `admin-web/src/pages/Venues/VenueForm.tsx:122`)  
Accepts any string. XSS risk if URL is rendered without escaping; also allows nonsensical values.

**P3-17. `ARRAY(String)` tags column unbounded** (`backend/app/models/venue.py`)  
No per-tag length limit or max array size. Trivially abusable via the submission form.

**P3-18. No CI/CD configured** (`.github/` directory missing entirely)  
No automated linting, type-checking, or tests on push/PR. Breaking changes can be merged with zero gates.

---

## Summary

| Priority | Area | Issues |
|----------|------|--------|
| P0 | Mobile | 6 (P0-1 through P0-6) |
| P0 | Backend/Infra | 2 (P0-7 through P0-8) |
| P1 | Security | 5 (P1-1 through P1-5) |
| P1 | Mobile | 4 (P1-6 through P1-9) |
| P1 | Admin Web | 2 (P1-10 through P1-11) |
| P2 | Various | 13 (P2-1 through P2-13) |
| P3 | Various | 18 (P3-1 through P3-18) |
| Resolved | — | 17 |
| **Total** | | **69** |
