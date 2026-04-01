// Golden Hour - Typography System
// Bold, energetic - "this is fuckin chill" vibe

import { TextStyle } from 'react-native';

export const typography = {
  // Display - Big splashy headers
  displayLarge: {
    fontSize: 40,
    fontWeight: '900',
    letterSpacing: -1.5,
    lineHeight: 44,
  } as TextStyle,

  displayMedium: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -1,
    lineHeight: 36,
  } as TextStyle,

  displaySmall: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
    lineHeight: 30,
  } as TextStyle,

  // Headlines
  headlineLarge: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
    lineHeight: 28,
  } as TextStyle,

  headlineMedium: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.2,
    lineHeight: 24,
  } as TextStyle,

  headlineSmall: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0,
    lineHeight: 22,
  } as TextStyle,

  // Body text
  bodyLarge: {
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 0.1,
    lineHeight: 24,
  } as TextStyle,

  bodyMedium: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.15,
    lineHeight: 20,
  } as TextStyle,

  bodySmall: {
    fontSize: 12,
    fontWeight: '400',
    letterSpacing: 0.2,
    lineHeight: 16,
  } as TextStyle,

  // Labels & Buttons
  labelLarge: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
    lineHeight: 20,
    textTransform: 'uppercase',
  } as TextStyle,

  labelMedium: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.4,
    lineHeight: 18,
  } as TextStyle,

  labelSmall: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    lineHeight: 14,
    textTransform: 'uppercase',
  } as TextStyle,

  // Special - for big stat numbers
  statNumber: {
    fontSize: 48,
    fontWeight: '900',
    letterSpacing: -2,
    lineHeight: 52,
  } as TextStyle,

  statLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
    lineHeight: 16,
    textTransform: 'uppercase',
  } as TextStyle,

  // New design system tokens
  wordmark: {
    fontSize: 19,
    fontWeight: '700',
    letterSpacing: -0.5,
    lineHeight: 24,
  } as TextStyle,

  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0,
    lineHeight: 18,
  } as TextStyle,

  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
    lineHeight: 24,
  } as TextStyle,

  price: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0,
    lineHeight: 18,
  } as TextStyle,

  micro: {
    fontSize: 10,
    fontWeight: '400',
    letterSpacing: 0.2,
    lineHeight: 14,
  } as TextStyle,

  label: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.3,
    lineHeight: 14,
  } as TextStyle,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  full: 999,
};
