# Golden Hour — Arts Fest Beta Build Brief (Claude Code)

_Paste this into Claude Code at the repo root (branch `location/state-college`). This is a SCOPED, TIME-BOXED build for a controlled beta during Central PA Arts Fest (July 8–12, 2026). It is NOT the August public launch. Read this whole file before writing code. Updated June 26, 2026._

---

## What this build is (and isn't)

**Is:** a live, seeded, genuinely useful **browse-and-contribute** map of State College bar deals. Users can explore venues/deals and propose edits or submit new deals, which flow to the existing admin verification queue. Deployed via TestFlight to a **known, limited** crew (~15–30 hand-picked townies) during Arts Fest.

**Is NOT:** a rewards app. For this build, **all cash, points, and redemption are OFF**. No points balance, no progress-to-$20 bar, no redeem button, no payout path. There is nothing to farm.

**Why:** Arts Fest is high-volume (125k+ attendees, biggest non-football alumni weekend) but this beta is deliberately low-stakes and limited-distribution. The August anti-farming stack (email verification, corroboration guards, payout queue) is NOT built yet, so we do not expose open signup + cash to a public event. This build isolates the one thing worth testing now: **is the map useful, will people contribute, and can the founder verify submissions fast enough under real volume?** Incentives would contaminate that signal — strip them.

## Guiding principle

Do the **minimum** to ship a clean browse-and-contribute experience. Prefer **hiding/disabling** existing points & rewards UI over building anything new. Do NOT build email verification, corroboration, duplicate handling, or the payout queue for this — those are August. If a task here starts to sprawl into August scope, stop and flag it.

---

## Build tasks (priority order)

### 1. Disable the economy layer (UI + award path)
- **Hide all points/rewards UI** in the mobile app: points balance, the "progress toward $20" bar on the Submit tab, any leaderboard entry point, any "redeem" affordance. Prefer a single feature flag (e.g. `REWARDS_ENABLED = false` in `constants.ts`) gating every rewards surface, so August can flip it back on cleanly. Do NOT delete the code.
- **Server: stop awarding points.** In `submission_review.py`, gate the point-award step behind the same flag (env var, e.g. `REWARDS_ENABLED=false`). Approvals still apply the data change (the deal goes live); they just don't write PointTransaction rows or increment balances. Confirm no other endpoint credits points.
- Net effect: admin approve/reject still works, deals still go live on the map, but no points move anywhere.

### 2. Make browse work without an account (low-friction)
- Allow **anonymous browse** of venues/deals — no login required to explore the map. Gate only the **contribute** actions (propose edit / submit deal) behind signup.
- When an anonymous user taps "submit" or "propose edit," prompt a lightweight signup at that moment. Keep registration minimal (email + password; no email verification step for this build — the crew is known).
- Confirm the mobile API client handles the no-token (anonymous) state gracefully on read endpoints and only attaches auth on contribute calls.

### 3. Make the contribute flow the star
- The **propose-edit / submit-deal** flow is the one interactive thing left, so it must be obvious and fast. Someone standing outside a bar seeing a special should add it in a few taps.
- Ensure submit + "propose edit to an existing deal" both work end-to-end into the admin queue. Verify the admin PendingReview/ReviewDetail loop shows these clearly.
- Copy/microcopy: frame contributions as "help build the map." Where rewards would have been mentioned, say rewards are **coming at full launch this fall** — do NOT imply points/cash are active now.

### 4. Confirm the map is full-coverage and never empty
- The map is the entire product for this build, so it must look full on open. Verify venues load **regardless of user GPS** (the earlier nearby-only bug — confirm the fix holds; a user browsing from a couch or out of town must still see the full State College map).
- Confirm the "Happening Now" / "Coming Up Tonight" / schedule-driven sections render correctly with seeded data.
- Support an **Arts Fest event/one-off layer**: the founder will seed festival-specific specials (extended happy hours, pop-up deals). Confirm one-off/event deals with short date windows display correctly and expire cleanly.

### 5. Stability pass (this is a real crowd, even if limited install)
- Confirm the Redis-backed rate limiter is active (already shipped) so contribute endpoints can't be hammered.
- Confirm token refresh works (already shipped) so signed-in contributors don't get kicked mid-festival.
- Sanity-check the read endpoints (`GET /deals/active`, `GET /deals/today`, venue list) have the N+1 eager-loading fixes applied (already shipped) — these are the hot paths when people browse.
- Quick check: nothing in the anonymous-browse path throws if there's no auth token.

### 6. TestFlight distribution readiness
- Apple Developer enrollment is DONE. Produce an iOS build via **EAS Build** (`eas build --platform ios`), submit to App Store Connect (`eas submit`).
- Add the crew as **internal testers** (up to 100, no beta review, immediate install) — do NOT use external testers for the first build (external triggers a beta-review delay).
- Confirm the build points at the correct (seeded, production-ish) backend, not a local dev DB the crew can't reach. NOTE: deployment/hosting is user-gated — if the crew is hitting a real server for the first time, confirm it's reachable and stable before onboarding.

---

## Explicitly OUT of scope for this build (do NOT build)
- Email verification
- Corroboration feature
- Duplicate submission handling
- Payout queue / monthly burn cap
- Admin analytics
- Anything that awards or displays points/cash

These remain the August public-launch gate. This build must not touch them beyond leaving the flag off.

## Acceptance check before onboarding the crew
1. A user can browse the full State College map with **no account**.
2. Signing up + submitting a deal or proposing an edit works end-to-end into the admin queue.
3. Admin can approve/reject; approved deals go live; **no points are awarded anywhere**.
4. No rewards/points/redeem UI is visible in the app.
5. Map is full of seeded venues + deals, including Arts Fest one-offs, and never shows empty.
6. Build is installable via TestFlight internal testing on an iPhone.

When each task is done, tell me plainly what changed and what to test. Flag anything that pushes toward August scope so we can defer it.
