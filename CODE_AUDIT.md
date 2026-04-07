# Code Audit Findings — Golden Hour

> Audit date: 2026-04-02  
> Auditor: Claude Code (claude-sonnet-4-6)  
> Scope: Full codebase — backend (FastAPI/Python), mobile (React Native/Expo), admin-web (React/Vite)

---

## BACKEND (FastAPI / Python)

### Critical
1. ~~**Naive datetime() — no UTC** (`deals.py:47,98`) — `datetime.now()` used without timezone; breaks happy hour filtering across timezones~~ **RESOLVED** in commit `fbbd212` — replaced with `_now_eastern()` using `ZoneInfo(settings.APP_TIMEZONE)`; 9 tests in `tests/test_issue1_deals_timezone.py`
2. ~~**Race condition on points balance** (`submission_review.py:99-119`) — non-atomic increment; concurrent approvals can silently lose points~~ **RESOLVED** in commit `fbbd212` — replaced ORM read-modify-write with atomic SQL `UPDATE users SET points_balance = points_balance + :x`; 7 tests in `tests/test_issue2_points_atomic.py`

### High
3. **No rate limiting** — zero rate limiting on any endpoint; auth endpoints and submission creation are wide open to abuse
4. ~~**Missing security headers** (`main.py`) — no HSTS, X-Frame-Options, Content-Security-Policy, or HTTPS redirect middleware~~ **RESOLVED** in commit `fbbd212` — added `add_security_headers` middleware to `main.py` injecting X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy, and Permissions-Policy on every response; 12 tests in `tests/test_issue4_security_headers.py`
5. ~~**Weak password validation** (`user.py:13-22`) — only checks for 1 uppercase/lowercase/digit; `Qwerty1` passes~~ **RESOLVED** in commit `1d153fb` — added special character requirement and `max_length=128` (bcrypt DoS protection); 13 tests in `tests/test_issue5_password_validation.py`
6. ~~**Email case sensitivity** — `User@Example.com` and `user@example.com` treated as distinct accounts; allows duplicate registration~~ **RESOLVED** in commit `1d153fb` — added `.lower()` normalizer to `UserCreate` and `UserLogin`; `func.lower()` used in all DB email queries; 12 tests in `tests/test_issue6_email_normalization.py`
7. ~~**JSONB submission data not value-validated** (`submission_review.py`) — lat/lon ranges not checked; malformed values applied directly to models~~ **RESOLVED** in commit `fbbd212` — created `app/schemas/submission_data.py` with `VenueData`/`DealData` Pydantic models (`extra="ignore"`, Field constraints on lat/lon/price/rating); `_apply_submission()` now validates all data through these schemas before any DB write, raising HTTP 422 on invalid values; 17 tests in `tests/test_issue7_submission_data_validation.py`
8. **Partial transaction rollback risk** (`submission_review.py:121-129`) — if approval partially succeeds, rollback may not cover all state changes

### Medium
9. **No request body size limits** — `submitted_data` JSONB accepts arbitrarily large payloads; DoS vector
10. **CORS too permissive** (`main.py:76-82`) — `allow_methods=["*"]` allows TRACE method; `allow_headers=["*"]` undermines CSRF protection
11. **Soft delete without audit trail** — `active` boolean flip has no `deleted_at` timestamp or `deleted_by` tracking
12. **7 empty stub files** — `moderation.py`, `geocoding.py`, `validation.py`, `happy_hours.py`, `public.py`, `admin/users.py`, `admin/analytics.py` are comment-only; if routes are registered, they return nothing or crash
13. **Redundant/empty Alembic migrations** — `11cfbfc180c0`, `86849ca32f7b` are no-ops; `4da5183dc371` duplicates earlier work; hard-to-trace upgrade path
14. **Missing FK indexes** — `PointTransaction.submission_id` and `Submission.reviewed_by` may lack explicit indexes
15. **Non-deterministic leaderboard ranking** — ties in `points_balance` sort in undefined order
16. **`pool_recycle=1800` may exceed DB idle timeout** (`database.py:13`) — if Postgres closes connections at 10 min, recycling at 30 min is too late
17. **`DEBUG=True` default enables SQL query logging** (`config.py`, `database.py`) — leaks schema/query details if accidentally left on in production
18. **Redis dependency declared but completely unimplemented** (`cache.py` is empty) — misleading, unused dependency

### Low
19. **Website/URL fields have no format validation** — XSS risk if rendered without escaping
20. **`ARRAY(String)` tags column is unbounded** — no per-tag length or array size constraint
21. **Nullable columns that should have defaults** — `HappyHourSchedule.deal_ids` defaults to `null` rather than `[]`
22. **No CASCADE delete defined on FK relationships** — orphaned submissions if parent deal deleted

---

## MOBILE (React Native / Expo)

### Critical / Breaking
23. **Search bar non-functional** (`HomeScreen.tsx:333-353`) — `searchQuery` state is set but never used to filter results
24. **Filter button non-functional** (`HomeScreen.tsx:350-352`) — `onPress` does nothing
25. **Bookmarks not persisted** (`HomeScreen.tsx`) — `toggleSave()` only updates local state; lost on app restart
26. **Notification toggle is cosmetic** (`ProfileScreen.tsx:154-159`) — switch does not actually register for push notifications
27. **`route.params.venue` accessed without null guard** (`HappyHourScreen.tsx:59`) — app crashes if navigation params are missing
28. **Corrupted AsyncStorage crashes auth init** (`AuthContext.tsx:40-52`) — `JSON.parse(storedUser)` is not wrapped in try-catch
29. **`deal.items` accessed without null guard** (`HomeScreen.tsx:409`, `DealCard.tsx:131`) — `items` is nullable per API types

