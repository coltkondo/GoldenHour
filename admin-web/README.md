# Golden Hour Admin Dashboard

React web application for managing venues and deals in the Golden Hour database.

## Technology

- React with Vite
- Connects to the FastAPI backend at localhost:8000

## What It Does

The admin dashboard provides a web interface for:

- Viewing all venues with search, filtering by neighborhood and venue type, and sorting
- Creating, editing, and soft-deleting venues
- Viewing all deals with search, filtering by category and deal type, and sorting
- Creating, editing, and soft-deleting deals
- Exporting venue and deal data as CSV files

## Running

### Prerequisites

- Node.js 18+
- The backend API must be running at http://localhost:8000

### Setup

```bash
cd admin-web
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

## API Integration

The dashboard uses the admin API endpoints at `/api/v1/admin/`. See [docs/API.md](../docs/API.md) for the full endpoint reference and [docs/admin-guide.md](../docs/admin-guide.md) for a step-by-step usage guide.
