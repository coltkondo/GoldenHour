# GLDNHR Code Audit Report

**Auditor:** Senior Software Engineer  
**Date:** 2026-03-29  
**Scope:** Backend (Python/FastAPI), Mobile (React Native/TypeScript), Admin Web (React/Vite/TypeScript), Docker/Infra  
**Methodology:** Manual code review of all source files, configuration, and deployment artifacts  

---

## Issue Tally (Running)

| Severity | Count |
|----------|-------|
| Critical | 9 |
| High | 13 |
| Medium | 11 |
| Low | 7 |
| **Total** | **40** |

---

## 1. Security

### SEC-01 
[SEVERITY: Critical]  
File / Area: `backend/app/api/admin/venues.py`, `backend/app/api/admin/deals.py`, `backend/app/api/admin/export.py`  
Issue: All admin endpoints under `/admin/venues`, `/admin/deals`, and `/admin/export` have **zero authentication or authorization**. No `get_current_user` or `require_admin` dependency is applied to any route. Anyone who discovers the URL prefix can create, update, soft-delete venues and deals, and download full CSV exports of the database.  
Why it matters: Complete data compromise. An attacker can read, modify, or delete all venue and deal data without any credentials.

### SEC-02
[SEVERITY: Critical]  
File / Area: `backend/app/api/v1/venues.py:118`, `backend/app/api/v1/deals.py:148`  
Issue: `POST /venues/` and `POST /deals/` are public endpoints with no authentication. Anyone can create arbitrary venues and deals directly, bypassing the submission/review workflow entirely.  
Why it matters: The entire points and review system is circumvented. Spam, poisoning, or malicious data can be injected at will.

### SEC-03
[SEVERITY: Critical]  
File / Area: `backend/app/main.py:59-63`  
Issue: CORS middleware is configured with `allow_origins=["*"]` AND `allow_credentials=True`. This allows any website to make authenticated cross-origin requests to the API. The `TODO: Restrict in production` comment is present but the code is deployable as-is.  
Why it matters: Cross-site request forgery. Any malicious webpage can perform admin actions using the victim's stored JWT.

### SEC-04
[SEVERITY: High]  
File / Area: `backend/app/services/submission_review.py:87,96-98`  
Issue: `_apply_submission` trusts `submitted_data` (unvalidated JSONB) blindly. For `new_bar` and `new_deal` types, it does `Venue(**{k: v for k, v in data.items() if hasattr(Venue, k)})`. For `bar_update` and `deal_update`, it calls `setattr(venue, k, v)` for any key matching the model. A user-submitted payload could inject fields like `verified=True`, bypassing admin review for that attribute.  
Why it matters: Privilege escalation through crafted submission data. A user can mark their own data as verified or set arbitrary model fields.

### SEC-05
[SEVERITY: High]  
File / Area: `backend/app/core/security.py:18-21`  
Issue: `get_current_user` queries for the user but does not check `user.active`. A soft-deleted (deactivated) user can still authenticate and use the API.  
Why it matters: Banned users retain full access. The soft-delete mechanism is ineffective for user management.

### SEC-06
[SEVERITY: High]  
File / Area: `mobile/src/api/client.ts:24`  
Issue: `console.log('API Request:', config)` logs every API request including the full config object, which contains the `Authorization: Bearer <token>` header. This runs in both development and production builds.  
Why it matters: JWT tokens leak into crash logs, Expo diagnostic output, and any tool that captures console output. In production, this exposes user sessions.

### SEC-07
[SEVERITY: Medium]  
File / Area: `backend/app/core/security.py:28`  
Issue: `token_preview=token[:10] + "..."` logs the first 10 characters of JWT tokens. JWTs have a predictable structure (`eyJ...` header + payload). Even partial tokens aid token-reconstruction attacks.  
Why it matters: Information leakage in logs. Enough token material to narrow brute-force search space significantly.

