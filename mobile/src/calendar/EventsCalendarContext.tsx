import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { venuesAPI, eventsAPI } from '../api/endpoints';
import { Venue } from '../types/api';
import { useAuth } from '../context/AuthContext';
import { addDays, isSameDay } from './utils/dateGrid';
import { EventCalItem, ViewMode } from './types';

const GUEST_MARKET_KEY = 'gh_guest_market';

interface EventsCalendarContextValue {
  view: ViewMode;
  setView: (v: ViewMode) => void;
  selectedDate: Date;
  setSelectedDate: (d: Date) => void;
  loading: boolean;
  error: string | null;
  refresh: () => void;
  eventsForDay: (date: Date) => EventCalItem[];
}

const EventsCalendarContext = createContext<EventsCalendarContextValue | undefined>(undefined);

export const EventsCalendarProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [view, setView] = useState<ViewMode>('day');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [items, setItems] = useState<EventCalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const { user } = useAuth();

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);

        const marketSlug = user
          ? user.market_slug
          : await AsyncStorage.getItem(GUEST_MARKET_KEY);

        // Window covers the ~13-week weekly / 3-month monthly occurrence
        // generation from submission_review.py with margin, plus 2 months of
        // past context. Fetched once and filtered client-side (same pattern
        // as the HH CalendarContext) — no refetch on day/week/month navigation.
        const today = new Date();
        const from = addDays(today, -60);
        const to = addDays(today, 210);

        const [venues, events] = await Promise.all([
          venuesAPI.getAll({ limit: 100, market_slug: marketSlug }),
          eventsAPI.getUpcoming({
            market_slug: marketSlug,
            upcoming_only: false,
            from_dt: from.toISOString(),
            to_dt: to.toISOString(),
            limit: 200,
          }),
        ]);
        if (cancelled) return;

        const venueMap = new Map<string, Venue>(venues.map((v) => [v.id, v]));
        const built: EventCalItem[] = [];
        for (const ev of events) {
          const venue = venueMap.get(ev.venue_id);
          if (!venue) continue; // event's venue not in this market's active list — skip defensively

          const start = new Date(ev.start_datetime);
          const end = ev.end_datetime ? new Date(ev.end_datetime) : null;
          const startMinutes = start.getHours() * 60 + start.getMinutes();
          let endMinutes = end ? end.getHours() * 60 + end.getMinutes() : startMinutes + 90;
          // Cross-midnight or missing/degenerate end: clamp to the bottom of
          // the start day's column rather than rendering a negative-height
          // block or spilling into the next date's column.
          if (!end || !isSameDay(start, end) || endMinutes <= startMinutes) {
            endMinutes = end && !isSameDay(start, end) ? 24 * 60 : Math.max(endMinutes, startMinutes + 30);
          }

          built.push({
            id: ev.id,
            venue,
            event: ev,
            title: ev.name,
            date: start,
            startMinutes,
            endMinutes,
          });
        }

        if (cancelled) return;
        setItems(built);
      } catch {
        if (!cancelled) setError('Could not load events. Pull to refresh.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshKey, user?.market_slug]);

  const eventsForDay = useCallback(
    (date: Date): EventCalItem[] => items.filter((it) => isSameDay(it.date, date)),
    [items],
  );

  const value = useMemo<EventsCalendarContextValue>(
    () => ({ view, setView, selectedDate, setSelectedDate, loading, error, refresh, eventsForDay }),
    [view, selectedDate, loading, error, refresh, eventsForDay],
  );

  return (
    <EventsCalendarContext.Provider value={value}>{children}</EventsCalendarContext.Provider>
  );
};

export function useEventsCalendar(): EventsCalendarContextValue {
  const ctx = useContext(EventsCalendarContext);
  if (!ctx) throw new Error('useEventsCalendar must be used within an EventsCalendarProvider');
  return ctx;
}
