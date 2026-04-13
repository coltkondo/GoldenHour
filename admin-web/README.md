# Golden Hour Admin Dashboard

React web application for managing the Golden Hour database. Requires an admin-role account.

## Technology

- React with Vite, TypeScript
- Connects to the FastAPI backend at localhost:8000 (proxied via Vite)
- JWT auth stored in localStorage, validated server-side on every page load

## What It Does

- **Login** — Authenticates against the backend; non-admin accounts are rejected
- **Venues** — Search, filter by neighborhood/type/status, sort, toggle active, edit, create
- **Deals** — Search, filter by category/type/venue, sort, toggle active, edit, create
- **Submissions** — Review queue for user-submitted tips; approve (auto-applies to DB + awards points) or reject with notes
- **Export** — Download venues and deals as CSV (authenticated fetch, not plain links)

## Running

### Prerequisites

- Node.js 18+
- The backend API must be running at http://localhost:8000
- An account with `role = 'admin'` in the database

### Setup

```bash
cd admin-web
npm install
npm run dev
```

Open http://localhost:5173 in your browser and log in with your admin credentials.

### Creating an admin account

Register any account via the mobile app or API, then promote it via psql:

```bash
docker compose exec db psql -U postgres -d goldenhour
```
```sql
UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
```

## API Integration

The dashboard uses the admin API endpoints at `/api/v1/admin/` and auth endpoints at `/api/v1/auth/`. Requests are proxied via Vite's dev server to avoid CORS. See [docs/API.md](../docs/API.md) for the full endpoint reference.

## Security Notes

- On app load, the stored token is validated via `GET /auth/me`. Invalid or non-admin tokens are automatically evicted and the user is sent to login.
- Export buttons use authenticated `fetch()` — not plain `<a>` links — so the `Authorization` header is always sent.