### SEC-08
[SEVERITY: Medium]  
File / Area: `backend/app/core/config.py:13`  
Issue: `SECRET_KEY` has no minimum-length or complexity validation. The `.env.example` ships with `SECRET_KEY=dev-secret-key-change-in-production`. There is no runtime check to reject known placeholder values.  
Why it matters: If deployed with the default secret, JWT tokens are trivially forgeable by anyone who reads the open-source code.

### TODO: SEC-09
[SEVERITY: Medium]  
File / Area: `docker-compose.yml:22,27`  
Issue: PostgreSQL (port 5432) and Redis (port 6379) are exposed to the host network with default credentials (`postgres`/`postgres`) and no Redis password.  
Why it matters: On any shared or cloud-hosted machine, the database is fully accessible. Redis without auth allows arbitrary command execution including `CONFIG SET`, which can lead to RCE.

### SEC-10
[SEVERITY: Low]  
File / Area: `mobile/src/screens/auth/SignupScreen.tsx`  
Issue: No client-side password complexity validation beyond minimum length 6. No email format validation (relies solely on backend).  
Why it matters: Poor UX leading to weak account security. Backend also only enforces `min_length=6` in `schemas/user.py:11`.

---

## 2. Error Handling

### TODO: ERR-01
[SEVERITY: Critical]  
File / Area: `backend/app/main.py:43-52`  
Issue: The global exception handler returns a plain Python `dict` instead of a `JSONResponse` with status code 500. FastAPI may auto-convert it, but the response will not have the correct HTTP status code (should be 500, may default to 200).  
Why it matters: Unhandled server errors appear as successful responses to clients and monitoring systems. Error tracking and alerting will miss failures.

### TODO: ERR-02
[SEVERITY: High]  
File / Area: `backend/app/services/submission_review.py:73-79`  
Issue: The `except` block logs the error but **does not call `db.rollback()`** before re-raising. SQLAlchemy's session may be left in an inconsistent state with partial mutations applied.  
Why it matters: Subsequent requests on the same session or connection can encounter dirty state, phantom data, or constraint violations from the aborted transaction.

### TODO: ERR-03
[SEVERITY: High]  
File / Area: `mobile/src/screens/ExplorerScreen.tsx:68`, `mobile/src/screens/HappyHourScreen.tsx:64`  
Issue: Empty `catch` blocks with no error feedback to the user. The UI silently shows stale or empty data.  
Why it matters: Users cannot distinguish between "no results" and "server error." Silent failures erode trust and make debugging impossible.

### TODO: ERR-04
[SEVERITY: Medium]  
File / Area: `mobile/src/components/FlagReportModal.tsx:82-83`  
Issue: `catch` block contains only a comment "silently fail" with no user notification or logging.  
Why it matters: Submission failures go completely unnoticed. Users believe their report was submitted when it was not.

### TODO: ERR-05
[SEVERITY: Medium]  
File / Area: `mobile/src/screens/LeaderboardScreen.tsx:28-31`  
Issue: Uses `.then()` chain with no `.catch()`. If the API call rejects, an unhandled promise rejection occurs.  
Why it matters: React Native will show a red-screen error in dev; in production, the error is swallowed and the screen may be stuck in a loading state.

### TODO:  cERR-06
[SEVERITY: Medium]  
File / Area: `backend/docker-entrypoint.sh:19-22`  
Issue: After exhausting all migration retries, the script prints a warning but continues to start the application with `exec "$@"`. The app runs with a potentially broken or missing schema.  
Why it matters: Runtime errors will be confusing and non-obvious. The app appears to start healthy but fails on database operations, making incidents harder to diagnose.

---

## 3. Data Integrity

### DATA-01
[SEVERITY: Critical]  
File / Area: `backend/app/services/submission_review.py:29-36`  
Issue: TOCTOU (time-of-check-time-of-use) race condition. The submission status check (`if sub.status != "pending"`) is a non-atomic read. Two concurrent admin requests can both read `status="pending"`, both proceed to approve, resulting in **double points awarded** and **double entity creation** (duplicate venues or deals).  
Why it matters: Financial integrity failure. Users receive double points. Duplicate data pollutes the database. This is exploitable even unintentionally under normal admin load.

