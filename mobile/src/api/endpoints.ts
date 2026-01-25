import apiClient from './client';
import { Venue, Deal } from '../types/api';

export const venuesAPI = {
  getAll: async (params?: { skip?: number; limit?: number; neighborhood?: string }) => {
    const response = await apiClient.get<Venue[]>('/venues', { params });
    console.log('Fetched venues:', response);
    return response.data;
  },

  getNearby: async (
    latitude: number,
    longitude: number,
    radiusMeters: number = 10000
  ) => {
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
};

export const dealsAPI = {
  getActive: async (params?: { skip?: number; limit?: number; category?: string }) => {
    const response = await apiClient.get<Deal[]>('/deals/active', { params });
    return response.data;
  },

  getNearby: async (
    latitude: number,
    longitude: number,
    radiusMeters: number = 10000,
    activeNow: boolean = false
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