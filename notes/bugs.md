# Bug Tracker

Format: `- [ ] Description` — **Priority** — _reported by / date_

Priority levels: **P0** crash / data wrong · **P1** broken feature · **P2** visual / minor

Fix a bug → check the box and add the commit: `- [x] Description — fixed in abc1234`

Assignees: bugs tagged _(Colt)_ are assigned to Colt. Untagged = Andes.

---

## Home Screen

<!-- deals feed, city chip, "Happening Now" / "Coming Up" sections, filter bubbles -->

- [x] [Coming-Soon-Ended-Deals] — **P1** — After all happy hours for the day have ended (e.g. 9pm), the home screen still shows next-day deals under "Coming Soon," implying they're happening later tonight. Fixed: added `isAlreadyEnded` helper; `comingUp` now excludes already-ended slots; `allDealsEndedToday` detects when all deals have wrapped up and swaps in a "Golden Hour Has Passed Today" card with "No more deals tonight — check back tomorrow."

---

## Venue Detail (HappyHourScreen)

<!-- logo, nickname, day selector, deals per day, directions/call/website, corroborate button -->

- [x] [Corroborate-Vicinity-Gate] — **P1** — "Still Accurate" corroborate button should only appear when the user is physically within range of the bar. Currently shows regardless of location. Fixed: `checkProximity()` runs on mount using `getLastKnownPositionAsync` (instant); button only renders when `isNearby === true` (within 50m). No permission prompt on mount — if permission not yet granted, button stays hidden.
- [x] [Corroborate-Daily-Cap] — **P1** — No limit on how many times a bar can be corroborated in a day. Should cap at 5 corroborations per bar per day across all users. Needs backend enforcement. _(Colt)_

---

## Map / Browse Tab

<!-- venue pins, map loading, filter sheet -->

- [x] [Map-Page-Scroll] — **P1** — Bottom sheet popup does not fully expand — gets stuck awkwardly mid-screen. _(see also [Accidental-Tabs] and [Map-Swipe-Logout] — likely same root cause)_ _(Colt)_
- [x] [Map-Swipe-Logout] — **P1** — Swiping down on the map or bottom venue panel redirects to Login screen unexpectedly. _(duplicate of [Map-Page-Scroll] swipe behavior and [Accidental-Tabs])_ _(Colt)_
- [x] [Map-Filtering] — **P1** — Shows Happy Hours in State College when in Arlington sometimes randomly. _(Colt)_
- [x] [Currently-Serving-Happy-Hour] — **P1** — All locations show "Currently Serving Happy Hour" regardless of actual schedule. Same root cause likely as [Coming-Soon-Ended-Deals]. Fixed: the map's `VenueCard` rendered its "Currently serving happy hour" badge whenever `venue.active` (the venue-is-listed flag) was true, never checking the actual schedule. Root-caused to the fact that the map only loaded venues — no schedule/live data. Fix: extracted Home's live/ended logic into shared, testable helpers in `scheduleUtils.ts` (`isCurrentlyLive`, `isAlreadyEnded`, `todayDbIndex`), created a `useLiveVenueStatus` hook that lazily fetches each venue's weekly schedules (cached per venue id, concurrency-capped, only active venues, only today's day-of-week) and returns the set of venue ids whose happy hour is in effect right now, and gated the badge on that set — threaded through `MapScreen` → `VenueBottomSheet` → `VenueCard` via an `isLiveNow` prop. Home feed now reuses the shared helpers instead of its private copies. Unit tests added for all three helpers (boundary, midnight-crossing, and malformed cases). _(Colt)_
- [x] [Map-Icon-Alignment] — **P2** — Selected venue icons are not centered/aligned correctly when a venue is selected on the map. _(Colt)_
- [x] [Map-Venue-Detail-Link] — **P2** — No way to open a venue's full details page from the map selection panel. Should add a "View Details" tap target. _(Colt)_
- [x] [Map-Bottom-Panel-UX] — **P2** — Bottom venue panel layout needs refactor. Selected venues should have a clearer, more prominent highlight/outline. _(related to [Map-Page-Scroll])_ _(Colt)_
- [x] [Courthaus-Social] — **P1** — Incorrect phone number and dead website link. Fixed in admin portal.
- [x] [Bar-Bao] — **P1** — Website button active but no website on record. Fixed in admin portal.

