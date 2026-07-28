# Bug Tracker

Format: `- [ ] Description` — **Priority** — _reported by / date_

Priority levels: 
**P0** crash / data wrong 
**P1** broken feature 
**P2** visual / minor

Fix a bug → check the box and add the commit: `- [x] Description — fixed in abc1234`

---

## Home Screen

<!-- deals feed, city chip, "Happening Now" / "Coming Up" sections, filter bubbles -->


---

## Venue Detail (HappyHourScreen)

<!-- logo, nickname, day selector, deals per day, directions/call/website, corroborate button -->


---

## Map / Browse Tab

<!-- venue pins, map loading, filter sheet -->

- [Map-Page-Scroll] - **P1** - If you are on the map page and try to full screen the pop-up which includes the local areas, it does not fully come up and it kind of awkwardly in the middle of the screen. On top of that, if you hold down and swipe down, you will be taken to a login screen. Kind of a strange bug.
- [Map-Filtering] - **P1** - Shows Happy Hours in State College when I am in Arlington sometimes randomly.
- [Currently-Serving-Happy-Hour] - **P1** - Says all locations are "Currently Serving Happy Hour" when that is not true at all. Right now it is 1:30pm on a Tuesday in Arlington. Only 1 deal location is currently serving HH. Every single bar is showing that it is serving HH.
- [Courthaus-Social] - **P1** - Random fake phone number in the data. Needs to be corrected. Website button is a dead link
- [Bar-Bao] - **P1** - Website button active but no website associated. Needs correcting as well.
---

## Calendar / Events Tab

<!-- week view, event blocks, day/venue filters -->


---

## Submit Tab (+)

<!-- submission forms, photo upload, auth wall -->

- [Submitted-Screen] - **P2** - "Submit Another" box looks stupid as hell  
---

## Profile Screen

<!-- points balance, submission history, delete account, privacy/support links -->

- [My-Submissions] - **P2** - Does not specify what the submission is. Simply says "New Deal". Should be a bit more specific in my opinion.
- [Contact-Support] - **P1** - Only works if you have mail setup. I dont have mail setup so I see that as an issue. Might want to route to gmail too.

---

## Auth (Login / Signup / Guest)

<!-- login errors, registration validation, guest mode, token refresh -->


---

## Admin Portal

<!-- submission queue, venue/deal CRUD, user management -->

- [Approving-Submissions] - **P0** - When in Admin Portal, could not approve a submission for a New Deal. "Failed to Fetch" Error. Rejection worked easily. But approval failed.
- [Approving-Submissions-Screen] - **P2** - When looking at a submission, might be helpful to see the deals at that same bar and day are to compare side by side.
---

## Cross-Cutting / General

<!-- performance, deep links, push notifications, onboarding -->

- [Backend-Database] - **P1** - Considering the addition of submissions_deal, submission_venue, submission_event, submission_correction, submission_bar to make the endpoint more direct and favorable.
- [Accidental-Tabs] - **P1** - In relation to the first Map Page bug, the thing creates a series of tabs which you can swipe in and out of. It is very strange. Need to swipe down on all tabs to get back to the root full page version of the app.
