// The "pre-alert" content shown right before iOS's location permission dialog.
// Presentational only: LocationPermissionProvider shows it in a modal, and
// GuestMarketPicker renders it inside its own sheet (iOS can't stack a second
// modal on top of one that's already open).
//
// Per Apple's guidance it has exactly ONE action, and that action goes on to
// the system dialog, where the user makes the real choice.

import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Text } from './ui/AppText';
import { useTheme } from '../theme';
import { AppIcon } from './icons';
import type { IconName } from './icons/AppIcon';

const REASONS: { icon: IconName; text: string }[] = [
  { icon: 'location', text: 'See happy hours and events at bars near you' },
  { icon: 'directions', text: 'Sort deals by how close the bar is' },
  { icon: 'check', text: 'Confirm you’re at a bar when you tap “Still Accurate”' },
];

export const LocationExplainer: React.FC<{ onContinue: () => void }> = ({ onContinue }) => {
  const { theme } = useTheme();
  const d = theme.derived;

  return (
    <View style={styles.container}>
      <View style={[styles.badge, { backgroundColor: d.selectedSurface }]}>
        <AppIcon name="location" size={28} role="brand" />
      </View>

      <Text style={[styles.title, { color: d.text }]} accessibilityRole="header">
        Find happy hours near you
      </Text>
      <Text style={[styles.lead, { color: d.textMuted }]}>
        Turning on location lets Golden Hour:
      </Text>

      <View style={styles.list}>
        {REASONS.map((r) => (
          <View key={r.text} style={styles.row}>
            <AppIcon name={r.icon} size={20} role="brand" />
            <Text style={[styles.rowText, { color: d.text }]}>{r.text}</Text>
          </View>
        ))}
      </View>

      <Text style={[styles.footnote, { color: d.textMuted }]}>
        Location is only used while you{'’'}re using the app. You can change this anytime in
        Settings.
      </Text>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: d.buttonPrimary }]}
        onPress={onContinue}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityHint="Shows the location permission prompt"
      >
        <Text style={[styles.buttonText, { color: d.buttonPrimaryText }]}>Continue</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 12 },
  badge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 24, fontWeight: '800', marginBottom: 6 },
  lead: { fontSize: 15, lineHeight: 21, marginBottom: 18 },
  list: { gap: 16, marginBottom: 20 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  rowText: { flex: 1, fontSize: 15, lineHeight: 21, fontWeight: '500' },
  footnote: { fontSize: 13, lineHeight: 18, marginBottom: 20 },
  button: { height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  buttonText: { fontSize: 15, fontWeight: '800', letterSpacing: 0.5 },
});
