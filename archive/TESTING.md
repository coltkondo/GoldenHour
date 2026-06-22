# GoldenHour Testing

Overview of all test coverage in the project.

---

## Backend Tests (Python / pytest)

Test files live in `backend/tests/`. Run from the `backend/` directory:

```bash
cd backend
pip install -r requirements.txt   # includes pytest and httpx
pytest tests/                     # run all tests
pytest tests/ -k test_name        # run a single test
pytest tests/ -v                  # verbose output
```

### Test Files

| File | What it tests |
|------|--------------|
| `test_fix6_debug_default.py` | DEBUG defaults to False; production guard blocks DEBUG=True |
| `test_issue1_deals_timezone.py` | Deals timezone handling |
| `test_issue2_points_atomic.py` | Points balance atomicity |
| `test_issue4_security_headers.py` | Security headers on responses |
| `test_issue5_password_validation.py` | Password complexity requirements |
| `test_issue6_email_normalization.py` | Email normalization on register/login |
| `test_issue7_submission_data_validation.py` | Submission data whitelist (no injected `verified`/`active`) |
| `test_issue10_cors.py` | CORS restricted to allowed origins |
| `test_issue15_leaderboard_ranking.py` | Leaderboard ranking order |
| `test_p0_dockerfile.py` | Dockerfile correctness |
| `test_p0_health_check.py` | Health check endpoint |

---

## Mobile Tests (Jest)

Test files live in `mobile/src/__tests__/`. Run from the `mobile/` directory:

```bash
cd mobile
npm test                          # run all tests
npm test -- --watch               # watch mode
npm test -- --coverage            # with coverage report
```

### Test Files

| File | What it tests |
|------|--------------|
| `apiClient.test.ts` | JWT logging wrapped in `__DEV__` guard |
| `ErrorBoundary.test.ts` | Error boundary renders fallback UI on crash |
| `profilePointsRefresh.test.ts` | Points balance re-fetches on screen focus |
| `notificationToggle.test.ts` | Notification toggle is disabled (coming soon) |
| `scheduleUtils.test.ts` | `parseTimeString` and `formatScheduleRange` utilities |
| `homeFilters.test.ts` | Home screen deal filter logic |
| `authUtils.test.ts` | Auth utility functions |

---

## Security Testing (curl)

Manual security verification scripts are documented in `TEST_SECURITY.md`.

Use `curl` against `http://localhost:8000` with the backend running via Docker.

Key checks:
- Admin routes reject unauthenticated and non-admin requests
- Rate limiting fires after 10 login attempts per minute
- CORS does not allow arbitrary origins
- Submission data whitelist blocks injected `verified`/`active` fields

---

## Integration Tests (PowerShell)

Require Docker running with all services healthy.

```powershell
.\test-system.ps1     # full system test (~30s)
.\health-check.ps1    # quick health check (~5s)
.\test-api.ps1        # API endpoint tests (~10s)
```

These scripts check container health, database seeding, and API endpoint responses.

---

## Full Stack Workflow

```bash
# 1. Start all services
docker compose up -d

# 2. Run backend tests
cd backend && pytest tests/ -v

# 3. Run mobile tests
cd ../mobile && npm test

# 4. Run security checks
# See TEST_SECURITY.md for curl commands

# 5. Run PowerShell integration tests (if on Windows/Mac with pwsh)
cd .. && .\test-system.ps1
```

---

## Database Access for Debugging

```bash
docker compose exec db psql -U postgres -d goldenhour

# In psql:
\dt public.*                          # list all tables
SELECT COUNT(*) FROM venues;
SELECT COUNT(*) FROM deals;
SELECT COUNT(*) FROM happy_hour_schedules;
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM submissions;
\q
```

---

## Backend Logs

```bash
docker compose logs backend --tail 50       # last 50 lines
docker compose logs -f backend              # follow in real-time
docker compose logs backend | grep "error\|failed\|imported"
```
