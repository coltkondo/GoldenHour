import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';
import { AppIcon } from '../../components/icons';
import { useCalendar } from '../CalendarContext';
import { FilterSheet } from './FilterSheet';

export const FilterBar: React.FC = () => {
  const { theme } = useTheme();
  const d = theme.derived;
  const { activeFilterCount, filters, setFilters } = useCalendar();
  const [filterOpen, setFilterOpen] = useState(false);

  return (
    <View style={[styles.container, { borderTopColor: d.border, borderBottomColor: d.border }]}>
      <TouchableOpacity
        style={[styles.filterBtn, { backgroundColor: d.surfaceAlt, borderColor: d.border }]}
        onPress={() => setFilterOpen(true)}
      >
        <AppIcon name="filter" size={16} color={d.text} />
        <Text style={[styles.filterText, { color: d.text }]}>Filters</Text>
        {activeFilterCount > 0 ? (
          <View style={[styles.badge, { backgroundColor: d.badgeBackground }]}>
            <Text style={[styles.badgeText, { color: d.badgeText }]}>{activeFilterCount}</Text>
          </View>
        ) : null}
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.nowBtn,
          {
            backgroundColor: filters.happeningNow ? d.primary : d.surfaceAlt,
            borderColor: filters.happeningNow ? d.primary : d.border,
          },
        ]}
        onPress={() => setFilters((f) => ({ ...f, happeningNow: !f.happeningNow }))}
      >
        <AppIcon name="fire" size={16} color={filters.happeningNow ? d.buttonPrimaryText : d.text} />
        <Text
          style={[
            styles.nowText,
            { color: filters.happeningNow ? d.buttonPrimaryText : d.textSecondary },
          ]}
        >
          Happening now
        </Text>
      </TouchableOpacity>

      <FilterSheet visible={filterOpen} onClose={() => setFilterOpen(false)} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  filterText: { fontSize: 13, fontWeight: '700' },
  badge: {
    marginLeft: 2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { fontSize: 11, fontWeight: '800' },
  nowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  nowText: { fontSize: 13, fontWeight: '700' },
});
