# Golden Hour — Build Backlog

_Economy spec: see [ECONOMY_SPEC.md](ECONOMY_SPEC.md)._

**38 open items** across all sections below.

---

## Right Now (5)

- [ ] **Verify import data** _(founder)_ — walk through Arlington and State College data in the app and confirm venues, deals, and schedules look accurate. Flag anything wrong, fix in the CSVs, and re-import.
- [ ] **Registration end-to-end test on real device** _(dev)_ — create test accounts from both Arlington and State College coordinates and confirm each lands in the right market. A silent radius-math bug would be invisible until someone lands in the wrong market.
- [ ] **Spider Kelly's hours** _(founder)_ — ARL011 is using a guessed 4pm start. Verify on a visit to Clarendon.
- [ ] **Define Arlington rehearsal plan** _(founder)_ — who gets access first, how many people, what you're specifically watching for (submission flow clarity, verification pace, points loop feel). Write it down before opening it up.
- [ ] **"Continue as guest" button** _(founder)_ — home screen needs a clear guest path so users aren't forced to sign up to browse.

---

## Priority 1 — Add the "+" Submit tab (4)

_The submit flow is the app's growth engine. Make it prominent and rewarding._

- [ ] **New bottom tab for submissions** — add a "+" tab to the bottom nav (Instagram-style). This becomes the primary way users contribute. Remove the Submit sub-tab from Explore once this exists.
- [ ] **Rewards progress bar** — top of the "+" page shows the user's points balance as a progress bar toward the 1,000pt / $20 reward threshold.
- [ ] **Submission forms below progress bar** — new bar, new deal, deal update, deal expired, bar closed. Same forms as current QuickSubmitScreen, just relocated.
- [ ] **My Submissions history** — keep accessible from the "+" page or Profile (or both).

---

## Priority 2 — Home page market filtering & redesign (2)

- [ ] **Market filtering on home page** — currently shows deals from ALL markets. Filter by `user.market_slug` when logged in, or by device coordinates when anonymous. Both markets' data is live in the DB so this is visible and wrong right now.
- [ ] **Home page visual redesign** — current layout is functional but not exciting. Revisit after market filtering is working.

---

## Multi-market & auth (2)

- [ ] **401 surfacing as raw error** — Submission and Profile tabs show a raw "API Error 401" when not logged in. Should show the auth gate / login prompt instead. Confirmed on device.
- [ ] **Rebase feature/calendar onto main** — branch predates multi-market merges; needs rebase before it can be tested or merged.

---

## Map page (1)

- [ ] **Map not loading on phone** — tested on device and map page failed. Likely a Maps API key issue or location permission race condition. Needs investigation (check console/network errors).

---

## Profile page (2)

- [ ] **Keep simple** — current layout is good. Submissions history is useful.
- [ ] **Defer leaderboard/rank to post-beta** — not important for initial launch.

---

## Ship before any beta user touches the app (1)

- [ ] Implement 25pt/day corroboration cap — max 10 corroborations × 2pts per user per day, enforced server-side in the corroboration endpoint (not yet built).

---

## July private beta gate (5)

_The beta can run without these, but each one is a real operational or financial risk._

- [ ] **Corroboration feature** — new `corroborate` submission type, endpoint at `POST /submissions/corroborate/{deal_id}`, enforce: verified+active deals only, 1 per user per deal per day, block original submitter from corroborating their own deal, mobile UI button on deal cards.
- [ ] **Daily corroboration cap** — server-side check: if user has earned ≥20 corroboration pts today, return 0 pts (not an error — the tap still registers, just earns nothing).
- [ ] **Duplicate submission handling** — when admin approves a submission for a deal that already exists, award 5pts not 50pts. Currently both get full credit. Admin UI should flag likely duplicates in the review queue.
- [ ] **Admin user management** — `api/admin/users.py` is an empty stub. Need: list users, view a user's point history, deactivate an account. This is the primary fraud-response tool.
- [ ] **`TIMESTAMP WITH TIME ZONE` migration** — `users`, `submissions`, and `point_transactions` tables were created with `TIMESTAMP WITHOUT TIME ZONE`. Models declare `DateTime(timezone=True)`. Fix via a new Alembic migration before real transaction data accumulates.

---

## App Store submission gate (4)

_Required before any production App Store submission. See [APP_STORE_COMPLIANCE.md](APP_STORE_COMPLIANCE.md) for full detail._

- [ ] **User-initiated account deletion** — `DELETE /api/v1/users/me` endpoint + "Delete Account" UI in ProfileScreen. Mandatory per Guideline 5.1.1(v). This is the most commonly rejected item.
- [ ] **Privacy policy** — write one, host it publicly, add a clickable link in ProfileScreen, enter URL in App Store Connect. Covers email, location, submissions, deletion policy.
- [ ] **In-app contact/support path** — "Contact / Support" row in ProfileScreen → `mailto:` link. Also enter in App Store Connect Support URL field.
- [ ] **App Review Notes draft** — document the admin-review content filter, the points/submission loop, and include reviewer demo account credentials.

---

## August public launch gate (8)

_Required before opening to the student body. Farming surface is too wide without these._

