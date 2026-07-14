import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

type Nav = any;
import { useTheme } from '../theme';
import { useCalendar } from './CalendarContext';
import { TimelineGrid } from './components/TimelineGrid';
import { EmptyState } from './components/EmptyState';
import { CalendarEvent, DAY_NAMES } from './types';
import { getWeekDays, isSameDay, jsDayToDow } from './utils/dateGrid';

interface WeekViewProps {
  onClusterPress?: (events: CalendarEvent[]) => void;
}

export const WeekView: React.FC<WeekViewProps> = ({ onClusterPress }) => {
  const { theme } = useTheme();
  const d = theme.derived;
  const { selectedDate, setSelectedDate, setView, eventsForDay } = useCalendar();
  const navigation = useNavigation<Nav>();
  const today = new Date();
  const dates = getWeekDays(selectedDate);

  const total = dates.reduce((sum: number, dt: Date) => sum + eventsForDay(dt).length, 0);
  const onEventPress = (ev: CalendarEvent) =>
    navigation.navigate('HappyHour', { venue: ev.venue });

  return (
    <View style={styles.flex}>
      <View style={[styles.headerRow, { borderBottomColor: d.border }]}>
        <View style={[styles.headerGutter]} />
        {dates.map((date: Date, i: number) => {
          const isToday = isSameDay(date, today);
          const dow = jsDayToDow(date.getDay());
          return (
            <TouchableOpacity
              key={i}
              style={[styles.headerCell, { borderLeftColor: d.border }]}
              onPress={() => {
                setSelectedDate(date);
                setView('day');
              }}
            >
              <Text style={[styles.headerDow, { color: isToday ? d.primary : d.textMuted }]}>
                {DAY_NAMES[dow].slice(0, 3)}
              </Text>
              <Text style={[styles.headerDate, { color: isToday ? d.primary : d.text }]}>
                {date.getDate()}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {total === 0 ? (
        <EmptyState />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          <TimelineGrid
            dates={dates}
            onEventPress={onEventPress}
            onClusterPress={onClusterPress}
          />
          <View style={{ height: 24 }} />
        </ScrollView>
      )}
    </View>
  );
};

const GUTTER = 38;

const styles = StyleSheet.create({
  flex: { flex: 1 },
  headerRow: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 6,
  },
  headerGutter: { width: GUTTER },
  headerCell: {
    flex: 1,
    alignItems: 'center',
    borderLeftWidth: StyleSheet.hairlineWidth,
    gap: 2,
  },
  headerDow: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  headerDate: { fontSize: 16, fontWeight: '800' },
});
