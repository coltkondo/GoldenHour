// Golden Hour — Color System (Light + Dark)

export type ThemeMode = 'light' | 'dark';

export interface ColorPalette {
  background: string;
  surface: string;
  primary: string;
  secondary: string;
  text: string;
  cardBackground?: string;
  cardBorder?: string;
  cardBackgroundAlt?: string;
  buttonPrimary?: string;
  buttonPrimaryText?: string;
  buttonSecondary?: string;
  buttonSecondaryText?: string;
  inputBackground?: string;
  inputBorder?: string;
  inputPlaceholder?: string;
  badgeBackground?: string;
  badgeText?: string;
  filterActive?: string;
  filterActiveForeground?: string;
  filterInactive?: string;
  filterInactiveText?: string;
  selectedSurface?: string;
  selectedBorder?: string;
  selectedText?: string;
  tabBar?: string;
  tabBarActive?: string;
  tabBarInactive?: string;
  navPill?: string;
  border?: string;
  borderStrong?: string;
  divider?: string;
  surfaceAlt?: string;
  surfaceDeep?: string;
  success?: string;
  error?: string;
  warning?: string;
  live?: string;
  textSecondary?: string;
  textMuted?: string;
  textHint?: string;
  toastBackground?: string;
  discovery?: string;
}

// "Golden hour sunset": neon gold is the brand, sunset pink marks what's live/hot,
// tangerine is the secondary accent. Dark = dusk plum-black; light = warm cream.
// In light mode gold is used for FILLS (buttons, chips, badges) with plum text on
// top, and accent TEXT uses a deeper sunset pink, since gold text on cream is unreadable.

const dark: ColorPalette = {
  background: '#1A1020',
  surface: '#26182E',
  primary: '#FFC23D',
  secondary: '#FF8A3D',
  text: '#FBF1E6',
  cardBackground: '#221529',
  cardBorder: '#35243F',
  cardBackgroundAlt: '#2A1B33',
  buttonPrimary: '#FFC23D',
  buttonPrimaryText: '#1A1020',
  buttonSecondary: '#35243F',
  buttonSecondaryText: '#FFC23D',
  inputBackground: '#26182E',
  inputBorder: '#35243F',
  inputPlaceholder: '#8A7896',
  badgeBackground: '#FFC23D',
  badgeText: '#1A1020',
  filterActive: '#FFC23D',
  filterActiveForeground: '#1A1020',
  filterInactive: '#2E1F37',
  filterInactiveText: '#A08FA8',
  selectedSurface: 'rgba(255,194,61,0.12)',
  selectedBorder: 'rgba(255,194,61,0.35)',
  tabBar: '#1A1020',
  tabBarActive: '#FFC23D',
  tabBarInactive: '#8A7896',
  navPill: '#1A1020',
  border: '#35243F',
  borderStrong: '#46304F',
  divider: '#35243F',
  surfaceAlt: '#2A1B33',
  surfaceDeep: '#2E1F37',
  success: '#3DD68C',
  error: '#FF5A5F',
  warning: '#FF8A3D',
  live: '#FF4F81',
  textSecondary: '#C9B8CC',
  textMuted: '#A08FA8',
  textHint: '#8A7896',
  toastBackground: '#2E1F37',
  discovery: '#A78BFA',
};

const light: ColorPalette = {
  background: '#FFF7EC',
  surface: '#FFFFFF',
  primary: '#C4265A',
  secondary: '#E8661C',
  text: '#2A1A22',
  cardBackground: '#FFFFFF',
  cardBorder: '#F0E2CF',
  cardBackgroundAlt: '#FFF0DD',
  buttonPrimary: '#FFC23D',
  buttonPrimaryText: '#2A1A22',
  buttonSecondary: '#FBE7CC',
  buttonSecondaryText: '#C4265A',
  inputBackground: '#FFFFFF',
  inputBorder: '#F0E2CF',
  inputPlaceholder: '#8E7883',
  badgeBackground: '#FFC23D',
  badgeText: '#2A1A22',
  filterActive: '#FFC23D',
  filterActiveForeground: '#2A1A22',
  filterInactive: '#F6E8D6',
  filterInactiveText: '#75606C',
  selectedSurface: 'rgba(255,194,61,0.18)',
  selectedBorder: 'rgba(196,38,90,0.35)',
  tabBar: '#FFF7EC',
  tabBarActive: '#C4265A',
  tabBarInactive: '#8E7883',
  navPill: '#FFF7EC',
  border: '#F0E2CF',
  borderStrong: '#E5CFB4',
  divider: '#F0E2CF',
  surfaceAlt: '#FFF0DD',
  surfaceDeep: '#FBE7CC',
  success: '#1F9D68',
  error: '#D93A3F',
  warning: '#E8661C',
  live: '#C4265A',
  textSecondary: '#6E5A66',
  textMuted: '#75606C',
  textHint: '#8E7883',
  toastBackground: '#FBE7CC',
  discovery: '#7C5CE0',
};

