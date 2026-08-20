# App Store Submission — Copy/Paste Kit + Walkthrough

Everything needed to actually submit Golden Hour in App Store Connect. Metadata blocks below are ready to paste as-is except copyright, which needed your name. Assets referenced live in `mobile/store-assets/`.

---

## 0. Before you start

- [x] Confirm the latest build (iPhone-only, `supportsTablet: false`, bigger splash logo) has finished processing in App Store Connect → TestFlight. Apple emails you when it's ready.
- [x] Confirm `REWARDS_ENABLED=false` is still set in Railway.

---

## 1. Metadata — copy/paste into App Store Connect → App Information / Pricing / Version fields

**Name**
```
GLDNHR
```

**Subtitle**
```
Golden Hour
```

**Description**
```
Golden Hour helps you find real happy hour deals at bars near you — built by the community that uses it.

Browse drink and food specials happening right now or coming up tonight, filtered to your city. Check the calendar for recurring happy hours and one-off events like trivia nights and live music.

Know a deal we're missing, or a spot that's closed? Submit it in seconds. Every submission goes through a quick review before it goes live, so the data stays accurate — and you earn points for helping keep it that way.

Golden Hour is for people who love going out without overpaying for it. Find your next happy hour, discover a new favorite bar, and bring your friends along.

FEATURES
• Real-time happy hour and deal listings, filtered to your city
• Calendar view for happy hours and events
• Map view to find what's nearby
• Community submissions — add deals, report changes, suggest new bars
• Points for contributing to the community
• Simple, fast, no clutter
```

**Keywords** (100-char limit, no spaces after commas — this is exactly 67 chars, ~30 left if you want to add more)
```
happy hour,bars,community,points,events,friends,deals,cheap,college
```
Optional add-ons if you want the extra room: `drinks,specials,nightlife`

**Category**
```
Primary: Food & Drink
Secondary (optional): Lifestyle
```

**Age Rating** — this is a questionnaire, not a text field. The one that matters:
```
"Alcohol, Tobacco, or Drug Use or References" → Frequent/Intense
```
That produces 17+, which matches everything else already documented. Answer the rest of the questionnaire honestly (should all be "None" elsewhere).

**Copyright**
```
© 2026 [YOUR FULL NAME]
```
No LLC exists yet, so this is your personal name — fill in the bracket yourself, not guessing it for you.

**Price**
```
Free
```

**Privacy Policy URL**
```
https://coltkondo.github.io/GoldenHour/privacy/
```

**Support URL**
```
mailto:gldnhr.app@gmail.com
```
Note: Apple's field technically wants a URL. A bare email address may get rejected by the form validation — `mailto:` is a valid URI scheme and is what's recommended here. If ASC rejects it, the fallback is standing up a one-line support page and linking that instead.

---

## 2. App Icon

```
mobile/store-assets/appstore-icon-1024.png
```
1024×1024, RGB, no alpha, no rounded corners baked in — ready to upload as-is if App Store Connect asks for a separate marketing icon. (Most current versions of ASC pull this automatically from the binary's own icon asset — if there's no separate upload field when you get there, that's expected, not a problem.)

---

## 3. Screenshots

Correction: the live Media Manager only shows **6.9"** and **6.5"** tabs, not 6.7" — the original 1290×2796 set (kept in `iphone-6.7/` for reference) doesn't fit either bucket. Two resized sets are ready instead:

```
mobile/store-assets/screenshots/iphone-6.9/   (1320×2868 — upload to the "iPhone 6.9" Display" tab)
mobile/store-assets/screenshots/iphone-6.5/   (1284×2778 — upload to the "iPhone 6.5" Display" tab)
  01-home.png
  02-venue-detail.png
  03-calendar.png
  04-profile.png
  05-splash.png
```
Same 5 shots, same order, just resized to each tab's exact required dimensions (scaled down/up ~2% from the originals — visually identical, no meaningful distortion since it's UI, not photography). Upload the `iphone-6.9` set to the 6.9" tab and the `iphone-6.5` set to the 6.5" tab, in the numbered order above. Since iPad support is off, there should be no separate iPad screenshot requirement.

---

## 4. App Review Notes

Full pre-written block, including the demo account, is in [`notes/APP_REVIEW_NOTES.md`](APP_REVIEW_NOTES.md) — copy everything inside the fenced code block under "Copy to paste into App Store Connect" into the App Review Notes field.

---

## 5. Step-by-step in App Store Connect

1. **App Information** — paste Name, Subtitle, Category, Copyright. Set Age Rating via the questionnaire.
2. **Pricing and Availability** — set to Free.
3. **Prepare for Submission (the version page)**:
   - Upload the 5 screenshots (Section 3)
   - Paste Description and Keywords (Section 1)
   - Confirm Privacy Policy URL and Support URL (Section 1)
   - **Build** — select the new iPhone-only build once it's finished processing
   - **App Review Information** — paste the block from `APP_REVIEW_NOTES.md` (Section 4), including the demo account email/password
4. Double check the age rating shows 17+ before submitting.
5. **Submit for Review.**

That's the whole path — nothing else is blocking at this point once the build finishes processing.
