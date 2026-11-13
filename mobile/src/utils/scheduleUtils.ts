import { HappyHourSchedule } from '../types/api';

/**
 * Parse a PostgreSQL time string ("HH:MM:SS" or "HH:MM") into hour and minute.
 * Throws on malformed input — callers should wrap in try/catch or use formatScheduleRange.
 */
export function parseTimeString(timeStr: string): { hour: number; minute: number } {
  const parts = timeStr.split(':');
  const hour = parseInt(parts[0], 10);
  const minute = parseInt(parts[1] ?? '0', 10);
  if (isNaN(hour) || isNaN(minute)) throw new Error(`Invalid time: ${timeStr}`);
  return { hour, minute };
}

/**
 * Convert a JS Date's day-of-week (0=Sunday..6=Saturday, the `getDay()`
 * convention) into the backend's `day_of_week` convention used by
 * HappyHourSchedule (0=Monday..6=Sunday).
 */
export function todayDbIndex(now: Date = new Date()): number {
  const today = now.getDay();
  return today === 0 ? 6 : today - 1;
}

/**
 * True when the schedule's happy hour window is in effect right now.
 *
 * Handles midnight-crossing windows (end < start, e.g. 9pm–1am): live when the
 * current time is at/after the start, or before the end earlier that morning.
 * A deal without a schedule is never live. Times are compared in the device's
 * local clock, matching how the rest of the app evaluates schedules.
 */
export function isCurrentlyLive(
  schedule: HappyHourSchedule | undefined,
  now: Date = new Date(),
): boolean {
  if (!schedule) return false;
  try {
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const start = parseTimeString(schedule.start_time);
    const end = parseTimeString(schedule.end_time);
    const startMinutes = start.hour * 60 + start.minute;
    const endMinutes = end.hour * 60 + end.minute;
    if (endMinutes > startMinutes) {
      return currentMinutes >= startMinutes && currentMinutes < endMinutes;
    }
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  } catch {
    return false;
  }
}

/**
 * True when the schedule's happy hour window has already ended for the day.
 *
 * Midnight-crossing windows are left alone (they may still be live early in
 * the morning). A deal without a schedule is never considered ended.
 */
export function isAlreadyEnded(
  schedule: HappyHourSchedule | undefined,
  now: Date = new Date(),
): boolean {
  if (!schedule) return false;
  try {
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const start = parseTimeString(schedule.start_time);
    const end = parseTimeString(schedule.end_time);
    const startMinutes = start.hour * 60 + start.minute;
    const endMinutes = end.hour * 60 + end.minute;
    // Only mark ended for normal daytime slots; midnight-crossing slots are left alone
    if (endMinutes > startMinutes) {
      return currentMinutes >= endMinutes;
    }
    return false;
  } catch {
    return false;
  }
}

// ── Day-aware helpers (overnight happy hours) ─────────────────────────────
//
// A schedule on day D whose end is at or before its start runs past midnight:
// Fri 22:00–01:00 is live Fri 10pm → Sat 1am. Callers that only look at
// *today's* rows miss the after-midnight half (it belongs to yesterday's row)
// and wrongly mark today's row live before it starts. Use these, not the
// time-only isCurrentlyLive/isAlreadyEnded above. Mirrors
// backend/app/services/schedule_window.py.

function minutesOf(t: string): number {
  const { hour, minute } = parseTimeString(t);
  return hour * 60 + minute;
}

function nowMinutes(now: Date): number {
  return now.getHours() * 60 + now.getMinutes();
}

function yesterdayDbIndex(now: Date): number {
  return (todayDbIndex(now) + 6) % 7;
}

/** True when the window runs past midnight into the next day. */
export function isOvernight(schedule: HappyHourSchedule): boolean {
  try {
    return minutesOf(schedule.end_time) <= minutesOf(schedule.start_time);
  } catch {
    return false;
  }
}

/** True when `schedule` belongs on today's list: today's row, or yesterday's
 *  overnight row that hasn't ended yet this morning. */
export function isRelevantToday(schedule: HappyHourSchedule, now: Date = new Date()): boolean {
  try {
    if (schedule.day_of_week === todayDbIndex(now)) return true;
    return (
      schedule.day_of_week === yesterdayDbIndex(now) &&
      isOvernight(schedule) &&
      nowMinutes(now) < minutesOf(schedule.end_time)
    );
  } catch {
    return false;
  }
}

