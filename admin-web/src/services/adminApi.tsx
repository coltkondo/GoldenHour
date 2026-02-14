const API_BASE = '/api/v1/admin'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.detail || `Request failed: ${res.status}`)
  }
  return res.json()
}

// ---------- Venues ----------

export interface VenueListParams {
  skip?: number
  limit?: number
  search?: string
  neighborhood?: string
  venue_type?: string
  active_only?: boolean | null
  sort_by?: string
  sort_order?: string
}

export const venuesApi = {
  list: (params: VenueListParams = {}) => {
    const qs = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') qs.set(k, String(v))
    })
    return request<any[]>(`/venues/?${qs}`)
  },
  get: (id: string) => request<any>(`/venues/${id}`),
  create: (data: any) => request<any>('/venues/', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => request<any>(`/venues/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  toggleActive: (id: string) => request<any>(`/venues/${id}/toggle-active`, { method: 'PATCH' }),
  count: (params: { active_only?: boolean } = {}) => {
    const qs = new URLSearchParams()
    if (params.active_only !== undefined) qs.set('active_only', String(params.active_only))
    return request<{ count: number }>(`/venues/count?${qs}`)
  },
  neighborhoods: () => request<string[]>('/venues/neighborhoods'),
  venueTypes: () => request<string[]>('/venues/venue-types'),
}

// ---------- Deals ----------

export interface DealListParams {
  skip?: number
  limit?: number
  search?: string
  venue_id?: string
  category?: string
  deal_type?: string
  active_only?: boolean | null
  sort_by?: string
  sort_order?: string
}

export const dealsApi = {
  list: (params: DealListParams = {}) => {
    const qs = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') qs.set(k, String(v))
    })
    return request<any[]>(`/deals/?${qs}`)
  },
  get: (id: string) => request<any>(`/deals/${id}`),
  create: (data: any) => request<any>('/deals/', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => request<any>(`/deals/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  toggleActive: (id: string) => request<any>(`/deals/${id}/toggle-active`, { method: 'PATCH' }),
  count: (params: { active_only?: boolean; venue_id?: string } = {}) => {
    const qs = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined) qs.set(k, String(v))
    })
    return request<{ count: number }>(`/deals/count?${qs}`)
  },
  categories: () => request<string[]>('/deals/categories'),
  dealTypes: () => request<string[]>('/deals/deal-types'),
}

// ---------- Export ----------

export const exportApi = {
  venuesCsvUrl: `${API_BASE}/export/venues.csv`,
  dealsCsvUrl: `${API_BASE}/export/deals.csv`,
}
