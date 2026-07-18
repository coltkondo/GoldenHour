import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme';
import { useCalendar } from './CalendarContext';
import { EventBlock } from './components/EventBlock';
import { EmptyState } from './components/EmptyState';
import { CalendarSheet } from './components/CalendarSheet';
import { CalendarEvent } from './types';
import { getMonthMatrix, isSameDay, isSameMonth, jsDayToDow } from './utils/dateGrid';
import { rankEvents } from './utils/ranking';

const MAX_PILLS = 3;

export const MonthView: React.FC = () => {
  const { theme } = useTheme();
  const d = theme.derived;
  const { selectedDate, eventsForDay } = useCalendar();
  const navigation = useNavigation<any>();
  const [sheetDate, setSheetDate] = useState<Date | null>(null);
  const [daySheetOpen, setDaySheetOpen] = useState(false);

  const weeks = getMonthMatrix(selectedDate);
  const today = new Date();
  const now = new Date();

  const openDay = (date: Date) => {
    setSheetDate(date);
    setDaySheetOpen(true);
  };

  const sheetEvents = sheetDate ? eventsForDay(sheetDate) : [];
  const onEventPress = (ev: CalendarEvent) => {
    setDaySheetOpen(false);
    navigation.navigate('HappyHour', { venue: ev.venue });
  };

  const total = weeks
    .flat()
    .reduce((sum: number, dt: Date) => sum + eventsForDay(dt).length, 0);

  if (total === 0) {
    return (
      <View style={styles.flex}>
        <EmptyState />
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      <View style={[styles.dowRow, { borderBottomColor: d.border }]}>
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((c, i) => (
          <Text key={i} style={[styles.dowCell, { color: d.textMuted }]}>
            {c}
          </Text>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.flex}>
        {weeks.map((week: Date[], wi: number) => (
          <View key={wi} style={[styles.weekRow, { borderBottomColor: d.border }]}>
            {week.map((date: Date, di: number) => {
              const inMonth = isSameMonth(date, selectedDate);
              const isToday = isSameDay(date, today);
              const ranked = rankEvents(eventsForDay(date), now);
              const evs = ranked.slice(0, MAX_PILLS);
              const overflow = ranked.length - evs.length;
              return (
                <TouchableOpacity
                  key={di}
                  style={[
                    styles.cell,
                    {
                      borderLeftColor: d.border,
                      borderTopColor: d.border,
                      backgroundColor: isToday ? d.selectedSurface : 'transparent',
                    },
                  ]}
                  onPress={() => openDay(date)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.cellDate,
                      { color: inMonth ? d.text : d.textHint },
                      isToday && { color: d.primary, fontWeight: '800' },
                    ]}
                  >
                    {date.getDate()}
                  </Text>
                  {evs.map((ev: CalendarEvent) => (
                    <EventBlock key={ev.id} event={ev} onPress={() => onEventPress(ev)} compact />
                  ))}
                  {overflow > 0 ? (
                    <Text style={[styles.more, { color: d.textMuted }]}>+{overflow} more</Text>
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
        <View style={{ height: 24 }} />
      </ScrollView>

      <CalendarSheet visible={daySheetOpen} onClose={() => setDaySheetOpen(false)}>
        <ScrollView contentContainerStyle={[styles.sheet, { paddingBottom: 32 }]}>
          {sheetDate ? (
            <Text style={[styles.sheetTitle, { color: d.text }]}>
              {sheetDate.toLocaleDateString(undefined, {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
          ) : null}
          {sheetEvents.map((ev: CalendarEvent) => (
            <EventBlock key={ev.id} event={ev} onPress={() => onEventPress(ev)} />
          ))}
        </ScrollView>
      </CalendarSheet>
    </View>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  dowRow: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 4,
  },
  dowCell: { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '700' },
  weekRow: {
    flexDirection: 'row',
    flex: 1,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  cell: {
    flex: 1,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderTopWidth: StyleSheet.hairlineWidth,
    padding: 4,
    minHeight: 78,
  },
  cellDate: { fontSize: 13, fontWeight: '700', marginBottom: 2 },
  more: { fontSize: 10, fontWeight: '600', marginTop: 2 },
  sheet: { padding: 16, gap: 8 },
  sheetTitle: { fontSize: 18, fontWeight: '800', marginBottom: 4 },
});
