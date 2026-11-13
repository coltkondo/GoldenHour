import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { DEFAULT_LOCATION } from '../config/constants';
import { useLocationPermission } from '../context/LocationPermissionContext';

export const useLocation = () => {
  const [location, setLocation] = useState(DEFAULT_LOCATION);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { ensureLocationPermission } = useLocationPermission();

  useEffect(() => {
    (async () => {
      try {
        // Request permission (shows the pre-permission explainer on first ask)
        const { status } = await ensureLocationPermission();

        if (status !== 'granted') {
          // Use default location (State College) when permission denied
          console.log('Location permission denied, using default State College location');
          setLoading(false);
          return;
        }

        // Get current location
        const currentLocation = await Location.getCurrentPositionAsync({});

        setLocation({
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        });
      } catch (err) {
        console.error('Error getting location, using default:', err);
        // Still use default location on error
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return { location, loading, error };
};
