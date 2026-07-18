import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../theme';
import { AppIcon } from '../../components/icons';
import { CalendarProvider, useCalendar } from '../CalendarContext';
import { CalendarHeader } from '../components/CalendarHeader';
import { FilterBar } from '../components/FilterBar';
import { EventBlock } from '../components/EventBlock';
import { CalendarSheet } from '../components/CalendarSheet';
import { WeekView } from '../WeekView';
import { DayView } from '../DayView';
import { MonthView } from '../MonthView';
import { CalendarEvent } from '../types';

const Views: React.FC<{ onClusterPress: (events: CalendarEvent[]) => void }> = ({
  onClusterPress,
}) => {
  const { theme } = useTheme();
  const d = theme.derived;
  const { view, loading, error, refresh } = useCalendar();

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={d.primary} size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <AppIcon name="warning" size={32} role="urgent" />
        <Text style={[styles.errorText, { color: d.text }]}>{error}</Text>
        <TouchableOpacity style={[styles.retry, { borderColor: d.border }]} onPress={refresh}>
          <Text style={[styles.retryText, { color: d.primary }]}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (view === 'day') return <DayView onClusterPress={onClusterPress} />;
  if (view === 'month') return <MonthView />;
  return <WeekView onClusterPress={onClusterPress} />;
};

export const ExploreCalendarScreen: React.FC = () => {
  const { theme } = useTheme();
  const d = theme.derived;
  const navigation = useNavigation<any>();
  const [clusterEvents, setClusterEvents] = useState<CalendarEvent[] | null>(null);
  const [clusterOpen, setClusterOpen] = useState(false);

  const onClusterPress = (events: CalendarEvent[]) => {
    setClusterEvents(events);
    setClusterOpen(true);
  };

  const onEventPress = (ev: CalendarEvent) => {
    setClusterOpen(false);
    navigation.navigate('HappyHour', { venue: ev.venue });
  };

  return (
    <CalendarProvider>
      <View style={[styles.screen, { backgroundColor: d.background }]}>
        <CalendarHeader />
        <FilterBar />
        <View style={styles.body}>
          <Views onClusterPress={onClusterPress} />
        </View>
      </View>

      <CalendarSheet visible={clusterOpen} onClose={() => setClusterOpen(false)}>
        <ScrollView contentContainerStyle={[styles.sheet, { paddingBottom: 32 }]}>
          <Text style={[styles.sheetTitle, { color: d.text }]}>
            {clusterEvents?.length ?? 0} happy hours
          </Text>
          {clusterEvents?.map((ev) => (
            <EventBlock key={ev.id} event={ev} onPress={() => onEventPress(ev)} />
          ))}
        </ScrollView>
      </CalendarSheet>
    </CalendarProvider>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1 },
  body: { flex: 1 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
  },
  errorText: { fontSize: 14, fontWeight: '600', textAlign: 'center' },
  retry: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  retryText: { fontSize: 14, fontWeight: '700' },
  sheet: { padding: 16, gap: 8 },
  sheetTitle: { fontSize: 18, fontWeight: '800', marginBottom: 4 },
});
