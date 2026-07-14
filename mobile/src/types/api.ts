export interface Venue {
  id: string;
  name: string;
  nickname: string | null;
  address: string;
  latitude: number;
  longitude: number;
  neighborhood: string | null;
  venue_type: string | null;
  tags: string[] | null;
  phone: string | null;
  website: string | null;
  cash_only: boolean;
  google_place_id: string | null;
  price_level: number | null;
  rating: number | null;
  verified: boolean;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Deal {
  id: string;
  venue_id: string;
  title: string;
  description: string | null;
  category: string;
  deal_type: string;
  original_price: number | null;
  deal_price: number | null;
  discount_percentage: number | null;
  items: string[] | null;
  active: boolean;
  verified: boolean;
  valid_through: string | null;
  created_at: string;
  updated_at: string;
}

export interface HappyHourSchedule {
  id: string;
  venue_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  deal_ids: string[] | null;
  notes: string | null;
  restrictions: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export const DAY_NAMES = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const;
export interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: string;
  points_balance: number;
  created_at: string;
}

export interface Submission {
  id: string;
  user_id: string;
  submitter_username: string;
  submission_type: string;
  submitted_data: Record<string, any>;
  related_bar_id: string | null;
  related_deal_id: string | null;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes: string | null;
  points_awarded: number;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PointTransaction {
  id: string;
  submission_id: string | null;
  points: number;
  transaction_type: string;
  description: string;
  created_at: string;
}

export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  username: string;
  points_balance: number;
  approved_count: number;
}
