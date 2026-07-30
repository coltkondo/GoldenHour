import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Platform,
  RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../theme';
import { useAuth } from '../../context/AuthContext';
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
import { eventsAPI } from '../../api/endpoints';
import { Event } from '../../types/api';

const EVENT_COLOR = '#a78bfa';
const GUEST_MARKET_KEY = 'gh_guest_market';

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

/* ── Events List (new) ── */

function formatEventDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

function formatEventTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function dateBucket(iso: string): string {
  return iso.slice(0, 10); // YYYY-MM-DD
}

interface DateSection {
  dateKey: string;
  label: string;
  events: Event[];
}

function groupEventsByDate(events: Event[]): DateSection[] {
  const map = new Map<string, Event[]>();
  for (const ev of events) {
    const key = dateBucket(ev.start_datetime);
    const list = map.get(key) ?? [];
    list.push(ev);
    map.set(key, list);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, evs]) => ({
      dateKey: key,
      label: formatEventDate(evs[0].start_datetime),
      events: evs,
    }));
}

const EventsListView: React.FC = () => {
  const { theme } = useTheme();
  const d = theme.derived;
  const { user } = useAuth();
  const navigation = useNavigation<any>();

  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const isMounted = useRef(true);

  const load = useCallback(async () => {
    try {
      setError(null);
      const marketSlug = user
        ? user.market_slug
        : await AsyncStorage.getItem(GUEST_MARKET_KEY);
      const data = await eventsAPI.getUpcoming({ market_slug: marketSlug });
      if (!isMounted.current) return;
      setEvents(data);
    } catch {
      if (isMounted.current) setError('Could not load events. Pull to refresh.');
    } finally {
      if (isMounted.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [user?.market_slug]);

  useEffect(() => {
    isMounted.current = true;
    load();
    return () => { isMounted.current = false; };
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={EVENT_COLOR} size="large" />
      </View>
    );
  }

  const sections = groupEventsByDate(events);

  return (
    <ScrollView
      contentContainerStyle={[styles.eventsScroll, (error || sections.length === 0) && styles.eventsScrollEmpty]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={EVENT_COLOR} />
      }
    >
      {(error || sections.length === 0) ? (
        <View style={styles.center}>
          <AppIcon name="clock" size={32} role="muted" />
          <Text style={[styles.emptyTitle, { color: d.text }]}>Events coming soon</Text>
          <Text style={[styles.emptySubtext, { color: d.textMuted }]}>
            We're just getting started — check back soon
          </Text>
        </View>
      ) : (
        sections.map((section) => (
          <View key={section.dateKey} style={styles.dateSection}>
            <Text style={[styles.dateSectionLabel, { color: d.textMuted }]}>{section.label}</Text>
            {section.events.map((ev) => (
              <TouchableOpacity
                key={ev.id}
                style={[styles.eventCard, { backgroundColor: d.cardBackground, borderColor: d.border }]}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('HappyHour', { venueId: ev.venue_id })}
              >
                <View style={[styles.eventAccent, { backgroundColor: EVENT_COLOR }]} />
                <View style={styles.eventCardBody}>
                  <Text style={[styles.eventCardName, { color: d.text }]}>{ev.name}</Text>
                  <Text style={[styles.eventCardVenue, { color: d.textMuted }]}>
                    {ev.venue_name ?? 'Unknown venue'}
                    {ev.venue_neighborhood ? ` · ${ev.venue_neighborhood}` : ''}
                  </Text>
                  <View style={styles.eventCardMeta}>
                    <Text style={[styles.eventCardTime, { color: EVENT_COLOR }]}>
                      {formatEventTime(ev.start_datetime)}
                      {ev.end_datetime ? ` – ${formatEventTime(ev.end_datetime)}` : ''}
                    </Text>
                    {ev.event_type && (
                      <View style={[styles.eventTypePill, { borderColor: EVENT_COLOR }]}>
                        <Text style={[styles.eventTypePillText, { color: EVENT_COLOR }]}>
                          {ev.event_type}
                        </Text>
                      </View>
                    )}
                    {(ev.is_recurring || ev.series_id) && (
                      <View style={[styles.eventTypePill, { borderColor: EVENT_COLOR, opacity: 0.7 }]}>
                        <Text style={[styles.eventTypePillText, { color: EVENT_COLOR }]}>
                          Recurring
                        </Text>
                      </View>
                    )}
                  </View>
                  {ev.description && (
                    <Text style={[styles.eventCardDesc, { color: d.textMuted }]} numberOfLines={2}>
                      {ev.description}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ))
      )}
      <View style={{ height: 120 }} />
    </ScrollView>
  );
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
        <Text style={[styles.screenTitle, { color: d.text }]}>Explore</Text>
      </View>

      {/* Mode toggle */}
      <View style={styles.toggleRow}>
        <ModeToggle mode={mode} onChange={setMode} />
      </View>

      {/* Content */}
      {mode === 'events' ? (
        <EventsListView />
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

  // Events list
  eventsScroll: { paddingHorizontal: 16, paddingTop: 4 },
  eventsScrollEmpty: { flex: 1 },
  dateSection: { marginBottom: 24 },
  dateSectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  eventCard: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    flexDirection: 'row',
    marginBottom: 8,
  },
  eventAccent: { width: 4 },
  eventCardBody: { flex: 1, padding: 14, gap: 4 },
  eventCardName: { fontSize: 16, fontWeight: '700', letterSpacing: -0.2 },
  eventCardVenue: { fontSize: 13, fontWeight: '500' },
  eventCardMeta: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 2 },
  eventCardTime: { fontSize: 13, fontWeight: '700' },
  eventTypePill: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  eventTypePillText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },
  eventCardDesc: { fontSize: 13, fontWeight: '400', lineHeight: 18, marginTop: 2 },

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
