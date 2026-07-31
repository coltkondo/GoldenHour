import {
  parseTimeString,
  formatScheduleRange,
  todayDbIndex,
  isCurrentlyLive,
  isAlreadyEnded,
} from '../utils/scheduleUtils';
import { HappyHourSchedule } from '../types/api';

const schedule = (startTime: string, endTime: string): HappyHourSchedule =>
  ({ start_time: startTime, end_time: endTime }) as HappyHourSchedule;

// ---------------------------------------------------------------------------
// parseTimeString
// ---------------------------------------------------------------------------

describe('parseTimeString', () => {
  test('parses "HH:MM:SS" format (PostgreSQL time column default)', () => {
    expect(parseTimeString('16:00:00')).toEqual({ hour: 16, minute: 0 });
    expect(parseTimeString('19:30:00')).toEqual({ hour: 19, minute: 30 });
    expect(parseTimeString('00:00:00')).toEqual({ hour: 0, minute: 0 });
  });

  test('parses "HH:MM" format', () => {
    expect(parseTimeString('16:00')).toEqual({ hour: 16, minute: 0 });
    expect(parseTimeString('09:30')).toEqual({ hour: 9, minute: 30 });
  });

  test('parses noon and midnight correctly', () => {
    expect(parseTimeString('12:00:00')).toEqual({ hour: 12, minute: 0 });
    expect(parseTimeString('00:00:00')).toEqual({ hour: 0, minute: 0 });
  });

  test('throws on malformed input', () => {
    expect(() => parseTimeString('not-a-time')).toThrow();
    expect(() => parseTimeString('')).toThrow();
  });
});

// ---------------------------------------------------------------------------
// formatScheduleRange
// ---------------------------------------------------------------------------

describe('formatScheduleRange', () => {
  // Same-period ranges — period shown once at the end
  test('4pm–7pm → "4–7p"', () => {
    expect(formatScheduleRange('16:00:00', '19:00:00')).toBe('4–7p');
  });

  test('5pm–8pm → "5–8p"', () => {
    expect(formatScheduleRange('17:00:00', '20:00:00')).toBe('5–8p');
  });

  test('3pm–6pm → "3–6p"', () => {
    expect(formatScheduleRange('15:00:00', '18:00:00')).toBe('3–6p');
  });

  test('10am–11am → "10–11a"', () => {
    expect(formatScheduleRange('10:00:00', '11:00:00')).toBe('10–11a');
  });

  // Cross-period ranges — both periods shown
  test('11am–2pm → "11a–2p"', () => {
    expect(formatScheduleRange('11:00:00', '14:00:00')).toBe('11a–2p');
  });

  test('midnight to 1am → "12–1a" (same period, period shown once at end)', () => {
    expect(formatScheduleRange('00:00:00', '01:00:00')).toBe('12–1a');
  });

  // Minutes
  test('3:30pm–6pm → "3:30–6p"', () => {
    expect(formatScheduleRange('15:30:00', '18:00:00')).toBe('3:30–6p');
  });

  test('4pm–6:30pm → "4–6:30p"', () => {
    expect(formatScheduleRange('16:00:00', '18:30:00')).toBe('4–6:30p');
  });

  test('3:30pm–5:30pm → "3:30–5:30p"', () => {
    expect(formatScheduleRange('15:30:00', '17:30:00')).toBe('3:30–5:30p');
  });

  // HH:MM format (without seconds)
  test('works with HH:MM format too', () => {
    expect(formatScheduleRange('16:00', '19:00')).toBe('4–7p');
  });

  // Fallback cases
  test('returns "Today" when both are undefined', () => {
    expect(formatScheduleRange(undefined, undefined)).toBe('Today');
  });

  test('returns "Today" when startTime is undefined', () => {
    expect(formatScheduleRange(undefined, '19:00:00')).toBe('Today');
  });

  test('returns "Today" when endTime is undefined', () => {
    expect(formatScheduleRange('16:00:00', undefined)).toBe('Today');
  });

  test('returns custom fallback when times are undefined', () => {
    expect(formatScheduleRange(undefined, undefined, 'Hours vary')).toBe('Hours vary');
  });

  test('returns fallback on malformed startTime', () => {
    expect(formatScheduleRange('not-a-time', '19:00:00')).toBe('Today');
  });

  test('returns fallback on malformed endTime', () => {
    expect(formatScheduleRange('16:00:00', 'bad')).toBe('Today');
  });

  test('does not throw on any input', () => {
    const inputs: [string | undefined, string | undefined][] = [
      [undefined, undefined],
      ['', ''],
      ['16:00:00', undefined],
      [undefined, '19:00:00'],
      ['bad', 'worse'],
      ['16:00:00', '19:00:00'],
    ];
    for (const [s, e] of inputs) {
      expect(() => formatScheduleRange(s, e)).not.toThrow();
    }
  });
});

// ---------------------------------------------------------------------------
// todayDbIndex
// ---------------------------------------------------------------------------

