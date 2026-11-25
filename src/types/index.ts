// =============================================================================
// TYPES: Pre-Registration & Participant Data Collection Portal
// =============================================================================

export type CoordinatorFollowupStatus = 
  | 'Pending Contact'
  | 'Contacted'
  | 'Awaiting Payment'
  | 'Confirmed'
  | 'Cancelled';

export const FOLLOWUP_STATUS_OPTIONS: CoordinatorFollowupStatus[] = [
  'Pending Contact',
  'Contacted',
  'Awaiting Payment',
  'Confirmed',
  'Cancelled',
];

export const SERVICE_PRICING = {
  accommodationPerPersonPerDay: 200,
  breakfastPerMeal: 50,
  lunchPerMeal: 60,
  dinnerPerMeal: 60,
} as const;

export interface MealRequirements {
  id?: string;
  registration_id?: string;
  breakfast_quantity: number;
  lunch_quantity: number;
  dinner_quantity: number;
  breakfast_amount: number;
  lunch_amount: number;
  dinner_amount: number;
  created_at?: string;
}

export interface AdminFollowup {
  id?: string;
  registration_id?: string;
  followup_status: CoordinatorFollowupStatus;
  coordinator_notes?: string | null;
  updated_at?: string;
}

export interface TeamMember {
  id?: string;
  fullName: string;
  mobile: string;
  email: string;
  gender?: string;
  department?: string;
  academicYear?: string;
  emergencyContact?: string;
}

export interface PreRegistration {
  id: string;
  reference_id: string;
  full_name: string;
  mobile: string;
  email: string;
  gender?: string;
  college: string;
  department?: string;
  academic_year?: string;
  event_category?: string;
  emergency_contact?: string;
  accommodation_required: boolean;
  accommodation_days: number;
  accommodation_participants: number;
  check_in_date?: string | null;
  check_out_date?: string | null;
  accommodation_estimated_amount: number;
  meal_estimated_amount: number;
  total_estimated_amount: number;
  registration_status: string;
  is_team: boolean;
  team_name?: string | null;
  team_members?: TeamMember[];
  created_at: string;
  meal_requirements?: MealRequirements;
  admin_followup?: AdminFollowup;
}

export interface PreRegistrationPayload {
  fullName: string;
  mobile: string;
  email: string;
  gender?: string;
  college: string;
  department: string;
  academicYear: string;
  eventCategory: string;
  emergencyContact: string;
  accommodationRequired: boolean;
  accommodationDays: number;
  accommodationParticipants: number;
  checkInDate?: string;
  checkOutDate?: string;
  isTeam?: boolean;
  teamName?: string;
  teamMembers?: TeamMember[];
  meals: {
    breakfast: boolean;
    breakfastDays: number;
    lunch: boolean;
    lunchDays: number;
    dinner: boolean;
    dinnerDays: number;
  };
}

export interface PreRegistrationStats {
  total_registrations: number;
  total_accommodation_participants: number;
  total_requested_accommodation_days: number;
  breakfast_demand: number;
  lunch_demand: number;
  dinner_demand: number;
  estimated_accommodation_charges: number;
  estimated_meal_charges: number;
  total_estimated_charges: number;
  followup_counts: {
    pending_contact: number;
    contacted: number;
    awaiting_payment: number;
    confirmed: number;
    cancelled: number;
  };
}

export type UserRole = 'admin' | 'volunteer';

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  created_at: string;
  email?: string;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface SystemSettings {
  id: number;
  per_night_fee: number;
  breakfast_fee: number;
  lunch_fee: number;
  dinner_fee: number;
  updated_at: string;
}
