import { brand } from '../../theme/colors';

export interface GoldenPeriod {
  key: string;
  label: string;
  startHour: number; // 0-24
  endHour: number; // 0-24 (exclusive), may exceed 24 after normalization
  color: string;
}

// Six "golden hour" periods mapped onto the existing brand palette so event
// blocks are tinted by when they happen (not by deal type), while still
// adhering to the current light/dark color system.
export const GOLDEN_PERIODS: GoldenPeriod[] = [
  { key: 'morning', label: 'Morning', startHour: 6, endHour: 12, color: brand.blue },
  { key: 'afternoon', label: 'Afternoon', startHour: 12, endHour: 17, color: brand.green },
  { key: 'golden', label: 'Golden Hour', startHour: 17, endHour: 19, color: brand.gold },
  { key: 'dusk', label: 'Dusk', startHour: 19, endHour: 21, color: brand.amber },
  { key: 'prime', label: 'Prime', startHour: 21, endHour: 23, color: brand.orange },
  { key: 'late', label: 'Late Night', startHour: 23, endHour: 30, color: brand.error }, // 23:00 - 06:00
];

export function periodForStartHour(hour: number): GoldenPeriod {
  const h = ((hour % 24) + 24) % 24;
  if (h >= 6 && h < 12) return GOLDEN_PERIODS[0];
  if (h >= 12 && h < 17) return GOLDEN_PERIODS[1];
  if (h >= 17 && h < 19) return GOLDEN_PERIODS[2];
  if (h >= 19 && h < 21) return GOLDEN_PERIODS[3];
  if (h >= 21 && h < 23) return GOLDEN_PERIODS[4];
  return GOLDEN_PERIODS[5];
}
