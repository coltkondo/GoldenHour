import React from 'react';
import { View, ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';

type Nav = any;
import { useTheme } from '../theme';
import { useEventsCalendar } from './EventsCalendarContext';
import { EventsTimelineGrid } from './components/EventsTimelineGrid';
import { EmptyState } from './components/EmptyState';
import { EventCalItem, DAY_NAMES } from './types';
import { getWeekDays, isSameDay, jsDayToDow, scrollOffsetForEvents } from './utils/dateGrid';

export const EventsWeekView: React.FC = () => {
  const { theme } = useTheme();
  const d = theme.derived;
  const { selectedDate, setSelectedDate, setView, eventsForDay } = useEventsCalendar();
  const navigation = useNavigation<Nav>();
  const today = new Date();
  const dates = getWeekDays(selectedDate);

  const allEvents = dates.flatMap((dt: Date) => eventsForDay(dt));
  const total = allEvents.length;
  const onEventPress = (item: EventCalItem) =>
    navigation.navigate('HappyHour', { venue: item.venue });

  return (
    <View style={styles.flex}>
      <View style={[styles.headerRow, { borderBottomColor: d.border }]}>
        <View style={styles.headerGutter} />
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
              <Text style={[styles.headerDow, { color: isToday ? '#a78bfa' : d.textMuted }]}>
                {DAY_NAMES[dow].slice(0, 3)}
              </Text>
              <Text style={[styles.headerDate, { color: isToday ? '#a78bfa' : d.text }]}>
                {date.getDate()}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {total === 0 ? (
        <EmptyState message="No events this week." />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentOffset={{ x: 0, y: scrollOffsetForEvents(allEvents) }}>
          <EventsTimelineGrid dates={dates} onEventPress={onEventPress} />
          <View style={{ height: 24 }} />
        </ScrollView>
      )}
    </View>
  );
};

const GUTTER = 38;

const styles = StyleSheet.create({
  flex: { flex: 1 },
  headerRow: { flexDirection: 'row', borderBottomWidth: StyleSheet.hairlineWidth, paddingVertical: 6 },
  headerGutter: { width: GUTTER },
  headerCell: { flex: 1, alignItems: 'center', borderLeftWidth: StyleSheet.hairlineWidth, gap: 2 },
  headerDow: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  headerDate: { fontSize: 16, fontWeight: '800' },
});
