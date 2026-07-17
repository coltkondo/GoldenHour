# Golden Hour — Build Backlog

_Economy spec: see [ECONOMY_SPEC.md](ECONOMY_SPEC.md). App Store gate detail: see [APP_STORE_COMPLIANCE.md](APP_STORE_COMPLIANCE.md)._

**36 open items.** Reprioritized against one explicit target: **TestFlight build tomorrow.**

---

## Sequencing logic (read this first)

TestFlight for internal testers (≤100 people) bypasses full App Store review — per APP_STORE_COMPLIANCE.md, none of the July beta gate or August public launch gate items block it. What blocks TestFlight is: (1) defects that make the app broken or wrong for the people who install it, and (2) the App Store submission gate items, which are Apple's baseline even for internal builds. Corroboration, email verification, Redis rate limiting, payout queues — none of these are required for tomorrow. They matter for safely opening the app to strangers, not for getting a working build onto known testers' phones.

**Tomorrow's actual bar: nothing crashes, nothing shows the wrong city's data, nothing gets the build auto-rejected.**

---

## P0 — Blocks TestFlight tomorrow, full stop

Do these today, in this order. Nothing else matters if these aren't done.

### `fix/home-market-filtering`
- [ ] **Market filtering on home page** — both markets' data is live and unfiltered right now. This is the most urgent item on the entire list: it directly undoes the reason `market_id` exists. Filter by `user.market_slug` when logged in, device coordinates when anonymous. A tester in Arlington seeing State College bars on day one is a worse first impression than a missing feature.

### `fix/map-loading`
- [ ] **Map not loading on phone** — confirmed broken on-device, cause undiagnosed (API key vs. permission race). Diagnose first (check console/network errors), then fix. A crashing core screen will get noticed by every single tester in the first five minutes.

### `fix/auth-error-surfacing`
- [ ] **401 surfacing as raw error** — Submission and Profile tabs show a raw API error instead of a login prompt when logged out. Cheap fix, but "the app shows an error message" is exactly the kind of thing that makes a beta tester assume the whole thing is broken.

### `feature/guest-mode-cta`
- [ ] **"Continue as guest" button** — anonymous browse already works at the nav level (confirmed in APP_STORE_COMPLIANCE.md), this is exposing an existing capability. Without it, testers may not realize they can browse before signing up. Likely small — do it today.

### `feature/guest-market-picker`
- [ ] **City picker modal for guests** — when an anonymous user opens the home screen with no `market_slug`, show a one-time bottom sheet: "Which city are you in?" (Arlington / State College). Store choice in AsyncStorage under `gh_guest_market` and pass it to the market filter. When the user registers, their signup coordinates overwrite it permanently. Do NOT prompt for location permission — that belongs to the registration flow, not browse.

### `feature/calendar`
- [ ] **Rebase `feature/calendar` onto main and work from there** — branch predates the multi-market merge; rebase first, then pick up the calendar work. Sequenced here because it's what we're working on today, right after the guest button.

### App Store submission gate — required for ANY TestFlight build to process, not just full release
- [ ] **User-initiated account deletion** — `DELETE /api/v1/users/me` + Delete Account UI. Most commonly auto-rejected item industry-wide.
- [ ] **Privacy policy** — write, host publicly, link in-app (ProfileScreen, visible logged-out too), enter URL in App Store Connect.
- [ ] **In-app contact/support path** — Contact/Support row → `mailto:` link. Same email in App Store Connect Support URL field.
- [ ] **App Review Notes draft** — document the admin-review content filter, the points/submission loop, include reviewer demo account credentials.

**If you can only save time in one place: the four App Store items can be done in parallel by a second person while P0 defects get fixed by whoever's in the code.** They don't depend on each other.

---

## P1 — Do immediately after TestFlight ships, before opening beyond known testers

These aren't blockers for tomorrow's build, but they're the next thing to break if skipped, and several are already-known risks with a live, unmonitored population using the app.

### `product/arlington-rehearsal-plan`
- [ ] **Define Arlington rehearsal plan** _(founder)_ — who gets access first, how many people, what you're watching for (submission flow clarity, verification pace, points loop feel — same four things the runbook named for July). Do this the moment market filtering (P0) ships, so the rehearsal group's first experience is the *correct*, filtered app — not before, not long after.

