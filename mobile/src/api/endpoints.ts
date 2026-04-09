import apiClient from './client';
import { Venue, Deal, HappyHourSchedule } from '../types/api';
import type { AuthUser, Submission, LeaderboardEntry } from '../types/api';

export const venuesAPI = {
  getAll: async (params?: { skip?: number; limit?: number; neighborhood?: string }) => {
    const response = await apiClient.get<Venue[]>('/venues', { params });
    return response.data;
  },

  getNearby: async (latitude: number, longitude: number, radiusMeters: number = 10000) => {
    const response = await apiClient.get<Venue[]>('/venues/nearby', {
      params: { latitude, longitude, radius_meters: radiusMeters },
    });
    return response.data;
  },

  getById: async (venueId: string) => {
    const response = await apiClient.get<Venue>(`/venues/${venueId}`);
    return response.data;
  },

  getNeighborhoods: async () => {
    const response = await apiClient.get<string[]>('/venues/neighborhoods/list');
    return response.data;
  },

  getSchedules: async (venueId: string) => {
    const response = await apiClient.get<HappyHourSchedule[]>(`/venues/${venueId}/schedules`);
    return response.data;
  },
};

export const dealsAPI = {
  getActive: async (params?: {
    skip?: number;
    limit?: number;
    category?: string;
    venue_id?: string;
  }) => {
    const response = await apiClient.get<Deal[]>('/deals/active', { params });
    return response.data;
  },

  getByVenue: async (venueId: string) => {
    const response = await apiClient.get<Deal[]>('/deals/active', {
      params: { venue_id: venueId },
    });
    return response.data;
  },

  getToday: async () => {
    const response = await apiClient.get<Deal[]>('/deals/today');
    return response.data;
  },

  getNearby: async (
    latitude: number,
    longitude: number,
    radiusMeters: number = 10000,
    activeNow: boolean = false,
  ) => {
    const response = await apiClient.get<Deal[]>('/deals/nearby', {
      params: { latitude, longitude, radius_meters: radiusMeters, active_now: activeNow },
    });
    return response.data;
  },

  getById: async (dealId: string) => {
    const response = await apiClient.get<Deal>(`/deals/${dealId}`);
    return response.data;
  },
};

export const authAPI = {
  register: async (data: { username: string; email: string; password: string }) => {
    const response = await apiClient.post<{ access_token: string; user: AuthUser }>(
      '/auth/register',
      data,
    );
    return response.data;
  },

  login: async (data: { email: string; password: string }) => {
    const response = await apiClient.post<{ access_token: string; user: AuthUser }>(
      '/auth/login',
      data,
    );
    return response.data;
  },

  me: async () => {
    const response = await apiClient.get<AuthUser>('/auth/me');
    return response.data;
  },
};

export const submissionsAPI = {
  submit: async (data: {
    submission_type: string;
    submitted_data: Record<string, any>;
    related_bar_id?: string;
    related_deal_id?: string;
  }) => {
    const response = await apiClient.post<Submission>('/submissions/', data);
    return response.data;
  },

  getMine: async () => {
    const response = await apiClient.get<Submission[]>('/submissions/mine');
    return response.data;
  },

  adminGetAll: async (params?: { status?: string; submission_type?: string }) => {
    const response = await apiClient.get<Submission[]>('/admin/submissions/', { params });
    return response.data;
  },

  review: async (id: string, action: { status: string; admin_notes?: string }) => {
    const response = await apiClient.patch<Submission>(`/admin/submissions/${id}/review`, action);
    return response.data;
  },
};

export const pointsAPI = {
  getBalance: async (userId: string) => {
    const response = await apiClient.get(`/points/users/${userId}`);
    return response.data;
  },
};

export const leaderboardAPI = {
  getTop: async () => {
    const response = await apiClient.get<LeaderboardEntry[]>('/leaderboard/');
    return response.data;
  },
};
