import { useEffect, useRef, useState } from 'react';
import { venuesAPI } from '../api/endpoints';
import { HappyHourSchedule, Venue } from '../types/api';
import { isCurrentlyLive, todayDbIndex } from '../utils/scheduleUtils';

const SCHEDULE_FETCH_CONCURRENCY = 8;

/**
 * Returns the set of venue ids currently serving happy hour.
 *
 * Fetches each venue's weekly schedule once (cached per venue id across
 * renders), then filters to today's day-of-week and evaluates the current
 * time against each window using the same rules as the Home feed.
 */
export function useLiveVenueStatus(venues: Venue[]): Set<string> {
  const [liveIds, setLiveIds] = useState<Set<string>>(() => new Set());
  const cacheRef = useRef<Map<string, HappyHourSchedule[]>>(new Map());

  useEffect(() => {
    const cache = cacheRef.current;
    const missingIds = venues
      .filter((v) => v.active)
      .map((v) => v.id)
      .filter((id) => !cache.has(id));

    if (missingIds.length === 0) {
      setLiveIds(computeLiveIds(venues, cache));
      return;
    }

    let cancelled = false;
    fetchWithConcurrency(missingIds, SCHEDULE_FETCH_CONCURRENCY, async (id) => {
      if (cancelled) return;
      const schedules = await venuesAPI.getSchedules(id).catch(() => [] as HappyHourSchedule[]);
      if (cancelled) return;
      cache.set(id, schedules);
    }).then(() => {
      if (cancelled) return;
      setLiveIds(computeLiveIds(venues, cache));
    });

    return () => {
      cancelled = true;
    };
  }, [venues]);

  return liveIds;
}

function computeLiveIds(venues: Venue[], cache: Map<string, HappyHourSchedule[]>): Set<string> {
  const now = new Date();
  const todayDb = todayDbIndex(now);
  const live = new Set<string>();
  for (const venue of venues) {
    if (!venue.active) continue;
    const schedules = cache.get(venue.id) ?? [];
    const isLive = schedules.some(
      (s) => s.active && s.day_of_week === todayDb && isCurrentlyLive(s, now),
    );
    if (isLive) live.add(venue.id);
  }
  return live;
}

function fetchWithConcurrency<T>(
  items: T[],
  limit: number,
  task: (item: T) => Promise<void>,
): Promise<void> {
  let nextIndex = 0;
  const workerCount = Math.max(1, Math.min(limit, items.length));
  const workers = Array.from({ length: workerCount }, async () => {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      await task(items[index]);
    }
  });
  return Promise.all(workers).then(() => undefined);
}
