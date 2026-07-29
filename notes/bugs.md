# Bug Tracker

Format: `- [ ] Description` — **Priority** — _reported by / date_

Priority levels: **P0** crash / data wrong · **P1** broken feature · **P2** visual / minor

Fix a bug → check the box and add the commit: `- [x] Description — fixed in abc1234`

Assignees: bugs tagged _(Colt)_ are assigned to Colt. Untagged = Andes.

---

## Home Screen

<!-- deals feed, city chip, "Happening Now" / "Coming Up" sections, filter bubbles -->

- [ ] [Coming-Soon-Ended-Deals] — **P1** — Deals that have already ended for the day still show as "Coming Soon" instead of ended/inactive. Same root cause likely as [Currently-Serving-Happy-Hour] — schedule time logic needs a pass.

---

## Venue Detail (HappyHourScreen)

<!-- logo, nickname, day selector, deals per day, directions/call/website, corroborate button -->

- [ ] [Corroborate-Vicinity-Gate] — **P1** — "Still Accurate" corroborate button should only appear when the user is physically within range of the bar. Currently shows regardless of location.
- [ ] [Corroborate-Daily-Cap] — **P1** — No limit on how many times a bar can be corroborated in a day. Should cap at 5 corroborations per bar per day across all users. Needs backend enforcement. _(Colt)_

---

## Map / Browse Tab

<!-- venue pins, map loading, filter sheet -->

- [ ] [Map-Page-Scroll] — **P1** — Bottom sheet popup does not fully expand — gets stuck awkwardly mid-screen. _(see also [Accidental-Tabs] and [Map-Swipe-Logout] — likely same root cause)_ _(Colt)_
- [ ] [Map-Swipe-Logout] — **P1** — Swiping down on the map or bottom venue panel redirects to Login screen unexpectedly. _(duplicate of [Map-Page-Scroll] swipe behavior and [Accidental-Tabs])_ _(Colt)_
- [ ] [Map-Filtering] — **P1** — Shows Happy Hours in State College when in Arlington sometimes randomly. _(Colt)_
- [ ] [Currently-Serving-Happy-Hour] — **P1** — All locations show "Currently Serving Happy Hour" regardless of actual schedule. Same root cause likely as [Coming-Soon-Ended-Deals]. _(Colt)_
- [ ] [Map-Icon-Alignment] — **P2** — Selected venue icons are not centered/aligned correctly when a venue is selected on the map. _(Colt)_
- [ ] [Map-Venue-Detail-Link] — **P2** — No way to open a venue's full details page from the map selection panel. Should add a "View Details" tap target. _(Colt)_
- [ ] [Map-Bottom-Panel-UX] — **P2** — Bottom venue panel layout needs refactor. Selected venues should have a clearer, more prominent highlight/outline. _(related to [Map-Page-Scroll])_ _(Colt)_
- [x] [Courthaus-Social] — **P1** — Incorrect phone number and dead website link. Fixed in admin portal.
- [x] [Bar-Bao] — **P1** — Website button active but no website on record. Fixed in admin portal.

---

## Calendar / Events Tab

<!-- week view, event blocks, day/venue filters -->

- [ ] [Events-No-Calendar-View] — **P1** — The Events toggle shows a flat card list, not a calendar. The plan was two calendar grids: one for Events (events plotted by date/time) and one for Happy Hours (existing week/day/month grid). The toggle should flip between two proper calendars, not a list and a calendar.
- [x] [Calendar-Swipe-Logout] — **P1** — Swiping down on the Calendar page redirects to Login screen unexpectedly. Same root cause as [Map-Swipe-Logout] and [Accidental-Tabs]. Fixed: `gestureEnabled: false` on Main in RootNavigator.

---

## Submit Tab (+)

<!-- submission forms, photo upload, auth wall -->

