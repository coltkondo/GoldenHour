# Beta Launch Sprint — Golden Hour

> **Goal:** App ready for 10–15 iOS beta users within 1 week.  
> **Context:** Owner is in State College Days 1–4 collecting every happy hour manually via Google Forms → Google Sheets (one row per deal). Returns Day 4–5 to ingest data and launch.

---

## Timeline

| Day(s) | Who | What |
|--------|-----|------|
| 1–4 | Engineering | Pre-work: all fixes + data pipeline built |
| 1–4 | Owner | Field research: collect every SC happy hour into Google Sheet |
| 4–5 | Owner + Eng | Ingest data, verify, fix any import issues |
| 5–7 | Owner + Eng | Final testing, distribute to beta users |

---

## Phase 1 — Engineering Pre-Work (Days 1–4)

Do all of this while owner is in the field. Each item is independent — can be parallelized.

---

### Fix 1 — Switch Map from Google Maps → Apple MapKit

**Priority:** P0 blocker. The map is currently broken — `"YOUR_GOOGLE_MAPS_API_KEY"` placeholder in config means no map renders.

**Why Apple Maps:** iOS-only beta, zero cost, zero API key setup. `react-native-maps` falls through to Apple MapKit automatically when no Google key is configured.

**Files to change:**

- [mobile/app.json](mobile/app.json) — remove the `ios.config.googleMapsApiKey` block entirely and remove `android.config.googleMaps` block
- [mobile/src/screens/MapScreen.tsx](mobile/src/screens/MapScreen.tsx) — remove the `customMapStyle` prop (it's a Google Maps feature; ignored by Apple Maps silently, but cleaner to remove). Apple Maps respects iOS system dark mode natively.

**Before:**
```json
"ios": {
  "config": {
    "googleMapsApiKey": "YOUR_GOOGLE_MAPS_API_KEY"
  }
}
```

**After:**
```json
"ios": {
  "supportsTablet": true,
  "bundleIdentifier": "com.goldenhour.app"
}
```

**Verify:** `npx expo start` → Map tab → Apple Maps renders with venue pins.

---

### ✅ Fix 2 — Remove JWT Logging from Production Builds
> **DONE** — commits `3d5fb5f` · 3 tests in `mobile/src/__tests__/apiClient.test.ts`

**Priority:** P1 security. Every API request logs the full `Authorization: Bearer <token>` to console.

**File:** [mobile/src/api/client.ts](mobile/src/api/client.ts) around line 24

**Change:** Wrap `console.log('API Request:', config)` in `if (__DEV__) { ... }`

---

### ✅ Fix 3 — Add React Error Boundary
> **DONE** — commits `3edc6b1` · 5 tests in `mobile/src/__tests__/ErrorBoundary.test.ts`

**Priority:** P1. Any single component crash currently kills the entire app with a black screen. Users have to force-quit.

**New file:** `mobile/src/components/ErrorBoundary.tsx`

```tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface State { hasError: boolean; }

export class ErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Something went wrong</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => this.setState({ hasError: false })}
          >
            <Text style={styles.buttonText}>Tap to retry</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a1a1a' },
  title: { color: '#fff', fontSize: 18, marginBottom: 20 },
  button: { backgroundColor: '#FF6B35', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
```

**Wire it up** in [mobile/App.tsx](mobile/App.tsx) or [mobile/src/navigation/RootNavigator.tsx](mobile/src/navigation/RootNavigator.tsx):
```tsx
import { ErrorBoundary } from './src/components/ErrorBoundary';

// Wrap the root:
<ErrorBoundary>
  <RootNavigator />
</ErrorBoundary>
```

---

### ✅ Fix 4 — Refresh Points Balance on Profile Focus
> **DONE** — commits `30b6e27` · 6 tests in `mobile/src/__tests__/profilePointsRefresh.test.ts`

**Priority:** P1. User earns points via submission, sees "+50 pts" toast, goes to Profile — balance hasn't changed. Breaks the core engagement loop.

**Root cause:** Points are fetched once on `ProfileScreen` mount and never re-fetched.

**File:** [mobile/src/screens/ProfileScreen.tsx](mobile/src/screens/ProfileScreen.tsx)

**Change:** Replace `useEffect` that fetches points with `useFocusEffect` so it re-fetches every time the screen gains focus:

```tsx
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';

// Replace the points fetch useEffect with:
useFocusEffect(
  useCallback(() => {
    fetchPointsBalance();
  }, [])
);
```

---

### Fix 5 — Disable Notification Toggle (Coming Soon)

**Priority:** P1. The "Happy Hour Alerts" toggle does nothing but store local state. Beta users will toggle it on, get no notifications, and assume the app is broken.

**File:** [mobile/src/screens/ProfileScreen.tsx](mobile/src/screens/ProfileScreen.tsx) around line 178

**Change:** Set `disabled={true}` on the Switch and update the hint text:
```tsx
<Switch
  value={false}
  disabled={true}
  trackColor={{ false: d.filterInactive, true: d.live }}
  thumbColor={d.background}
/>
// hint text:
<Text>Notifications coming soon</Text>
```

---

### Fix 6 — Set DEBUG Default to False in Backend

**Priority:** P1. If `DEBUG` env var is not set in production, SQLAlchemy `echo=True` dumps every SQL query (including password hash queries) to stdout.

**File:** [backend/app/core/config.py](backend/app/core/config.py) around line 32

**Change:**
```python
# Before:
DEBUG: bool = True
# After:
DEBUG: bool = False
```

Also confirm Railway environment has `DEBUG=false` and `ENVIRONMENT=production` set explicitly.

---

### Fix 7 — Fix Hardcoded Happy Hour Countdown Time

**Priority:** P2. `Math.max(hour + 1, 17)` forces "next happy hour" to always show 5pm regardless of actual schedule. Will show wrong times for SC venues with e.g. 4pm or 3pm happy hours.

**File:** [mobile/src/screens/HomeScreen.tsx](mobile/src/screens/HomeScreen.tsx) around line 541–546

**Change:** Use the actual `start_time` from the nearest upcoming `HappyHourSchedule` in the deal data, not a hardcoded 17.

---

### Fix 8 — Build Data Import Script (Google Sheets → DB)

**Priority:** Critical path. This is the mechanism for getting field data into the app.

**New file:** `backend/scripts/import_gsheets.py`

**What it does:**
1. Reads a CSV exported from Google Sheets (flat format, one row per deal)
2. Groups rows by `venue_name` to create unique Venue records
3. Auto-geocodes venue addresses via Nominatim (OpenStreetMap — free, no API key needed)
   - Caches geocode results so each venue is only geocoded once
   - Falls back to State College center (40.7934, -77.8600) with a warning if geocoding fails
   - Respects Nominatim's 1 req/sec rate limit
4. Creates one Deal per row
5. Parses the `days` column (comma-separated: `Mon,Tue,Wed`) into `HappyHourSchedule` records
6. Supports `--force` flag to clear all existing data before import
7. Supports `--dry-run` flag to preview without writing to DB
8. Prints a summary: N venues, M deals, K schedules

**Usage:**
```bash
cd backend
# Preview only:
python -m scripts.import_gsheets data/state_college_export.csv --dry-run

# Import (clears existing data first):
python -m scripts.import_gsheets data/state_college_export.csv --force
```

---

## Google Form Schema (For Owner — Field Collection)

The import script expects these exact column names (case-insensitive, spaces OK). Set up the Google Form with these fields:

| Column | Type | Required | Notes |
|--------|------|----------|-------|
| `venue_name` | Short text | ✅ | Exact bar name — must be consistent across rows |
| `address` | Short text | ✅ | Full address, e.g. "108 S Pugh St, State College, PA" |
| `phone` | Short text | | Optional |
| `website` | Short text | | Optional |
| `venue_type` | Multiple choice | ✅ | Bar / Sports Bar / Restaurant / Cocktail Bar / Dive Bar |
| `neighborhood` | Short text | | Default: "Downtown" if blank |
| `deal_name` | Short text | ✅ | e.g. "$3 Truly" or "Half Price Wings" |
| `deal_price` | Number | ✅ | Price during happy hour, e.g. 3.00 |
| `original_price` | Number | | Regular price (for discount calc), optional |
| `is_drink` | Checkbox | ✅ | Yes/No |
| `is_food` | Checkbox | ✅ | Yes/No |
| `days` | Checkboxes | ✅ | Mon / Tue / Wed / Thu / Fri / Sat / Sun (multi-select) |
| `start_time` | Short text | ✅ | e.g. "4:00 PM" or "16:00" |
| `end_time` | Short text | ✅ | e.g. "7:00 PM" or "19:00" |
| `notes` | Paragraph | | Optional notes |

**Export:** File → Download → Comma-separated values (.csv) → place in `backend/data/`

---

## Phase 2 — Data Ingestion (Day 4–5)

When owner returns from SC:

```bash
# 1. Export Google Sheets to CSV, place it at:
backend/data/state_college_export.csv

# 2. Dry run — review what will be imported
cd backend
python -m scripts.import_gsheets data/state_college_export.csv --dry-run

# 3. Real import
python -m scripts.import_gsheets data/state_college_export.csv --force

# 4. Verify in admin-web (http://localhost:5173)
#    Check: venues list, deals, schedules all look right

# 5. Test mobile app with real data
npx expo start
```

**Common issues to check:**
- Venue names must be consistent across all deal rows for the same venue (the script groups by exact name)
- Time format: "4:00 PM", "4 PM", "16:00" all supported — mixed formats in the sheet are fine
- Missing coordinates: any venue the geocoder can't resolve will show a warning and fall back to city center coords — manually fix after import via admin-web

---

## Phase 3 — Final Testing + Distribution (Days 5–7)

### End-to-End Test Checklist

- [ ] Cold start → no blank screen
- [ ] Map tab → Apple Maps renders, State College venue pins visible
- [ ] Tap a pin → HappyHourScreen opens with real deals + schedule
- [ ] HomeScreen → real deals with correct times and categories
- [ ] Search bar → filters deals/venues
- [ ] Sort button → Nearest / Best Deal modes work
- [ ] ExplorerScreen → venue list + Tonight tab shows active deals
- [ ] Auth: Register new account → Login → Profile shows 0 points
- [ ] QuickSubmit: Submit a tip → go to Profile → points updated (Fix 4 validates this)
- [ ] Dark mode toggle → all screens respect it
- [ ] Tap phone/directions/website on HappyHourScreen → opens correct app

### Beta Distribution

**Option A — Expo Go (fastest, no Apple account needed):**
```bash
cd mobile
npx expo start --tunnel
```
Send testers the QR code. They install Expo Go from App Store and scan.

**Option B — TestFlight (better experience, requires Apple Developer account):**
```bash
npm install -g eas-cli
eas build --platform ios --profile preview
# Upload .ipa to TestFlight → invite testers by email
```

### Backend Production Checklist

Before distributing to testers, confirm in Railway:

| Variable | Value |
|----------|-------|
| `SECRET_KEY` | 32+ char random string (not the dev default) |
| `DEBUG` | `false` |
| `ENVIRONMENT` | `production` |
| `DATABASE_URL` | Railway-injected |
| `ALLOWED_ORIGINS` | Your frontend domain (not `*`) |
| `LOG_FORMAT` | `json` |

Generate a secret key:
```bash
python3 -c "import secrets; print(secrets.token_hex(32))"
```

---

## What We're NOT Building for Beta (Intentional Scope Cuts)

| Feature | Why Deferred |
|---------|-------------|
| Push notifications | Backend not implemented; toggle disabled in UI (Fix 5) |
| Bookmarks persistence | Good beta feedback item; marked as known gap |
| Rate limiting | Safe at 10–15 users; add before public launch |
| Token refresh | Session expires at 30 min; user re-logs in; acceptable |
| Offline support | Not needed for testing in bars |
| Android support | iOS-only beta |
| Admin-web hardening | Admin-facing, internal-only |

---

## Known Beta Gaps to Tell Testers

When distributing, set expectations:

1. **Saved venues reset on app restart** — not persisted yet, working on it
2. **No push notifications** — coming in v1.1
3. **Sessions expire after 30 minutes** — you may need to log in again
4. **This is beta** — please report anything broken via the in-app submit form

---

## Files Changed Summary

| File | Change | Status |
|------|--------|--------|
| `mobile/app.json` | Remove Google Maps API key config from iOS + Android | ⬜ Fix 1 |
| `mobile/src/screens/MapScreen.tsx` | Remove `customMapStyle` prop | ⬜ Fix 1 |
| `mobile/src/api/client.ts` | Wrap `console.log` in `__DEV__` guard | ✅ Fix 2 · `3d5fb5f` |
| `mobile/src/__tests__/apiClient.test.ts` | **New** — 3 tests for `__DEV__` guard | ✅ Fix 2 · `3d5fb5f` |
| `mobile/src/components/ErrorBoundary.tsx` | **New** — React error boundary | ✅ Fix 3 · `3edc6b1` |
| `mobile/App.tsx` | Wrap root with `<ErrorBoundary>` | ✅ Fix 3 · `3edc6b1` |
| `mobile/package.json` | Add `jsx: react` to jest transform for `.tsx` test support | ✅ Fix 3 · `3edc6b1` |
| `mobile/src/__tests__/ErrorBoundary.test.ts` | **New** — 5 tests for ErrorBoundary | ✅ Fix 3 · `3edc6b1` |
| `mobile/src/screens/ProfileScreen.tsx` | `useFocusEffect` to refresh points on focus | ✅ Fix 4 · `30b6e27` |
| `mobile/src/__tests__/profilePointsRefresh.test.ts` | **New** — 6 tests for points refresh logic | ✅ Fix 4 · `30b6e27` |
| `mobile/src/screens/ProfileScreen.tsx` | Disable notification toggle | ⬜ Fix 5 |
| `mobile/src/screens/HomeScreen.tsx` | Fix hardcoded `Math.max(hour+1, 17)` | ⬜ Fix 7 |
| `backend/app/core/config.py` | `DEBUG: bool = False` | ⬜ Fix 6 |
| `backend/scripts/import_gsheets.py` | **New** — flat CSV import with Nominatim geocoding | ⬜ Fix 8 |
