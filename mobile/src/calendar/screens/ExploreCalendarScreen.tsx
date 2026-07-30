import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Platform,
} from 'react-native';
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
import { EventsCalendarProvider, useEventsCalendar } from '../EventsCalendarContext';
import { EventsCalendarHeader } from '../components/EventsCalendarHeader';
import { EventsWeekView } from '../EventsWeekView';
import { EventsDayView } from '../EventsDayView';
import { EventsMonthView } from '../EventsMonthView';

const EVENT_COLOR = '#a78bfa';

/* ── HH Calendar (existing) ── */

const HHViews: React.FC<{ onClusterPress: (events: CalendarEvent[]) => void }> = ({
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

/* ── Events Calendar (new) ── */

const EventsViews: React.FC = () => {
  const { theme } = useTheme();
  const d = theme.derived;
  const { view, loading, error, refresh } = useEventsCalendar();

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={EVENT_COLOR} size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <AppIcon name="warning" size={32} role="urgent" />
        <Text style={[styles.errorText, { color: d.text }]}>{error}</Text>
        <TouchableOpacity style={[styles.retry, { borderColor: d.border }]} onPress={refresh}>
          <Text style={[styles.retryText, { color: EVENT_COLOR }]}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (view === 'day') return <EventsDayView />;
  if (view === 'month') return <EventsMonthView />;
  return <EventsWeekView />;
};

/* ── Mode toggle ── */

type Mode = 'events' | 'hh';

const ModeToggle: React.FC<{ mode: Mode; onChange: (m: Mode) => void }> = ({ mode, onChange }) => {
  const { theme } = useTheme();
  const d = theme.derived;
  return (
    <View style={[styles.modeToggleWrap, { borderColor: d.border, backgroundColor: d.cardBackground }]}>
      {(['events', 'hh'] as Mode[]).map((m) => {
        const active = mode === m;
        const label = m === 'events' ? 'Events' : 'Happy Hours';
        const activeColor = m === 'events' ? EVENT_COLOR : d.primary;
        return (
          <TouchableOpacity
            key={m}
            style={[
              styles.modeToggleBtn,
              active && { backgroundColor: m === 'events' ? 'rgba(167,139,250,0.12)' : 'rgba(245,166,35,0.12)' },
            ]}
            onPress={() => onChange(m)}
            activeOpacity={0.7}
          >
            <Text style={[styles.modeToggleText, { color: active ? activeColor : d.textMuted }]}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

/* ── Root screen ── */

export const ExploreCalendarScreen: React.FC = () => {
  const { theme } = useTheme();
  const d = theme.derived;
  const navigation = useNavigation<any>();
  const [mode, setMode] = useState<Mode>('events');
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
    <View style={[styles.screen, { backgroundColor: d.background }]}>
      {/* Screen header */}
      <View style={styles.screenHeader}>
        <Text style={[styles.screenTitle, { color: d.text }]}>Calendar</Text>
      </View>

      {/* Mode toggle */}
      <View style={styles.toggleRow}>
        <ModeToggle mode={mode} onChange={setMode} />
      </View>

      {/* Content */}
      {mode === 'events' ? (
        <EventsCalendarProvider>
          <View style={styles.hhWrapper}>
            <EventsCalendarHeader />
            <View style={styles.body}>
              <EventsViews />
            </View>
          </View>
        </EventsCalendarProvider>
      ) : (
        <CalendarProvider>
          <View style={styles.hhWrapper}>
            <CalendarHeader />
            <FilterBar />
            <View style={styles.body}>
              <HHViews onClusterPress={onClusterPress} />
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
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1 },

  screenHeader: {
    paddingTop: Platform.OS === 'ios' ? 60 : 48,
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  screenTitle: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },

  toggleRow: { paddingHorizontal: 20, paddingBottom: 12 },
  modeToggleWrap: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  modeToggleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeToggleText: { fontSize: 14, fontWeight: '700' },

  // HH wrapper takes up remaining space
  hhWrapper: { flex: 1 },
  body: { flex: 1 },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', marginTop: 4 },
  emptySubtext: { fontSize: 13, fontWeight: '500', textAlign: 'center' },
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
