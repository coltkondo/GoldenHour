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

const dark: ColorPalette = {
  background: '#0D0D0D',
  surface: '#1E1E1E',
  primary: '#F5A623',
  secondary: '#2DD4A0',
  text: '#F0EDE6',
  cardBackground: '#1A1A1A',
  cardBorder: '#2A2A2A',
  cardBackgroundAlt: '#1E1E1E',
  buttonPrimary: '#F5A623',
  buttonPrimaryText: '#0D0D0D',
  buttonSecondary: '#2A2A2A',
  buttonSecondaryText: '#F5A623',
  inputBackground: '#1E1E1E',
  inputBorder: '#2A2A2A',
  inputPlaceholder: '#6B6B6B',
  badgeBackground: '#F5A623',
  badgeText: '#0D0D0D',
  filterActive: '#F5A623',
  filterActiveForeground: '#0D0D0D',
  filterInactive: '#2A2A2A',
  filterInactiveText: '#6B6B6B',
  selectedSurface: 'rgba(245,166,35,0.12)',
  selectedBorder: 'rgba(245,166,35,0.3)',
  tabBar: '#0D0D0D',
  tabBarActive: '#F5A623',
  tabBarInactive: '#6B6B6B',
  navPill: '#0D0D0D',
  border: '#2A2A2A',
  borderStrong: '#2A2A2A',
  divider: '#2A2A2A',
  surfaceAlt: '#1E1E1E',
  surfaceDeep: '#1E1E1E',
  success: '#2DD4A0',
  error: '#FF6B35',
  warning: '#F4A261',
  live: '#2DD4A0',
  textSecondary: '#6B6B6B',
  textMuted: '#6B6B6B',
  textHint: '#6B6B6B',
  toastBackground: '#1E1B4B',
  discovery: '#5B9BD5',
};

const light: ColorPalette = {
  background: '#FAF9F6',
  surface: '#FFFFFF',
  primary: '#C77D1A',
  secondary: '#1EA87A',
  text: '#1A1A1A',
  cardBackground: '#FFFFFF',
  cardBorder: '#E5E2DC',
  cardBackgroundAlt: '#F5F3EF',
  buttonPrimary: '#C77D1A',
  buttonPrimaryText: '#FFFFFF',
  buttonSecondary: '#F0EDE6',
  buttonSecondaryText: '#C77D1A',
  inputBackground: '#FFFFFF',
  inputBorder: '#E5E2DC',
  inputPlaceholder: '#9B978E',
  badgeBackground: '#C77D1A',
  badgeText: '#FFFFFF',
  filterActive: '#C77D1A',
  filterActiveForeground: '#FFFFFF',
  filterInactive: '#E5E2DC',
  filterInactiveText: '#9B978E',
  selectedSurface: 'rgba(199,125,26,0.1)',
  selectedBorder: 'rgba(199,125,26,0.3)',
  tabBar: '#FAF9F6',
  tabBarActive: '#C77D1A',
  tabBarInactive: '#9B978E',
  navPill: '#FAF9F6',
  border: '#E5E2DC',
  borderStrong: '#D4D0C8',
  divider: '#E5E2DC',
  surfaceAlt: '#F5F3EF',
  surfaceDeep: '#F0EDE6',
  success: '#1EA87A',
  error: '#E04E2A',
  warning: '#C77D1A',
  live: '#1EA87A',
  textSecondary: '#9B978E',
  textMuted: '#9B978E',
  textHint: '#9B978E',
  toastBackground: '#F0EDE6',
  discovery: '#4A8BC2',
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
  gold: '#F5A623',
  amber: '#F4A261',
  orange: '#FF6B35',
  green: '#2DD4A0',
  blue: '#5B9BD5',
  error: '#FF6B35',
  success: '#2DD4A0',
};