export const colorPalettes: Record<ThemeMode, ColorPalette> = {
  dark,
  light,
};

export function getColors(mode: ThemeMode): ColorPalette {
  return colorPalettes[mode];
}

export interface DerivedTokens {
  background: string;
  surface: string;
  primary: string;
  secondary: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  textHint: string;
  border: string;
  borderStrong: string;
  divider: string;
  surfaceAlt: string;
  surfaceDeep: string;
  cardBackground: string;
  cardBackgroundAlt: string;
  cardBorder: string;
  buttonPrimary: string;
  buttonPrimaryText: string;
  buttonSecondary: string;
  buttonSecondaryText: string;
  inputBackground: string;
  inputBorder: string;
  inputPlaceholder: string;
  badgeBackground: string;
  badgeText: string;
  filterActive: string;
  filterActiveForeground: string;
  filterInactive: string;
  filterInactiveText: string;
  selectedSurface: string;
  selectedBorder: string;
  tabBar: string;
  tabBarActive: string;
  tabBarInactive: string;
  navPill: string;
  success: string;
  error: string;
  warning: string;
  live: string;
  toastBackground: string;
  discovery: string;
}

export function deriveTokens(c: ColorPalette): DerivedTokens {
  const fallback = dark;
  return {
    background: c.background ?? fallback.background!,
    surface: c.surface ?? fallback.surface!,
    primary: c.primary ?? fallback.primary!,
    secondary: c.secondary ?? fallback.secondary!,
    text: c.text ?? fallback.text!,
    textSecondary: c.textSecondary ?? fallback.textSecondary!,
    textMuted: c.textMuted ?? fallback.textMuted!,
    textHint: c.textHint ?? fallback.textHint!,
    border: c.border ?? fallback.border!,
    borderStrong: c.borderStrong ?? fallback.borderStrong!,
    divider: c.divider ?? fallback.divider!,
    surfaceAlt: c.surfaceAlt ?? fallback.surfaceAlt!,
    surfaceDeep: c.surfaceDeep ?? fallback.surfaceDeep!,
    cardBackground: c.cardBackground ?? fallback.cardBackground!,
    cardBackgroundAlt: c.cardBackgroundAlt ?? fallback.cardBackgroundAlt!,
    cardBorder: c.cardBorder ?? fallback.cardBorder!,
    buttonPrimary: c.buttonPrimary ?? fallback.buttonPrimary!,
    buttonPrimaryText: c.buttonPrimaryText ?? fallback.buttonPrimaryText!,
    buttonSecondary: c.buttonSecondary ?? fallback.buttonSecondary!,
    buttonSecondaryText: c.buttonSecondaryText ?? fallback.buttonSecondaryText!,
    inputBackground: c.inputBackground ?? fallback.inputBackground!,
    inputBorder: c.inputBorder ?? fallback.inputBorder!,
    inputPlaceholder: c.inputPlaceholder ?? fallback.inputPlaceholder!,
    badgeBackground: c.badgeBackground ?? fallback.badgeBackground!,
    badgeText: c.badgeText ?? fallback.badgeText!,
    filterActive: c.filterActive ?? fallback.filterActive!,
    filterActiveForeground: c.filterActiveForeground ?? fallback.filterActiveForeground!,
    filterInactive: c.filterInactive ?? fallback.filterInactive!,
    filterInactiveText: c.filterInactiveText ?? fallback.filterInactiveText!,
    selectedSurface: c.selectedSurface ?? fallback.selectedSurface!,
    selectedBorder: c.selectedBorder ?? fallback.selectedBorder!,
    tabBar: c.tabBar ?? fallback.tabBar!,
    tabBarActive: c.tabBarActive ?? fallback.tabBarActive!,
    tabBarInactive: c.tabBarInactive ?? fallback.tabBarInactive!,
    navPill: c.navPill ?? fallback.navPill!,
    success: c.success ?? fallback.success!,
    error: c.error ?? fallback.error!,
    warning: c.warning ?? fallback.warning!,
    live: c.live ?? fallback.live!,
    toastBackground: c.toastBackground ?? fallback.toastBackground!,
    discovery: c.discovery ?? fallback.discovery!,
  };
}

export const brand = {
  gold: '#FFC23D',
  tangerine: '#FF8A3D',
  pink: '#FF4F81',
  violet: '#A78BFA',
  sky: '#7FB7E8',
  green: '#3DD68C',
  // Legacy names kept so existing imports keep working.
  amber: '#FF8A3D',
  orange: '#FF8A3D',
  blue: '#7FB7E8',
  error: '#FF5A5F',
  success: '#3DD68C',
};

/** Gold → tangerine → pink, for hero/splash gradients (expo-linear-gradient). */
export const sunsetGradient = ['#FFC23D', '#FF8A3D', '#FF4F81'] as const;