- [ ] **Email verification** — add `is_verified` column to users, email confirmation link on registration, block point awards for unverified accounts.
- [ ] **Account-age corroboration gate** — accounts less than 7 days old can tap corroborate but earn 0 pts.
- [ ] **Redis-backed rate limiter** — current in-memory slowapi resets on process restart and doesn't scale across Gunicorn workers.
- [ ] **Monthly burn cap / payout queue** — build a `payouts` table. When user requests a reward at 1,000pts: create a queued payout record, deduct points, founder processes via Venmo.
- [ ] **Payout request flow in the mobile app** — user-facing "Redeem $20" button on the profile screen once balance ≥ 1,000pts.
- [ ] **Admin analytics** — `api/admin/analytics.py` is an empty stub. Submission volume by day, signups by day, top submitters by points.
- [ ] **Rate limit on `POST /auth/register`** — currently 5/minute per IP in-memory. Needs Redis limiter to be meaningful.
- [ ] **`ON DELETE SET NULL`** on `submissions.related_bar_id` and `submissions.related_deal_id` — currently no ON DELETE behavior.

---

## Happy hour schedule CRUD (1)

- [ ] `api/v1/happy_hours.py` is a stub. Venue schedules cannot be viewed or edited via API. Build basic CRUD before the first football weekend.

---

## Post-launch / scaling (5)

_Not needed for launch. Revisit after the first football weekend shows what actually breaks._

- [ ] Replace in-memory Haversine geo filtering with PostGIS `ST_DWithin`
- [ ] Composite `(latitude, longitude)` index or PostGIS GIST index
- [ ] Redis cache for leaderboard and `GET /deals/active`
- [ ] Cursor-based pagination
- [ ] Bar reward redemption — future feature requiring bar partnership agreements

---

## Already Done

- [x] Multi-market architecture — Market table, market_id FK on Venue and User, signup_latitude/longitude on User
- [x] Market-scoped leaderboard — `?market_slug=` param, filters by market; 404 on unknown slug
- [x] Daily cap from DB — replaced hardcoded `DAILY_POINTS_CAP = 200` with `market.daily_points_cap`
- [x] new_bar venue assignment — approval stamps market_id from submitting user onto new Venue (feature/market-scoping)
- [x] market_slug on UserResponse/AuthUser — mobile client now knows which market it's in
- [x] Signup location wiring — registration endpoint geo-matches coordinates to a market; mobile requests location permission before submit
- [x] import_csv.py rewritten — per-market operation, scoped deletes, past-midnight time clamping
- [x] State College data imported — 9 venues, 159 deals, 95 schedules
- [x] Arlington data imported — 13 venues, 76 deals, 51 schedules
- [x] Removed stale auto-seed from app startup (was crashing backend on boot)
- [x] DATA_MODELS.md synced with live codebase
- [x] Home page redesign — "Happening Now" and "Coming Up Tonight" sections, driven by real schedule data
- [x] Working filter bubbles — All, Cocktails, Beer, Wine, Food keyword-match against deal title/category/items
- [x] Dead UI removed — bell icon, dropdown arrow, search bar, sort panel, floating animated icons all removed
- [x] Live deal accuracy — "Happening Now" checks current time against schedule start/end; "Coming Up" sorted by start time
- [x] Browse tab — removed stats banner, replaced with subtle "X deals tonight" count. Tag deduplication. Removed per-venue tag chips.
- [x] Tonight tab — live badges driven by real schedule data. Shows time range and "Live" label only for actually-live deals.
- [x] Submit tab — removed (replaced by "+" bottom tab, coming soon)
- [x] Venues now appear on map for State College — switched from `getNearby` (GPS only) to `getAll`
- [x] Data cleanup — venue + deal data verified, duplicate tags cleaned, schedules verified, CSVs re-imported
- [x] Auth system — JWT, bcrypt, register/login/refresh/me endpoints
- [x] Submissions workflow — create, pending state, admin review queue, approve/reject
- [x] Points service — atomic balance increment, PointTransaction log, non-negative CHECK constraint
- [x] Admin panel — PendingReview list, ReviewDetail with approve/reject confirmation dialogs, wired to real API
- [x] Admin venue + deal CRUD — full create/update/soft-delete with search and filtering
- [x] Security headers middleware — X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy
- [x] CORS restricted to configured origins — no longer `allow_origins=["*"]`
- [x] `DEBUG=False` by default, production guard validates at startup
- [x] Connection pool configured — `pool_size=10, max_overflow=20`
- [x] Timezone-correct happy hour filtering — uses `ZoneInfo("America/New_York")`, not server clock
- [x] `TimestampMixin` uses `datetime.now(timezone.utc)` — no more naive datetimes
- [x] `deal_ids` array referential integrity — DB trigger validates on insert/update, cleanup trigger on deal delete
- [x] Economy spec written and locked — [ECONOMY_SPEC.md](ECONOMY_SPEC.md)
- [x] Point values corrected — `points_config.py` and `constants.ts` now match the spec
- [x] Rate limiting on submissions endpoint — 10/minute
- [x] Auto-geocode on new_bar approval — Nominatim integration
- [x] 401 token refresh interceptor — silently refreshes expired tokens and retries the failed request
