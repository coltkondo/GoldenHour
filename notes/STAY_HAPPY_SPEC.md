# Stay Happy: verify deck, status tiers, badges and boards

**Status:** draft, decisions from 2026-11-13 below · **Target:** v1.1, *after* the App Store resubmission · **Owner:** Andes

## Why

GoldenHour is only as good as its data. A stale deal sends someone to a bar for nothing, and they don't come back. Today verifying a deal takes effort (open the venue, find the deal, tap verify) for 2 points, and points have no visible meaning: they can't be spent, and the only place they show up is an all-time leaderboard that early users will lock up.

Stay Happy makes verifying fast and fun, and gives points a visible meaning through status, badges and weekly and per-bar boards.

**When it's worth building:** once there are roughly 30–50 weekly active users per market. Until then, boards are empty and Wrong reports never find backers. The deck still works solo: verify-only, with admin review for reports.

## Decisions

| | Decision |
|---|---|
| Name | **Stay Happy** |
| Verifying | **On-site only.** 50 m in the app, plus a 75 m check on the server |
| Badges | Keep the playful names |
| Levels | Airline-style **status tiers**, never expire |
| Wrong swipes | **0 points until backed up** by other users or an admin |
| Weekly board | Per city, resets Monday 00:00 local time, top 3 get Weekly Crown |
| Per-bar | Monthly "Top Regulars" board, a "Keeper of ___" title, and bar badges (phase 3) |

## What exists today (building on it, not replacing it)

| Piece | How it works now |
|---|---|
| Verify a deal | `POST /submissions/corroborate/{deal_id}` (`corroboration_service.corroborate_deal`). Instant 2 pts, max 1 per user per deal per day, max 5 per deal per day (`CORROBORATION_DAILY_CAP`), plus the per-market daily points cap (`market.daily_points_cap`, default 200). |
| "You must be at the bar" | **Checked only in the app** (`CORROBORATE_RADIUS_M = 50` in `HappyHourScreen`). The server has no location check. |
| Reporting a wrong deal | `deal_update` / `deal_expired` submissions (25 pts after admin review) via the full Submit form. |
| Leaderboard | `GET /leaderboard/?market_slug=&limit=`, ranked by all-time `points_balance`. |
| Points | Not redeemable (`REWARDS_ENABLED` off). Every award is recorded in `point_transactions`. |

## Feature 1: the Stay Happy deck

When you're within 50 m of a venue with live or upcoming deals, a banner appears on Home and Map:

> **You're at Zeno's Pub** · 3 deals to check · **+6 pts** → [Stay Happy]

Tapping it opens a card stack with one card per deal (title, schedule, "Last checked 3 days ago"):

- **Swipe right / ✓ Still right:** a verification. Instant +2 pts, haptics, the card flies off.
- **Swipe left / ✗ Wrong:** quick picker *Price changed (new price) · Time changed · Deal's gone*. It creates a **pending report** (see below). 0 pts for now.
- **Report cards:** if someone else has a pending report on a deal here, the card asks "Someone says drafts are $4 now. True?" ✓ / ✗.
- **End of stack:** "Zeno's is fresh 🍺 +6 pts", progress toward your next status, and any new badge.

### Rules
- Cards only for venues within **50 m**. The app sends `lat`/`lng` with each verify, and the **server rejects anything over 75 m** (GPS slack) and stores `distance_m`. Old app versions without coordinates are accepted for a transition window, then rejected.
- Existing limits stay as they are: 1 per user per deal per day, 5 per deal per day, daily points cap.

