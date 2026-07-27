# Golden Hour — App Store Review Compliance Checklist

_Companion to `golden-hour-runbook.md`, `golden-hour-master-plan.md`, and `golden-hour-claude-code-audit-brief.md`. Maps the Apple App Review Guidelines (last updated by Apple Feb 6, 2026) to Golden Hour's actual build state. Drafted for both the project folder and Claude Code._

---

## How to use this (Claude Code)

Golden Hour is a **user-generated-content app** (submit / verify / correct / remove bar deals) with a **cash-reward loop**, **open signup**, **location services**, and an **alcohol-adjacent subject**. Those four facts drive most of the risk below.

For each item marked **[ ] VERIFY**, confirm the current state against the actual code — cite files/lines — then implement if missing. Items marked **[x] LIKELY OK** are stated as probably satisfied by the existing plan/build but still deserve a code-level confirmation before submission. Items marked **[ ] BUILD** are known gaps.

Structure your response as **GO / NO-GO for App Store submission**, with each blocking item flagged plainly. Do not soften. A rejection costs a review cycle; finding the gap now is cheaper.

**Blocking vs. non-blocking:** items under "Submission blockers" below will get the app rejected if missing. Everything else is either metadata/process (handled at submission time in App Store Connect) or lower-risk.

---

## SUBMISSION BLOCKERS (build/verify before first submission)

These are the guideline items most likely to reject a Golden Hour build specifically.

### Guideline 1.2 — User-Generated Content (THE big one)

Golden Hour is fundamentally UGC. Apple requires **all four** of the following for any app with user-generated content. Missing any one is a rejection.

- [ ] **BUILD/VERIFY — Content filtering.** A method for filtering objectionable material from being posted.
  - _Golden Hour's approved-venue dropdown handles venue curation structurally, but that is not the same as filtering objectionable text._ Free-text fields (deal title, description, corroboration notes, easter-egg content) are the exposure. Confirm whether any user-submitted free text reaches other users before admin approval. If submissions pend until founder review and nothing user-authored is shown publicly pre-approval, that human review IS the filter — document that explicitly. If any user text renders to other users before approval (e.g. corroboration notes, display names), a filter is required.
  - _Files to check:_ submission model + serializers, corroboration endpoint, anywhere user free-text is returned in a public/list response.

- [ ] **BUILD — Report mechanism.** A way for users to report offensive/inaccurate content, plus a process for timely response.
  - _This does not currently appear in the build._ The "remove dead/expired deal" action is an accuracy mechanism, not an abuse-report mechanism. Add an explicit "report this content" affordance on user-visible content and a route for it to reach the admin queue.

- [ ] **BUILD — Block abusive users.** Ability to block abusive users from the service.
  - _Partial._ `admin/users.py` already has deactivate/reactivate (founder-side). Confirm whether that satisfies "block abusive users" for review purposes, or whether Apple expects a user-facing block. For a deal-discovery app with no direct user-to-user messaging, admin deactivation likely suffices — but confirm there is no user-to-user interaction surface (corroboration, comments) that would require user-level blocking.

- [ ] **VERIFY — Published contact information.** Users must be able to reach you easily.
  - Ties to Guideline 1.5. Confirm a support/contact path exists both in-app and at the Support URL used in App Store Connect.

### Guideline 5.1.1(v) — In-app account deletion (MANDATORY, commonly missed)

- [ ] **BUILD — Account deletion inside the app.** Any app that supports account creation MUST offer account deletion from within the app. Deactivation is not deletion.
  - _Golden Hour has open signup and account creation, so this is required._ `admin/users.py` deactivate is admin-side; this needs to be a **user-initiated** deletion flow. Add the endpoint + mobile UI.
  - _Interaction with the cash economy:_ decide what happens to pending points / queued payouts on deletion, and state it. Deletion must still work regardless.

### Guideline 1.4.3 — Alcohol / physical harm

- [ ] **VERIFY — No encouragement of excessive consumption.** Apps that encourage excessive alcohol consumption are prohibited; apps that encourage minors to consume are rejected.
  - Golden Hour surfaces deals — that's permitted. The risk is **copy and framing**. Audit all user-facing strings, marketing copy, easter-egg text, and bounty language for anything that reads as encouraging binge drinking or drinking games as a goal. "Find the deal" = fine; "drink the most" = not.
  - _Files to check:_ mobile `constants.ts` / string files, any seeded easter-egg content, launch-bounty copy.

