# App Review Notes — Golden Hour

_Paste the content below into the "Notes for App Review" field in App Store Connect. 4,000 character limit — this draft is ~1,200 characters._

---

## Copy to paste into App Store Connect

```
Golden Hour is a community-driven happy hour discovery app. Users browse drink and food deals at local bars, submit new deals or corrections, and earn points redeemable for cash rewards.

--- DEMO ACCOUNT ---
Email: gldnhr.app@gmail.com
Password: Courtland123!
This account is a standard user account with pre-existing point history and one approved submission, so the points/rewards flow is visible without needing to submit and wait for admin approval.

--- KEY FLOWS TO TEST ---
1. Browse deals: Home tab → "Happening Now" and "Coming Up Tonight" sections show real deal data filtered to the reviewer's city. If location is outside our markets (Arlington, VA / State College, PA), use the city picker that appears on the home screen for guest users.

2. Submit a deal: Tap the Submit tab → fill out the form → submit. Submissions go into a moderation queue and are not live until approved by an admin. No deal goes public without human review.

3. Account deletion: Profile tab → scroll to bottom → "Delete Account." This permanently anonymizes the account (email, username, and password are scrubbed; the row is retained for referential integrity but all PII is removed).

4. Privacy Policy and Contact Support: Profile tab → "LEGAL & SUPPORT" section.

--- CONTENT MODERATION ---
All user-submitted deals and venue suggestions route through an admin review queue before becoming visible to other users. Reviewers approve or reject each submission individually. There is no automated or instant content publishing.

--- REWARDS ---
Points are earned when submissions are approved. 1,000 points = $20, paid out manually via Venmo by the Golden Hour team. There is no in-app purchase or payment flow.

--- AGE RATING ---
Content references alcohol (bar deals, drink specials). App is rated 17+.
```

---

## Notes for yourself (not in the App Store Connect field)

- The demo account was created in-app and exists in the production DB. It is already in the Arlington, VA market.
- If the reviewer's device location is outside Arlington or State College, the guest city picker will appear on the home screen — they can tap it and select Arlington to see real data.
- The "Redeem" / payout flow is not yet built in-app (P3 item). If Apple asks about the cash reward claim, the current answer is: redemption is handled manually by the team; the in-app payout button is not yet shipped.