### DATA-02
[SEVERITY: Critical]  
File / Area: `backend/app/services/submission_review.py:55`  
Issue: `submitter.points_balance += points` is a read-modify-write without row-level locking (`SELECT ... FOR UPDATE`). Two concurrent approvals for the same user can cause a lost update — one increment overwrites the other.  
Why it matters: Points balance drifts from the sum of transactions. Users lose earned points. Financial data becomes inconsistent.

### DATA-03
[SEVERITY: High]  
File / Area: `backend/app/models/user.py:16`  
Issue: `points_balance` has no `CHECK(points_balance >= 0)` constraint at the database level. Bugs or race conditions could produce negative balances.  
Why it matters: Negative balances break the business logic (redemption, leaderboard). Without DB-level enforcement, the application must be perfect at all times.

### DATA-04
[SEVERITY: High]  
File / Area: `backend/app/models/happy_hour.py:19`  
Issue: `deal_ids` is a PostgreSQL `ARRAY(UUID)` that references `deals.id` without a foreign key constraint. Deleting a deal leaves stale UUIDs in this array with no referential integrity enforcement.  
Why it matters: Schedule rows point to nonexistent deals. API responses will include deal IDs that resolve to 404. Data becomes silently corrupted over time.

### DATA-05
[SEVERITY: High]  
File / Area: `backend/app/models/happy_hour.py:12-14`  
Issue: No `CHECK` constraint ensuring `end_time > start_time` or that `day_of_week` is between 0 and 6. Inverted or nonsensical schedules can be inserted at the database level.  
Why it matters: Malformed schedules produce incorrect "active now" deal queries. The `get_todays_deals` and `get_nearby_deals` endpoints will return wrong results.

### DATA-06
[SEVERITY: Medium]  
File / Area: `backend/app/schemas/venue.py:27-31`  
Issue: `VenueUpdate` schema strips `ge`/`le` constraints from `latitude` and `longitude` fields (they are plain `Optional[float]` with no bounds). Updates can set `latitude=999` without Pydantic catching it.  
Why it matters: Invalid coordinates break geospatial queries. The bounding box filter and haversine calculations produce nonsensical results for out-of-range values.

### DATA-07
[SEVERITY: Medium]  
File / Area: `backend/app/schemas/deal.py:20-27`  
Issue: `DealUpdate` schema strips `ge=0` constraints from `original_price` and `deal_price`. Updates can set negative prices. Also, no cross-field validation ensures `deal_price <= original_price`.  
Why it matters: Nonsensical deal data is displayed to users (e.g., negative prices, deal price higher than original).

### DATA-08
[SEVERITY: Low]  
File / Area: `backend/app/models/base.py:8-9`  
Issue: `datetime.utcnow` is deprecated since Python 3.12. `onupdate=datetime.utcnow` only works at the ORM level — raw SQL updates do not refresh `updated_at`. `DateTime` columns are naive (no timezone).  
Why it matters: Time-related bugs in multi-timezone contexts. `updated_at` silently stays stale for raw SQL operations.

---

## 4. Performance

### PERF-01
[SEVERITY: High]  
File / Area: `backend/app/api/admin/venues.py:66-71`  
Issue: N+1 query pattern in the venue list endpoint. For each venue returned, two additional `COUNT` queries are executed to get `deals_count` and `active_deals_count`. With 200 venues, this is 401 queries (1 + 200 * 2).  
Why it matters: Response times scale linearly with data size. At moderate venue counts, this endpoint will dominate database load and take seconds to respond.

### PERF-02
[SEVERITY: High]  
File / Area: `backend/app/api/v1/venues.py:66` (`haversine_distance`)  
Issue: The `nearby` endpoint fetches all candidates from the bounding box into Python memory, then computes haversine distance for each one in a Python loop. No `ST_DWithin` or PostGIS spatial index is used.  
Why it matters: As venue count grows, this becomes an O(n) Python loop over every candidate. PostGIS spatial indexes would reduce this to an O(log n) index scan. At ~1000+ venues, response times will degrade noticeably.

