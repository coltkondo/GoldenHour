import {
  formatScheduleRange,
  hasEndedAt,
  isLiveAt,
  isOvernight,
  isRelevantToday,
  scheduleForNow,
} from '../utils/scheduleUtils';
import { HappyHourSchedule } from '../types/api';

// day_of_week: 0=Mon … 4=Fri, 5=Sat, 6=Sun (backend convention)
const FRI = 4;
const SAT = 5;
const SUN = 6;
const sched = (
  day: number,
  start: string,
  end: string,
  id = `${day}-${start}`,
): HappyHourSchedule =>
  ({ id, day_of_week: day, start_time: start, end_time: end, active: true }) as HappyHourSchedule;

// Local-time dates. 2026-11-13 is a Friday.
const at = (d: number, h: number, m = 0) => new Date(2026, 10, d, h, m);
const FRI_8PM = at(13, 20);
const FRI_11PM = at(13, 23);
const FRI_0030 = at(13, 0, 30);
const SAT_0030 = at(14, 0, 30);
const SAT_0100 = at(14, 1);
const SAT_5PM = at(14, 17);
const MON_0130 = at(16, 1, 30);

const friNormal = sched(FRI, '16:00:00', '19:00:00');
const friOvernight = sched(FRI, '22:00:00', '01:00:00'); // Fri 10pm → Sat 1am
const friToMidnight = sched(FRI, '21:00:00', '00:00:00');
const satNormal = sched(SAT, '16:00:00', '19:00:00');
const sunOvernight = sched(SUN, '23:00:00', '02:00:00'); // Sun → Mon wrap

describe('isOvernight', () => {
  test('end at or before start', () => {
    expect(isOvernight(friOvernight)).toBe(true);
    expect(isOvernight(friToMidnight)).toBe(true);
    expect(isOvernight(friNormal)).toBe(false);
  });
});

describe('isLiveAt (day-aware)', () => {
  test.each([
    ['Fri 8pm: nothing live', FRI_8PM, friOvernight, false],
    ['Fri 11pm: overnight live before midnight', FRI_11PM, friOvernight, true],
    ['Sat 12:30am: Friday overnight still live', SAT_0030, friOvernight, true],
    ['Sat 1:00am: end is exclusive', SAT_0100, friOvernight, false],
    ["Fri 12:30am: Friday's overnight hasn't started", FRI_0030, friOvernight, false],
    ['Mon 1:30am: Sunday overnight wraps the week', MON_0130, sunOvernight, true],
    ['normal window on its day', at(13, 17), friNormal, true],
    ['normal window on another day', at(14, 17), friNormal, false],
  ])('%s', (_label, now, s, expected) => {
    expect(isLiveAt(s, now)).toBe(expected);
  });

  test('undefined schedule is never live', () => {
    expect(isLiveAt(undefined, FRI_11PM)).toBe(false);
  });
});

describe('hasEndedAt', () => {
  test("today's normal window ends at its end time", () => {
    expect(hasEndedAt(friNormal, at(13, 18))).toBe(false);
    expect(hasEndedAt(friNormal, FRI_8PM)).toBe(true);
  });
  test("today's overnight window never 'ends' today (it ends tomorrow)", () => {
    expect(hasEndedAt(friOvernight, FRI_11PM)).toBe(false);
  });
  test("last night's overnight window ends this morning", () => {
    expect(hasEndedAt(friOvernight, SAT_0030)).toBe(false);
    expect(hasEndedAt(friOvernight, SAT_5PM)).toBe(true);
  });
});

describe('isRelevantToday', () => {
  test("12:30am Sat: Saturday's rows plus Friday's still-running overnight", () => {
    expect(isRelevantToday(satNormal, SAT_0030)).toBe(true);
    expect(isRelevantToday(friOvernight, SAT_0030)).toBe(true);
    expect(isRelevantToday(friNormal, SAT_0030)).toBe(false);
  });
  test('Friday overnight drops off after it ends', () => {
    expect(isRelevantToday(friOvernight, SAT_5PM)).toBe(false);
  });
});

describe('scheduleForNow', () => {
  test('prefers the live schedule (last night) over a later one today', () => {
    // Same deal runs Fri 10pm–1am and Sat 4–7pm.
    expect(scheduleForNow([friOvernight, satNormal], SAT_0030)).toBe(friOvernight);
  });
  test("otherwise today's schedule", () => {
    expect(scheduleForNow([friOvernight, satNormal], SAT_5PM)).toBe(satNormal);
  });
  test('nothing relevant → undefined', () => {
    expect(scheduleForNow([friNormal], SAT_5PM)).toBeUndefined();
  });
});

describe('formatScheduleRange across midnight', () => {
  test('shows the real end time', () => {
    expect(formatScheduleRange('22:00:00', '01:00:00')).toMatch(/10.*1/);
  });
});