describe('todayDbIndex', () => {
  test('maps Sunday (getDay 0) to backend 6', () => {
    expect(todayDbIndex(new Date(2026, 6, 26, 12, 0, 0))).toBe(6);
  });

  test('maps Monday (getDay 1) to backend 0', () => {
    expect(todayDbIndex(new Date(2026, 6, 27, 12, 0, 0))).toBe(0);
  });

  test('maps Wednesday (getDay 3) to backend 2', () => {
    expect(todayDbIndex(new Date(2026, 6, 29, 12, 0, 0))).toBe(2);
  });

  test('maps Saturday (getDay 6) to backend 5', () => {
    expect(todayDbIndex(new Date(2026, 7, 1, 12, 0, 0))).toBe(5);
  });
});

// ---------------------------------------------------------------------------
// isCurrentlyLive
// ---------------------------------------------------------------------------

describe('isCurrentlyLive', () => {
  test('false before the window opens', () => {
    const now = new Date(2026, 6, 29, 15, 0, 0);
    expect(isCurrentlyLive(schedule('16:00:00', '19:00:00'), now)).toBe(false);
  });

  test('true exactly at the start time (inclusive)', () => {
    const now = new Date(2026, 6, 29, 16, 0, 0);
    expect(isCurrentlyLive(schedule('16:00:00', '19:00:00'), now)).toBe(true);
  });

  test('true in the middle of the window', () => {
    const now = new Date(2026, 6, 29, 17, 30, 0);
    expect(isCurrentlyLive(schedule('16:00:00', '19:00:00'), now)).toBe(true);
  });

  test('false exactly at the end time (exclusive)', () => {
    const now = new Date(2026, 6, 29, 19, 0, 0);
    expect(isCurrentlyLive(schedule('16:00:00', '19:00:00'), now)).toBe(false);
  });

  test('false after the window closes', () => {
    const now = new Date(2026, 6, 29, 20, 0, 0);
    expect(isCurrentlyLive(schedule('16:00:00', '19:00:00'), now)).toBe(false);
  });

  test('midnight-crossing window live in the evening', () => {
    const now = new Date(2026, 6, 29, 23, 0, 0);
    expect(isCurrentlyLive(schedule('21:00:00', '01:00:00'), now)).toBe(true);
  });

  test('midnight-crossing window live after midnight', () => {
    const now = new Date(2026, 6, 30, 0, 30, 0);
    expect(isCurrentlyLive(schedule('21:00:00', '01:00:00'), now)).toBe(true);
  });

  test('midnight-crossing window not live in the afternoon', () => {
    const now = new Date(2026, 6, 30, 14, 0, 0);
    expect(isCurrentlyLive(schedule('21:00:00', '01:00:00'), now)).toBe(false);
  });

  test('false when there is no schedule', () => {
    const now = new Date(2026, 6, 29, 17, 0, 0);
    expect(isCurrentlyLive(undefined, now)).toBe(false);
  });

  test('false on malformed times', () => {
    const now = new Date(2026, 6, 29, 17, 0, 0);
    expect(isCurrentlyLive(schedule('not-a-time', '19:00:00'), now)).toBe(false);
    expect(isCurrentlyLive(schedule('16:00:00', 'bad'), now)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// isAlreadyEnded
// ---------------------------------------------------------------------------

describe('isAlreadyEnded', () => {
  test('false before the window opens', () => {
    const now = new Date(2026, 6, 29, 15, 0, 0);
    expect(isAlreadyEnded(schedule('16:00:00', '19:00:00'), now)).toBe(false);
  });

  test('false in the middle of the window', () => {
    const now = new Date(2026, 6, 29, 17, 30, 0);
    expect(isAlreadyEnded(schedule('16:00:00', '19:00:00'), now)).toBe(false);
  });

  test('true exactly at the end time', () => {
    const now = new Date(2026, 6, 29, 19, 0, 0);
    expect(isAlreadyEnded(schedule('16:00:00', '19:00:00'), now)).toBe(true);
  });

  test('true after the window closes', () => {
    const now = new Date(2026, 6, 29, 20, 0, 0);
    expect(isAlreadyEnded(schedule('16:00:00', '19:00:00'), now)).toBe(true);
  });

  test('midnight-crossing window never marked ended while live in the evening', () => {
    const now = new Date(2026, 6, 29, 23, 0, 0);
    expect(isAlreadyEnded(schedule('21:00:00', '01:00:00'), now)).toBe(false);
  });

  test('midnight-crossing window not marked ended after midnight', () => {
    const now = new Date(2026, 6, 30, 0, 30, 0);
    expect(isAlreadyEnded(schedule('21:00:00', '01:00:00'), now)).toBe(false);
  });

  test('false when there is no schedule', () => {
    const now = new Date(2026, 6, 29, 20, 0, 0);
    expect(isAlreadyEnded(undefined, now)).toBe(false);
  });

  test('false on malformed times', () => {
    const now = new Date(2026, 6, 29, 20, 0, 0);
    expect(isAlreadyEnded(schedule('not-a-time', '19:00:00'), now)).toBe(false);
    expect(isAlreadyEnded(schedule('16:00:00', 'bad'), now)).toBe(false);
  });
});
