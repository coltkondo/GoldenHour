import { Venue, Deal, HappyHourSchedule, Event as ApiEvent } from '../types/api';

export { DAY_NAMES } from '../types/api';

export type ViewMode = 'day' | 'week' | 'month';

export type DealTypeFilter = 'drinks' | 'food' | 'both';
export type PriceTier = 1 | 2 | 3 | 4;

export interface Filters {
  venueIds: string[];
  neighborhoods: string[];
  dealType: DealTypeFilter | null;
  priceTiers: PriceTier[];
  daysOfWeek: number[]; // 0=Mon .. 6=Sun
  happeningNow: boolean;
  radiusMeters: number | null;
}

export const DEFAULT_FILTERS: Filters = {
  venueIds: [],
  neighborhoods: [],
  dealType: null,
  priceTiers: [],
  daysOfWeek: [],
  happeningNow: false,
  radiusMeters: null,
};

export interface CalendarEvent {
  id: string;
  venue: Venue;
  schedule: HappyHourSchedule;
  deals: Deal[];
  title: string;
  dayOfWeek: number; // 0=Mon .. 6=Sun (matches schedule.day_of_week)
  startMinutes: number; // minutes from midnight (may exceed 1440 when crossing midnight)
  endMinutes: number; // minutes from midnight (may exceed 1440)
  priceLevel: number | null;
  // layout (set by layoutDay)
  column?: number;
  columns?: number;
}

// Events calendar item — dated occurrence, not a recurring weekly slot.
// Deliberately parallel to CalendarEvent (same id/title/startMinutes/endMinutes
// shape) so it can flow through the same layoutDay() column-packing function,
// but `date` replaces `dayOfWeek` since two Tuesdays can show different events.
export interface EventCalItem {
  id: string;
  venue: Venue;
  event: ApiEvent;
  title: string;
  date: Date; // local calendar date this occurrence falls on
  startMinutes: number; // minutes from midnight, local to `date`
  endMinutes: number;
  column?: number;
  columns?: number;
}
