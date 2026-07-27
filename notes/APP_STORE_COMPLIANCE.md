# App Store Compliance — Golden Hour

Maps Apple App Review Guidelines (last revised Feb 6, 2026) to the actual build state. Use this before any production App Store submission.

_Arts Fest TestFlight distribution (internal, ≤100 testers) bypasses App Store review entirely — none of this blocks that build._

---

## TL;DR — Submission Readiness

| Status | Count | Detail |
|---|---|---|
| Hard blocker | 3 | Will get app rejected |
| Needs docs / review notes | 1 | Won't auto-reject but reviewer may ask |
| Confirmed passing | 9 | Verified in code |
| Metadata / ops (not code) | 2 | Handled at submission time in App Store Connect |

---

## Hard Blockers — build before App Store submission

### 1. User-initiated account deletion `(Guideline 5.1.1(v))` — MANDATORY

Any app with account creation must offer user-initiated deletion from within the app. Deactivation is not deletion.

**Current state:** `PATCH /api/admin/users/{id}/deactivate` exists but is admin-only. No `DELETE /users/me` endpoint. No delete-account UI in the mobile app.

**What to build:**
- Backend: `DELETE /api/v1/users/me` — permanently removes user record (or anonymizes and marks deleted); decide what happens to pending point balance
- Mobile: "Delete Account" option in ProfileScreen settings, confirmation dialog, then sign out and navigate to unauthenticated state

This is the most commonly missed item in App Store review and Apple has auto-rejected for it since 2022.

---

### 2. Privacy policy — in-app link required `(Guideline 5.1.1)`

Golden Hour collects email, location, and user-generated submissions. A privacy policy is required both as a clickable link inside the app AND as a URL in App Store Connect metadata.

**Current state:** No privacy policy link anywhere in the mobile app. No privacy policy document exists in the project.

**What to build:**
- Write a privacy policy covering: data collected (email, location, submissions), how it's used, third-party sharing (none currently), retention/deletion policy, how to request deletion
- Host it publicly (GitHub Pages, Notion, or a simple static page)
- Add a "Privacy Policy" link in ProfileScreen (visible to logged-out users too)
- Enter the URL in App Store Connect under App Information

---

### 3. In-app contact/support path `(Guideline 1.5)`

Users must be able to reach you. Apple checks for a support path both in-app and at the Support URL entered in App Store Connect.

**Current state:** No contact/support link anywhere in the app.

**What to build:**
- Minimum: a "Contact / Support" row in ProfileScreen that opens `mailto:support@goldenhour.app` (or your personal email)
- Enter the same email or a support URL in App Store Connect

---

## Needs review notes — not a hard blocker but a reviewer may probe

### 4. UGC content filter documentation `(Guideline 1.2)`

Apple requires apps with UGC to have a method for filtering objectionable material. Golden Hour's architecture handles this correctly (all submissions are `status: pending` until admin-approved; no raw user free-text renders publicly before review). However, this isn't visible to the reviewer without explanation.

**Current state:** `FlagReportModal.tsx` exists and handles accuracy reports (deal expired, bar closed, deal info wrong) — not content moderation. The real filter is the admin review queue in `submission_review.py`.

**What to do before submission:**
- In App Review Notes: "All user-submitted content (deal titles, descriptions, notes) enters a pending queue and is reviewed by the founder before any content is made visible to other users. No user-generated text is displayed publicly prior to approval."
- This is sufficient for a deal-discovery app with no user-to-user messaging surface. No automated filter is needed when human review is the gate.

---

## Confirmed passing — verified in code

| Guideline | Requirement | Evidence |
|---|---|---|
| 1.2 — Block abusive users | Admin can deactivate accounts | `PATCH /admin/users/{id}/deactivate` in `backend/app/api/admin/users.py:115` |
| 1.2 — Report mechanism | Users can report accuracy issues | `FlagReportModal.tsx` — deal expired, bar closed, deal info wrong |
| 1.4.3 — No encouragement of excess | All copy is utility-framed | Strings in `SubmitScreen.tsx`, `HomeScreen.tsx`: "find deals", "help build the map" — no binge/excess language |
| 5.1.1(v) — Anonymous browse | Map and deals visible without login | Anonymous browse live in `RootNavigator.tsx` — auth gate removed from root, only gated at contribute actions |
| 5.1.5 — Location purpose string | iOS purpose string present | `app.json:41` — `locationAlwaysAndWhenInUsePermission` set |
| 5.1.5 — Camera purpose string | N/A — app has no camera usage | No `expo-camera` or `ImagePicker` usage found in `mobile/src` |
| 3.2.2(x) — No reward gating on store actions | Points not tied to rating/review/download | No rating prompts or social-share requirements found anywhere |
| 2.2 — TestFlight compensation | Beta rewards not framed as testing compensation | `REWARDS_ENABLED=false` for Arts Fest beta — no points awarded during TestFlight phase |
| 3.1.1 — IAP not triggered | Cash rewards are founder→user outside app | Venmo payouts are outside the app; no in-app payments |

---

## Metadata / ops — no code required

| Item | Action |
|---|---|
| 17+ age rating `(2.3.6/2.3.8)` | Set honestly in App Store Connect age-rating questionnaire — alcohol reference will push to 17+. Metadata must be 4+ appropriate regardless. |
| Demo account for reviewer `(2.1)` | Create a dedicated `reviewer@goldenhour.app` account before submission. Include credentials in App Review Notes along with explanation of the points/submission loop. Backend must be live on Railway during review. |

---

## Notes on future features to watch

- **Easter eggs / surprise drops** — if these ever become random-draw, they risk crossing into lottery territory `(5.3)`. Keep all rewards skill/action-based (submit a verified deal), not chance-based.
- **Sign in with Apple** — only required if you add Google/Facebook/social login. Your own email/password system does not trigger `(4.8)`.
- **Bar-paid placement** — if bar sponsorships ever become an in-app digital purchase, IAP applies `(3.1.1)`. Keep B2B/outside-app to stay clear.

---

_Guidelines reference Apple's Feb 6, 2026 revision. Re-check against the live guidelines before any submission._
