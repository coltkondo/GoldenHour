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