- [x] [Submitted-Screen] — **P2** — "Submit Another" box looks bad. Needs a redesign. Fixed in mobile/src/screens/SubmitScreen.tsx — success state now uses a proper card with full-width button.
- [ ] [Event-Submit-Time-Defaults-AM] — **P2** — Time picker on event submission defaults to AM. Should default to PM since most events happen in the evening. _(Colt)_
- [ ] [Event-Submit-Date-No-Picker] — **P2** — "Enter date" field is a plain text input. Should open a native calendar/date picker instead. _(Colt)_
- [ ] [Event-Submit-No-Recurring] — **P2** — No way to mark an event as recurring when submitting. Should support weekly, biweekly, or other recurrence patterns so users don't have to re-submit the same event every week.

---

## Profile Screen

<!-- points balance, submission history, delete account, privacy/support links -->

- [ ] [My-Submissions] — **P2** — Does not specify what the submission is. Simply says "New Deal". Should be more descriptive. _(Colt)_
- [ ] [My-Submissions-Show-Rejected] — **P2** — Submission history shows rejected submissions. Rejected entries aren't useful to users and could feel discouraging. Should only show pending, approved, and corroborated submissions. _(Colt)_
- [x] [Contact-Support] — **P1** — Only works if native Mail app is set up. Fixed: checks if mailto can open; if not, shows Alert with email + native Share sheet (includes Copy).

---

## Auth (Login / Signup / Guest)

<!-- login errors, registration validation, guest mode, token refresh -->

- [x] [Login-Not-Persisted] — **P1** — Login state not saved across app restarts. Root cause: 30-min JWT + refresh endpoint required a valid token to refresh. Fixed: token lifetime extended to 30 days; `auth:logout` event clears React state when refresh fails.
- [ ] [Guest-Mode-While-Logged-In] — **P2** — "Continue as Guest" option is shown or tappable even when already logged in, which is misleading. _(Colt)_
- [x] [Redirect-To-Login-While-Authenticated] — **P1** — App redirects to login even when authenticated. Root cause: refresh failure cleared AsyncStorage but not AuthContext React state. Fixed with `DeviceEventEmitter` auth:logout event.
- [x] [Session-Expired-On-Submit] — **P1** — "Session expired" on submission. Same root cause as above — 30-min token lifetime. Fixed by 30-day token + state sync on refresh failure.
- [x] [Guest-No-Dark-Mode] — **P2** — Logged-out users have no option to switch between light and dark mode. Fixed: dark mode toggle added to guest Profile view.
- [x] [Guest-No-Support] — **P2** — Logged-out users have no access to a Support/Help option. Fixed: Contact Support and Privacy Policy links added to guest Profile view.
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
  - **Events**: `Event` model default is `verified=False`. The `/events/` endpoint hard-filters `Event.verified == True`. `_apply_submission` never sets `verified=True`, so every user-submitted event is permanently invisible. _(Colt — backend one-liner)_
  - **Deals**: `_apply_submission` creates a `Deal` row but never creates or links it to a `HappyHourSchedule`. The home screen (`/deals/today`) only returns deals whose ID appears in a schedule's `deal_ids` array. The venue detail screen (HappyHourScreen) does the same filter client-side. A newly approved deal has no schedule, so it is filtered out everywhere.
- [x] [Accidental-Tabs] — **P1** — Swiping on Map and Calendar pages creates a series of ghost tabs the user can swipe between. Must swipe down on all tabs to return to root. Fixed: `gestureEnabled: false` on Main in RootNavigator stops native stack from intercepting tab-screen swipes.
- [x] [Event-Submission-No-Apply] — **P1** — Approving a `new_event` submission awarded 75 pts but never created the event in the DB. Fixed: added `new_event` branch to `_apply_submission`, `EventData` schema, and admin portal label/description. Fixed in 13f2767.

---

## Post-Launch Refactors

_Not bugs. Defer until after public launch._

- [ ] [Submission-Endpoint-Split] — Split `POST /submissions/` into type-specific endpoints (`/submissions/deal`, `/submissions/venue`, etc.) for cleaner Swagger docs and more explicit API contracts. Low value vs. effort during TestFlight — current `submission_type` field handles discrimination cleanly.
