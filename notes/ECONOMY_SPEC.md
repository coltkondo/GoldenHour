# Golden Hour — Points Economy Spec

_Last updated: 2026-07-30. This is the authoritative source of truth for the points economy. The backend `points_config.py`, mobile `constants.ts`, and any admin UI must match the values here._

_Values below were halved from the original 2026-06-26 spec (new_deal 50→25, new_bar/bar_closed 100→50, etc.) — the backend was changed at some point without the spec, mobile constants, or admin UI being updated to match. All four are now back in sync._

---

## Point Values

| Action | Submission Type | Points |
|---|---|---|
| New deal discovered | `new_deal` | 25 |
| Deal correction | `deal_update` | 25 |
| Deal marked expired | `deal_expired` | 25 |
| New bar added | `new_bar` | 50 |
| Bar marked closed | `bar_closed` | 50 |
| Bar info correction | `bar_update` | 25 |
| New event submitted | `new_event` | 50 |
| Corroborate existing deal | `corroborate` | 2 |
| Duplicate submission (same deal already exists) | — | 2 (corroboration rate) |
| Easter eggs / surprise drops | — | 2–10 (variable) |

A point = $0.02. A verified deal = ~$0.50. A corroboration = ~$0.04.

---

## Reward Threshold

REWARDS NOT ACTIVE YET

**1,000 points = $20 cash.**

- Current payout: $20 via Venmo, on user request.
- Future payout: user selects a reward from a partner bar (drink, discount, etc.) at redemption.
- Points are deducted from the user's balance when a payout is processed.
- There is no automatic disbursement — the user must request it.

At 25 pts per deal submission, a user needs **40 approved submissions** to earn one reward.
At 2 pts per corroboration, a user needs **500 corroborations** to earn one reward.

Design intent: a high cash bar (~40 verified deals) over a wide, cheap reward layer. Small rewards drive engagement but are financially trivial.

---

## How Points Flow

1. User submits via the app → creates a `Submission` record with `status = pending`, `points_awarded = 0`.
2. Founder reviews in the admin panel → approves or rejects.
3. On approval → points from the table above are atomically credited to `users.points_balance` and a `PointTransaction` record is created.
4. Points never credit before admin approval. **No auto-pay path may exist.**
5. On rejection → no points are awarded. The submission record reflects the rejection and admin notes.

---

## Daily Earn Cap

**200 pts/day per user**, enforced server-side in the review/award path.

| Source | Cap behavior |
|---|---|
| Submission approvals | Subject to 200/day cap. If a user hits the cap mid-day, subsequent approvals still apply the data change but award 0 pts. |
| Corroboration points | Subject to the same 200/day cap, plus corroboration-specific limits below. |

The 200/day cap is ~8 verified deals. The founder may tune this value. It is defined per-market as `Market.daily_points_cap` (falls back to 200 if unset), enforced in `submission_review.py`.

---

## Duplicate Submission Handling

**Built.** First-submit wins the full 25; later duplicates get corroboration (2) only.

- `is_flagged_duplicate` is set automatically at submission time (not review time) — fuzzy-matches the submitted bar name (≥0.75 similarity) against active venues, then the deal title against that venue's active deals or other pending submissions (≥0.80 similarity).
- Flagged submissions still go through normal review; approval just pays the corroboration rate (2 pts) instead of the full `new_deal` rate. The admin queue shows an "⚠ Dupe?" badge; the review detail page shows a warning banner.
- The founder still determines at review time whether it's actually a true duplicate — flagging doesn't auto-reject.

---

## Corroboration Rules

Corroboration is a lightweight "still accurate" confirmation on an existing live deal.

**When the button is available:**
- Only on deals that are active (`active = true`) and admin-verified (`verified = true`).
- Pending deals and expired deals do not show the corroborate button.

**Earning limits:**
- A user can corroborate the same deal at most **once per calendar day**. Built — DB unique constraint on `(user_id, deal_id, corroborated_date)` plus an explicit check, 409 on a repeat.
- A user **cannot corroborate their own submission** — the original submitter is ineligible. Built — 403 if the caller has an *approved* submission linked to that `deal_id`.
- Corroborations from accounts **<7 days old** OR with **zero verified originals**: display-only, earn 0. **Not built.** No account-age or prior-verified-count check exists in `corroborate_deal` today — this depends on email verification shipping first (see P3 in TODO.md) and isn't enforced yet.

**Status:** Endpoint (`POST /submissions/corroborate/{deal_id}`), self-corroboration guard, and once-per-day limit are built and live. The account-age farming gate above is not.

---

## Anti-Farming Design

- 2 pts per corroboration, 1,000 pt threshold → **500 corroborations per fake account per $20.**
- 200 pts/day cap → max **$4/day** per account, bounded by founder review throughput.
- All points pend on human review → no automated path to rewards.
- Corroboration on your own submission earns nothing.
- Account-age gate (blocks corroboration earnings for new accounts <7 days) is designed but **not yet built** — see status above.
- Open signup (any email) widens the farming surface → anti-farming enforced server-side, not client-side.

---

## Monthly Burn Cap

Hard monthly burn cap on payouts. Once the cap is hit, redemption requests queue to the next month. Prevents surprise payout obligations from accumulating invisibly.

**Status:** Not yet built. Needs `payouts` table and redemption flow for August launch.

---

## What Is Not Yet Built (as of 2026-07-30)

| Feature | Status |
|---|---|
| Account-age corroboration gate | Not built. Accounts <7 days would earn 0 from corroboration — depends on email verification shipping first. |
| Email verification | Not built. `is_verified` column missing from ORM model. |
| Payout request flow | Not built. Current process: user messages founder → Venmo. |
| Monthly burn cap | Not built. Needs `payouts` table. |
| Easter egg / surprise drop system | Not built. Variable 2–10 pts, details TBD. |

## Already Implemented

| Feature | Status |
|---|---|
| Point values in `points_config.py` + `constants.ts` | **Done.** 25/50/2, threshold 1000. |
| Daily earn cap (200 pts/day) | **Done.** Per-market via `Market.daily_points_cap`, enforced server-side in `submission_review.py`. |
| Atomic points award on approval | **Done.** SQL-level increment with `PointTransaction` audit trail. |
| No auto-approval path | **Done.** All submissions pend until admin review. |
| Admin user management (deactivate accounts) | **Done.** `admin/users.py` — list, point history, deactivate/reactivate. |
| TIMESTAMP WITH TIME ZONE migration | **Done.** All timestamp columns now timezone-aware. |
| `corroborate` submission path | **Done.** `POST /submissions/corroborate/{deal_id}` — instant, no admin review. |
| Duplicate detection at submission time | **Done.** Fuzzy-matched automatically, flagged submissions pay the corroboration rate on approval. |
| Self-corroboration block | **Done.** 403 if the caller has an approved submission linked to that deal. |