---

## Calendar / Events Tab

<!-- week view, event blocks, day/venue filters -->

- [x] [Events-No-Calendar-View] — **P1** — The Events toggle shows a flat card list, not a calendar. The plan was two calendar grids: one for Events (events plotted by date/time) and one for Happy Hours (existing week/day/month grid). The toggle should flip between two proper calendars, not a list and a calendar. Fixed: built a full Day/Week/Month calendar for Events as a sibling to the existing HH calendar — `EventsCalendarContext`, `EventsCalendarHeader`, `EventsTimelineGrid`, `EventTimelineBlock`, `EventsWeekView`/`EventsDayView`/`EventsMonthView` — rather than modifying the working HH components. Key difference from HH: events place by real calendar date, not day-of-week. HH schedules are recurring rules where every week looks identical, so its `eventsForDay` just checks day-of-week; Events are dated occurrences (each a real `start_datetime`), so a copy-paste of that filter would've shown the same event every week forever — `eventsForDay` for Events filters on actual date instead. Reuses the HH grid's column-packing geometry (`layoutDay` in `dateGrid.ts`, genericized to accept either shape) rather than duplicating it. Fetches venues + events once per mount (2 months back, 7 months forward — covers the 13-week/3-month occurrence-generation windows from [Event-Submit-No-Recurring] with margin) and joins each event to its venue so tapping a block navigates correctly into `HappyHourScreen`. Recurring events show a ↻ badge. Old flat-list `EventsListView` and its helpers were deleted, not left dead. Skipped for v1 (documented gaps, not oversights): no ranked "N more" clustering like HH's dense grid (event density is much lower — plain chronological layout is enough for now); no venue/day filter bar yet.
- [x] [Calendar-Tab-Rename] — **P2** — Calendar tab was titled "Explore" with a magnifying glass icon, misleading now that it's a real calendar rather than a search/browse surface. Fixed: tab bar icon changed to `CalendarDots` (already registered in the icon set and already grouped with the other tabs' duotone weight, so no extra styling needed), tab label and in-screen header both changed to "Calendar". Left the internal route name (`ExplorerTab`) and component name (`ExploreCalendarScreen`) untouched — invisible to users, and renaming risked missing a `navigation.navigate('ExplorerTab')` call elsewhere in the app.
- [x] [Calendar-Default-View] — **P2** — Both calendars (Events and Happy Hours) opened on the Week tab by default. Fixed: `CalendarContext` and `EventsCalendarContext` both now initialize `view` state to `'day'` instead of `'week'`.
- [x] [Calendar-Timeline-Scroll-Anchor] — **P2** — Day/Week timeline views always opened scrolled to a fixed 11am, so on a typical day — where happy hours and events skew afternoon/evening — you had to manually scroll down every time to see anything. Fixed: new `scrollOffsetForEvents()` helper in `dateGrid.ts` scrolls to 30 minutes before the earliest item actually in view (clamped at midnight) instead of a fixed hour; Week view uses the earliest item across all 7 visible days so nothing in the week is scrolled past. Applied to both Day/Week views in both calendars (4 files). Considered a simpler fixed-3pm anchor instead but rejected it — a later fixed anchor would scroll past and hide any event earlier than 3pm on a given day, where the dynamic version never hides anything regardless of when things start.
- [x] [Calendar-Swipe-Logout] — **P1** — Swiping down on the Calendar page redirects to Login screen unexpectedly. Same root cause as [Map-Swipe-Logout] and [Accidental-Tabs]. Fixed: `gestureEnabled: false` on Main in RootNavigator.

