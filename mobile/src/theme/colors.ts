// Golden Hour - Time-Based Color System
// Colors shift throughout the day to match the mood

export type TimePeriod = 'lateNight' | 'morning' | 'afternoon' | 'goldenHour' | 'evening';

export interface ColorPalette {
  primary: string;
  primaryLight: string;
  secondary: string;
  accent: string;
  background: string;
  backgroundGradient: string[];
  surface: string;
  surfaceElevated: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  textOnPrimary: string;
  border: string;
  tabBar: string;
  tabBarActive: string;
  tabBarInactive: string;
  cardBackground: string;
  cardBorder: string;
  statusBarStyle: 'light' | 'dark';
  mapStyle: 'dark' | 'light';
}

// 12am - 6am: Indigo/Dark Purple + White/Light Grey
const lateNightColors: ColorPalette = {
  primary: '#7C4DFF',
  primaryLight: '#B388FF',
  secondary: '#CE93D8',
  accent: '#E040FB',
  background: '#1A0533',
  backgroundGradient: ['#0D0019', '#1A0533', '#311B92', '#4A148C'],
  surface: '#2D1B4E',
  surfaceElevated: '#3D2B5E',
  text: '#F3E5F5',
  textSecondary: '#CE93D8',
  textMuted: '#9575CD',
  textOnPrimary: '#FFFFFF',
  border: '#4A148C',
  tabBar: '#1A0533',
  tabBarActive: '#E040FB',
  tabBarInactive: '#7C4DFF',
  cardBackground: '#2D1B4E',
  cardBorder: '#4A148C',
  statusBarStyle: 'light',
  mapStyle: 'dark',
};

// 6am - 12pm: Soft blue + soft yellow
const morningColors: ColorPalette = {
  primary: '#42A5F5',
  primaryLight: '#90CAF9',
  secondary: '#FFD54F',
  accent: '#FF6B35',
  background: '#E8F4FD',
  backgroundGradient: ['#E3F2FD', '#BBDEFB', '#FFF9C4', '#FFF3E0'],
  surface: '#FFFFFF',
  surfaceElevated: '#F5F9FF',
  text: '#1A237E',
  textSecondary: '#3F51B5',
  textMuted: '#7986CB',
  textOnPrimary: '#FFFFFF',
  border: '#BBDEFB',
  tabBar: '#FFFFFF',
  tabBarActive: '#1976D2',
  tabBarInactive: '#90CAF9',
  cardBackground: '#FFFFFF',
  cardBorder: '#E3F2FD',
  statusBarStyle: 'dark',
  mapStyle: 'light',
};

// 12pm - 5pm: Comfort blue + gold
const afternoonColors: ColorPalette = {
  primary: '#1976D2',
  primaryLight: '#64B5F6',
  secondary: '#FFB300',
  accent: '#FF6B35',
  background: '#F0F7FF',
  backgroundGradient: ['#E3F2FD', '#90CAF9', '#FFE082', '#FFF8E1'],
  surface: '#FFFFFF',
  surfaceElevated: '#F5F9FF',
  text: '#0D47A1',
  textSecondary: '#1565C0',
  textMuted: '#64B5F6',
  textOnPrimary: '#FFFFFF',
  border: '#90CAF9',
  tabBar: '#FFFFFF',
  tabBarActive: '#0D47A1',
  tabBarInactive: '#90CAF9',
  cardBackground: '#FFFFFF',
  cardBorder: '#E3F2FD',
  statusBarStyle: 'dark',
  mapStyle: 'light',
};

// 5pm - 8pm: Deep orange (PRIMARY - golden hour!)
const goldenHourColors: ColorPalette = {
  primary: '#FF6B35',
  primaryLight: '#FF8A50',
  secondary: '#FFB74D',
  accent: '#FFD700',
  background: '#1A0A00',
  backgroundGradient: ['#BF360C', '#E65100', '#FF6B35', '#FF8A50', '#FFB74D'],
  surface: 'rgba(255, 255, 255, 0.12)',
  surfaceElevated: 'rgba(255, 255, 255, 0.18)',
  text: '#FFFFFF',
  textSecondary: '#FFE0B2',
  textMuted: '#FFCC80',
  textOnPrimary: '#FFFFFF',
  border: 'rgba(255, 255, 255, 0.2)',
  tabBar: 'rgba(26, 10, 0, 0.95)',
  tabBarActive: '#FFD700',
  tabBarInactive: '#FF8A50',
  cardBackground: 'rgba(255, 255, 255, 0.12)',
  cardBorder: 'rgba(255, 183, 77, 0.3)',
  statusBarStyle: 'light',
  mapStyle: 'dark',
};

// 8pm - 12am: Navy + gold
const eveningColors: ColorPalette = {
  primary: '#1B3A5C',
  primaryLight: '#2C5282',
  secondary: '#FFD700',
  accent: '#FF6B35',
  background: '#0D1B2A',
  backgroundGradient: ['#050D18', '#0D1B2A', '#1B2838', '#1B3A5C'],
  surface: '#1B3A5C',
  surfaceElevated: '#2C5282',
  text: '#F0E6D3',
  textSecondary: '#B8C9DB',
  textMuted: '#6B8299',
  textOnPrimary: '#FFFFFF',
  border: '#2C5282',
  tabBar: '#0D1B2A',
  tabBarActive: '#FFD700',
  tabBarInactive: '#6B8299',
  cardBackground: '#1B3A5C',
  cardBorder: '#2C5282',
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
export const brand = {
  orange: '#FF6B35',
  orangeLight: '#FF8A50',
  gold: '#FFD700',
  white: '#FFFFFF',
  black: '#0A0A0A',
  success: '#4CAF50',
  error: '#FF3B30',
  warning: '#FFB300',
};
