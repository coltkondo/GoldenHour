import { Venue, VenueWithDeals, Deal, DealWithVenue, Submission, Event } from '../types';
import { API_URL } from '../config';

const API_BASE = `${API_URL}/admin`;

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('gh_admin_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Request failed: ${res.status}`);
  }
  return res.json();
}

// ---------- Venues ----------

export interface VenueListParams {
  skip?: number;
  limit?: number;
  search?: string;
  neighborhood?: string;
  venue_type?: string;
  active_only?: boolean | null;
  sort_by?: string;
  sort_order?: string;
}

type VenueCreate = {
  name: string;
  address: string;
  latitude?: number | null;
  longitude?: number | null;
  nickname?: string | null;
  phone?: string | null;
  website?: string | null;
  neighborhood?: string | null;
  venue_type?: string | null;
  tags?: string[] | null;
  cash_only?: boolean;
  google_place_id?: string | null;
  price_level?: number | null;
  rating?: number | null;
  description?: string | null;
  active?: boolean;
};
type VenueUpdate = Partial<VenueCreate>;

export const venuesApi = {
  list: (params: VenueListParams = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') qs.set(k, String(v));
    });
    return request<VenueWithDeals[]>(`/venues/?${qs}`);
  },
  get: (id: string) => request<Venue>(`/venues/${id}`),
  create: (data: VenueCreate) =>
    request<Venue>('/venues/', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: VenueUpdate) =>
    request<Venue>(`/venues/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  toggleActive: (id: string) => request<Venue>(`/venues/${id}/toggle-active`, { method: 'PATCH' }),
  count: (params: { active_only?: boolean } = {}) => {
    const qs = new URLSearchParams();
    if (params.active_only !== undefined) qs.set('active_only', String(params.active_only));
    return request<{ count: number }>(`/venues/count?${qs}`);
  },
  neighborhoods: () => request<string[]>('/venues/neighborhoods'),
  venueTypes: () => request<string[]>('/venues/venue-types'),
};

// ---------- Deals ----------

export interface DealListParams {
  skip?: number;
  limit?: number;
  search?: string;
  venue_id?: string;
  category?: string;
  deal_type?: string;
  active_only?: boolean | null;
  sort_by?: string;
  sort_order?: string;
}

type DealCreate = {
  venue_id: string;
  title: string;
  description?: string | null;
  category?: string;
  deal_type?: string;
  original_price?: number | null;
  deal_price?: number | null;
  discount_percentage?: number | null;
  items?: string[];
  active?: boolean;
};
type DealUpdate = Partial<DealCreate>;

export const dealsApi = {
  list: (params: DealListParams = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') qs.set(k, String(v));
    });
    return request<DealWithVenue[]>(`/deals/?${qs}`);
  },
  get: (id: string) => request<DealWithVenue>(`/deals/${id}`),
  create: (data: DealCreate) =>
    request<Deal>('/deals/', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: DealUpdate) =>
    request<Deal>(`/deals/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  toggleActive: (id: string) => request<Deal>(`/deals/${id}/toggle-active`, { method: 'PATCH' }),
  count: (params: { active_only?: boolean; venue_id?: string } = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined) qs.set(k, String(v));
    });
    return request<{ count: number }>(`/deals/count?${qs}`);
  },
  categories: () => request<string[]>('/deals/categories'),
  dealTypes: () => request<string[]>('/deals/deal-types'),
};

// ---------- Events ----------

export interface EventCreateParams {
  venue_id: string;
  series_id?: string | null;
  name: string;
  description?: string | null;
  event_type?: string | null;
  start_datetime: string;
  end_datetime?: string | null;
  deal_ids?: string[];
  image_url?: string | null;
  is_sponsored?: boolean;
  is_recurring?: boolean;
  active?: boolean;
  verified?: boolean;
  source?: string;
}

export interface EventUpdateParams extends Partial<Omit<EventCreateParams, 'venue_id' | 'series_id'>> {}

export interface SeriesCreateParams {
  venue_id: string;
  name: string;
  description?: string | null;
  event_type?: string | null;
  start_datetimes: string[];
  end_time_offset_minutes?: number | null;
  deal_ids?: string[];
  image_url?: string | null;
  is_sponsored?: boolean;
  source?: string;
}

