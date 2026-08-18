# App Review Notes — Golden Hour

_Paste the content below into the "Notes for App Review" field in App Store Connect. 4,000 character limit — this draft is ~1,200 characters._

---

## Copy to paste into App Store Connect

```
Golden Hour is a community-driven happy hour discovery app. Users browse drink and food deals at local bars, and can submit new deals or corrections to help keep listings accurate.

--- DEMO ACCOUNT ---
Email: gldnhr.app@gmail.com
Password: Courtland821!
This account is an admin account with minimal usage.

--- KEY FLOWS TO TEST ---
1. Browse deals: Home tab → "Happening Now" and "Coming Up Tonight" sections show real deal data filtered to the reviewer's city. If location is outside our markets (Arlington, VA / State College, PA), use the city picker that appears on the home screen for guest users.

2. Submit a deal: Tap the Submit tab → fill out the form → submit. Submissions go into a moderation queue and are not live until approved by an admin. No deal goes public without human review.

3. Account deletion: Profile tab → scroll to bottom → "Delete Account." This permanently anonymizes the account (email, username, and password are scrubbed; the row is retained for referential integrity but all PII is removed).

4. Privacy Policy and Contact Support: Profile tab → "LEGAL & SUPPORT" section.

--- CONTENT MODERATION ---
All user-submitted deals and venue suggestions route through an admin review queue before becoming visible to other users. Reviewers approve or reject each submission individually. There is no automated or instant content publishing.

--- REWARDS ---
Users earn points when their submissions are approved, shown as a running tally on their profile. Points are a display-only engagement mechanic — they are not redeemable for cash, goods, or anything else, and there is no in-app purchase or payment flow anywhere in the app.

--- AGE RATING ---
Content references alcohol (bar deals, drink specials). App is rated 17+.
```

---

## Notes for yourself (not in the App Store Connect field)

- The demo account was created in-app and exists in the production DB. It is already in the Arlington, VA market.
- If the reviewer's device location is outside Arlington or State College, the guest city picker will appear on the home screen — they can tap it and select Arlington to see real data.
- Points are currently non-redeemable by design (no payout flow exists in-app or out). A future update will layer on bar-specific loyalty badges / achievement tallies — not decided/built yet, so nothing about that goes in the App Review copy until it ships.
- Before submitting: confirm `REWARDS_ENABLED` in Railway matches what this doc claims. If points are actively being awarded in production, that's consistent with the copy above (points still aren't redeemable either way) — just don't let this doc drift out of sync again as the rewards system evolves.
