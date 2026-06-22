# Golden Hour — Build Backlog

_Generated from the June 2026 launch-readiness audit and economy design session._
_Economy spec: see [ECONOMY_SPEC.md](ECONOMY_SPEC.md)._

---

## Ship before any beta user touches the app

- [x] Fix point values in `points_config.py` and `constants.ts` — was 50/25/15, now 50/100 per economy spec
- [x] Add `@limiter.limit("10/minute")` to `POST /submissions/` in `api/v1/submissions.py` — currently unthrottled, a logged-in user can spam the queue
- [ ] Implement 25pt/day corroboration cap — max 10 corroborations × 2pts per user per day, enforced server-side in the corroboration endpoint (not yet built)
- [ ] Add 401 token refresh interceptor to `mobile/src/api/client.ts` — tokens expire after 30 minutes with no silent refresh, users get kicked mid-session
- [x] Auto-geocode `new_bar` submissions via Nominatim on admin approval — `_apply_submission` resolves name+address to lat/lng when coordinates are missing

---

## July private beta gate

_The beta can run without these, but each one is a real operational or financial risk during the townie test period._

- [ ] **Corroboration feature** — new `corroborate` submission type, endpoint at `POST /submissions/corroborate/{deal_id}`, enforce: verified+active deals only, 1 per user per deal per day, block original submitter from corroborating their own deal, mobile UI button on deal cards
- [ ] **Daily corroboration cap** — server-side check: if user has earned ≥20 corroboration pts today, return 0 pts (not an error — the tap still registers, just earns nothing)
- [ ] **Duplicate submission handling** — when admin approves a submission for a deal that already exists, award 5pts not 50pts. Currently both get full credit. Admin UI should flag likely duplicates in the review queue.
- [ ] **Admin user management** — `api/admin/users.py` is an empty stub. Need: list users, view a user's point history, deactivate an account. This is the primary fraud-response tool.
- [ ] **`TIMESTAMP WITH TIME ZONE` migration** — `users`, `submissions`, and `point_transactions` tables were created with `TIMESTAMP WITHOUT TIME ZONE`. Models declare `DateTime(timezone=True)`. Fix via a new Alembic migration before real transaction data accumulates.

---

## August public launch gate

_Required before opening to the student body. Farming surface is too wide without these._

- [ ] **Email verification** — add `is_verified` column to users, email confirmation link on registration, block point awards for unverified accounts. This is the foundation everything else below depends on.
- [ ] **Account-age corroboration gate** — once email verification exists: accounts less than 7 days old can tap corroborate but earn 0 pts. Raises the cost of mass fake accounts without blocking real users.
- [ ] **Redis-backed rate limiter** — current in-memory slowapi resets on process restart and doesn't scale across Gunicorn workers. Move to Redis before multi-worker deployment.
- [ ] **Monthly burn cap / payout queue** — build a `payouts` table. When user requests a reward at 1,000pts: create a queued payout record, deduct points, founder processes via Venmo. Prevents surprise payout obligations from accumulating invisibly.
- [ ] **Payout request flow in the mobile app** — user-facing "Redeem $20" button on the profile screen once balance ≥ 1,000pts. Currently no UI or endpoint for this.
- [ ] **Admin analytics** — `api/admin/analytics.py` is an empty stub. Need before the first football weekend: submission volume by day, new account signups by day, top submitters by points. Early warning system for farming patterns.
- [ ] **Rate limit on `POST /auth/register`** — currently 5/minute per IP in-memory. With Redis limiter (above), this becomes meaningful. Without it it's theater.
- [ ] **`ON DELETE SET NULL`** on `submissions.related_bar_id` and `submissions.related_deal_id` — currently no ON DELETE behavior, an admin cleaning up a venue will hit an FK IntegrityError.

---

## Happy hour schedule CRUD

_Separate track — blocking for data quality but not directly tied to the points economy._

- [ ] `api/v1/happy_hours.py` is a stub (3-line comment). Venue schedules cannot be viewed or edited via API. Admin must use direct DB access to manage hours. Build basic CRUD before the first football weekend so schedules can be corrected without a DB client.

---

## Post-launch / scaling

_Not needed for launch. Revisit after the first football weekend shows what actually breaks._

- [ ] Replace in-memory Haversine geo filtering with PostGIS `ST_DWithin` — currently loads all bounding-box venues into Python memory per request
- [ ] Composite `(latitude, longitude)` index or PostGIS GIST index — current separate btree indexes on each column don't help range queries efficiently  
- [ ] Redis cache for leaderboard and `GET /deals/active` — both are uncached DB hits on every request
- [ ] Cursor-based pagination — current offset pagination degrades at scale
- [ ] Bar reward redemption — future feature requiring bar partnership agreements; replace the Venmo payout with in-app reward selection

---

## Already done

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