### `feature/corroboration` (spec-accurate, single branch — do not split across releases)
- [ ] Corroboration endpoint (`POST /submissions/corroborate/{deal_id}`)
- [ ] No self-corroboration guard
- [ ] One-per-deal-per-user-per-day guard
- [ ] Subject to the existing 200pt/day overall cap — **no separate corroboration sub-cap exists in ECONOMY_SPEC.md.** (Prior "25pt" and "20pt sub-cap" items were invented numbers with no spec basis — removed, not fixed.)

### `feature/duplicate-handling`
- [ ] Duplicate submission handling — flag likely duplicates in admin review queue; only first-submit earns full points, later ones route to corroboration rate.

### `feature/admin-analytics`
- [ ] Admin analytics (`api/admin/analytics.py` is a stub) — submission volume, signups, top submitters by day. **Moved up from August:** if corroboration ships in P1, you have a new farming surface live with zero visibility into whether it's being abused. Ship the dashboard alongside the feature, not months later.

### `chore/admin-panel-user-wiring`
- [ ] **Wire `admin/users.py` to the admin web panel UI** — backend (list, point history, deactivate/reactivate) is fully implemented and already confirmed done. What's left is exposing it in the UI. Your primary fraud-response tool is half-live right now — backend ready, no way to click it.

### `feature/guest-city-change`
- [ ] **Tappable city chip on home screen for guests** — once a guest picks a city, there's currently no way to change it short of reinstalling. Add a small tappable "Arlington, VA ›" subtitle on HomeScreen (guests only) that reopens the `GuestMarketPicker`. Logged-in users don't see it — their city is account-bound. Low friction, high value for multi-market demos.

---

## P2 — App Store full public submission gate (beyond TestFlight)

Not needed tomorrow. Needed before this leaves TestFlight for a real public listing.

- [ ] Confirm 17+ age rating set honestly in App Store Connect (alcohol reference)
- [ ] Confirm reviewer demo account (`reviewer@goldenhour.app`) is live and documented in App Review Notes
- [ ] Re-check APP_STORE_COMPLIANCE.md against the live Feb 2026 guidelines before any non-TestFlight submission

---

## P3 — August public launch gate (farming surface, not urgent for known testers)

Required before opening to the student body — a TestFlight group of people you know personally doesn't need these yet, per the runbook's own operational-management principle for the July beta.

### `feature/email-verification`
- [ ] Email verification — `is_verified` column exists, wire ORM + confirmation link + block point awards for unverified accounts. **Build first in this group** — it's the prerequisite for account-age gating below.

### `feature/account-age-gate`
- [ ] Account-age corroboration gate (<7 days old → 0 pts) — depends on email verification existing first.

### `infra/redis-rate-limiter`
- [ ] Redis-backed rate limiter — replaces in-memory slowapi (resets on restart, multiplies per Gunicorn worker). Also required for the `/auth/register` rate limit (currently 5/min per IP in-memory) to mean anything — one branch, not two.

### `feature/payout-queue`
- [ ] Monthly burn cap / payout queue (`payouts` table)
- [ ] Payout request flow in mobile app ("Redeem $20" button, appears at ≥1,000pts) — same branch, depends on the table existing first.

### `fix/submission-fk-ondelete`
- [ ] `ON DELETE SET NULL` on `submissions.related_bar_id` / `related_deal_id` — small, bundle into whichever migration branch is already touching submissions.

---

## P4 — Structural product work (post-TestFlight, pre-scale)

### `feature/submit-tab` (one cohesive UI branch, don't split)
- [ ] New "+" bottom tab (Instagram-style, replaces Submit sub-tab in Explore)
- [ ] Rewards progress bar (points balance toward 1,000pt/$20 threshold)
- [ ] Submission forms relocated below progress bar
- [ ] My Submissions history (accessible from "+" or Profile)

### `feature/happy-hour-crud`
- [ ] `api/v1/happy_hours.py` CRUD — needed before venue schedules can be viewed/edited via API. Sequence against your actual State College launch date (first home football weekend), not generic backlog — this is more urgent the closer that date gets.


