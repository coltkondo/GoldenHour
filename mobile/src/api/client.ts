import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config/constants';

const TOKEN_KEY = 'gh_token';
const USER_KEY = 'gh_user';

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token on every request
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // no token stored; continue unauthenticated
    }
    return config;
  },
  (error) => Promise.reject(error),
);

if (__DEV__) {
  console.log('API Client initialized with base URL:', API_URL);
}

let isRefreshing = false;
let pendingRequests: Array<{
  resolve: (token: string) => void;
  reject: (err: any) => void;
}> = [];

function onRefreshed(newToken: string) {
  pendingRequests.forEach(({ resolve }) => resolve(newToken));
  pendingRequests = [];
}

function onRefreshFailed(err: any) {
  pendingRequests.forEach(({ reject }) => reject(err));
  pendingRequests = [];
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/login') &&
      !originalRequest.url?.includes('/auth/register') &&
      !originalRequest.url?.includes('/auth/refresh')
    ) {
      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingRequests.push({
            resolve: (token: string) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(apiClient(originalRequest));
            },
            reject,
          });
        });
      }

      isRefreshing = true;

      try {
        const response = await apiClient.post('/auth/refresh');
        const newToken = response.data.access_token;
        const newUser = response.data.user;

        await Promise.all([
          AsyncStorage.setItem(TOKEN_KEY, newToken),
          AsyncStorage.setItem(USER_KEY, JSON.stringify(newUser)),
        ]);

        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        onRefreshed(newToken);
        return apiClient(originalRequest);
      } catch (refreshError) {
        onRefreshFailed(refreshError);
        await Promise.all([
          AsyncStorage.removeItem(TOKEN_KEY),
          AsyncStorage.removeItem(USER_KEY),
        ]);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    if (__DEV__) {
      console.error('API Error:', error.response?.status, error.message);
    }
    return Promise.reject(error);
  },
);

export default apiClient;
