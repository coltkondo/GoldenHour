// Golden Hour — font system.
//
// Display: Shrikhand, a retro sign-painter face for big, bold moments
// (screen titles, venue names, hero numbers). Body: DM Sans, a clean, friendly
// sans for everything else.
//
// Custom fonts in React Native ship one family per weight, and `fontWeight` on
// a custom family is ignored or faux-bolded on Android. So instead of setting
// fontFamily at ~150 call sites, the app's <Text>/<TextInput> wrappers
// (components/ui/AppText.tsx) call resolveFont() to turn the style's
// fontSize/fontWeight into the right family. Tune the look here, in one place.

import type { TextStyle } from 'react-native';

export const DISPLAY_FONT = 'Shrikhand_400Regular';

export const BODY_FONTS = {
  300: 'DMSans_300Light',
  400: 'DMSans_400Regular',
  500: 'DMSans_500Medium',
  600: 'DMSans_600SemiBold',
  700: 'DMSans_700Bold',
  800: 'DMSans_800ExtraBold',
  900: 'DMSans_900Black',
} as const;

/** Text at least this big AND at least DISPLAY_MIN_WEIGHT bold uses the display face. */
export const DISPLAY_MIN_SIZE = 22;
export const DISPLAY_MIN_WEIGHT = 700;

/** React Native's default fontSize when none is set. */
const RN_DEFAULT_FONT_SIZE = 14;

export const fonts = {
  display: DISPLAY_FONT,
  body: BODY_FONTS[400],
  medium: BODY_FONTS[500],
  semibold: BODY_FONTS[600],
  bold: BODY_FONTS[700],
  extrabold: BODY_FONTS[800],
  black: BODY_FONTS[900],
};

export function normalizeWeight(weight: TextStyle['fontWeight']): number | undefined {
  if (weight === undefined || weight === null) return undefined;
  if (weight === 'normal') return 400;
  if (weight === 'bold') return 700;
  const n = typeof weight === 'number' ? weight : parseInt(String(weight), 10);
  return Number.isFinite(n) ? n : undefined;
}

function nearestBodyFont(weight: number): string {
  const available = Object.keys(BODY_FONTS).map(Number);
  const best = available.reduce((a, b) => (Math.abs(b - weight) < Math.abs(a - weight) ? b : a));
  return BODY_FONTS[best as keyof typeof BODY_FONTS];
}

/**
 * Font overrides to apply on top of a flattened text style.
 *
 * - An explicit `fontFamily` always wins (opt-out / opt-in to the display face).
 * - Nested <Text> with no weight of its own returns {} so it inherits its parent's font.
 * - Big + bold → display face; otherwise the DM Sans file matching the weight.
 * - `fontWeight` is cleared because the weight now lives in the family.
 */
export function resolveFont(style: TextStyle | undefined, insideText = false): TextStyle {
  const s = style ?? {};
  if (s.fontFamily) return {};

  const weight = normalizeWeight(s.fontWeight);
  if (insideText && weight === undefined) return {};

  const w = weight ?? 400;
  const size = s.fontSize ?? RN_DEFAULT_FONT_SIZE;

  if (size >= DISPLAY_MIN_SIZE && w >= DISPLAY_MIN_WEIGHT) {
    return {
      fontFamily: DISPLAY_FONT,
      fontWeight: undefined,
      // Shrikhand is already tight and wide; the old negative tracking on
      // heavy system-font headings would make letters collide.
      letterSpacing: Math.max(s.letterSpacing ?? 0, 0),
    };
  }

  return { fontFamily: nearestBodyFont(w), fontWeight: undefined };
}
