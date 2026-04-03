import { Venue, VenueWithDeals, Deal, DealWithVenue, Submission } from '../types';

const API_BASE = '/api/v1/admin';

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
