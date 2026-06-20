# Golden Hour — Launch-Readiness Audit Brief for Claude Code

_Paste this whole file into Claude Code at the repo root. It gives you the product/launch context you don't currently have, then asks for a specific audit. Be honest and specific — do not reassure._

---

## Product context (what this app is)

Golden Hour is a happy-hour discovery app for college students, launching in State College, PA (Penn State). Stack: React Native (iOS-first), FastAPI backend, PostgreSQL + PostGIS. Core loop: users submit/verify/correct/remove bar deals, earn "Happy Hour Points," redeem points for cash/rewards. Accuracy is the entire value proposition. Signup is open to any email (no .edu gate for launch).

## Launch context (the stakes)

- Soft launch July (private townie beta), public student launch at the first home football weekend in late Aug/Sept.
- The founder is the **manual verification bottleneck** — points pend until a human approves them via photo proof or a phone call. Verification throughput under load is a real operational risk.
- Real cash pays out at 100 points ($20). Anything that lets points be farmed = direct financial loss.

## Points economy the code must enforce

- 5 pts: first verified new-deal submission, verified removal, verified correction.
- 1 pt: corroboration of an existing live deal.
- **First-submit timestamp** wins the 5; later duplicates get corroboration only.
- Points **pend** until manual admin verification — nothing auto-pays.
- Daily earn cap: 25 pts/day per user.
- Corroborations from accounts <7 days old OR with zero verified originals: display-only, earn 0.
- Hard monthly burn cap: payouts queue past the cap.
- Open signup — any email accepted. No .edu gate (deferred). This WIDENS the farming surface: anti-farming must be enforced server-side.

---

## What I need you to audit (be specific, cite files/lines)

**1. Correctness vs. the economy above.** Does the code actually enforce every rule? Specifically:
   - First-submit timestamp resolution when two users submit the same deal near-simultaneously (race condition?).
   - Can points ever credit before admin verification? Trace the path.
   - Daily cap + new-account corroboration rule — enforced server-side, not just client?
   - Burn-cap queuing logic.

**2. Abuse / farming surface.** Cash is on the line. Where can someone game points? Duplicate accounts, self-corroboration, fake submissions, replaying requests, client-side tampering. What's enforced server-side vs. trustingly client-side?

**3. Data integrity.** venues/deals/schedules/users/submissions/user_contributions schema — referential integrity, what happens to points/contributions when a deal is deleted, timestamp/timezone handling for happy-hour windows and first-submit ordering.

**4. Auth & open signup.** Any email is accepted (no .edu gate). Is auth/session handling sound? Since registration is open, the duplicate-account problem is the central abuse vector — how easily can one person spin up many accounts to self-corroborate or farm? Is there any rate-limiting, device/IP signal, or email-verification step on registration? Flag what would meaningfully raise the cost of mass account creation without blocking real users.

**5. Load behavior.** The first-football-weekend spike is the biggest stress. What breaks first under concurrent submissions + reads? N+1 queries, missing indexes (esp. PostGIS geo queries + first-submit ordering), unbounded queries.

**6. Launch blockers vs. nice-to-haves.** Sort findings into: (a) MUST fix before any public launch, (b) should fix before the August student push, (c) post-launch. Be ruthless about (a).

**7. What's missing entirely.** Anything the launch plan assumes exists that the code doesn't have yet (admin verification panel usable under volume? burn-cap enforcement? duplicate detection?).

## Output format I want back

For each of the 7 areas: current state (with file/line refs), specific risks, and concrete fix recommendations. End with a single **GO / NO-GO / GO-WITH-FIXES** verdict for (1) July private beta and (2) August public launch, with the short list of must-fix items for each gate.

Do not soften the assessment. I would rather hear it now than at kickoff on a football Saturday.