---

## Submit Tab (+)

<!-- submission forms, photo upload, auth wall -->

- [x] [Submitted-Screen] — **P2** — "Submit Another" box looks bad. Needs a redesign. Fixed in mobile/src/screens/SubmitScreen.tsx — success state now uses a proper card with full-width button.
- [x] [Event-Submit-Time-Defaults-AM] — **P2** — Time picker on event submission defaults to AM. Fixed: `startAm` and `endAm` now initialize to `false` (PM) in NewEventForm.
- [x] [Event-Submit-Date-No-Picker] — **P2** — "Enter date" field is a plain text input. Should open a native calendar/date picker instead. _(Colt — needs @react-native-community/datetimepicker)_
- [x] [Event-Submit-No-Recurring] — **P2** — No way to mark an event as recurring when submitting. Fixed: NewEventForm now has a "How often?" recurrence selector (One Time / Weekly / Biweekly / Monthly / Custom). Weekly shows multi-day picker; biweekly shows single-day; monthly asks for day of month; custom shows first-occurrence date + free-text notes field. Backend generates ~13 weeks of Event rows on approval for weekly/biweekly and 3 months for monthly, all sharing a `series_id`. `EventSchedule` rows store the recurrence rule.

---

## Profile Screen

<!-- points balance, submission history, delete account, privacy/support links -->

- [x] [My-Submissions] — **P2** — Does not specify what the submission is. Simply says "New Deal". Should be more descriptive. _(Colt)_
- [x] [My-Submissions-Show-Rejected] — **P2** — Submission history shows rejected submissions. Rejected entries aren't useful to users and could feel discouraging. Should only show pending, approved, and corroborated submissions. _(Colt)_
- [x] [Contact-Support] — **P1** — Only works if native Mail app is set up. Fixed: checks if mailto can open; if not, shows Alert with email + native Share sheet (includes Copy).

---

## Auth (Login / Signup / Guest)

<!-- login errors, registration validation, guest mode, token refresh -->

- [x] [Login-Not-Persisted] — **P1** — Login state not saved across app restarts. Root cause: 30-min JWT + refresh endpoint required a valid token to refresh. Fixed: token lifetime extended to 30 days; `auth:logout` event clears React state when refresh fails.
- [x] [Guest-Mode-While-Logged-In] — **P2** — "Continue as Guest" option is shown or tappable even when already logged in, which is misleading. _(Colt)_
- [x] [Redirect-To-Login-While-Authenticated] — **P1** — App redirects to login even when authenticated. Root cause: refresh failure cleared AsyncStorage but not AuthContext React state. Fixed with `DeviceEventEmitter` auth:logout event.
- [x] [Session-Expired-On-Submit] — **P1** — "Session expired" on submission. Same root cause as above — 30-min token lifetime. Fixed by 30-day token + state sync on refresh failure.
- [x] [Guest-No-Dark-Mode] — **P2** — Logged-out users have no option to switch between light and dark mode. Fixed: dark mode toggle added to guest Profile view.
- [x] [Guest-No-Support] — **P2** — Logged-out users have no access to a Support/Help option. Fixed: Contact Support and Privacy Policy links added to guest Profile view.
- [x] [Forgot-Password] — **P1** — No recover/reset password flow anywhere in the app. Fixed: two-stage ForgotPasswordScreen (email → 6-digit OTP → new password); backend adds `/auth/forgot-password` + `/auth/reset-password` endpoints; OTP sent via Resend, SHA-256 hashed, 15-min expiry. Requires `RESEND_API_KEY` in Railway env vars.
- [x] [Signup-No-Confirm-Password] — **P2** — Signup screen has no "Confirm Password" field. Users can mistype their password with no way to catch it before submitting. Fixed: added confirm password input + mismatch validation in SignupScreen.

---

## Admin Portal

<!-- submission queue, venue/deal CRUD, user management -->

