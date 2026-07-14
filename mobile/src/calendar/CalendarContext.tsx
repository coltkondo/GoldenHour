import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from 'react';
import { venuesAPI, dealsAPI } from '../api/endpoints';
import { Venue, Deal, HappyHourSchedule, DAY_NAMES } from '../types/api';
import { parseTimeString } from '../utils/scheduleUtils';
import { useLocation } from '../hooks/useLocation';
import { haversineMeters } from './utils/geo';
import { jsDayToDow } from './utils/dateGrid';
import {
  CalendarEvent,
  Filters,
  DEFAULT_FILTERS,
  ViewMode,
  PriceTier,
} from './types';

// Lightweight in-memory cache so switching views (and remounts) reuses the
// already-fetched schedule/deal data instead of hitting the backend again.
// Mirrors the app's existing spatiotemporal-caching intent without a Redis dep.
const scheduleCache = new Map<string, HappyHourSchedule[]>();
let dealCache: Deal[] | null = null;

interface UserLoc {
  latitude: number;
  longitude: number;
}

interface CalendarContextValue {
  view: ViewMode;
  setView: (v: ViewMode) => void;
  selectedDate: Date;
  setSelectedDate: (d: Date) => void;
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  activeFilterCount: number;
  clearFilters: () => void;
  toggleNeighborhood: (n: string) => void;
  toggleDay: (dow: number) => void;
  togglePriceTier: (t: PriceTier) => void;
  events: CalendarEvent[]; // all derived (unfiltered)
  userLocation: UserLoc | null;
  neighborhoods: string[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
  // Filtered events for the *current* view (respects all filters except the
  // per-day projection, which each view applies via eventsForDay).
  getEventsForView: () => CalendarEvent[];
  // Events that occur on a specific calendar date.
  eventsForDay: (date: Date) => CalendarEvent[];
}

const CalendarContext = createContext<CalendarContextValue | undefined>(undefined);

function passAlwaysFilters(
  ev: CalendarEvent,
  filters: Filters,
  userLoc: UserLoc | null,
): boolean {
  if (
    filters.neighborhoods.length > 0 &&
    !(ev.venue.neighborhood && filters.neighborhoods.includes(ev.venue.neighborhood))
  ) {
    return false;
  }

  if (filters.dealType) {
    const cats = new Set(ev.deals.map((d) => (d.category ?? '').toLowerCase()));
    if (filters.dealType === 'drinks' && !cats.has('drink')) return false;
    if (filters.dealType === 'food' && !cats.has('food')) return false;
    if (filters.dealType === 'both' && !(cats.has('food') && cats.has('drink'))) return false;
  }

  if (filters.priceTiers.length > 0) {
    const pl = ev.venue.price_level;
    if (pl == null || !filters.priceTiers.includes(pl as PriceTier)) return false;
  }

  if (filters.radiusMeters != null && userLoc && ev.venue.latitude != null) {
    const dist = haversineMeters(
      userLoc.latitude,
      userLoc.longitude,
      ev.venue.latitude,
      ev.venue.longitude,
    );
    if (dist > filters.radiusMeters) return false;
  }

  if (filters.happeningNow) {
    const now = new Date();
    const curMin = now.getHours() * 60 + now.getMinutes();
    const todayDow = jsDayToDow(now.getDay());
    if (ev.dayOfWeek !== todayDow) return false;
    const s = ev.startMinutes % 1440;
    const e = ev.endMinutes % 1440;
    const live = e > s ? curMin >= s && curMin < e : curMin >= s || curMin < e;
    if (!live) return false;
  }

  return true;
}

export const CalendarProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [view, setView] = useState<ViewMode>('week');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const { location } = useLocation();
  const userLocation = useMemo<UserLoc | null>(
    () =>
      location
        ? { latitude: location.latitude, longitude: location.longitude }
        : null,
    [location],
  );

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);

        const venues = await venuesAPI.getAll({ limit: 100 });
        if (cancelled) return;

        const pairs: [string, HappyHourSchedule[]][] = await Promise.all(
          venues.map(async (v): Promise<[string, HappyHourSchedule[]]> => {
            if (scheduleCache.has(v.id)) return [v.id, scheduleCache.get(v.id)!];
            try {
              const s = await venuesAPI.getSchedules(v.id);
              scheduleCache.set(v.id, s);
              return [v.id, s];
            } catch {
              return [v.id, []];
            }
          }),
        );
        if (cancelled) return;

        const scheduleMap = new Map<string, HappyHourSchedule[]>(pairs);
        if (!dealCache) dealCache = await dealsAPI.getActive({ limit: 200 });
        const dealMap = new Map<string, Deal>(dealCache.map((d) => [d.id, d]));

        const built: CalendarEvent[] = [];
        const hoodSet = new Set<string>();
        for (const v of venues) {
          if (v.neighborhood) hoodSet.add(v.neighborhood);
          const scheds = scheduleMap.get(v.id) ?? [];
          for (const s of scheds) {
            if (!s.active) continue;
            const start = parseTimeString(s.start_time);
            const end = parseTimeString(s.end_time);
            const startMin = start.hour * 60 + start.minute;
            let endMin = end.hour * 60 + end.minute;
            if (endMin <= startMin) endMin += 24 * 60; // crossing midnight
            // Exclude "open hours" schedules (e.g. 0:00–23:59) that are not
            // happy hours. They span the entire timeline and would otherwise
            // render as one giant block in every day column, dwarfing real
            // happy hours. The backend should ideally surface `is_happy_hour`
            // so this can be a precise filter instead of a duration heuristic.
            if (endMin - startMin >= 22 * 60) continue;
            const deals = (s.deal_ids ?? [])
              .map((id) => dealMap.get(id))
              .filter((d): d is Deal => Boolean(d));
            built.push({
              id: s.id,
              venue: v,
              schedule: s,
              deals,
              title: v.nickname ?? v.name,
              dayOfWeek: s.day_of_week,
              startMinutes: startMin,
              endMinutes: endMin,
              priceLevel: v.price_level,
            });
          }
        }

        if (cancelled) return;
        setEvents(built);
        setNeighborhoods(Array.from(hoodSet).sort());
      } catch (err) {
        if (!cancelled) setError('Could not load happy hours. Pull to refresh.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const clearFilters = useCallback(() => setFilters(DEFAULT_FILTERS), []);
  const toggleNeighborhood = useCallback(
    (n: string) =>
      setFilters((f) => ({
        ...f,
        neighborhoods: f.neighborhoods.includes(n)
          ? f.neighborhoods.filter((x) => x !== n)
          : [...f.neighborhoods, n],
      })),
    [],
  );
  const toggleDay = useCallback(
    (dow: number) =>
      setFilters((f) => ({
        ...f,
        daysOfWeek: f.daysOfWeek.includes(dow)
          ? f.daysOfWeek.filter((x) => x !== dow)
          : [...f.daysOfWeek, dow],
      })),
    [],
  );
  const togglePriceTier = useCallback(
    (t: PriceTier) =>
      setFilters((f) => ({
        ...f,
        priceTiers: f.priceTiers.includes(t)
          ? f.priceTiers.filter((x) => x !== t)
          : [...f.priceTiers, t],
      })),
    [],
  );

  const activeFilterCount = useMemo(() => {
    let c = 0;
    if (filters.neighborhoods.length) c++;
    if (filters.dealType) c++;
    if (filters.priceTiers.length) c++;
    if (filters.daysOfWeek.length) c++;
    if (filters.happeningNow) c++;
    if (filters.radiusMeters != null) c++;
    return c;
  }, [filters]);

  const getEventsForView = useCallback((): CalendarEvent[] => {
    let evs = events.filter((ev) => passAlwaysFilters(ev, filters, userLocation));
    if (view !== 'day' && filters.daysOfWeek.length > 0) {
      evs = evs.filter((ev) => filters.daysOfWeek.includes(ev.dayOfWeek));
    }
    return evs;
  }, [events, filters, userLocation, view]);

  const eventsForDay = useCallback(
    (date: Date): CalendarEvent[] => {
      const dow = jsDayToDow(date.getDay());
      return getEventsForView().filter((ev) => ev.dayOfWeek === dow);
    },
    [getEventsForView],
  );

  const value = useMemo<CalendarContextValue>(
    () => ({
      view,
      setView,
      selectedDate,
      setSelectedDate,
      filters,
      setFilters,
      activeFilterCount,
      clearFilters,
      toggleNeighborhood,
      toggleDay,
      togglePriceTier,
      events,
      userLocation,
      neighborhoods,
      loading,
      error,
      refresh,
      getEventsForView,
      eventsForDay,
    }),
    [
      view,
      selectedDate,
      filters,
      activeFilterCount,
      clearFilters,
      toggleNeighborhood,
      toggleDay,
      togglePriceTier,
      events,
      userLocation,
      neighborhoods,
      loading,
      error,
      refresh,
      getEventsForView,
      eventsForDay,
    ],
  );

  return <CalendarContext.Provider value={value}>{children}</CalendarContext.Provider>;
};

export function useCalendar(): CalendarContextValue {
  const ctx = useContext(CalendarContext);
  if (!ctx) throw new Error('useCalendar must be used within a CalendarProvider');
  return ctx;
}

export { DAY_NAMES };
