import { useState, useEffect } from 'react';
import { venuesAPI } from '../api/endpoints';
import { Venue } from '../types/api';

interface UseVenuesResult {
  venues: Venue[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useVenues(
  latitude: number,
  longitude: number,
  radiusMeters: number = 10000,
): UseVenuesResult {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadVenues = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await venuesAPI.getNearby(latitude, longitude, radiusMeters);
      setVenues(data);
    } catch (err) {
      console.error('Error loading venues:', err);
      setError('Failed to load venues');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (latitude && longitude) {
      loadVenues();
    }
  }, [latitude, longitude, radiusMeters]);

  return { venues, loading, error, refresh: loadVenues };
}