### Wrong reports need backup
1. A ✗ swipe creates a pending report. The reporter gets 0 pts.
2. **2 backers** (1 for Diamond and above) agree on the report card, **or** an admin approves it → it's validated. The reporter gets **+25**, backers get the normal +2.
3. 2 users saying it's still right → the report closes, no points, admins never see it.
4. With few users, reports fall back to the admin queue (same as today's submissions).
5. **Open:** does a validated report update the deal automatically, or go to an admin marked "2 people agree"? Start with the admin step.

Implementation: reuse `submissions` (`deal_update` / `deal_expired`) with a new `source='quick_check'`, a `pending_backing` status, and a `report_votes(user_id, submission_id, agrees, created_at)` table.

### Freshness on deal cards
"✓ Checked 2h ago", or "Not checked in 2 weeks" in muted text. Source: the latest corroboration per deal (`last_verified_at` on deal responses).

## Feature 2: status, badges, boards

### Status tiers (lifetime points earned; never expire)

| Status | Lifetime pts | Perk (cosmetic or trust; points aren't spendable) |
|---|---|---|
| Bronze | 0 | — |
| Silver | 100 | Silver ring on avatar |
| Gold | 300 | Gold name on boards |
| Platinum | 750 | Verifications count double toward a deal's freshness |
| Diamond | 1,500 | Wrong reports need 1 backer instead of 2 |
| UltraGolden | 3,000 | Animated badge; "verified by an UltraGolden" tag on deals |

Based on `users.lifetime_points`, not `points_balance`, so it still works if redemption is turned on later. A full-screen celebration on reaching a new status (confetti and haptics).

### Badges (contributing, never drinking)

| Badge | How you earn it |
|---|---|
| First Find | First approved deal |
| Fact Checker | 10 / 50 / 250 verifications (tiers) |
| Fresh Maker | Verify a deal nobody had checked in 14+ days |
| Myth Buster | A Wrong report gets validated |
| Trailblazer | Add a bar that wasn't on the map |
| Night Owl | Find an approved happy hour that runs past midnight |
| Neighborhood Pro | Verify at 5 different bars |
| Weekly Crown | Top 3 on a weekly board (stackable, shows the count) |
| *Bar* Regular | Verified deals at one bar on 5 separate days (phase 3) |

Badges for past contributions are **backfilled at launch**, so the people who built the map start with some.

### Weekly board
Points earned this week per city, computed from `point_transactions` in the market's local time and reset Monday 00:00. The leaderboard screen gets a **This week / All time** toggle, defaulting to This week. A Monday job (Railway cron, or done lazily on the first request after reset) awards Weekly Crown.

### Per-bar boards (phase 3)
- On each venue page: **Top Regulars this month**, the top 3–5 users by distinct check-in *days* at that bar in the last 30 days (a group-by on `corroborations`).
- The #1 spot is the **"Keeper of Zeno's"** (name open), shown on the venue page and the holder's profile. Others can take the title.
- **Privacy:** monthly aggregate only, never timestamps; a **"Hide me from bar boards"** setting (default open), and hidden users still earn everything.

## Apple guardrails (Guideline 1.4.3, 3.2.2, 5.1.1)
- Nothing counts drinks or visits per night, or rewards drinking more. Bar badges count *days you verified deals*, capped at one per day, and their wording is about checking deals ("Kept Zeno's deals fresh 5 times").
- Points stay unrelated to ratings and reviews of the app.
- The location check is part of the core verify action, and the existing purpose string covers it. Stored distance only, not continuous tracking.
- Public usernames on more boards: username filtering (#19) already applies. Consider report/block on usernames (Guideline 1.2) when the boards launch.

## Backend changes

| Change | Notes |
|---|---|
| Verify accepts `lat`, `lng`; 75 m server check | Migration: `corroborations.distance_m` |
| `GET /quick-check?lat&lng` | Deals at active venues within 50 m not verified by you today, plus pending report cards |
| `last_verified_at` on deal responses | One subquery |
| `users.lifetime_points` | Backfill from positive `point_transactions`; update at every award site |
| `user_badges(user_id, badge_key, tier, venue_id NULL, awarded_at)` | Checked on submission approval and on verify |
| `report_votes`, submission `source` / `pending_backing` | Phase 2 |
| `GET /me/progress` | Status, points to next tier, badges, weekly rank |
| `GET /leaderboard?period=week` | |
| `GET /venues/{id}/regulars` | Phase 3; respects the hide setting |

## App changes
Nearby banner, swipe deck, Wrong picker, report cards, end-of-stack summary, freshness line, profile status ring and badge grid (locked badges as silhouettes), leaderboard toggle and status names, venue Regulars section, celebration component (`expo-haptics` and confetti), privacy toggle.

## Phases
1. Server location check, deck (verify only), freshness line, status tiers, weekly board (~1 week)
2. Wrong reports with backers, badges and backfill, celebrations, Weekly Crown (~3–4 days)
3. Per-bar boards, Keeper title, bar badges, privacy setting (~3 days)

## Metrics
- Verifications per week (target 10× today)
- Share of live deals checked in the last 7 days (the main data-quality metric)
- Weekly active contributors
- 7-day retention of new sign-ups

## Open questions
1. Validated Wrong reports: update the deal automatically, or keep the admin step?
2. "Hide me from bar boards": on or off by default?
3. The title for #1 at a bar: "Keeper of ___", or something else?