### PERF-03
[SEVERITY: Medium]  
File / Area: `backend/app/core/database.py:6-9`  
Issue: No connection pool size configuration. SQLAlchemy defaults to `pool_size=5, max_overflow=10`. Under concurrent load (multiple mobile users, admin dashboard), the pool will exhaust quickly.  
Why it matters: Connection pool exhaustion causes request timeouts. Users see 503 errors during normal traffic spikes.

### PERF-04
[SEVERITY: Medium]  
File / Area: `backend/app/core/logging.py:86-107`  
Issue: `sys.stdout` is replaced with a custom `InterceptHandler` that calls `logger.info(message.strip())` for every `print()` statement and library stdout write. This adds loguru overhead to all stdout I/O.  
Why it matters: Performance degradation for any library that writes to stdout (e.g., subprocess output, health checks, third-party dependencies). Also breaks any code that depends on `print()` behavior.

### PERF-05
[SEVERITY: Low]  
File / Area: `backend/app/api/v1/deals.py:48-62` (`get_todays_deals`)  
Issue: Fetches all schedule rows for today, iterates in Python to flatten `deal_ids` arrays, then does a second query with `IN (...)`. Two round trips where one could suffice with a subquery or join.  
Why it matters: Minor overhead at current scale, but the pattern does not scale if schedule/deal count grows.

---

## 5. Scalability

### SCALE-01
[SEVERITY: High]  
File / Area: `backend/app/core/cache.py`  
Issue: Redis is installed and the service is running, but the cache module is completely empty. No caching is implemented for any endpoint. Every request hits the database.  
Why it matters: Under load, the database becomes the bottleneck. Read-heavy endpoints like `/venues`, `/deals/active`, and `/leaderboard` would benefit enormously from even simple TTL caching.

### SCALE-02
[SEVERITY: High]  
File / Area: `backend/app/main.py:72-87` (middleware)  
Issue: No rate limiting on any endpoint. Login, registration, and all API endpoints are unthrottled.  
Why it matters: Brute-force attacks on `/auth/login` are trivial. DDoS on any endpoint can exhaust database connections or CPU. No protection against credential stuffing.

### SCALE-03
[SEVERITY: Medium]  
File / Area: `backend/app/main.py:43`  
Issue: `trace_id` uses `str(id(exc))` which is Python's memory address. `request_id` uses `str(id(request))` which is similarly meaningless for tracing. These IDs are not unique across requests and cannot be correlated with any external system.  
Why it matters: Impossible to correlate logs with specific requests in production. Debugging incidents requires manual timestamp correlation.

### SCALE-04
[SEVERITY: Medium]  
File / Area: `backend/app/api/v1/leaderboard.py`  
Issue: The leaderboard query scans all users with `points_balance > 0` and performs an outer join with a subquery of approved submissions. No pagination beyond `limit`, and no caching.  
Why it matters: As the user base grows, this query becomes increasingly expensive. A public-facing endpoint that scans the entire user table on every request is a scalability risk.

---

## 6. API Design

### API-01
[SEVERITY: High]  
File / Area: `backend/app/api/admin/submissions.py`, `backend/app/api/v1/submissions.py`  
Issue: Duplicate submission review endpoints exist at both `PATCH /api/v1/submissions/{id}/review` and `PATCH /api/v1/admin/submissions/{id}/review`. Both call the same `review_submission` service function. The v1 version uses `require_admin`, but its existence alongside the admin-prefixed version is confusing.  
Why it matters: API consumers do not know which endpoint to use. Bug fixes must be applied in two places. The v1 route suggests user-facing access, but it requires admin.

### API-02
[SEVERITY: Medium]  
File / Area: `backend/app/api/v1/venues.py:118-133` (`POST /venues/`)  
Issue: The public `POST /venues/` endpoint returns 201 with the created venue. There is no authentication, no review workflow, and no indication that this is a "contribution" versus an "admin creation." The proper contribution path is `POST /submissions/`.  
Why it matters: Two parallel paths to create the same resource with different authorization models. Confusing for API consumers and undermines the submission/points system.