/** True when `schedule`'s window contains `now` (end exclusive), across midnight. */
export function isLiveAt(schedule: HappyHourSchedule | undefined, now: Date = new Date()): boolean {
  if (!schedule) return false;
  try {
    const cur = nowMinutes(now);
    const start = minutesOf(schedule.start_time);
    const end = minutesOf(schedule.end_time);
    const today = todayDbIndex(now);
    if (end > start) return schedule.day_of_week === today && cur >= start && cur < end;
    // Overnight: before midnight on its own day, or after midnight the next day.
    if (schedule.day_of_week === today) return cur >= start;
    return schedule.day_of_week === yesterdayDbIndex(now) && cur < end;
  } catch {
    return false;
  }
}

/** True when today's occurrence of `schedule` is over. */
export function hasEndedAt(
  schedule: HappyHourSchedule | undefined,
  now: Date = new Date(),
): boolean {
  if (!schedule) return false;
  try {
    const cur = nowMinutes(now);
    const end = minutesOf(schedule.end_time);
    if (schedule.day_of_week === todayDbIndex(now)) {
      return isOvernight(schedule) ? false : cur >= end; // overnight ends tomorrow
    }
    // Yesterday's overnight row: over once we pass its end this morning.
    return schedule.day_of_week === yesterdayDbIndex(now) && isOvernight(schedule) && cur >= end;
  } catch {
    return false;
  }
}

/** What a venue's map pin shows: a happy hour on now, one still to come
 *  today, or nothing left today. */
export type VenueDealStatus = 'live' | 'later' | 'none';

/** Status of a venue at `now`, from its weekly happy-hour schedules. */
export function venueDealStatusAt(
  schedules: HappyHourSchedule[],
  now: Date = new Date(),
): VenueDealStatus {
  const active = schedules.filter((s) => s.active);
  if (active.some((s) => isLiveAt(s, now))) return 'live';
  const later = active.some(
    (s) => isRelevantToday(s, now) && !isLiveAt(s, now) && !hasEndedAt(s, now),
  );
  return later ? 'later' : 'none';
}

/** Of one deal's schedules, the one that represents it right now: a live one
 *  if any (including last night's still running), else today's. */
export function scheduleForNow(
  schedules: HappyHourSchedule[],
  now: Date = new Date(),
): HappyHourSchedule | undefined {
  const relevant = schedules.filter((s) => isRelevantToday(s, now));
  return (
    relevant.find((s) => isLiveAt(s, now)) ??
    relevant.find((s) => s.day_of_week === todayDbIndex(now)) ??
    relevant[0]
  );
}

function to12Hour(hour: number): number {
  if (hour === 0) return 12;
  if (hour > 12) return hour - 12;
  return hour;
}

function period(hour: number): 'a' | 'p' {
  return hour >= 12 ? 'p' : 'a';
}

function minuteSuffix(minute: number): string {
  return minute > 0 ? `:${String(minute).padStart(2, '0')}` : '';
}

/**
 * Format a schedule start_time / end_time pair (PostgreSQL time strings like
 * "16:00:00" or "16:00") into a short display range for the UI.
 *
 * Examples:
 *   "16:00:00", "19:00:00" → "4–7p"
 *   "15:30:00", "18:00:00" → "3:30–6p"
 *   "11:00:00", "14:00:00" → "11a–2p"
 *   undefined, undefined   → fallback (default "Today")
 *   malformed string       → fallback
 */
export function formatScheduleRange(
  startTime: string | undefined,
  endTime: string | undefined,
  fallback = 'Today',
): string {
  if (!startTime || !endTime) return fallback;
  try {
    const start = parseTimeString(startTime);
    const end = parseTimeString(endTime);
    const sh = to12Hour(start.hour);
    const eh = to12Hour(end.hour);
    const sp = period(start.hour);
    const ep = period(end.hour);
    const sm = minuteSuffix(start.minute);
    const em = minuteSuffix(end.minute);
    // Same period: omit it from start, show once at end — "4–7p"
    if (sp === ep) return `${sh}${sm}–${eh}${em}${ep}`;
    return `${sh}${sm}${sp}–${eh}${em}${ep}`;
  } catch {
    return fallback;
  }
}
