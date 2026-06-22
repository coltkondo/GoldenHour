# Golden Hour — Points Economy Spec

_Last updated: 2026-06-20. This is the authoritative source of truth for the points economy. The backend `points_config.py`, mobile `constants.ts`, and any admin UI must match the values here._

---

## Point Values

| Action | Submission Type | Points |
|---|---|---|
| New deal discovered | `new_deal` | 50 |
| Deal correction | `deal_update` | 50 |
| Deal marked expired | `deal_expired` | 50 |
| New bar added | `new_bar` | 100 |
| Bar marked closed | `bar_closed` | 100 |
| Corroborate existing deal | `corroborate` | 2 |
| Duplicate submission (same deal already exists) | — | 5 |

**Special event deals** (e.g. game-day specials, limited-time promotions) are treated as `new_deal` or `deal_update` depending on whether the deal is new or a change to an existing one. No special category needed.

---

## Reward Threshold

**1,000 points = one reward.**

- Current payout: $20 via Venmo, on user request.
- Future payout: user selects a reward from a partner bar (drink, discount, etc.) at redemption.
- Points are deducted from the user's balance when a payout is processed.
- There is no automatic disbursement — the user must request it.

At 50 pts per deal submission, a user needs 20 approved submissions to earn one reward.
At 2 pts per corroboration, a user needs 500 corroborations to earn one reward.
The math deliberately makes farming via fake accounts not worth the effort.

---

## How Points Flow

1. User submits via the app → creates a `Submission` record with `status = pending`, `points_awarded = 0`.
2. Founder reviews in the admin panel → approves or rejects.
3. On approval → points from the table above are atomically credited to `users.points_balance` and a `PointTransaction` record is created.
4. Points never credit before admin approval. There is no auto-approval path.
5. On rejection → no points are awarded. The submission record reflects the rejection and admin notes.

---

## Corroboration Rules

Corroboration is a lightweight "still accurate" confirmation on an existing live deal. It is the mechanism that keeps data fresh between founder verification calls.

**When the button is available:**
- Only on deals that are active (`active = true`) and admin-verified (`verified = true`).
- Pending deals and expired deals do not show the corroborate button.

**Earning limits:**
- A user can corroborate the same deal at most **once per calendar day**.
- A user can earn corroboration points on at most **10 distinct deals per day** (20 pts/day max via corroboration alone).
- A user **cannot corroborate their own submission** — the original submitter is ineligible regardless of how long ago they submitted it.

**Why these limits exist:**
Corroboration is designed for users walking into a bar and confirming the deal is live. The daily-per-deal cap prevents a single user from repeatedly tapping the same deal. The 10-deal-per-day cap bounds daily corroboration earnings to 20 pts, which is not a meaningful farming surface at the 1,000 pt threshold.

---

## Duplicate Submission Handling

If a user submits a deal that already exists in the database (pending or live):

- The submission is accepted and reviewed normally by the founder.
- On approval, the submitter earns **5 pts** (not the full 50 pts for a genuinely new deal).
- The founder determines at review time whether the submission is a true duplicate or contains new information that warrants full points.

The low duplicate point value (5 pts vs. 50 pts) removes the incentive for users to race to submit the same deal as others.

---

## Daily Earn Cap

| Source | Daily cap per user |
|---|---|
| Submission approvals | No daily cap — bounded by founder review throughput |
| Corroboration points | 20 pts/day (10 deals × 2 pts) |

Submission approvals are not daily-capped because the bottleneck is founder review, not user submission rate. A user cannot earn more approved submissions per day than the founder can process.

---

## Anti-Farming Design

The economy is designed so that farming via multiple fake accounts is economically irrational:

- 2 pts per corroboration, 1,000 pt threshold → **500 corroborations per fake account per $20 reward.**
- 5 pts per duplicate → **200 duplicate submissions per $20 reward.**
- All points pend on human review → no automated path to rewards.
- Corroboration on your own submission earns nothing.

No device fingerprinting or account-age gate is required at launch. The point math is the primary protection. If farming patterns emerge in the admin panel, the response is account deactivation — not upfront restrictions that would also block real users.

---

## What Is Not Yet Built (as of 2026-06-20)

| Feature | Status |
|---|---|
| `corroborate` submission type | Not built. Needs new endpoint, model change, and mobile UI button. |
| Duplicate detection at review time | Not built. Founder must identify duplicates manually during review. |
| Daily corroboration cap enforcement | Not built. Needs server-side check in the corroboration endpoint. |
| Self-corroboration block | Not built. Needs check against original submitter at corroboration time. |
| Payout request flow | Not built. Current process: user messages founder → Venmo. |
| Bar reward redemption | Future feature. Requires bar partnership agreements. |
| `points_config.py` updated to these values | **Must do before any beta user submits.** Currently set to wrong values. |
| `constants.ts` updated to these values | **Must do before any beta user submits.** Currently mirrors wrong backend values. |

---

## Values to Update Immediately

**`backend/app/core/points_config.py`:**
```python
POINTS_CONFIG = {
    "new_deal": 50,
    "new_bar": 100,
    "deal_expired": 50,
    "bar_closed": 100,
    "deal_update": 50,
    "bar_update": 50,
    "corroborate": 2,
}
```

**`mobile/src/config/constants.ts`:**
```typescript
export const POINTS_CONFIG: Record<string, number> = {
  new_deal: 50,
  new_bar: 100,
  deal_expired: 50,
  bar_closed: 100,
  deal_update: 50,
  bar_update: 50,
  corroborate: 2,
};

export const REWARDS_THRESHOLD = 1000;
```