### API-03
[SEVERITY: Medium]  
File / Area: `backend/app/api/v1/points.py:63-67` (`POST /redeem`)  
Issue: Returns 501 "Redemption not yet implemented" — a placeholder endpoint exposed in the public API.  
Why it matters: Dead endpoints in production confuse API consumers and mobile app users who discover them.

### API-04
[SEVERITY: Low]  
File / Area: `backend/app/api/admin/export.py:16-44`  
Issue: CSV export endpoints stream the entire database in a single response with no pagination, filtering, or streaming optimization. The entire result set is loaded into memory via `io.StringIO`.  
Why it matters: At scale, this will cause memory exhaustion on the server and timeout on the client. Fine for current data size, but not future-proof.

---

## 7. Code Quality

### QUAL-01
[SEVERITY: High]  
File / Area: `backend/app/core/logging.py:86-107`  
Issue: `sys.stdout = InterceptHandler()` globally replaces Python's stdout. The `InterceptHandler` only implements `write` and `flush`, missing other `TextIO` methods. This breaks `print()`, subprocess stdout capture, and any library that writes to stdout. The original `sys.stdout` reference is never saved and cannot be restored.  
Why it matters: Silent breakage of third-party libraries. `print()` output goes through loguru instead of direct stdout. Subprocess output may be lost or garbled.

### QUAL-02
[SEVERITY: Medium]  
File / Area: `backend/app/core/logging.py:73-81`  
Issue: JSON log format is built via string concatenation and `.replace('"', '\\"')` instead of `json.dumps()`. This will produce invalid JSON when message content contains newlines, backslashes, curly braces, or other special characters.  
Why it matters: Log aggregation tools (Datadog, ELK, CloudWatch) will fail to parse malformed JSON logs. Errors in the error-logging system.

### QUAL-03
[SEVERITY: Medium]  
File / Area: `backend/app/core/logging.py:118-127`  
Issue: Auto-configuration at import time uses `os.getenv()` directly instead of the `settings` object from `config.py`. This creates two sources of truth for configuration — environment variables read by `config.py` (via pydantic-settings) and environment variables read by `logging.py` (via `os.getenv`).  
Why it matters: Changing `settings.LOG_LEVEL` has no effect on logging. The logging module was already configured at import time using a different config path.

### QUAL-04
[SEVERITY: Medium]  
File / Area: `backend/app/main.py:14-19`  
Issue: Six model classes are imported into `main.py` solely for `Base.metadata.create_all` to know about them. These imports are unused in the module's own logic.  
Why it matters: Tight coupling between `main.py` and every model. Adding a model requires remembering to add an import here. Should be handled via a centralized `models/__init__.py` import.

### QUAL-05  
[SEVERITY: Medium]  
File / Area: `backend/app/services/search.py:6-12`  
Issue: `bounding_box` does not clamp latitude to [-90, 90] or handle longitude wrapping at the antimeridian. At the poles, `cos(lat_rad)` approaches zero causing division by zero in `deg_lng`.  
Why it matters: Searching near the poles or antimeridian produces invalid bounding boxes. Database queries with `latitude >= -200` will return incorrect results or behave unpredictably.

### QUAL-06
[SEVERITY: Low]  
File / Area: `backend/app/models/deal.py:37`  
Issue: Uses `backref="deals"` on the venue relationship while every other model in the codebase uses `back_populates`. Mixing both patterns causes confusion about where bidirectional relationships are defined.  
Why it matters: Developers adding new code may not find the reverse relationship definition. `backref` and `back_populates` have subtle behavioral differences.

### QUAL-07
[SEVERITY: Low]  
File / Area: `admin-web/src/services/adminApi.tsx`  
Issue: Every API function uses `any` as the return type (`request<any[]>`, `request<any>`). The `types.ts` file defines proper interfaces (`Venue`, `Deal`, `Submission`) but they are never used in the API layer.  
Why it matters: No compile-time type safety between API responses and UI components. Typos in property names and missing fields are only caught at runtime.

---

## 8. Observability

