import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';
import { useCalendar } from '../CalendarContext';
import { CalendarSheet } from './CalendarSheet';
import { DAY_NAMES } from '../../types/api';

const DAY_ABBREVS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

interface FilterSheetProps {
  visible: boolean;
  onClose: () => void;
}

export const FilterSheet: React.FC<FilterSheetProps> = ({ visible, onClose }) => {
  const { theme } = useTheme();
  const d = theme.derived;
  const { filters, clearFilters, toggleDay, toggleVenue, venues } = useCalendar();

  const sortedVenues = [...venues].sort((a, b) =>
    (a.nickname ?? a.name).localeCompare(b.nickname ?? b.name),
  );

  return (
    <CalendarSheet visible={visible} onClose={onClose}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 32 }]}>
        <Text style={[styles.heading, { color: d.text }]}>Filters</Text>

        <Text style={[styles.section, { color: d.textSecondary }]}>Day of Week</Text>
        <View style={styles.dayRow}>
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
                  {DAY_ABBREVS[dow]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.section, { color: d.textSecondary }]}>Bar</Text>
        <View style={styles.chipRow}>
          {sortedVenues.map((venue) => {
            const active = filters.venueIds.includes(venue.id);
            return (
              <TouchableOpacity
                key={venue.id}
                style={[
                  styles.chip,
                  {
                    backgroundColor: active ? d.filterActive : d.filterInactive,
                    borderColor: active ? d.filterActive : d.border,
                  },
                ]}
                onPress={() => toggleVenue(venue.id)}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: active ? d.filterActiveForeground : d.filterInactiveText },
                  ]}
                >
                  {venue.nickname ?? venue.name}
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
  section: { fontSize: 13, fontWeight: '700', marginTop: 16, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  dayRow: { flexDirection: 'row', gap: 8 },
  dayChip: {
    width: 40,
    height: 40,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayChipText: { fontSize: 14, fontWeight: '700' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipText: { fontSize: 13, fontWeight: '700' },
  clearBtn: {
    marginTop: 24,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  clearText: { fontSize: 14, fontWeight: '700' },
});
