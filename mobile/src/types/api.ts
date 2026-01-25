export interface Venue {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  neighborhood: string | null;
  venue_type: string | null;
  phone: string | null;
  website: string | null;
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
  items: string[];
  active: boolean;
  verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface HappyHourSchedule {
  id: string;
  venue_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  notes: string | null;
  active: boolean;
}