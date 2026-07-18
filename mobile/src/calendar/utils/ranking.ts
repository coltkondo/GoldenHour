import { CalendarEvent } from '../types';

export interface RankedEvent extends CalendarEvent {
  score: number;
}

// Tiered-hierarchy relevance signal. Optimizes for GLDNHR's core question —
// "where should I go for a happy hour right now / tonight?" — so the few
// deals worth a tap surface above the long tail. Combines:
//   - venue rating (primary, stable across days)
//   - verified status
//   - deal count
//   - urgency when viewing *today* (happening now > ending within 60/120 min)
export function eventScore(ev: CalendarEvent, now: Date): number {
  let score = 0;

  const rating = ev.venue.rating;
  if (rating != null) score += rating * 2; // 0..10
  if (ev.venue.verified) score += 1;
  score += Math.min(ev.deals.length, 3) * 0.5;

  const curMin = now.getHours() * 60 + now.getMinutes();
  const s = ev.startMinutes % 1440;
  const e = ev.endMinutes % 1440;
  const happeningNow = e > s ? curMin >= s && curMin < e : curMin >= s || curMin < e;
  if (happeningNow) {
    score += 5;
  } else {
    const minsUntilEnd = (e - curMin + 1440) % 1440;
    if (minsUntilEnd <= 60) score += 3;
    else if (minsUntilEnd <= 120) score += 1.5;
  }

  return score;
}

export function rankEvents(events: CalendarEvent[], now: Date = new Date()): RankedEvent[] {
  return events
    .map((ev) => ({ ...ev, score: eventScore(ev, now) }))
    .sort((a, b) => b.score - a.score || a.startMinutes - b.startMinutes);
}
