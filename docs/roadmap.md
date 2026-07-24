# Roadmap and Vision for GLDNHR

## Goal of the App

Show happy hours and let the community crowdsource the database for up-to-date deals, specials, and ways to enjoy going out cheap.

## Our Persona

Someone who at 5pm on a Thursday is asking where they should gather their squad for a social, affordable after-work hangout. Someone who enjoys going out and trying new places. Someone who isn't afraid of a beer on a Tuesday if the occasion fits. Social, community-oriented, values the experience over the price tag — but appreciates a good deal.

In essence: college students and young professionals.

---

## Rehearsal Release (TestFlight — ~10 people)

Observe how people actually use the app. What pages get opened, what gets ignored, what breaks, how the submission flow feels, whether the home feed is useful day-to-day. No major feature decisions before this data exists.

---

## Initial Release

Keep it tight. The goal is a usable, reliable core — not a feature-complete product.

* Home feed: deals happening now + coming up tonight, grouped by venue
* Basic filtering: All, Cocktails, Beer, Wine, Food
* Submissions: add deals, correct prices, report closed bars, add new bars
* Admin approval queue for all submissions
* Lightweight points economy: earn points for approved submissions — **no redemption, no leaderboard yet**. Points exist solely to build the submission habit from day one. A database that goes stale kills the app; the incentive to keep it fresh must ship with v1.
* Map view
* Calendar view (happy hour schedules)
* Basic profile: points balance + submission history

---

## Update 1 — Events

The feature that turns a "check it once a week" app into a "check it every day" app. Karaoke Wednesday, trivia Thursday, bar crawl Saturday — these are time-sensitive and drive urgency in a way that static happy hour schedules don't.

* Events table: karaoke, trivia, dance classes, one-off specials, community nights
* Calendar pivots to events-first (events as the primary view, happy hour schedules as a secondary tab)
* Bar partners can submit events through the same submission pipeline
* Begin outreach to local bars for event coordination

---

## Update 2 — App-Specific Deals (the moat)

This is the feature Yelp and Google cannot replicate. A deal that exists exclusively in the app, redeemed through the app, verified by a bartender tap. Bars get a direct marketing channel to the exact demographic they want. Users get deals they can't find anywhere else.

* Bar partnership program: bars submit exclusive in-app deals
* In-app deal redemption flow: user taps "Redeem," bartender confirms
* This creates a reason for bars to engage with the platform and a reason for users to open the app before they've even decided where they're going

---

## Update 3 — Push Notifications + Favorites

Notifications are only valuable if there's something worth notifying about. By Update 3, there is: exclusive deals going live, events at favorite bars, happy hours starting soon.

* Favorite bars and deal categories saved to profile
* Push notifications: happy hour starting at a favorited bar, new event added nearby, exclusive deal unlocked
* APNS/FCM setup, notification preferences in profile

---

## Update 4 — Community + Leaderboard

Once the submission habit is established and the data is healthy, surface the social layer.

* Leaderboard: top contributors by market, all-time and monthly
* Points become visible and competitive — not just a backstage mechanic
* Profile customization: display name, badge for top contributors
* Advanced admin analytics: submission volume, top submitters, corroboration rates, farming detection

---

## Update 5 — Rewards Economy

Only viable if bar partnerships (Update 2) are in place, or if a fair payout model is worked out. Don't ship this without a funding mechanism.

* Points redeemable for cash or bar credit (pending partnership agreements)
* Monthly payout queue
* Redemption flow in-app

---

## Update 6 — Expansion

Prove the model in one or two markets first. State College and Arlington as the template. When the playbook is repeatable — seeded data, bar partnerships, community traction — expand.

* Identify next market (college town or dense young-professional city)
* Replicate bar outreach and data seeding process
* Market-specific leaderboards and events

---

## Brand Event Sponsorships

By this point the Events pipeline is live, the notification layer exists, and there's a real user base across multiple markets. That combination is worth paying for.

Brands like Tito's, Happy Dad, Venmo, and others already spend money hosting in-bar events that most people only hear about through text or by walking in by accident. GLDNHR becomes the channel that fixes that. A brand submits their event through a dedicated partner pipeline, it gets a sponsored flag, and a push notification goes to every user in that market the morning of. The brand gets guaranteed reach to the exact demographic they're activating for. First partnerships done manually and offered free to prove the attendance lift — then charged per send once the data is there.

* Sponsored event submission pipeline for brand partners
* "Presented by [Brand]" label on event cards and notifications
* Outreach to campus brand reps for Tito's, Happy Dad, and similar
* Per-notification pricing model once reach is proven

---

## B2B Bar Dashboard

Bars that are already partners (events, exclusive deals) want to know if it's working. This is the SaaS layer that sits on top of everything already built — no additional user-facing work required.

* Bar manager login with a simple dashboard: deal views, event attendance estimates, exclusive deal redemption counts
* Weekly summary email to bar managers (automated)
* Gives bars a reason to stay engaged with the platform and a data-driven reason to renew or expand their partnership
* Monthly subscription pricing — bars are already paying for far worse marketing

---

## Bar Loyalty Card

Bars like Cafe 210 (55 Days challenge) and PMans already run loyalty stamp programs through physical books. Move it into the app with a mechanic that can't be gamed — the code can never leave the bar's possession.

How it works: user opens app and taps "Get Stamp." A blind PIN pad appears on their screen. The bartender — not the user — enters a 4-digit shift code directly on the user's phone (digits hidden, like a card PIN). App validates server-side, stamp logs, user gets their phone back without ever seeing the code. Shift codes are generated by GLDNHR and sent to the bar manager each morning, rotate per shift. Bartender knows their code the same way they know their register code.

* Venue-specific stamp challenges: "Visit 10 times, earn a free drink"
* Blind PIN entry UI — bartender punches in shift code on user's device
* Daily/per-shift code rotation managed by GLDNHR
* Bar manager dashboard shows challenge completion rates
* Requires active bar partnership — not available to unclaimed venues

---

## Bar Loyalty — NFC Upgrade

Once bars are bought into the loyalty program, offer the premium version: a $1 NFC sticker behind the bar. User taps their phone to it, stamp logs automatically. No bartender involvement, no PIN, zero friction. The sticker encodes a venue-specific token; the app validates proximity and logs the visit server-side.

* NFC tag provisioning for partner bars
* Instant tap-to-stamp with no manual entry
* Falls back to blind PIN for bars that haven't upgraded
* iOS NFC background scanning + Android NFC support

---

## Bar Crawl Builder

Fun feature that makes sense once the data is mature across multiple markets and events are established. The app already has all the ingredients — venues, happy hour schedules, events, maps. This assembles them into a planned night out.

User picks a start time and number of stops. App builds a route where happy hour windows actually overlap so you're not showing up at Bar 2 after their special ends. Crawl is shareable as a link or in-app invite. Could layer in a Bar Golf scoring mode down the line — points per stop based on challenge completion — though how aggressively to promote that is a product call for when the time comes.

* Time-aware routing: only suggests stops where windows overlap with your planned arrival
* Shareable crawl link for groups
* Crawl history saved to profile
* Could link to Bar games like Bar Golf

---

## Ideas Parking Lot

* Host events at bars directly (GLDNHR-sponsored nights)
* "Squad mode": share a shortlist of bars with friends, vote on where to go
* Corroboration geofencing: require GPS proximity to the venue before allowing a corroboration tap — makes the accuracy signal meaningful (someone physically there confirmed it) and prevents farming from home. Venues already have lat/lng, app already has location permission. Simple check, high data quality payoff.
