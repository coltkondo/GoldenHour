import { venueDealStatusAt } from '../utils/scheduleUtils';
import { HappyHourSchedule } from '../types/api';
import pinGeometry from '../components/assets/pins/pinGeometry.json';

// day_of_week: 0=Mon … 4=Fri, 5=Sat, 6=Sun (backend convention)
const FRI = 4;
const SAT = 5;
const sched = (day: number, start: string, end: string, active = true): HappyHourSchedule =>
  ({
    id: `${day}-${start}`,
    day_of_week: day,
    start_time: start,
    end_time: end,
    active,
  }) as HappyHourSchedule;

// Local-time dates. 2026-11-13 is a Friday.
const at = (d: number, h: number, m = 0) => new Date(2026, 10, d, h, m);

describe('venueDealStatusAt', () => {
  const friNormal = sched(FRI, '16:00:00', '19:00:00');
  const friOvernight = sched(FRI, '22:00:00', '01:00:00');

  test('live during the window', () => {
    expect(venueDealStatusAt([friNormal], at(13, 17))).toBe('live');
  });

  test('later before today’s window starts', () => {
    expect(venueDealStatusAt([friNormal], at(13, 12))).toBe('later');
  });

  test('none once today’s window has ended', () => {
    expect(venueDealStatusAt([friNormal], at(13, 19))).toBe('none');
  });

  test('none with no schedule today', () => {
    expect(venueDealStatusAt([sched(SAT, '16:00:00', '19:00:00')], at(13, 12))).toBe('none');
    expect(venueDealStatusAt([], at(13, 12))).toBe('none');
  });

  test('live beats later when a venue has both', () => {
    expect(venueDealStatusAt([friNormal, friOvernight], at(13, 17))).toBe('live');
  });

  test('later between two windows on the same day', () => {
    expect(venueDealStatusAt([friNormal, friOvernight], at(13, 20))).toBe('later');
  });

  test('last night’s overnight window is still live after midnight', () => {
    expect(venueDealStatusAt([friOvernight], at(14, 0, 30))).toBe('live');
    expect(venueDealStatusAt([friOvernight], at(14, 1))).toBe('none');
  });

  test('inactive schedules are ignored', () => {
    expect(venueDealStatusAt([sched(FRI, '16:00:00', '19:00:00', false)], at(13, 17))).toBe('none');
  });
});

describe('pin geometry', () => {
  test('every status has default and selected geometry with a sane anchor', () => {
    for (const status of ['live', 'later', 'none'] as const) {
      for (const state of ['default', 'selected'] as const) {
        const g = pinGeometry[status][state];
        expect(g.anchor.y).toBeGreaterThan(0);
        expect(g.anchor.y).toBeLessThanOrEqual(1);
        expect(g.topAboveAnchor).toBeGreaterThan(0);
        expect(g.topAboveAnchor).toBeLessThanOrEqual(g.height * g.anchor.y);
      }
    }
  });
});
