import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';
import { AppIcon } from '../../components/icons';
import { useCalendar } from '../CalendarContext';
import { ViewMode } from '../types';
import { addDays, getWeekDays, isSameDay } from '../utils/dateGrid';

const VIEWS: { key: ViewMode; label: string }[] = [
  { key: 'day', label: 'Day' },
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
];

function rangeLabel(start: Date, end: Date): string {
  const opt: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  return `${start.toLocaleDateString(undefined, opt)} – ${end.toLocaleDateString(undefined, opt)}`;
}

export const CalendarHeader: React.FC = () => {
  const { theme } = useTheme();
  const d = theme.derived;
  const { view, setView, selectedDate, setSelectedDate } = useCalendar();

  const shift = (dir: number) => {
    if (view === 'day') setSelectedDate(addDays(selectedDate, dir));
    else if (view === 'week') setSelectedDate(addDays(selectedDate, dir * 7));
    else
      setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + dir, 1));
  };

  let label: string;
  if (view === 'day') {
    label = selectedDate.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  } else if (view === 'week') {
    const days = getWeekDays(selectedDate);
    label = rangeLabel(days[0], days[6]);
  } else {
    label = selectedDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  }

  const isToday = isSameDay(selectedDate, new Date());

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <TouchableOpacity
          style={[styles.navBtn, { borderColor: d.border }]}
          onPress={() => shift(-1)}
          hitSlop={8}
        >
          <AppIcon name="caretLeft" size={18} color={d.text} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.todayBtn,
            { borderColor: d.border, backgroundColor: d.surfaceAlt },
          ]}
          onPress={() => setSelectedDate(new Date())}
        >
          <Text style={[styles.todayText, { color: isToday ? d.primary : d.text }]}>
            {isToday ? 'Today' : 'Jump to Today'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navBtn, { borderColor: d.border }]}
          onPress={() => shift(1)}
          hitSlop={8}
        >
          <AppIcon name="chevronRight" size={18} color={d.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.labelRow}>
        <Text style={[styles.label, { color: d.text }]}>{label}</Text>
        <View style={styles.tabs}>
          {VIEWS.map((v) => {
            const active = v.key === view;
            return (
              <TouchableOpacity
                key={v.key}
                onPress={() => setView(v.key)}
                style={[
                  styles.tab,
                  active && { backgroundColor: d.primary },
                ]}
              >
                <Text
                  style={[
                    styles.tabText,
                    { color: active ? d.buttonPrimaryText : d.textSecondary },
                  ]}
                >
                  {v.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 8,
    gap: 8,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayBtn: {
    height: 36,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayText: {
    fontSize: 13,
    fontWeight: '700',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 18,
    fontWeight: '800',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: 'transparent',
    gap: 4,
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