### High
30. **No token expiry / 401 handling** (`client.ts`) — expired tokens silently fail; no auto-logout or session-expired message
31. **No error boundary** — single component crash takes down the entire app with no recovery
32. **Points balance not refreshed after submission** — user sees "+50 pts" toast but profile total doesn't update until manual refresh
33. **Flag/report errors not shown to user** (`FlagReportModal.tsx:103-107`) — error state set but no UI feedback
34. **ThemeContext returns `null` while loading** (`ThemeContext.tsx:68-70`) — causes blank screen on cold start
35. **Error states set but retry not offered** (`MapScreen.tsx`, `LeaderboardScreen.tsx`) — user is stuck with error banner with no way to retry
36. **ExplorerScreen uses non-virtualized ScrollView** — renders all venues at once; performance degrades with large lists
37. **Incorrect day-of-week mapping** (`ExplorerScreen.tsx:32-34`) — JS `getDay()` Sunday=0 vs backend Monday=0 causes schedule to display wrong day

### Medium
38. **Silent `.catch(() => [])` in HomeScreen deals load** (`HomeScreen.tsx:178`) — no error state set; deals appear empty on failure
39. **MySubmissionsScreen shows empty list on API failure** — no error state; user thinks they have no submissions
40. **`calculateDistance` duplicated in 3+ files** — HomeScreen, MapScreen, VenueCard; calculations can diverge
41. **`formatTime` duplicated** (`HappyHourScreen.tsx` vs `HomeScreen.tsx`) — inconsistent time display
42. **Hardcoded happy hour start time logic** (`HomeScreen.tsx:541-546`) — `Math.max(hour + 1, 17)` ignores actual schedule times
43. **Google Maps API key is placeholder** (`app.json:18,28-30`) — `"YOUR_GOOGLE_MAPS_API_KEY"` still in config; map will not render
44. **Console.log in production API code** (`endpoints.ts:8`) — `console.log('Fetched venues:', response)` always fires
45. **No network retry logic** — single timeout = permanent failure with no exponential backoff
46. **No offline detection** — app shows broken state with no "you are offline" message
47. **No error reporting service** — production crashes (Sentry/Bugsnag) go undetected
48. **Version string hardcoded** (`LoadingScreen.tsx:126`) — `v1.0.0` not tied to `package.json`

### Low
49. **`ThemedTabBar` not memoized** — re-renders on every theme tick; could cause tab bar flicker
50. **8 looping animations in FeaturedCardBackground** — may cause frame drops on older devices
51. **No accessibility labels** on interactive elements throughout
52. **Navigation `navigate()` calls use untyped string literals** — typos caught only at runtime

---

## ADMIN WEB (React / Vite)

### Critical
53. **No HTTPS/TLS for production** — admin credentials sent in plaintext; docker-compose has no TLS config
54. **4 empty stub pages registered in filesystem** — `VenueDetail.tsx`, `PopularDeals.tsx`, `Usage.tsx`, `BulkImport.tsx` are 0-byte files; if routed, will crash

### High
55. **JWT stored in `localStorage`** (`AuthContext.tsx`) — readable by any XSS payload; httpOnly cookies not used
56. **No 401 → logout handling** (`adminApi.tsx`) — expired/invalid tokens produce repeated error dialogs instead of redirecting to login
57. **No token refresh** — 30-min token expiry from backend is not handled; users abruptly lose session
58. **Token not re-validated on page load** — stale/expired token used until a request fails
59. **Admin role only checked at login** — role revocation on backend not reflected in active session
60. **No CSRF protection** — all state-mutating requests use only `Authorization` header; no CSRF tokens
61. **No routes for analytics or venue detail** (`App.tsx`) — features mentioned in README but not wired

### Medium
62. **Silent `.catch(() => {})` in DealForm/DealList/VenueForm** — dropdowns for categories, deal types, venues appear empty with no user feedback
63. **Dashboard Promise.all doesn't surface errors** (`dashboard.tsx:15-28`) — stats silently fail; loading may persist indefinitely
64. **Non-atomic toggle + refetch** (`VenueList.tsx:56-59`, `DealList.tsx:60-63`) — rapid clicks cause race conditions in UI state
65. **Latitude/longitude accept any value** (`VenueForm.tsx:110-114`) — no range validation (±90 / ±180)
66. **Website field accepts non-URL strings** (`VenueForm.tsx:122`) — no `http://` prefix requirement or format check
67. **Phone field accepts arbitrary strings** — no format or pattern validation
68. **Unsafe `as` type casts on all API responses** — `data as Venue[]` etc. bypass runtime type checking
69. **API path parameters not URL-encoded** (`adminApi.tsx:63,65,66`) — special characters in IDs could cause path issues
70. **Vite proxy target hardcoded to `localhost:8000`** (`vite.config.ts`) — breaks in any non-local deployment
71. **No `VITE_API_BASE_URL` env var** — API base is hardcoded; cannot point at staging/prod without code change
72. **No frontend `.env.example`** — new developers have no guidance on configuration

### Low
73. **`noUnusedLocals: false`, `noUnusedParameters: false`** (`tsconfig.json`) — partially defeats strict TypeScript mode
74. **Pervasive `any` types** — catch blocks, payload objects, and form data use `any` throughout
75. **Generic "Loading..." text** in all list pages — no skeleton UI or descriptive state
76. **No ARIA labels** on toggle switches and action buttons
77. **No empty-state help text** — "No venues found" with no guidance on why

---

## Summary

| Severity | Count |
|----------|-------|
| Critical / Breaking | 8 |
| High | 19 |
| Medium | 35 |
| Low | 15 |
| **Total** | **77** |
