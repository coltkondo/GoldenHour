import Constants from 'expo-constants';
import { Platform } from 'react-native';

const getLocalApiUrl = (): string => {
  // Manual override via app.json "extra.apiUrl" (useful for Expo tunnel)
  const extra = Constants.expoConfig?.extra;
  if (extra?.apiUrl) {
    return extra.apiUrl;
  }
  // Expo Go on a physical device: extract the dev machine's LAN IP from hostUri
  const hostUri = Constants.expoConfig?.hostUri ?? Constants.manifest?.debuggerHost;
  if (hostUri) {
    const host = hostUri.split(':')[0];
    return `http://${host}:8000/api/v1`;
  }
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
  new_deal: 50,
  new_bar: 100,
  deal_expired: 50,
  bar_closed: 100,
  deal_update: 50,
  bar_update: 50,
  corroborate: 2,
};

export const REWARDS_THRESHOLD = 1000;

// Arts Fest beta: economy is off. Flip to true for August public launch.
export const REWARDS_ENABLED = false;
