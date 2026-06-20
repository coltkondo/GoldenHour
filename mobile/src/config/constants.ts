import { Platform } from 'react-native';
// Detect the correct API URL for local development.
// Physical devices on Expo Go cannot reach "localhost" — they need the
// dev machine's LAN IP, which Expo exposes via hostUri.
const getLocalApiUrl = (): string => {
  // Fallback for simulators/emulators
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8000/api/v1';
  }
  return 'http://localhost:8000/api/v1';
};

const LOCAL_API = getLocalApiUrl();
const PRODUCTION_API = 'https://goldenhour-production.up.railway.app/api/v1';

// Use local backend in dev, production in release builds
export const API_URL = __DEV__ ? LOCAL_API : PRODUCTION_API;

export const DEFAULT_LOCATION = {
  latitude: 40.7934, // State College, PA
  longitude: -77.86,
  latitudeDelta: 0.03,
  longitudeDelta: 0.03,
};

export const SEARCH_RADIUS_METERS = 10000;
// Points awarded per submission type (mirrors backend points_config.py)
export const POINTS_CONFIG: Record<string, number> = {
  new_deal: 5,
  new_bar: 10,
  deal_expired: 5,
  bar_closed: 10,
  deal_update: 5,
  bar_update: 5,
};
