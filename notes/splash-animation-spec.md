# Splash Screen Animation Spec

## Vision

A fully animated splash sequence that tells the story of the logo before revealing it.

---

## Sequence (in order)

1. **Black screen** — brief hold, app is loading in background

2. **Hourglass appears** — the upright hourglass (no slant) fades or draws in. Top chamber is full of sand. Bottom chamber is empty.

3. **Sand falls** — grains stream down through the neck of the hourglass. Crucially, instead of piling into a mound at the bottom, the grains accumulate into the shape of a martini glass — the olive, the stem, the triangular bowl. The martini glass forms grain by grain inside the bottom chamber.

4. **Spin** — once the martini is fully formed, the entire hourglass rotates ~400 degrees (slightly past a full rotation to give it momentum/snap), landing on the slanted angle of the actual logo.

5. **Hold** — brief pause on the final logo pose (matches the static splash asset exactly).

6. **Transition** — fade out into the app home screen.

---

## Technical Approach

**Library:** `@shopify/react-native-skia` — Expo-compatible canvas library that supports drawing paths, animating shapes, and running particle systems in JS. No After Effects or Lottie files needed.

**Why Skia over Animated API:** The sand particle system requires drawing ~50–100 individual grains with independent paths. React Native's `Animated` API isn't designed for this. Skia gives a real canvas with frame-by-frame control.

**Key implementation pieces:**

1. **Hourglass outline** — defined as Skia `Path` objects (two triangles + neck). Can be traced directly from the logo geometry.

2. **Sand grains** — array of ~80 small circles. Each grain has:
   - A start position (randomly distributed across the top chamber)
   - A fall path (through the neck, with slight horizontal drift)
   - A destination position (a specific XY coordinate that forms part of the martini shape)
   - A staggered start time so grains fall one after another, not all at once

3. **Martini shape coordinates** — the martini bowl, stem, base, and olive need to be mapped as a set of XY target points that grains settle into. This is the most labor-intensive part — hand-mapping ~80 points that collectively read as a martini glass when filled.

4. **Spin** — once all grains have settled, rotate the entire canvas element using `react-native-reanimated`'s `withSpring` or `withTiming` for the 400-degree rotation to the logo's resting angle.

5. **App handoff** — use `expo-splash-screen` `SplashScreen.hideAsync()` to keep the native static splash visible until the JS animation component is mounted, then crossfade.

---

## Implementation Notes

- Keep the native static splash (`app.json` splash config) as-is — it shows instantly while JS loads, before the animated component mounts.
- The animated splash component replaces the screen once JS is ready, plays the sequence, then navigates/fades to the real app.
- Total animation duration target: **2.5–3.5 seconds** — long enough to read, short enough not to annoy repeat users.
- Consider an AsyncStorage flag (`gh_splash_seen`) to skip or shorten the animation on repeat opens. First launch gets the full sequence; subsequent launches get a shorter version (just the spin + hold).

---

## Open Questions Before Building

- [ ] Does the hourglass in the animation start upright (vertical) or at the logo's slant? (Upright → spin to slant is the cleaner narrative)
- [ ] Should the olive animate separately — e.g. drop in last after the martini bowl is formed?
- [ ] Full animation on every launch, or first-launch only?
- [ ] Exact slant angle of the logo (measure from the asset before building)

---

## Effort Estimate

**1–2 days** of focused work. The martini coordinate mapping is the longest part. Everything else is wiring Skia + Reanimated.

**Sequence:** Build after initial TestFlight feedback is in and core bugs are fixed. This is a 1.0 → 1.1 polish moment, not a launch blocker.
