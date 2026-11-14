import { useEffect, useRef, useState } from 'react';
import { venuesAPI } from '../api/endpoints';
import { HappyHourSchedule, Venue } from '../types/api';
import { VenueDealStatus, venueDealStatusAt } from '../utils/scheduleUtils';

const SCHEDULE_FETCH_CONCURRENCY = 8;
const REEVALUATE_MS = 60_000;

/**
 * Returns each venue's deal status (happy hour on now / later today / none).
 * Venues missing from the map have no known status yet (treat as 'none').
 *
 * Fetches each venue's weekly schedule once (cached per venue id across
 * renders), then evaluates the current time with the day-aware rules the Home
 * feed uses (overnight windows count after midnight). Re-evaluates every
 * minute so a pin turns gold when its happy hour starts while the map is open.
 */
export function useVenueDealStatus(venues: Venue[]): Map<string, VenueDealStatus> {
  const [statuses, setStatuses] = useState<Map<string, VenueDealStatus>>(() => new Map());
  const cacheRef = useRef<Map<string, HappyHourSchedule[]>>(new Map());

  useEffect(() => {
    const cache = cacheRef.current;
    let cancelled = false;
    const update = () => {
      if (!cancelled) setStatuses(computeStatuses(venues, cache));
    };

    const missingIds = venues
      .filter((v) => v.active)
      .map((v) => v.id)
      .filter((id) => !cache.has(id));

    if (missingIds.length === 0) {
      update();
    } else {
      fetchWithConcurrency(missingIds, SCHEDULE_FETCH_CONCURRENCY, async (id) => {
        if (cancelled) return;
        const schedules = await venuesAPI.getSchedules(id).catch(() => [] as HappyHourSchedule[]);
        if (cancelled) return;
        cache.set(id, schedules);
      }).then(update);
    }

    const timer = setInterval(update, REEVALUATE_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [venues]);

  return statuses;
}

function computeStatuses(
  venues: Venue[],
  cache: Map<string, HappyHourSchedule[]>,
): Map<string, VenueDealStatus> {
  const now = new Date();
  const result = new Map<string, VenueDealStatus>();
  for (const venue of venues) {
    if (!venue.active) continue;
    result.set(venue.id, venueDealStatusAt(cache.get(venue.id) ?? [], now));
  }
  return result;
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
