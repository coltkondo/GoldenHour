# Golden Hour — Points Economy Spec

_Last updated: 2026-06-26. This is the authoritative source of truth for the points economy. The backend `points_config.py`, mobile `constants.ts`, and any admin UI must match the values here._

---

## Point Values

| Action | Submission Type | Points |
|---|---|---|
| New deal discovered | `new_deal` | 50 |
| Deal correction | `deal_update` | 50 |
| Deal marked expired | `deal_expired` | 50 |
| New bar added | `new_bar` | 100 |
| Bar marked closed | `bar_closed` | 100 |
| Bar info correction | `bar_update` | 50 |
| Corroborate existing deal | `corroborate` | 2 |
| Duplicate submission (same deal already exists) | — | 2 (corroboration rate) |
| Easter eggs / surprise drops | — | 2–10 (variable) |

A point = $0.02. A verified deal = ~$1. A corroboration = ~$0.04.

---

## Reward Threshold

**1,000 points = $20 cash.**

- Current payout: $20 via Venmo, on user request.
- Future payout: user selects a reward from a partner bar (drink, discount, etc.) at redemption.
- Points are deducted from the user's balance when a payout is processed.
- There is no automatic disbursement — the user must request it.

At 50 pts per deal submission, a user needs **20 approved submissions** to earn one reward.
At 2 pts per corroboration, a user needs **500 corroborations** to earn one reward.

Design intent: a high cash bar (~20 verified deals) over a wide, cheap reward layer. Small rewards drive engagement but are financially trivial.

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

The 200/day cap is ~4 verified deals. The founder may tune this value. It is defined as `DAILY_POINTS_CAP` in `submission_review.py`.

---

## Duplicate Submission Handling

**First-submit timestamp wins the 50; later duplicates get corroboration (2) only.**

- When two submissions cover the same venue/deal, the admin review queue should flag likely duplicates.
- Only the first submission earns full points. Later duplicates earn the corroboration rate (2 pts) on approval.
- The founder determines at review time whether the submission is a true duplicate or contains new information.

---

## Corroboration Rules

Corroboration is a lightweight "still accurate" confirmation on an existing live deal.

**When the button is available:**
- Only on deals that are active (`active = true`) and admin-verified (`verified = true`).
- Pending deals and expired deals do not show the corroborate button.

**Earning limits:**
- A user can corroborate the same deal at most **once per calendar day**.
- A user **cannot corroborate their own submission** — the original submitter is ineligible.
- Corroborations from accounts **<7 days old** OR with **zero verified originals**: display-only, earn 0.

**Status:** Not yet built. Needs endpoint, model change, and mobile UI button for August launch.

---

## Anti-Farming Design

- 2 pts per corroboration, 1,000 pt threshold → **500 corroborations per fake account per $20.**
- 200 pts/day cap → max **$4/day** per account, bounded by founder review throughput.
- All points pend on human review → no automated path to rewards.
- Corroboration on your own submission earns nothing.
- Account-age gate blocks corroboration earnings for new accounts (<7 days).
- Open signup (any email) widens the farming surface → anti-farming enforced server-side, not client-side.

---

## Monthly Burn Cap

Hard monthly burn cap on payouts. Once the cap is hit, redemption requests queue to the next month. Prevents surprise payout obligations from accumulating invisibly.

**Status:** Not yet built. Needs `payouts` table and redemption flow for August launch.

---

## What Is Not Yet Built (as of 2026-06-26)

| Feature | Status |
|---|---|
| `corroborate` submission type | Not built. Needs new endpoint, model change, and mobile UI button. |
| Duplicate detection at review time | Not built. Founder must identify duplicates manually during review. |
| Self-corroboration block | Not built. Needs check against original submitter at corroboration time. |
| Account-age corroboration gate | Not built. Accounts <7 days earn 0 from corroboration. |
| Email verification | Not built. `is_verified` column missing from ORM model. |
| Payout request flow | Not built. Current process: user messages founder → Venmo. |
| Monthly burn cap | Not built. Needs `payouts` table. |
| Easter egg / surprise drop system | Not built. Variable 2–10 pts, details TBD. |

## Already Implemented

| Feature | Status |
|---|---|
| Point values in `points_config.py` + `constants.ts` | **Done.** 50/100/2, threshold 1000. |
| Daily earn cap (200 pts/day) | **Done.** Enforced server-side in `submission_review.py`. |
| Atomic points award on approval | **Done.** SQL-level increment with `PointTransaction` audit trail. |
| No auto-approval path | **Done.** All submissions pend until admin review. |
| Admin user management (deactivate accounts) | **Done.** `admin/users.py` — list, point history, deactivate/reactivate. |
| TIMESTAMP WITH TIME ZONE migration | **Done.** All timestamp columns now timezone-aware. |
