import { CalendarEvent } from '../types';
import { rankEvents } from './ranking';

// JS Date.getDay(): 0=Sun .. 6=Sat. Our schedule.day_of_week: 0=Mon .. 6=Sun.
export function jsDayToDow(jsDay: number): number {
  return jsDay === 0 ? 6 : jsDay - 1;
}
export function dowToJsDay(dow: number): number {
  return (dow + 1) % 7;
}

export function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const diff = (d.getDay() + 6) % 7; // days since Monday
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

export function getWeekDays(anchor: Date): Date[] {
  const start = startOfWeek(anchor);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export function getMonthMatrix(anchor: Date): Date[][] {
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const start = startOfWeek(first);
  const weeks: Date[][] = [];
  let cur = start;
  for (let w = 0; w < 6; w++) {
    weeks.push(Array.from({ length: 7 }, (_, i) => addDays(cur, i)));
    cur = addDays(cur, 7);
  }
  return weeks;
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

// Timeline domain: 00:00 -> 23:59 (full day).
export const TIMELINE_START_MIN = 0;
export const TIMELINE_END_MIN = 24 * 60;
export const HOUR_HEIGHT = 72;
export const PX_PER_MIN = HOUR_HEIGHT / 60;
export const TIMELINE_HEIGHT = ((TIMELINE_END_MIN - TIMELINE_START_MIN) * HOUR_HEIGHT) / 60;

export function timelineHours(): number[] {
  const hours: number[] = [];
  for (let h = 0; h <= 23; h++) hours.push(h);
  return hours;
}

export function hourLabel(hour24: number): string {
  const h = ((hour24 % 24) + 24) % 24;
  if (h === 0) return '12a';
  if (h === 12) return '12p';
  if (h < 12) return `${h}a`;
  return `${h - 12}p`;
}

// Layout overlapping events into side-by-side columns (Teams/Google style).
// Returns shallow copies of events annotated with `column` and `columns`.
export function layoutDay(events: CalendarEvent[]): CalendarEvent[] {
  const sorted = [...events].sort(
    (a, b) => a.startMinutes - b.startMinutes || a.endMinutes - b.endMinutes,
  );
  const out: CalendarEvent[] = [];
  let i = 0;
  while (i < sorted.length) {
    const cluster: CalendarEvent[] = [sorted[i]];
    let clusterEnd = sorted[i].endMinutes;
    i++;
    while (i < sorted.length && sorted[i].startMinutes < clusterEnd) {
      cluster.push(sorted[i]);
      clusterEnd = Math.max(clusterEnd, sorted[i].endMinutes);
      i++;
    }

    const cols: number[] = [];
    const laid: CalendarEvent[] = [];
    for (const ev of cluster) {
      let placed = -1;
      for (let c = 0; c < cols.length; c++) {
        if (ev.startMinutes >= cols[c]) {
          placed = c;
          break;
        }
      }
      if (placed === -1) {
        placed = cols.length;
        cols.push(ev.endMinutes);
      } else {
        cols[placed] = ev.endMinutes;
      }
      laid.push({ ...ev, column: placed, columns: 0 });
    }
    const total = cols.length;
    for (const l of laid) l.columns = total;
    out.push(...laid);
  }
  return out;
}

// Above this many *additional* overlapping deals in a time slot, the lower
// ranked ones collapse into a single "N more" cluster block. Keeps the number
// of individually rendered blocks per slot at or below Miller's 7±2 and, more
// importantly, Hick's comfortable 3-5 choice set (1 top pick + up to 3 others).
export const CLUSTER_THRESHOLD = 4;

export type TimelineItem =
  | {
      kind: 'event';
      event: CalendarEvent;
      startMinutes: number;
      endMinutes: number;
      column: number;
      columns: number;
      topPick: boolean;
    }
  | {
      kind: 'cluster';
      events: CalendarEvent[];
      startMinutes: number;
      endMinutes: number;
      column: number;
      columns: number;
      label: string;
    };

// Tiered-hierarchy + clustering layout for the Day/Week timeline.
// 1. Rank events by relevance (rating + urgency).
// 2. Group mutually-overlapping events into time-slot clusters.
// 3. In each cluster the single highest-ranked deal is always shown
//    individually as a "top pick" (recognition + Gestalt similarity: every
//    top pick shares a marker). The remaining deals are shown individually
//    only while they stay within CLUSTER_THRESHOLD; beyond that they merge
//    into one "N more" cluster block that defers detail to a tap
//    (progressive disclosure).
// 4. Column-pack the resulting items so nothing overlaps visually.
export function layoutDayClustered(
  events: CalendarEvent[],
  now: Date = new Date(),
  threshold: number = CLUSTER_THRESHOLD,
): TimelineItem[] {
  const ranked = rankEvents(events, now);

  // 1+2: greedy overlap clusters (input is score-sorted, so index 0 = best).
  const clusters: CalendarEvent[][] = [];
  let cur: CalendarEvent[] = [];
  let curEnd = -Infinity;
  for (const ev of ranked) {
    if (cur.length && ev.startMinutes >= curEnd) {
      clusters.push(cur);
      cur = [];
      curEnd = -Infinity;
    }
    cur.push(ev);
    curEnd = Math.max(curEnd, ev.endMinutes);
  }
  if (cur.length) clusters.push(cur);

  const items: { start: number; end: number; item: TimelineItem }[] = [];
  for (const c of clusters) {
    const cs = Math.min(...c.map((e) => e.startMinutes));
    const ce = Math.max(...c.map((e) => e.endMinutes));
    const [top, ...rest] = c;
    items.push({
      start: top.startMinutes,
      end: top.endMinutes,
      item: {
        kind: 'event',
        event: top,
        startMinutes: top.startMinutes,
        endMinutes: top.endMinutes,
        column: 0,
        columns: 1,
        topPick: true,
      },
    });
    if (rest.length > threshold - 1) {
      const rs = Math.min(...rest.map((e) => e.startMinutes));
      const re = Math.max(...rest.map((e) => e.endMinutes));
      items.push({
        start: rs,
        end: re,
        item: {
          kind: 'cluster',
          events: rest,
          startMinutes: rs,
          endMinutes: re,
          column: 0,
          columns: 1,
          label: `${rest.length} more`,
        },
      });
    } else {
      for (const ev of rest) {
        items.push({
          start: ev.startMinutes,
          end: ev.endMinutes,
          item: {
            kind: 'event',
            event: ev,
            startMinutes: ev.startMinutes,
            endMinutes: ev.endMinutes,
            column: 0,
            columns: 1,
            topPick: false,
          },
        });
      }
    }
  }

  // 4: greedy column packing of all items across the day.
  const sorted = items.sort((a, b) => a.start - b.start || a.end - b.end);
  const colsEnd: number[] = [];
  const out: TimelineItem[] = [];
  for (const it of sorted) {
    let placed = -1;
    for (let c = 0; c < colsEnd.length; c++) {
      if (it.start >= colsEnd[c]) {
        placed = c;
        break;
      }
    }
    if (placed === -1) {
      placed = colsEnd.length;
      colsEnd.push(it.end);
    } else {
      colsEnd[placed] = it.end;
    }
    const total = colsEnd.length;
    out.push({ ...it.item, column: placed, columns: total });
  }
  return out;
}