### OBS-01
[SEVERITY: High]  
File / Area: `backend/app/main.py:37-40` (`/health`)  
Issue: The health endpoint always returns `{"status": "healthy"}` regardless of database connectivity. It does not execute a `SELECT 1` or check Redis.  
Why it matters: Load balancers and orchestrators (Railway, Render) will route traffic to a backend that cannot serve requests. Failed database connections are invisible to health checks.

### OBS-02
[SEVERITY: Medium]  
File / Area: `backend/app/main.py:47`  
Issue: `trace_id: str(id(exc))` uses Python's built-in `id()` which returns a memory address. It is not a UUID, not unique across requests, and changes if the object is garbage-collected and the address is reused.  
Why it matters: Cannot correlate error responses with log entries. Support tickets with "trace_id: 140234567890" are unsearchable.

### OBS-03
[SEVERITY: Medium]  
File / Area: `backend/app/api/v1/venues.py`, `backend/app/api/v1/deals.py`  
Issue: No request-level metrics (latency percentiles, error rates, throughput). The request logging middleware records individual request durations but does not aggregate them. No integration with Prometheus, StatsD, or any metrics system.  
Why it matters: Cannot detect performance degradation, set up alerts, or identify slow endpoints without manually parsing log files.

### OBS-04
[SEVERITY: Low]  
File / Area: `backend/app/core/logging.py:77`  
Issue: `logger.bind(traceback=True)` is used but `traceback=True` is not a standard loguru parameter. Loguru uses `logger.exception()` or `exc_info=True` for exception tracebacks.  
Why it matters: Tracebacks may not appear in logs when expected, making error diagnosis harder.

---

## 9. Deployment Readiness

### DEP-01
[SEVERITY: Critical]  
File / Area: `backend/app/main.py:26`  
Issue: `Base.metadata.create_all(bind=engine)` runs on every startup. This creates tables that don't exist but does not modify existing ones. Combined with Alembic migrations, this causes schema drift — `create_all` may create a column that Alembic later tries to `ALTER TABLE ADD` (causing "column already exists" errors).  
Why it matters: Migration failures on deploy. If `create_all` and Alembic diverge, deployments become unpredictable and may require manual intervention.

### DEP-02
[SEVERITY: High]  
File / Area: `backend/Dockerfile`  
Issue: No `.dockerignore` file. `COPY . .` copies everything from `backend/` into the image, including `__pycache__/`, `.env` files (if present), `.git` data, and IDE configuration. If a developer has a `.env` with real secrets, it gets baked into the Docker image.  
Why it matters: Secret leakage through Docker image layers. Anyone who pulls the image can extract `.env` contents.

### DEP-03
[SEVERITY: High]  
File / Area: `backend/Dockerfile`  
Issue: The container runs as root. No `USER` directive creates a non-root application user.  
Why it matters: Container escape vulnerabilities grant root access to the host. Most container security scanners flag this as a high finding.

### DEP-04
[SEVERITY: High]  
File / Area: `backend/Dockerfile`  
Issue: No `HEALTHCHECK` instruction. The `docker-compose.yml` uses `depends_on` with `condition: service_healthy` for `db` and `redis`, but the `backend` service itself has no health check for orchestrators.  
Why it matters: Railway/Render cannot determine if the backend is actually healthy. Crashed-but-running containers continue to receive traffic.

### DEP-05
[SEVERITY: High]  
File / Area: `backend/app/core/config.py:12`  
Issue: `DEBUG: bool = True` is the default. If the `DEBUG` environment variable is not set in production, SQLAlchemy `echo=True` dumps every SQL statement to stdout (performance + data leak), and the app runs in debug mode.  
Why it matters: Production database queries with sensitive data (password hashes, tokens) appear in logs. Performance degradation from excessive logging.

### DEP-06
[SEVERITY: Medium]  
File / Area: `docker-compose.yml:22,27,49`  
Issue: `--reload` is in the `command:` for the backend service. The Dockerfile `CMD` does NOT include `--reload` (production-safe), but `docker-compose.yml` overrides it. If someone uses the compose file in production, they get hot-reload.  
Why it matters: Hot-reload in production is a security risk (file watcher overhead) and stability risk (unexpected restarts on file changes).

