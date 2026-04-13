# Security Audit — Testing Roadmap

All security fixes have been applied. This document is a step-by-step guide to manually
verify each fix using `curl` against `http://localhost:8000`.

**Prerequisites:** Backend running (`docker compose up -d`), `SECRET_KEY` set in environment.

---

## Setup — Get Tokens

```bash
# 1. Register a regular user
curl -s -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@test.com","password":"TestPass1"}' | python3 -m json.tool

# Save the access_token from the response → USER_TOKEN

# 2. Register an admin user (then promote via psql below)
curl -s -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"adminuser","email":"admin@test.com","password":"AdminPass1"}' | python3 -m json.tool

# Promote to admin:
# docker compose exec db psql -U postgres -d goldenhour -c "UPDATE users SET role = 'admin' WHERE email = 'admin@test.com';"

# 3. Login as admin
curl -s -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"AdminPass1"}' | python3 -m json.tool

# Save the access_token → ADMIN_TOKEN
```

---

## SEC-01: Admin Endpoints Require Auth

All admin routes must reject unauthenticated requests with 401.

```bash
# Should all return 401 Unauthorized
curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/api/v1/admin/venues/
curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/api/v1/admin/deals/
curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/api/v1/admin/export/venues.csv
curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/api/v1/admin/export/deals.csv
```

All admin routes must reject non-admin users with 403.

```bash
# Should all return 403 Forbidden
curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $USER_TOKEN" http://localhost:8000/api/v1/admin/venues/
curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $USER_TOKEN" http://localhost:8000/api/v1/admin/deals/
curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $USER_TOKEN" http://localhost:8000/api/v1/admin/export/venues.csv
```

Admin routes must work with admin token.

```bash
# Should all return 200
curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $ADMIN_TOKEN" http://localhost:8000/api/v1/admin/venues/
curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $ADMIN_TOKEN" http://localhost:8000/api/v1/admin/deals/
curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $ADMIN_TOKEN" http://localhost:8000/api/v1/admin/export/venues.csv
```

---

## SEC-02: Public Write Endpoints Require Auth

`POST /venues/` and `POST /deals/` must reject non-admin users.

```bash
# Unauthenticated → 401
curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:8000/api/v1/venues/ \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","address":"123 Main St"}'

# Regular user → 403
curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:8000/api/v1/venues/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -d '{"name":"Test","address":"123 Main St"}'

# Admin → 201
curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:8000/api/v1/venues/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"name":"Test","address":"123 Main St"}'
```

---

## SEC-03: CORS Restricted Origins

```bash
# Should NOT include Access-Control-Allow-Origin: *
curl -s -D - -o /dev/null http://localhost:8000/api/v1/venues/ \
  -H "Origin: http://evil.com" | grep -i "access-control"

# Should allow configured origin
curl -s -D - -o /dev/null http://localhost:8000/api/v1/venues/ \
  -H "Origin: http://localhost:5173" | grep -i "access-control"
```

---

## SEC-04: Submission Data Whitelist

Test that `verified` and `active` cannot be injected via submissions.

```bash
# Create a submission trying to set verified=true
curl -s -X POST http://localhost:8000/api/v1/submissions/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -d '{
    "submission_type": "new_bar",
    "submitted_data": {"name":"Hacked Bar","address":"1 Evil St","verified":true,"active":true}
  }'

# Note the submission_id, then admin-approve it
curl -s -X PATCH http://localhost:8000/api/v1/admin/submissions/{submission_id}/review \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"status":"approved"}'

# Get the created venue — verified should be false (default), not true
curl -s http://localhost:8000/api/v1/venues/ | python3 -c "
import sys, json
venues = json.load(sys.stdin)
for v in venues:
    if v['name'] == 'Hacked Bar':
        print(f\"verified={v['verified']}, active={v['active']}\")
        assert v['verified'] == False, 'SEC-04 FAILED: verified was injected'
        print('SEC-04 PASSED')
"
```

---

## SEC-05: Deactivated Users Blocked

```bash
# Login, get token, then have admin deactivate the user via DB
# Then try to use the token
curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $USER_TOKEN" \
  http://localhost:8000/api/v1/auth/me
# After deactivation, should return 403
```

---

## SEC-07/SEC-08: No Token Leakage in Logs + SECRET_KEY Validation

```bash
# Verify no token_preview in logs
docker compose logs backend 2>/dev/null | grep -c "token_preview"
# Should be 0

# Verify SECRET_KEY rejects placeholders
# In .env, set SECRET_KEY=dev-secret-key-change-in-production
# Restart → should crash with validation error
```

---

## SEC-09: Database Not Exposed

```bash
# Should fail (port not accessible from outside)
curl -s -o /dev/null -w "%{http_code}" http://localhost:5432
```

---

## SEC-10: Password Complexity

```bash
# Weak password → 422
curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"weak","email":"weak@test.com","password":"short"}'

# No uppercase → 422
curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"weak2","email":"weak2@test.com","password":"nouppercase1"}'

# No digit → 422
curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"weak3","email":"weak3@test.com","password":"NoDigitHere"}'

# Valid → 201
curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"strong","email":"strong@test.com","password":"GoodPass1"}'
```

---

## DEP-01: No create_all Conflict

```bash
# Verify clean migration on fresh database
docker compose down -v
docker compose build backend
SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_hex(32))") docker compose up -d
sleep 30
docker compose logs backend | grep -c "DuplicateColumn\|DuplicateObject"
# Should be 0

# Verify alembic_version is populated
docker compose exec db psql -U postgres -d goldenhour -c "SELECT * FROM alembic_version;"
# Should show all 8 migration revisions applied
```
