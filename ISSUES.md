# Known Gaps — Golden Hour

Current status of known issues. Updated 2026-04-09.

---

## Fixed (Done)

| Issue | Fix |
|-------|-----|
| CORS wildcard + credentials | Production guard in `config.py` blocks `ALLOWED_ORIGINS=*` when `ENVIRONMENT=production` |
| No rate limiting on auth routes | `slowapi` added; register: 5/min, login: 10/min |
| `DEBUG=True` default | Changed to `False`; production guard also rejects `DEBUG=True` in production |
| Dev `SECRET_KEY` placeholder | `production_guards` validator blocks known dev secret in production |
| Silent startup seed failure | Exception now halts startup instead of being swallowed |
| Fake `trace_id` in 500 errors | Replaced `id(exc)` (memory address) with `uuid.uuid4()` |
| Redis connection leak in health check | `finally: client.close()` added |
| JWT logging on every API request | Wrapped in `if (__DEV__)` guard |
| Admin approve/reject without confirmation | Two-step confirm dialog added in ReviewDetail |
| Admin export buttons broken (no auth header) | Replaced `<a>` tags with authenticated `fetch()` + blob download |
| Admin session not validated server-side | `GET /auth/me` called on app load; invalid/non-admin tokens evicted |
| Race condition on unmounted component setState | `isMounted` ref pattern in HomeScreen, ExplorerScreen, MapScreen |
| ThemeContext re-created every render | Wrapped in `useMemo` |
| Silenced errors in admin pages | Error banners with Retry added to VenueList and PendingReview |
| `console.log(venueData)` in production | Removed from `endpoints.ts` |
| Weak password validation | `field_validator` enforces 8+ chars, uppercase, digit |

---

## Open — Fix Before Scale

These are acceptable for a 10–15 person soft launch but will cause pain at larger scale.

| Issue | Severity | Notes |
|-------|----------|-------|
| No `.dockerignore` | Medium | Docker builds include `.git`, `__pycache__`, etc. — increases image size. |
| JWT tokens cannot be revoked | Medium | No token blocklist. Compromised token stays valid until it expires (30 min). |
| No email verification on registration | Medium | Anyone can register with any email. |
| N+1 query on admin venues list | Medium | `deals_count` fetched per-venue in a loop. Slow with 200+ venues. |
| Redis cache is unused | Medium | `app/core/cache.py` exists but caching is not wired up anywhere. Leaderboard recalculates on every request. |
| No audit trail for admin actions | Medium | No log of who approved/rejected what. |
| No request body size limit | Low | A malformed client could POST a large payload to any endpoint. |
| Optimistic locking missing on venue/deal updates | Low | Last-write-wins if two admins edit the same record simultaneously. |
| No CI/CD pipeline | Low | Pushes go straight to Railway with no automated test gate. |
| Token refresh does not validate old token expiry | Low | `POST /auth/refresh` issues a new token without checking if the old one is still valid. |
| `ErrorBoundary` retry does not remount child | Low | `setState({ hasError: false })` — if the child's state caused the error, it will re-throw immediately. Use a `key` prop to force remount. |

---

## Not Planned for Beta

| Feature | Decision |
|---------|----------|
| Push notifications | Backend not implemented; toggle disabled in UI |
| Android support | iOS-only beta |
| Offline support | Not needed for bar use case |
| Bookmarks persistence | In-memory only; reset on app restart |
