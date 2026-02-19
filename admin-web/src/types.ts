export interface Venue {
  id: string
  name: string
  nickname: string | null
  address: string
  latitude: number
  longitude: number
  phone: string | null
  website: string | null
  neighborhood: string | null
  venue_type: string | null
  tags: string[] | null
  cash_only: boolean
  google_place_id: string | null
  price_level: number | null
  rating: number | null
  description: string | null
  verified: boolean
  active: boolean
  created_at: string
  updated_at: string
}

export interface VenueWithDeals extends Venue {
  deals_count: number
  active_deals_count: number
}

export interface Deal {
  id: string
  venue_id: string
  title: string
  description: string | null
  category: string
  deal_type: string
  original_price: number | null
  deal_price: number | null
  discount_percentage: number | null
  items: string[]
  source: string | null
  verified: boolean
  active: boolean
  created_at: string
  updated_at: string
}

export interface DealWithVenue extends Deal {
  venue_name: string | null
}

export interface Submission {
  id: string
  user_id: string
  submitter_username: string
  submission_type: string
  submitted_data: Record<string, any>
  related_bar_id: string | null
  related_deal_id: string | null
  status: string
  admin_notes: string | null
  points_awarded: number
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
  updated_at: string
}

export interface AdminUser {
  id: string
  username: string
  email: string
  role: string
  points_balance: number
  created_at: string
}