### `feature/home-redesign`
- [ ] Home page visual redesign — **sequence after market filtering (P0) ships.** No point redesigning a feed that's currently showing the wrong city's deals.

---

## Explicitly not doing yet (correct to defer, listed so they don't get re-litigated)

- Leaderboard/rank on Profile — deferred post-beta
- Profile page layout — current version is fine, no changes planned
- PostGIS `ST_DWithin` replacing in-memory Haversine — post-launch scaling
- Composite/GIST index on lat/long — post-launch scaling
- Redis cache for leaderboard / `GET /deals/active` — post-launch scaling
- Cursor-based pagination — post-launch scaling
- Bar reward redemption — needs partnership agreements that don't exist yet

---

## Already Done

- [x] Multi-market architecture — Market table, market_id FK on Venue and User, signup_latitude/longitude on User
- [x] Market-scoped leaderboard — `?market_slug=` param, filters by market; 404 on unknown slug
- [x] Daily cap from DB — replaced hardcoded `DAILY_POINTS_CAP = 200` with `market.daily_points_cap`
- [x] new_bar venue assignment — approval stamps market_id from submitting user onto new Venue
- [x] market_slug on UserResponse/AuthUser — mobile client knows which market it's in
- [x] Signup location wiring — registration endpoint geo-matches coordinates to a market; mobile requests location permission before submit
- [x] import_csv.py rewritten — per-market operation, scoped deletes, past-midnight time clamping
- [x] State College data imported — 9 venues, 159 deals, 522 schedule rows (95 grouped `HappyHourSchedule` records)
- [x] Arlington data imported — 13 venues, 76 deals, 253 schedule rows (49 grouped `HappyHourSchedule` records — standardizing Spider Kelly's end times merged some previously-split grouping keys)
- [x] Removed stale auto-seed from app startup (was crashing backend on boot)
- [x] DATA_MODELS.md synced with live codebase
- [x] `admin/users.py` backend — list users, point history, deactivate/reactivate. Fully implemented (only UI wiring remains — see P1).
- [x] `TIMESTAMP WITH TIME ZONE` migration (`e6f7a8b9c0d1`) — ran, confirmed live.
- [x] Home page redesign — "Happening Now" / "Coming Up Tonight" sections, driven by real schedule data
- [x] Working filter bubbles — All, Cocktails, Beer, Wine, Food keyword-match
- [x] Dead UI removed — bell icon, dropdown arrow, search bar, sort panel, floating animated icons
- [x] Live deal accuracy — "Happening Now" checks current time against schedule; "Coming Up" sorted by start time
- [x] Browse tab cleanup — stats banner removed, tag deduplication, per-venue chips removed
- [x] Tonight tab — live badges driven by real schedule data
- [x] Submit tab removed (replaced by "+" tab, in progress — see P4)
- [x] Venues appear on map for State College — switched `getNearby` → `getAll`
- [x] Data cleanup — venue + deal data verified, duplicate tags cleaned, schedules verified, re-imported
- [x] Auth system — JWT, bcrypt, register/login/refresh/me endpoints
- [x] Submissions workflow — create, pending state, admin review queue, approve/reject
- [x] Points service — atomic balance increment, PointTransaction log, non-negative CHECK constraint
- [x] Admin panel — PendingReview list, ReviewDetail with approve/reject, wired to real API
- [x] Admin venue + deal CRUD — full create/update/soft-delete with search and filtering
- [x] Security headers middleware
- [x] CORS restricted to configured origins
- [x] `DEBUG=False` by default, production guard validates at startup
- [x] Connection pool configured (`pool_size=10, max_overflow=20`)
- [x] Timezone-correct happy hour filtering — `ZoneInfo("America/New_York")`
- [x] `TimestampMixin` uses `datetime.now(timezone.utc)`
- [x] `deal_ids` array referential integrity — DB triggers on insert/update/delete
- [x] Economy spec written and locked
- [x] Point values corrected — `points_config.py` and `constants.ts` match spec
- [x] Rate limiting on submissions endpoint — 10/minute
- [x] Auto-geocode on new_bar approval — Nominatim integration
- [x] 401 token refresh interceptor — silently refreshes expired tokens
- [x] Spider Kelly's hours — weekdays 4-7pm, weekends 12-5pm. Confirmed, Arlington CSV corrected.