- [x] [Approving-Submissions] — **P0** — Could not approve a New Deal submission — "Failed to Fetch" error. Root cause: mobile sends `bar_id` but backend expected `venue_id`; `bar_id` was silently dropped leaving `venue_id=null`, failing DB constraint. Fixed in 1b58ec3.
- [x] [Approving-Submissions-Screen] — **P2** — When reviewing a submission, no way to see existing deals at the same bar for comparison. Added active deals table to review detail page. Fixed in 1b58ec3.

---

## Cross-Cutting / General

<!-- performance, deep links, push notifications, onboarding -->

- [x] [Expired-Deal-Orphan-Schedule] — **P1** — Approving a "deal no longer active" submission set `Deal.active = False` but left the `HappyHourSchedule` row intact with the deal's UUID still in `deal_ids`. The dead time slot continued appearing in the calendar. Fixed: `deal_expired` approval now calls `_remove_deal_from_schedules` — removes the deal UUID from all matching schedule arrays, deactivates any schedule that becomes empty. Fixed in `c4882d9`.

- [x] [Approved-Content-Not-Visible] — **P0** — Approved deal and event submissions do not appear in the app (home screen, calendar, venue detail). Points are awarded and the submission is marked approved, but the content is invisible to users. Two root causes identified — both now fixed.
  - **Events**: `Event` model default is `verified=False`. The `/events/` endpoint hard-filters `Event.verified == True`. `_apply_submission` never set `verified=True`. Fixed: `_build_event` helper sets `verified=True`; recurring events also generate occurrence rows with `verified=True` and a shared `series_id`.
  - **Deals**: Fixed — `_apply_submission` now flushes the new Deal to get its ID, then calls `_create_deal_schedules` which reads `days`/`is_all_day`/`start_time`/`end_time` from the raw submission payload and creates a `HappyHourSchedule` row per day (or appends to an existing matching schedule). All data was already being submitted by the mobile; it was being silently dropped by `DealData.extra="ignore"`. Fixed in `backend/app/services/submission_review.py`.
- [x] [Accidental-Tabs] — **P1** — Swiping on Map and Calendar pages creates a series of ghost tabs the user can swipe between. Must swipe down on all tabs to return to root. Fixed: `gestureEnabled: false` on Main in RootNavigator stops native stack from intercepting tab-screen swipes.
- [x] [Event-Submission-No-Apply] — **P1** — Approving a `new_event` submission awarded 75 pts but never created the event in the DB. Fixed: added `new_event` branch to `_apply_submission`, `EventData` schema, and admin portal label/description. Fixed in 13f2767.
- [x] [Points-Economy-Doubled-Display] — **P1** — Mobile app displayed exactly double what the backend actually awarded on approval, for every submission type except corroborate (e.g. Submit tab promised "+50 pts" for a new deal; backend paid 25). `backend/app/core/points_config.py` had been lowered at some point without `mobile/src/config/constants.ts`, the locked `notes/ECONOMY_SPEC.md`, or the admin portal's duplicate-submission warning text being updated to match. Confirmed the backend values are correct and current. Fixed: `constants.ts` POINTS_CONFIG halved to match (`new_deal`/`deal_update`/`deal_expired`/`bar_update` 25, `new_bar`/`bar_closed`/`new_event` 50, `corroborate` unchanged at 2); hardcoded `'50'` in `admin-web/ReviewDetail.tsx`'s dupe-warning banner corrected to `'25'`; `ECONOMY_SPEC.md` values and derived math (reward threshold, daily cap in deals/day, corroboration/duplicate/self-corroboration build status) brought current.

---

## Post-Launch Refactors

_Not bugs. Defer until after public launch._

- [ ] [Submission-Endpoint-Split] — Split `POST /submissions/` into type-specific endpoints (`/submissions/deal`, `/submissions/venue`, etc.) for cleaner Swagger docs and more explicit API contracts. Low value vs. effort during TestFlight — current `submission_type` field handles discrimination cleanly.
