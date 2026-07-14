import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';
import { AppIcon } from '../../components/icons';
import { useCalendar } from '../CalendarContext';
import { CalendarSheet } from './CalendarSheet';
import { DAY_NAMES } from '../../types/api';

const MILE_METERS = 1609.34;
const DISTANCE_PRESETS: { label: string; meters: number | null }[] = [
  { label: 'Any', meters: null },
  { label: '1 mi', meters: Math.round(1 * MILE_METERS) },
  { label: '5 mi', meters: Math.round(5 * MILE_METERS) },
  { label: '10 mi', meters: Math.round(10 * MILE_METERS) },
];

const DEAL_TYPES: { key: 'drinks' | 'food' | 'both'; label: string }[] = [
  { key: 'drinks', label: 'Drinks' },
  { key: 'food', label: 'Food' },
  { key: 'both', label: 'Both' },
];

interface FilterSheetProps {
  visible: boolean;
  onClose: () => void;
}

export const FilterSheet: React.FC<FilterSheetProps> = ({ visible, onClose }) => {
  const { theme } = useTheme();
  const d = theme.derived;
  const {
    filters,
    setFilters,
    neighborhoods,
    clearFilters,
    toggleNeighborhood,
    toggleDay,
    togglePriceTier,
  } = useCalendar();

  return (
    <CalendarSheet visible={visible} onClose={onClose}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 32 }]}>
        <Text style={[styles.heading, { color: d.text }]}>Filters</Text>

        <Text style={[styles.section, { color: d.textSecondary }]}>Neighborhood</Text>
        <View style={styles.chipRow}>
          {neighborhoods.map((n) => {
            const active = filters.neighborhoods.includes(n);
            return (
              <TouchableOpacity
                key={n}
                style={[
                  styles.chip,
                  {
                    backgroundColor: active ? d.filterActive : d.filterInactive,
                    borderColor: active ? d.filterActive : d.border,
                  },
                ]}
                onPress={() => toggleNeighborhood(n)}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: active ? d.filterActiveForeground : d.filterInactiveText },
                  ]}
                >
                  {n}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.section, { color: d.textSecondary }]}>Deal Type</Text>
        <View style={styles.chipRow}>
          <TouchableOpacity
            style={[
              styles.chip,
              {
                backgroundColor: filters.dealType == null ? d.filterActive : d.filterInactive,
                borderColor: filters.dealType == null ? d.filterActive : d.border,
              },
            ]}
            onPress={() => setFilters((f) => ({ ...f, dealType: null }))}
          >
            <Text
              style={[
                styles.chipText,
                { color: filters.dealType == null ? d.filterActiveForeground : d.filterInactiveText },
              ]}
            >
              All
            </Text>
          </TouchableOpacity>
          {DEAL_TYPES.map((t) => {
            const active = filters.dealType === t.key;
            return (
              <TouchableOpacity
                key={t.key}
                style={[
                  styles.chip,
                  {
                    backgroundColor: active ? d.filterActive : d.filterInactive,
                    borderColor: active ? d.filterActive : d.border,
                  },
                ]}
                onPress={() => setFilters((f) => ({ ...f, dealType: t.key }))}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: active ? d.filterActiveForeground : d.filterInactiveText },
                  ]}
                >
                  {t.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.section, { color: d.textSecondary }]}>Price Tier</Text>
        <View style={styles.chipRow}>
          {([1, 2, 3, 4] as const).map((t) => {
            const active = filters.priceTiers.includes(t);
            return (
              <TouchableOpacity
                key={t}
                style={[
                  styles.chip,
                  {
                    backgroundColor: active ? d.filterActive : d.filterInactive,
                    borderColor: active ? d.filterActive : d.border,
                  },
                ]}
                onPress={() => togglePriceTier(t)}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: active ? d.filterActiveForeground : d.filterInactiveText },
                  ]}
                >
                  {'$'.repeat(t)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.section, { color: d.textSecondary }]}>Days of Week</Text>
        <View style={styles.chipRow}>
          {DAY_NAMES.map((name, dow) => {
            const active = filters.daysOfWeek.includes(dow);
            return (
              <TouchableOpacity
                key={name}
                style={[
                  styles.dayChip,
                  {
                    backgroundColor: active ? d.filterActive : d.filterInactive,
                    borderColor: active ? d.filterActive : d.border,
                  },
                ]}
                onPress={() => toggleDay(dow)}
              >
                <Text
                  style={[
                    styles.dayChipText,
                    { color: active ? d.filterActiveForeground : d.filterInactiveText },
                  ]}
                >
                  {name.slice(0, 1)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.section, { color: d.textSecondary }]}>Distance</Text>
        <View style={styles.chipRow}>
          {DISTANCE_PRESETS.map((p) => {
            const active = filters.radiusMeters === p.meters;
            return (
              <TouchableOpacity
                key={p.label}
                style={[
                  styles.chip,
                  {
                    backgroundColor: active ? d.filterActive : d.filterInactive,
                    borderColor: active ? d.filterActive : d.border,
                  },
                ]}
                onPress={() => setFilters((f) => ({ ...f, radiusMeters: p.meters }))}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: active ? d.filterActiveForeground : d.filterInactiveText },
                  ]}
                >
                  {p.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          style={[styles.clearBtn, { borderColor: d.border }]}
          onPress={clearFilters}
        >
          <Text style={[styles.clearText, { color: d.text }]}>Clear all filters</Text>
        </TouchableOpacity>
      </ScrollView>
    </CalendarSheet>
  );
};

const styles = StyleSheet.create({
  content: { padding: 16, gap: 8 },
  heading: { fontSize: 20, fontWeight: '800', marginBottom: 4 },
  section: { fontSize: 13, fontWeight: '700', marginTop: 12, textTransform: 'uppercase' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipText: { fontSize: 13, fontWeight: '700' },
  dayChip: {
    width: 38,
    height: 38,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayChipText: { fontSize: 14, fontWeight: '700' },
  clearBtn: {
    marginTop: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  clearText: { fontSize: 14, fontWeight: '700' },
});