### Guideline 2.3.6 / 2.3.8 — Age rating & minors (tied to open-signup decision)

- [ ] **VERIFY — Honest age rating for an alcohol-oriented app.** Answer App Store Connect age-rating questions honestly; alcohol reference will push the rating to 17+. Metadata must be 4+ appropriate regardless.
  - _Direct consequence of the no-.edu-gate / open-signup decision:_ the app must not imply its audience is children (it won't), and the age rating must reflect alcohol content. This is a submission-time metadata action, but flag it now so the rating isn't set wrong.

### Guideline 3.2.2(x) — Don't gate rewards on store actions

- [ ] **VERIFY — Rewards not tied to prohibited actions.** Apps must not force users to rate/review the app, download other apps, or take store-related actions to earn compensation (incl. points/cash/gift codes). Incentivizing in-app actions (submitting a deal, completing a level) IS allowed.
  - Golden Hour's points-for-submissions loop is fine. Confirm no bounty or reward is ever contingent on rating the app, sharing to social, or downloading anything. Cross-check launch-weekend bounty mechanics.
  - _Related:_ Guideline 5.1.2(i) — don't require enabling push/location/tracking as a condition of receiving compensation.

### Guideline 2.2 — TestFlight testers cannot be compensated

- [ ] **VERIFY — Beta rewards separated from testing.** TestFlight betas cannot be distributed to testers in exchange for compensation of any kind.
  - _Direct tension with the plan:_ the townie beta crew earns points → cash during the TestFlight phase. Keep beta-phase participation and reward-earning conceptually and operationally separate; do not frame points/cash as payment for testing. Safest: treat beta rewards as normal in-app economy activity available to all users, not as compensation for being a tester.

---

## PRIVACY (Guideline 5.1) — build + metadata

### 5.1.1 — Data collection & storage

- [ ] **BUILD/VERIFY — Privacy policy.** Required both as a link in App Store Connect metadata AND accessible in-app. Must state what data is collected, how, all uses, third-party sharing, retention/deletion, and how to revoke consent / request deletion.
  - Golden Hour collects email, location, submissions, and runs payouts. A real privacy policy is required before submission.
- [ ] **VERIFY — Consent for data collection.** Secure user consent for collected/usage data; provide a way to withdraw consent.
- [ ] **VERIFY — Data minimization.** Only request data relevant to core functionality. Email + location are justifiable (accuracy + geo-filtering). Don't request more.
- [ ] **VERIFY — No login wall if avoidable.** 5.1.1(v): if the app doesn't require account-based features to be useful, allow use without login. _Anonymous browsing is already planned/enabled — good; confirm it's live so the map is viewable pre-signup._

### 5.1.5 — Location services

- [ ] **VERIFY — Location purpose string + consent.** Explain why location is used (nearby deals / "Happening Now"); obtain consent before collecting; only use it where directly relevant. Confirm the iOS purpose string is present and accurate.

---

## PERFORMANCE / COMPLETENESS (Guideline 2)

- [ ] **VERIFY — 2.1 App completeness.** No placeholder text, no empty screens, no crashes. _Note the flagged Primanti "Happy Hour Specials" placeholder and the rotating-shot placeholder — ensure no placeholder is user-visible at submission._
- [ ] **BUILD — 2.1 Demo access for reviewer.** Provide App Review either a working demo account or a demo mode, plus review notes explaining the points/cash loop and any non-obvious features (corroboration, admin verification). The reviewer must be able to exercise the full loop.
- [ ] **VERIFY — Backend live during review.** FastAPI/Postgres/Redis must be reachable by the reviewer, not just locally. (Ties to the user-gated hosting milestone — the "first non-dev user" trigger effectively includes App Review.)
- [ ] **VERIFY — 2.3.x metadata accuracy.** Screenshots show the app in use (not just splash/login); no hidden/undocumented features; describe corroboration + points in review notes with specificity (generic descriptions get rejected).

---

## BUSINESS / PAYMENTS (Guideline 3.1)

- [x] **LIKELY OK — Cash rewards are outside-app / founder-paid.** Points redeemed for cash via founder Venmo, outside the app, is not an in-app digital-goods purchase, so IAP (3.1.1) is not triggered by the current model. **Verify nothing in-app takes a payment or unlocks in-app digital content for money** — if it doesn't, you're clear of 3.1.1.
  - _Watch for scope creep:_ if you ever sell bar-paid placement, boosts, or premium features **inside the app** as digital content, that likely requires IAP. The current monetization thesis (bar-paid placement) is B2B/outside-app and post-launch — keep it that way to stay clear, or plan for IAP if it becomes an in-app digital purchase.
- [x] **LIKELY OK — Gifting/rewards structure.** The reward is founder→user, in-app actions earn it; this isn't user-to-user P2P payment. No IAP obligation from the reward side.

---

## LEGAL / IP / CONDUCT (Guidelines 4–5)

- [ ] **VERIFY — 5.2 Intellectual property.** Venue names, logos, and any bar imagery: confirm you have rights or are using them nominatively/factually (listing a bar's name and its public deal is generally fine; using their logo as your asset may not be). The curation-favoring-local-bars stance helps but check any seeded images/logos.
- [ ] **VERIFY — 5.2.2 Third-party data.** If any deal data is scraped from a third-party service rather than founder-photographed or user-submitted, confirm you're permitted to use it. Founder-seeded-from-signage and user-submitted are clean; scraped sources are not.
- [x] **LIKELY OK — 4.1 Copycats / 4.2 Minimum functionality.** Golden Hour is a genuine UGC utility with a real loop, not a repackaged website or template — comfortably clears 4.2.
- [ ] **VERIFY — 5.6 Developer Code of Conduct / identity.** Accurate developer identity in App Store Connect. (King of Eagles entity vs. individual — 5.1.1(ix) flags that apps in *highly regulated* fields should be submitted by a legal entity. Alcohol *discovery* is not in Apple's enumerated highly-regulated list (banking, health, gambling, cannabis, crypto, air travel), so individual submission is likely acceptable — but entity submission is cleaner if available.)

---

## NON-BLOCKING / LATER

- **1.7 Reporting criminal activity** — N/A (no crime-reporting features).
- **5.3 Gambling / lotteries** — N/A **as long as** points/rewards never become a game of chance. _Watch:_ "easter eggs / surprise drops" and any "sweepstakes"-style launch mechanic could drift toward lottery territory (consideration + chance + prize). Keep bounties skill/action-based (submit a verified deal), not random-draw, to stay clear of 5.3.
- **4.8 Login services** — Sign in with Apple equivalence is only required if you add a *third-party/social* login (Google/Facebook). If you use only your own email/password system, 4.8 doesn't apply. Revisit only if social login is added.
- **1.3 / 5.1.4 Kids Category** — N/A; do not use "for kids" terms; not a kids app (alcohol content precludes it).
- **2.5.14 Recording consent** — N/A unless you add camera/mic recording. _Note:_ photo-proof submission uses the camera for a photo, not recording — but confirm the camera purpose string exists (5.1.5-style permission string) for the photo-proof flow.

---

## Pre-submission action list (condensed — for the runbook August gate)

Build/verify, in leverage order:

1. **[BUILD]** In-app user-initiated account deletion (5.1.1(v)) — mandatory, commonly missed.
2. **[BUILD]** Report-content mechanism (1.2) — mandatory for UGC.
3. **[VERIFY/BUILD]** Content-filter story documented or built (1.2) — hinges on whether user free-text is shown pre-approval.
4. **[VERIFY]** Block-abusive-users path (1.2) — confirm admin deactivation suffices given no user-to-user messaging.
5. **[BUILD]** Privacy policy — in-app link + App Store Connect (5.1.1).
6. **[BUILD]** Reviewer demo account/mode + review notes explaining the points/corroboration/cash loop (2.1).
7. **[VERIFY]** Backend reachable by reviewer (2.1).
8. **[VERIFY]** Location + camera purpose strings present and accurate (5.1.5).
9. **[VERIFY]** All user-facing/marketing copy clean of "encourage excessive drinking" framing (1.4.3).
10. **[VERIFY]** No reward gated on rate/review/download-other-app/enable-tracking (3.2.2(x), 5.1.2).
11. **[VERIFY]** Beta rewards not framed as compensation for TestFlight testing (2.2).
12. **[VERIFY]** No user-visible placeholders at submission (2.1).
13. **[VERIFY]** Honest 17+ age rating for alcohol content; metadata 4+ appropriate (2.3.6/2.3.8).

---

_Guidelines reference current as of Apple's Feb 6, 2026 revision. Apple's guidelines are a living document; re-check the live version before submission for any changes._
