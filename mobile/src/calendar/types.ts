import { Venue, Deal, HappyHourSchedule } from '../types/api';

export { DAY_NAMES } from '../types/api';

export type ViewMode = 'day' | 'week' | 'month';

export type DealTypeFilter = 'drinks' | 'food' | 'both';
export type PriceTier = 1 | 2 | 3 | 4;

export interface Filters {
  neighborhoods: string[];
  dealType: DealTypeFilter | null;
  priceTiers: PriceTier[];
  daysOfWeek: number[]; // 0=Mon .. 6=Sun
  happeningNow: boolean;
  radiusMeters: number | null; // null = no distance filter
}

export const DEFAULT_FILTERS: Filters = {
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
