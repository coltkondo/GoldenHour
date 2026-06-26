Golden Hour — Context & Build Brief for Claude Code

Paste this whole file into Claude Code at the repo root (branch location/state-college). It gives you the current product/launch context and the locked economy so your work matches the plan. Updated June 25, 2026.


Product context (what this app is)

Golden Hour is a happy-hour discovery app for college students, launching in State College, PA (Penn State). Stack: React Native (iOS-first), FastAPI backend, PostgreSQL + PostGIS. Core loop: users submit / verify / correct / remove bar deals, earn "Happy Hour Points," redeem points for cash. Accuracy is the entire value proposition. Signup is open to any email (no .edu gate for launch).

Launch context (the stakes)


Soft launch July (private townie beta, 10–15 hand-picked users), public student launch at the first home football weekend in late Aug/Sept.
The founder is the manual verification bottleneck — points pend until a human approves them via photo proof or a phone call. Nothing auto-pays.
Real cash pays out at 1,000 points ($20). Anything that lets points be farmed = direct financial loss.


Points economy the code must enforce (LOCKED, updated Jun 25)

ActionPointsVerified new deal50Verified removal of dead/expired deal50Verified correction of inaccurate deal50Corroboration of existing live deal2Easter eggs / surprise drops2–10 (variable)


1,000 points = $20 cash. A point = $0.02; a verified deal = ~$1; a corroboration = ~$0.04.
Design intent: a high cash bar (~20 verified deals) over a wide, cheap reward layer. Small rewards drive engagement but are financially trivial.
Points pend until manual admin verification. No auto-pay path may exist.
Daily earn cap: 200 pts/day per user (≈4 verified deals; founder may tune). Must be enforced server-side in the review/award path.
First-submit timestamp wins the 50; later duplicates get corroboration (2) only.
Corroborations from accounts <7 days old OR with zero verified originals: display-only, earn 0.
Hard monthly burn cap: payouts queue past the cap.
Open signup — any email accepted. This WIDENS the farming surface: anti-farming must be enforced server-side.



Note: Earlier audits flagged a 50-vs-5 points discrepancy. RESOLVED — 50 is the intended value. Just ensure points_config.py and mobile constants.ts agree, and that the payout threshold reads 1,000.




Current build status (per latest audit)

Working: core loop (submit → pending → admin review → approve → atomic points award with audit trail), JWT auth with bcrypt + token refresh, submission/register/login rate limiting (in-memory), PostGIS ST_DWithin geo filtering, password complexity, CORS restricted, auto-geocode for new bars.

July beta = GO-WITH-FIXES. August public launch = NO-GO until the August list below ships.

July beta — remaining must-fix


Confirm economy values — points_config.py + constants.ts read 50 / 2, payout = 1,000.
TIMESTAMP WITHOUT TIME ZONE → WITH TIME ZONE migration on users, submissions, point_transactions. Models declare DateTime(timezone=True) but columns are tz-naive; the mismatch silently corrupts first-submit ordering after DST. Do before real data accumulates.
Admin user management (admin/users.py stub) — deactivate accounts, view point history.
Set daily cap to a 50-pt-coherent number (≈200/day) and enforce server-side.


August public launch — required build list (priority order)


Email verification. The is_verified column exists in the DB but the ORM doesn't reference it. Wire it up, add the email link flow, and block point awards for unverified accounts. Highest-leverage anti-farming move and prerequisite for the account-age gate.
Corroboration feature (IN for August). Build endpoint + mobile UI + server-side rules: no self-corroboration (corroborator ≠ original submitter), one corroboration per deal per user, account-age gate (accounts <7 days or no verified original earn 0). Defined as 2 pts in config; otherwise unbuilt. Lowest-effort/highest-frequency action, so guards are mandatory.
Redis-backed rate limiter. Replace in-memory slowapi storage before any multi-worker Gunicorn deploy. In-memory resets on restart and multiplies the limit per worker.
Duplicate submission handling. When two submissions cover the same venue/deal, flag duplicates in the review queue; only first-submit earns the 50, later → corroboration.
Monthly burn cap / payout queue. Build a payouts table + redemption flow; once monthly cap hit, redemptions queue to next month.
N+1 fixes. from_orm_with_username() lazy-loads each submission's user. Add joinedload(Submission.submitter) on v1/submissions.py and admin/submissions.py. Also add eager loading on get_active_deals() / get_todays_deals().
Admin analytics (admin/analytics.py stub) — submission-volume trends to spot farming spikes from new accounts.


What I need from you

For any item above: confirm the current state against the actual code (cite files/lines), then implement. Do not soften or skip — I'd rather find gaps now than on a football Saturday. When you finish an item, tell me plainly what changed and what to test.