export const eventsApi = {
  list: (params: { venue_id?: string; series_id?: string; event_type?: string; active_only?: boolean; upcoming_only?: boolean } = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== null) qs.set(k, String(v)); });
    return request<Event[]>(`/events/?${qs}`);
  },
  get: (id: string) => request<Event>(`/events/${id}`),
  create: (data: EventCreateParams) =>
    request<Event>('/events/', { method: 'POST', body: JSON.stringify(data) }),
  createSeries: (data: SeriesCreateParams) =>
    request<{ series_id: string; created: number }>('/events/series', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: EventUpdateParams) =>
    request<Event>(`/events/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  updateSeries: (seriesId: string, data: EventUpdateParams) =>
    request<{ updated: number }>(`/events/series/${seriesId}`, { method: 'PUT', body: JSON.stringify(data) }),
  toggleActive: (id: string) =>
    request<{ id: string; active: boolean }>(`/events/${id}/toggle-active`, { method: 'PATCH' }),
  delete: (id: string) =>
    fetch(`${API_BASE}/events/${id}`, { method: 'DELETE', headers: getAuthHeader() }),
  eventTypes: () => request<string[]>('/events/event-types'),
};

// ---------- Analytics ----------

interface DailyCount {
  date: string;
  count: number;
}

export interface AnalyticsSummary {
  period_days: number;
  submissions: {
    total: number;
    by_status: Record<string, number>;
    by_type: Record<string, number>;
    approval_rate: number | null;
    duplicate_rate: number;
    daily: DailyCount[];
  };
  signups: { total: number; daily: DailyCount[] };
  corroborations: { total: number; daily: DailyCount[] };
  top_submitters: { username: string; approved: number; pending: number; points_earned: number }[];
  top_corroborators: { username: string; count: number; points: number }[];
  markets: { market_slug: string; submissions: number; signups: number }[];
}

export const analyticsApi = {
  summary: (period_days = 7) =>
    request<AnalyticsSummary>(`/analytics/summary?period_days=${period_days}`),
};

// ---------- Export ----------

export const exportApi = {
  venuesCsvUrl: `${API_BASE}/export/venues.csv`,
  dealsCsvUrl: `${API_BASE}/export/deals.csv`,
};

// ---------- Submissions ----------

export interface SubmissionListParams {
  skip?: number;
  limit?: number;
  status?: string;
  submission_type?: string;
}

interface ReviewAction {
  status: string;
  admin_notes?: string;
}

export const submissionsApi = {
  list: (params: SubmissionListParams = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') qs.set(k, String(v));
    });
    return request<Submission[]>(`/submissions/?${qs}`);
  },
  count: (params: { status?: string } = {}) => {
    const qs = new URLSearchParams();
    if (params.status) qs.set('status', params.status);
    return request<{ count: number }>(`/submissions/count?${qs}`);
  },
  get: (id: string) => request<Submission>(`/submissions/${id}`),
  review: (id: string, action: ReviewAction) =>
    request<Submission>(`/submissions/${id}/review`, {
      method: 'PATCH',
      body: JSON.stringify(action),
    }),
};

// ---------- Users ----------

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: string;
  points_balance: number;
  active: boolean;
  created_at: string;
  submission_count: number;
  approved_count: number;
}

export interface PointTransaction {
  id: string;
  submission_id: string | null;
  points: number;
  transaction_type: string;
  description: string;
  created_at: string;
}

export const usersApi = {
  list: (params: { skip?: number; limit?: number; active_only?: boolean } = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) qs.set(k, String(v));
    });
    return request<AdminUser[]>(`/users/?${qs}`);
  },
  get: (userId: string) => request<AdminUser>(`/users/${userId}`),
  pointHistory: (userId: string) =>
    request<PointTransaction[]>(`/users/${userId}/points`),
  deactivate: (userId: string) =>
    request<{ detail: string }>(`/users/${userId}/deactivate`, { method: 'PATCH' }),
  reactivate: (userId: string) =>
    request<{ detail: string }>(`/users/${userId}/reactivate`, { method: 'PATCH' }),
};