### DEP-07
[SEVERITY: Medium]  
File / Area: `mobile/src/config/constants.ts:15`  
Issue: The production API URL `https://goldenhour-production.up.railway.app/api/v1` is hardcoded in source. Changing the production URL requires a new mobile app build and app store submission.  
Why it matters: Infrastructure changes (domain migration, failover) require a full mobile release cycle. Should be in an Expo config or environment variable.

### DEP-08
[SEVERITY: Low]  
File / Area: `backend/requirements.txt`  
Issue: `passlib[bcrypt]==1.7.4` is declared but `security.py` imports `bcrypt` directly. `bcrypt` is not listed as a direct dependency. If `passlib` is ever removed, the import breaks. Transitive dependencies (lines 37-50) are pinned individually, which is fragile.  
Why it matters: Confusing dependency tree. Build failures if transitive pins conflict with upstream updates.

---

## Executive Summary

### Overall Readiness Assessment

**NOT READY for production deployment.** The codebase has a functional feature set and reasonable architecture, but it has critical security gaps that would result in immediate data compromise if deployed today. The most dangerous issues are authentication bypasses on admin endpoints and write endpoints, which allow unauthenticated users to read, modify, and delete all data.

### Top 3 Blockers (Must Fix Before Any Deployment)

1. **Missing authentication on admin endpoints** (SEC-01). All admin CRUD and CSV export routes are completely unprotected. This is the single most critical finding — it allows full database compromise without credentials.

2. **Missing authentication on public write endpoints** (SEC-02). `POST /venues/` and `POST /deals/` accept unauthenticated requests, bypassing the entire submission/review workflow and allowing direct data injection.

3. **Race conditions in submission review** (DATA-01, DATA-02). Concurrent approval of the same submission awards double points and creates duplicate entities. Concurrent approvals for the same user lose point increments. This is a data integrity and financial correctness failure.

### Prioritized Fix Order

**Immediate (before deploy):**
1. Add `require_admin` dependency to all `admin/venues.py`, `admin/deals.py`, and `admin/export.py` routes
2. Add `get_current_user` dependency to `POST /venues/` and `POST /deals/` (or remove these endpoints in favor of submissions)
3. Add `SELECT ... FOR UPDATE` row locking in `submission_review.py` for both the submission status check and the user points balance update
4. Add `db.rollback()` in the `except` block of `submission_review.py`
5. Fix the global exception handler to return `JSONResponse(status_code=500, ...)`
6. Check `user.active` in `get_current_user`

**Short-term (within 1-2 weeks):**
7. Remove `sys.stdout = InterceptHandler()` from logging.py or replace with a proper logging integration
8. Add CORS origin allowlist instead of `["*"]`
9. Add database-level CHECK constraints for coordinates, prices, day_of_week, points_balance
10. Fix N+1 queries in admin venue listing
11. Add health check that verifies database connectivity
12. Add `.dockerignore` and non-root user to Dockerfile
13. Remove `Base.metadata.create_all` from startup (rely on Alembic only)
14. Set `DEBUG` default to `False`

**Medium-term (within 1 month):**
15. Implement Redis caching for read-heavy endpoints
16. Add rate limiting to auth endpoints and all public API
17. Use PostGIS spatial functions (`ST_DWithin`) instead of Python haversine loops
18. Remove `console.log` from mobile API interceptor
19. Add request-level metrics (latency, error rates)
20. Add proper request/trace IDs (UUID-based, not `id()`)
21. Validate `submitted_data` shape per submission type
22. Pin `bcrypt` as a direct dependency; align passlib usage or remove it

**Ongoing:**
23. Add unit and integration tests (currently zero)
24. Add ESLint/Prettier for TypeScript; Ruff/Black for Python
25. Deduplicate types between `mobile/src/types/` and `shared/`
26. Implement proper JSON logging via `json.dumps()` instead of string concatenation
