// Golden Hour - Time-Based Color System (Rulebook Compliant)
// Dark-mode first with disciplined contrast and single gold accent

export type TimePeriod = 'lateNight' | 'morning' | 'afternoon' | 'goldenHour' | 'evening';

export interface ColorPalette {
  // Core backgrounds (dark mode first)
  primary: string;
  primaryLight: string;
  secondary: string;
  accent: string; // GOLD - the only tappable accent color
  background: string; // Near-black #0F0F14
  backgroundGradient: string[]; // Only for backgrounds, never behind text
  surface: string; // Slightly lighter #171A21
  surfaceElevated: string;
  
  // Text hierarchy (high contrast)
  text: string; // Off-white #F5F7FA
  textSecondary: string; // Muted gray #A0A3AD
  textMuted: string; // Low-contrast gray #5A5D66
  textOnPrimary: string; // For gold buttons
  
  // UI elements
  border: string; // Subtle definition
  tabBar: string;
  tabBarActive: string; // Gold
  tabBarInactive: string;
  cardBackground: string;
  cardBorder: string;
  statusBarStyle: 'light' | 'dark';
  mapStyle: 'dark' | 'light';
}

// 12am - 6am: Deep indigo mood with gold accents
const lateNightColors: ColorPalette = {
  primary: '#0F0F14', // Near-black
  primaryLight: '#171A21',
  secondary: '#1A0F2E', // Deep purple tint
  accent: '#FFD700', // GOLD - only tappable accent
  background: '#0F0F14',
  backgroundGradient: ['#0F0F14', '#1A0F2E', '#1A0533'], // Subtle indigo gradient
  surface: '#171A21',
  surfaceElevated: '#1F1F28',
  text: '#F5F7FA', // Off-white
  textSecondary: '#A0A3AD', // Muted gray
  textMuted: '#5A5D66', // Low-contrast gray
  textOnPrimary: '#0F0F14', // Dark text on gold
  border: 'rgba(255, 255, 255, 0.06)',
  tabBar: '#0F0F14',
  tabBarActive: '#FFD700', // Gold
  tabBarInactive: '#5A5D66',
  cardBackground: '#171A21',
  cardBorder: 'rgba(255, 255, 255, 0.06)',
  statusBarStyle: 'light',
  mapStyle: 'dark',
};

// 6am - 12pm: Morning with subtle blue tint, still dark-mode first
const morningColors: ColorPalette = {
  primary: '#0F0F14',
  primaryLight: '#171A21',
  secondary: '#0F1419', // Cool blue-black tint
  accent: '#FFD700', // GOLD - only tappable accent
  background: '#0F0F14',
  backgroundGradient: ['#0F0F14', '#0F1419', '#1A1F2E'], // Subtle blue gradient
  surface: '#171A21',
  surfaceElevated: '#1F1F28',
  text: '#F5F7FA',
  textSecondary: '#A0A3AD',
  textMuted: '#5A5D66',
  textOnPrimary: '#0F0F14',
  border: 'rgba(255, 255, 255, 0.06)',
  tabBar: '#0F0F14',
  tabBarActive: '#FFD700', // Gold
  tabBarInactive: '#5A5D66',
  cardBackground: '#171A21',
  cardBorder: 'rgba(255, 255, 255, 0.06)',
  statusBarStyle: 'light',
  mapStyle: 'dark',
};

// 12pm - 5pm: Afternoon with neutral warmth
const afternoonColors: ColorPalette = {
  primary: '#0F0F14',
  primaryLight: '#171A21',
  secondary: '#1A1612', // Warm neutral tint
  accent: '#FFD700', // GOLD - only tappable accent
  background: '#0F0F14',
  backgroundGradient: ['#0F0F14', '#1A1612', '#1F1A16'], // Subtle warm gradient
  surface: '#171A21',
  surfaceElevated: '#1F1F28',
  text: '#F5F7FA',
  textSecondary: '#A0A3AD',
  textMuted: '#5A5D66',
  textOnPrimary: '#0F0F14',
  border: 'rgba(255, 255, 255, 0.06)',
  tabBar: '#0F0F14',
  tabBarActive: '#FFD700', // Gold
  tabBarInactive: '#5A5D66',
  cardBackground: '#171A21',
  cardBorder: 'rgba(255, 255, 255, 0.06)',
  statusBarStyle: 'light',
  mapStyle: 'dark',
};

