# GoldenHour — Agent Guidelines

Monorepo with three apps: **backend** (Python/FastAPI), **mobile** (React Native/Expo/TypeScript), **admin-web** (React/Vite/TypeScript). Docker is required for the backend. Package manager is **npm**.

---

## Build / Dev Commands

### Backend (Docker)

```bash
docker compose build backend          # first time only
docker compose up -d                  # start all services (db, redis, backend)
docker compose down -v                # stop + wipe database volume
docker compose logs -f backend        # follow logs
docker compose restart backend        # restart after code changes
docker compose exec db psql -U postgres -d goldenhour   # psql shell
docker compose exec backend alembic upgrade head         # run migrations
```

Backend runs on `http://localhost:8000`. API docs at `/docs`.

### Mobile

```bash
cd mobile
npm install                           # first time only
npx expo start                        # dev server
```

### Admin Web

```bash
cd admin-web
npm install                           # first time only
npm run dev                           # Vite dev server (http://localhost:5173)
npm run build                         # tsc && vite build
```

### System Tests (PowerShell)

```bash
.\test-system.ps1                     # full system test (~30s)
.\health-check.ps1                    # quick health check (~5s)
.\test-api.ps1                        # API endpoint tests (~10s)
```

### Data Import

```bash
python scripts/import_data.py                    # full import
python scripts/import_data.py --dry-run          # validate only
python -m scripts.import_csv                     # import inside container
```

---

## Testing

**No unit test frameworks are installed.** There are no `pytest`, `jest`, or `vitest` configs.

- Python tests: install `pytest` + `httpx` if needed. Use `pytest backend/tests/` or `pytest -k test_name` for a single test.
- TypeScript tests: no test runner configured in either mobile or admin-web.
- Integration testing is done via the PowerShell scripts above.

---

## Code Style — Python (`backend/`)

### Naming

- Files and functions: `snake_case`
- Classes: `PascalCase`
- Constants: `UPPER_SNAKE_CASE`

### Imports

Group and order: stdlib → third-party → local. One import per symbol for readability.

```python
from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.venue import Venue
from app.schemas.venue import VenueCreate, VenueResponse
```

### Type Hints

Use Python 3.10+ syntax: `dict[str, Any]`, `str | None`, `list[str]`. Avoid `Optional[X]` and `List[X]` in new code.

### Architecture

Layered: `api/v1/` (routes) → `services/` (business logic) → `models/` (SQLAlchemy). Pydantic `schemas/` handle validation and serialization.

### Router Pattern

```python
router = APIRouter(prefix="/venues", tags=["venues"])

@router.get("/", response_model=list[VenueResponse])
async def list_venues(
    skip: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
```

### Error Handling

- Raise `HTTPException(status_code=404, detail="Not found")`
- Global exception handler in `main.py` logs unhandled exceptions via `loguru`
- Structured logging: `logger.bind(key=value).info("event_name")`

### Pydantic Schemas

```python
class VenueBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)

class VenueResponse(VenueBase):
    id: UUID
    model_config = ConfigDict(from_attributes=True)
```

---

## Code Style — TypeScript (`mobile/`, `admin-web/`)

### Naming

- Components and types/interfaces: `PascalCase`
- Functions, variables, hooks: `camelCase`
- Files: `camelCase` for utilities, `PascalCase` for component files

### Imports

```typescript
import React, { useState, useEffect } from 'react';
import { venuesAPI } from '../api/endpoints';
import { Venue } from '../types/api';
```

### Components

Function components with hooks. Use Context for global state (auth, theme). Custom hooks for data fetching (`useVenues`, `useLocation`).

### Types

Define interfaces in `src/types/` that match backend field names (`snake_case`).

```typescript
interface Venue {
  id: string;
  name: string;
  neighborhood: string;
  latitude: number;
  longitude: number;
}
```

### API Clients

- **Mobile**: Axios instance with request interceptor injecting JWT from AsyncStorage. Typed responses: `apiClient.get<Venue[]>('/venues')`.
- **Admin Web**: Native `fetch` wrapped in a generic `request<T>()` function. Auth header from `localStorage`.

### TypeScript Config

Both projects have `strict: true` enabled. `admin-web` targets ES2020 with `react-jsx`.

---

## Database Conventions

- **UUID primary keys** on all tables (not auto-increment)
- **Soft deletes**: `active` boolean flag, never hard-delete rows
- **Alembic** for migrations; `Base.metadata.create_all` also runs on startup
- **Auto-seed**: backend seeds from `data/*.csv` if venues table is empty

---

## Auth

- JWT via `python-jose`. Passwords hashed with `passlib[bcrypt]`.
- Tokens stored in `AsyncStorage` (mobile) and `localStorage` (admin-web).
- Dependency chain: `get_db` → `get_current_user` → `require_admin`.

---

## Docker Services

| Service | Port | Purpose |
|---------|------|---------|
| `db` | 5432 | PostgreSQL 15 + PostGIS |
| `redis` | 6379 | Redis 7 (installed, caching unused) |
| `backend` | 8000 | FastAPI with `--reload` (bind-mounted) |

---

## Key Gaps (no tooling configured)

- **No linter/formatter**: no ESLint, Prettier, Ruff, Black, or mypy
- **No unit tests**: `backend/tests/` is empty; no test runner in mobile/admin-web
- **No pre-commit hooks** or CI/CD pipeline
- **`shared/` directory is empty**: types are duplicated in `mobile/src/types/`
- **No `.dockerignore`**

---

## Docs

- `README.md` — project overview and API reference
- `FIRSTSTEP.md` — full setup walkthrough for new developers
- `TESTING.md` — PowerShell test scripts guide
- `docs/` — additional docs (SETUP, API, DATA_MODELS, admin-guide)
