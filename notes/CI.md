# CI / CD

## What runs

`.github/workflows/ci.yml` runs on every PR into `main`, on every push to `main`, and on demand (Actions → CI → Run workflow). Each check is its own job, so a red X tells you exactly what broke.

| Job | What it does | Run it locally |
|---|---|---|
| **Backend · pytest** | Python 3.11 (matches `backend/Dockerfile`); `pytest tests/` on the SQLite test DB from `conftest.py` | `cd backend && pip install -r requirements.txt -r requirements-test.txt && DATABASE_URL=sqlite:///./x.db SECRET_KEY=$(python3 -c "import secrets;print(secrets.token_hex(32))") pytest tests/` |
| **Backend · ruff** | `ruff check` with `backend/ruff.toml` (syntax errors + Pyflakes: unused/undefined names). Findings show inline on the PR diff. | `cd backend && pip install ruff==0.17.5 && ruff check .` (`ruff check --fix .` fixes most) |
| **Mobile · tsc + jest** | `tsc --noEmit`, then all Jest suites | `cd mobile && npx tsc --noEmit && npm test` |
| **Admin web · build** | `npm run build` (`tsc && vite build`), the same command Vercel runs | `cd admin-web && npm run build` |
| **Prettier · changed files** | `prettier --check` on the `.ts/.tsx` (and admin-web `.css/.json`) files **this PR touches** | `npm run format` in `mobile/` or `admin-web/` |

No Docker or Postgres is needed for any of it.

**Why Prettier only checks changed files:** about 59 existing files aren't Prettier-formatted. A one-shot repo-wide reformat would conflict with every in-flight branch, so instead any file you touch must be formatted, and the codebase converges over time. If you ever want a clean slate, run `npm run format` in both apps in a dedicated PR when nothing else is open.

## What doesn't run (on purpose)

- **Deploys.** Railway (backend) and Vercel (admin-web) deploy from `main` through their own GitHub integrations. CI only gates what reaches `main`. No deploy tokens live in GitHub.
- **EAS / mobile releases.** `eas build` / `eas submit` stay manual while release timing is a human call (TestFlight, App Store review).
- **Postgres-only behaviour.** PostGIS queries and `UNNEST` (e.g. `HappyHourSchedule` lookups) aren't covered; `conftest.py` documents this. Adding a Postgres service job is the next step if that becomes a problem.

## One-time setup (needs repo admin; can't be done from code)

1. **Make the checks required:** GitHub → Settings → Branches (or Rules → Rulesets) → add a rule for `main` → *Require status checks to pass* → select all five jobs above (they appear after CI has run once) → optionally *Require a pull request before merging*. With this on, `main` only ever receives green code, so Railway/Vercel production deploys are gated too.
2. **Railway:** backend service → Settings → *Wait for CI* → on. Railway then skips deploying a `main` commit until its GitHub checks pass.
3. **Vercel:** nothing required. Production deploys come from `main`, which step 1 keeps green. Preview deploys still build on every PR, which is fine.

## Stacked PRs

The workflow runs on PRs whose **base is `main`**. In a stack, only the bottom PR targets `main`, so the upper ones get CI once they're retargeted to `main` after the PR below merges (GitHub does this automatically when the base branch is deleted on merge).