// 5pm - 8pm: GOLDEN HOUR - Enhanced gold presence (PRIMARY TIME)
const goldenHourColors: ColorPalette = {
  primary: '#0F0F14',
  primaryLight: '#171A21',
  secondary: '#1A0F05', // Deep orange-black tint
  accent: '#FFD700', // GOLD - maximum emphasis
  background: '#0F0F14',
  backgroundGradient: ['#0F0F14', '#1A0F05', '#1F1408'], // Warm golden gradient
  surface: '#171A21',
  surfaceElevated: '#1F1A14',
  text: '#F5F7FA',
  textSecondary: '#FFD700', // GOLD for secondary text during golden hour
  textMuted: '#A0A3AD', // Keep muted elements neutral
  textOnPrimary: '#0F0F14',
  border: 'rgba(255, 215, 0, 0.15)', // Gold-tinted borders
  tabBar: '#0F0F14',
  tabBarActive: '#FFD700', // Gold
  tabBarInactive: '#A0A3AD', // Higher contrast during prime time
  cardBackground: '#171A21',
  cardBorder: 'rgba(255, 215, 0, 0.15)', // Gold glow on cards
  statusBarStyle: 'light',
  mapStyle: 'dark',
};

// 8pm - 12am: Evening with cool navy tint
const eveningColors: ColorPalette = {
  primary: '#0F0F14',
  primaryLight: '#171A21',
  secondary: '#0D1116', // Cool navy tint
  accent: '#FFD700', // GOLD - only tappable accent
  background: '#0F0F14',
  backgroundGradient: ['#0F0F14', '#0D1116', '#0F1419'], // Subtle navy gradient
  surface: '#171A21',
  surfaceElevated: '#1F1F28',
  text: '#F5F7FA',
  textSecondary: '#A0A3AD',
  textMuted: '#5A5D66',
  textOnPrimary: '#0F0F14',
  border: 'rgba(255, 255, 255, 0.06)',
  tabBar: '#0F0F14',
  tabBarActive: '#FFD700', // Gold
  tabBarInactive: '#5A5D66',
  cardBackground: '#171A21',
  cardBorder: 'rgba(255, 255, 255, 0.06)',
  statusBarStyle: 'light',
  mapStyle: 'dark',
};

export const colorPalettes: Record<TimePeriod, ColorPalette> = {
  lateNight: lateNightColors,
  morning: morningColors,
  afternoon: afternoonColors,
  goldenHour: goldenHourColors,
  evening: eveningColors,
};

export function getTimePeriod(date: Date = new Date()): TimePeriod {
  const hour = date.getHours();

  if (hour >= 0 && hour < 6) return 'lateNight';
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 20) return 'goldenHour';
  return 'evening';
}

export function getColors(date?: Date): ColorPalette {
  return colorPalettes[getTimePeriod(date)];
}

// Brand colors that stay constant regardless of time
// RULEBOOK COMPLIANT: Single accent color system
export const brand = {
  // Primary accent (tappable elements)
  gold: '#FFD700',
  goldLight: '#FFA500',
  
  // Dark mode backgrounds
  backgroundPrimary: '#0F0F14',
  backgroundSecondary: '#171A21',
  
  // Text hierarchy
  textPrimary: '#F5F7FA',
  textSecondary: '#A0A3AD',
  textMuted: '#5A5D66',
  
  // Borders
  borderSubtle: 'rgba(255, 255, 255, 0.06)',
  borderGold: 'rgba(255, 215, 0, 0.15)',
  
  // Status colors (use sparingly)
  success: '#4CAF50',
  error: '#FF3B30',
  warning: '#FFB300',
  
  // Legacy (deprecated - avoid using)
  orange: '#FF6B35', // Remove gradual use
  orangeLight: '#FF8A50', // Remove gradual use
  white: '#FFFFFF',
  black: '#0A0A0A',
};

// Helper function to get proper contrast ratios
export function getContrastColor(background: string): string {
  // For dark backgrounds, return light text
  if (background === brand.backgroundPrimary || background === brand.backgroundSecondary) {
    return brand.textPrimary;
  }
  // For gold backgrounds, return dark text
  if (background === brand.gold) {
    return brand.backgroundPrimary;
  }
  return brand.textPrimary;
}

// Semantic color helpers for consistency
export const semantic = {
  // Actions (always gold)
  actionPrimary: brand.gold,
  actionPrimaryGradient: [brand.gold, brand.goldLight],
  actionSecondary: 'transparent', // Outline style
  actionDisabled: brand.textMuted,
  
  // Cards
  cardBackground: brand.backgroundSecondary,
  cardBorder: brand.borderSubtle,
  cardBorderActive: brand.borderGold,
  
  // Status indicators
  live: brand.gold,
  inactive: brand.textMuted,
  success: brand.success,
  error: brand.error,
};