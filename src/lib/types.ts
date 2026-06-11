export type UserRole = "customer" | "therapist" | "admin";

export interface Profile {
  id: string;
  auth_id: string | null;
  role: UserRole;
  full_name: string;
  email: string | null;
  phone: string | null;
  language: string;
  avatar_url: string | null;
  status: "active" | "suspended" | "deleted";
  created_at: string;
}

export interface Therapist {
  id: string;
  bio: string;
  experience_years: number;
  certifications: { name: string; issuer: string }[];
  specialties: string[];
  service_areas: string[];
  base_area: string | null;
  video_url: string | null;
  photos: string[];
  rating_avg: number;
  rating_count: number;
  is_approved: boolean;
  profile?: Profile;
  services?: TherapistService[];
}

export interface TherapistService {
  id: string;
  therapist_id: string;
  service_type: string;
  duration_min: number;
  price_aed: number;
}

export interface AvailabilitySlot {
  id: string;
  therapist_id: string;
  weekday: number;
  start_time: string;
  end_time: string;
}

export type BookingStatus =
  | "requested"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "rejected"
  | "expired";

export interface Booking {
  id: string;
  customer_id: string;
  therapist_id: string;
  service_id: string | null;
  service_type: string;
  duration_min: number;
  price_aed: number;
  booking_date: string;
  start_time: string;
  end_time: string;
  status: BookingStatus;
  address_text: string;
  area: string | null;
  visit_notes: string | null;
  cancelled_at: string | null;
  cancel_reason: string | null;
  refund_amount_aed: number | null;
  created_at: string;
}

export interface Review {
  id: string;
  booking_id: string;
  customer_id: string;
  therapist_id: string;
  rating: number;
  comment: string;
  tags: string[];
  status: "published" | "pending" | "hidden";
  created_at: string;
}
