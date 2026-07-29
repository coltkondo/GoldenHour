# Bug Tracker

Format: `- [ ] Description` — **Priority** — _reported by / date_

Priority levels: **P0** crash / data wrong · **P1** broken feature · **P2** visual / minor

Fix a bug → check the box and add the commit: `- [x] Description — fixed in abc1234`

---

## Home Screen

<!-- deals feed, city chip, "Happening Now" / "Coming Up" sections, filter bubbles -->

- [ ] [Coming-Soon-Ended-Deals] — **P1** — Deals that have already ended for the day still show as "Coming Soon" instead of ended/inactive. Same root cause likely as [Currently-Serving-Happy-Hour] — schedule time logic needs a pass.

---

## Venue Detail (HappyHourScreen)

<!-- logo, nickname, day selector, deals per day, directions/call/website, corroborate button -->

---

## Map / Browse Tab

<!-- venue pins, map loading, filter sheet -->

- [ ] [Map-Page-Scroll] — **P1** — Bottom sheet popup does not fully expand — gets stuck awkwardly mid-screen. _(see also [Accidental-Tabs] and [Map-Swipe-Logout] — likely same root cause)_
- [ ] [Map-Swipe-Logout] — **P1** — Swiping down on the map or bottom venue panel redirects to Login screen unexpectedly. _(duplicate of [Map-Page-Scroll] swipe behavior and [Accidental-Tabs])_
- [ ] [Map-Filtering] — **P1** — Shows Happy Hours in State College when in Arlington sometimes randomly.
- [ ] [Currently-Serving-Happy-Hour] — **P1** — All locations show "Currently Serving Happy Hour" regardless of actual schedule. Same root cause likely as [Coming-Soon-Ended-Deals].
- [ ] [Map-Icon-Alignment] — **P2** — Selected venue icons are not centered/aligned correctly when a venue is selected on the map.
- [ ] [Map-Venue-Detail-Link] — **P2** — No way to open a venue's full details page from the map selection panel. Should add a "View Details" tap target.
- [ ] [Map-Bottom-Panel-UX] — **P2** — Bottom venue panel layout needs refactor. Selected venues should have a clearer, more prominent highlight/outline. _(related to [Map-Page-Scroll])_
- [x] [Courthaus-Social] — **P1** — Incorrect phone number and dead website link. Fixed in admin portal.
- [x] [Bar-Bao] — **P1** — Website button active but no website on record. Fixed in admin portal.

---

## Calendar / Events Tab

<!-- week view, event blocks, day/venue filters -->

- [ ] [Calendar-Swipe-Logout] — **P1** — Swiping down on the Calendar page redirects to Login screen unexpectedly. Same root cause as [Map-Swipe-Logout] and [Accidental-Tabs].

---

## Submit Tab (+)

<!-- submission forms, photo upload, auth wall -->

- [ ] [Submitted-Screen] — **P2** — "Submit Another" box looks bad. Needs a redesign.

---

## Profile Screen

<!-- points balance, submission history, delete account, privacy/support links -->

- [ ] [My-Submissions] — **P2** — Does not specify what the submission is. Simply says "New Deal". Should be more descriptive.
- [ ] [Contact-Support] — **P1** — Only works if native Mail app is set up. Should also route to Gmail or a web fallback.

---

## Auth (Login / Signup / Guest)

<!-- login errors, registration validation, guest mode, token refresh -->

- [ ] [Guest-No-Dark-Mode] — **P2** — Logged-out users have no option to switch between light and dark mode. Theme toggle is only accessible from Profile, which requires login.
- [ ] [Guest-No-Support] — **P2** — Logged-out users have no access to a Support/Help option. _(related to [Contact-Support])_
- [ ] [Forgot-Password] — **P1** — No recover/reset password flow anywhere in the app. Needs investigation and implementation.

---

## Admin Portal

<!-- submission queue, venue/deal CRUD, user management -->

- [x] [Approving-Submissions] — **P0** — Could not approve a New Deal submission — "Failed to Fetch" error. Root cause: mobile sends `bar_id` but backend expected `venue_id`; `bar_id` was silently dropped leaving `venue_id=null`, failing DB constraint. Fixed in 1b58ec3.
- [x] [Approving-Submissions-Screen] — **P2** — When reviewing a submission, no way to see existing deals at the same bar for comparison. Added active deals table to review detail page. Fixed in 1b58ec3.

---

## Cross-Cutting / General

<!-- performance, deep links, push notifications, onboarding -->

- [ ] [Approved-Content-Not-Visible] — **P0** — Approved deal and event submissions do not appear in the app (home screen, calendar, venue detail). Points are awarded and the submission is marked approved, but the content is invisible to users. Two root causes identified — see investigation notes below.
  - **Events**: `Event` model default is `verified=False`. The `/events/` endpoint hard-filters `Event.verified == True`. `_apply_submission` never sets `verified=True`, so every user-submitted event is permanently invisible.
  - **Deals**: `_apply_submission` creates a `Deal` row but never creates or links it to a `HappyHourSchedule`. The home screen (`/deals/today`) only returns deals whose ID appears in a schedule's `deal_ids` array. The venue detail screen (HappyHourScreen) does the same filter client-side. A newly approved deal has no schedule, so it is filtered out everywhere.
- [ ] [Accidental-Tabs] — **P1** — Swiping on Map and Calendar pages creates a series of ghost tabs the user can swipe between. Must swipe down on all tabs to return to root. Root cause shared with [Map-Swipe-Logout] and [Calendar-Swipe-Logout] — likely a navigation gesture conflict.
- [x] [Event-Submission-No-Apply] — **P1** — Approving a `new_event` submission awarded 75 pts but never created the event in the DB. Fixed: added `new_event` branch to `_apply_submission`, `EventData` schema, and admin portal label/description. Fixed in 13f2767.

---

## Post-Launch Refactors

_Not bugs. Defer until after public launch._

- [ ] [Submission-Endpoint-Split] — Split `POST /submissions/` into type-specific endpoints (`/submissions/deal`, `/submissions/venue`, etc.) for cleaner Swagger docs and more explicit API contracts. Low value vs. effort during TestFlight — current `submission_type` field handles discrimination cleanly.
