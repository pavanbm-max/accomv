// =============================================================================
// API CLIENT LAYER: Pre-Registration & Participant Data Collection Portal
// =============================================================================

import { supabase, isSupabaseConfigured } from './supabase';
import { SERVICE_PRICING } from '../types';
import type {
  PreRegistration,
  PreRegistrationPayload,
  PreRegistrationStats,
  CoordinatorFollowupStatus,
  Announcement,
  Profile,
  SystemSettings,
} from '../types';

// In-memory/localStorage key for local persistence when running in demo/offline mode
const LOCAL_STORAGE_KEY = 'portal_pre_registrations';

function getLocalRegistrations(): PreRegistration[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalRegistrations(regs: PreRegistration[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(regs));
  } catch {}
}

/**
 * Calculates cost breakdown based on user selections
 */
export function calculateEstimatedCharges(payload: {
  accommodationRequired: boolean;
  accommodationParticipants: number;
  accommodationDays: number;
  breakfastRequired: boolean;
  breakfastDays: number;
  lunchRequired: boolean;
  lunchDays: number;
  dinnerRequired: boolean;
  dinnerDays: number;
}): {
  accommodationAmount: number;
  breakfastAmount: number;
  lunchAmount: number;
  dinnerAmount: number;
  mealEstimatedAmount: number;
  totalEstimatedAmount: number;
} {
  const participants = Math.max(1, payload.accommodationParticipants || 1);
  const stayDays = Math.max(0, payload.accommodationDays || 0);

  const accommodationAmount = payload.accommodationRequired
    ? participants * stayDays * SERVICE_PRICING.accommodationPerPersonPerDay
    : 0;

  const breakfastAmount = payload.breakfastRequired
    ? participants * Math.max(0, payload.breakfastDays) * SERVICE_PRICING.breakfastPerMeal
    : 0;

  const lunchAmount = payload.lunchRequired
    ? participants * Math.max(0, payload.lunchDays) * SERVICE_PRICING.lunchPerMeal
    : 0;

  const dinnerAmount = payload.dinnerRequired
    ? participants * Math.max(0, payload.dinnerDays) * SERVICE_PRICING.dinnerPerMeal
    : 0;

  const mealEstimatedAmount = breakfastAmount + lunchAmount + dinnerAmount;
  const totalEstimatedAmount = accommodationAmount + mealEstimatedAmount;

  return {
    accommodationAmount,
    breakfastAmount,
    lunchAmount,
    dinnerAmount,
    mealEstimatedAmount,
    totalEstimatedAmount,
  };
}

/**
 * Check if a pre-registration already exists with the given mobile or email
 */
export async function checkDuplicateRegistration(
  mobile: string,
  email: string
): Promise<{
  isDuplicate: boolean;
  existingReferenceId?: string;
  existingName?: string;
}> {
  const trimmedPhone = mobile.trim();
  const trimmedEmail = email.trim().toLowerCase();

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.rpc('check_duplicate_registration', {
        p_mobile: trimmedPhone,
        p_email: trimmedEmail,
      });

      if (!error && data && data.length > 0 && data[0].exists_duplicate) {
        return {
          isDuplicate: true,
          existingReferenceId: data[0].existing_reference_id,
          existingName: data[0].existing_full_name,
        };
      }
    } catch (e) {
      console.warn('Supabase duplicate check fallback:', e);
    }
  }

  // Local fallback
  const locals = getLocalRegistrations();
  const match = locals.find(
    (r) => r.mobile === trimmedPhone || r.email.toLowerCase() === trimmedEmail
  );
  if (match) {
    return {
      isDuplicate: true,
      existingReferenceId: match.reference_id,
      existingName: match.full_name,
    };
  }

  return { isDuplicate: false };
}

/**
 * Submit a new Pre-Registration
 */
export async function createPreRegistration(
  payload: PreRegistrationPayload
): Promise<{
  success: boolean;
  referenceId: string;
  id: string;
  totalEstimatedAmount: number;
  error?: string;
}> {
  // Validate mobile number (10 digits)
  const phoneClean = payload.mobile.replace(/\D/g, '');
  if (phoneClean.length < 10) {
    throw new Error('Please enter a valid 10-digit mobile number.');
  }

  // Check duplicate
  const dupCheck = await checkDuplicateRegistration(payload.mobile, payload.email);
  if (dupCheck.isDuplicate) {
    throw new Error(
      `A pre-registration already exists for this phone or email with Reference ID ${dupCheck.existingReferenceId} (${dupCheck.existingName}).`
    );
  }

  // Calculate pricing breakdown
  const costs = calculateEstimatedCharges({
    accommodationRequired: payload.accommodationRequired,
    accommodationParticipants: payload.accommodationParticipants,
    accommodationDays: payload.accommodationDays,
    breakfastRequired: payload.meals.breakfast,
    breakfastDays: payload.meals.breakfastDays,
    lunchRequired: payload.meals.lunch,
    lunchDays: payload.meals.lunchDays,
    dinnerRequired: payload.meals.dinner,
    dinnerDays: payload.meals.dinnerDays,
  });

  const generatedRefId = `PRE-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

  let registrationRecordId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 11);

  if (isSupabaseConfigured()) {
    try {
      // 1. Insert into registrations
      const normalizedPhone = phoneClean.length >= 10 ? phoneClean.slice(-10) : payload.mobile.trim();
      const { error: regError } = await supabase
        .from('registrations')
        .insert({
          id: registrationRecordId,
          reference_id: generatedRefId,
          full_name: payload.fullName.trim(),
          mobile: normalizedPhone,
          email: payload.email.trim().toLowerCase(),
          gender: payload.gender || 'Male',
          college: payload.college.trim(),
          department: payload.department.trim(),
          academic_year: payload.academicYear.trim(),
          event_category: payload.eventCategory.trim(),
          emergency_contact: payload.emergencyContact.trim(),
          accommodation_required: payload.accommodationRequired,
          accommodation_days: payload.accommodationRequired ? payload.accommodationDays : 0,
          accommodation_participants: payload.accommodationRequired ? payload.accommodationParticipants : 1,
          check_in_date: payload.accommodationRequired ? payload.checkInDate : null,
          check_out_date: payload.accommodationRequired ? payload.checkOutDate : null,
          accommodation_estimated_amount: costs.accommodationAmount,
          meal_estimated_amount: costs.mealEstimatedAmount,
          total_estimated_amount: costs.totalEstimatedAmount,
          registration_status: 'pre_registered',
          is_team: payload.isTeam || false,
          team_name: payload.teamName?.trim() || null,
          team_members: payload.teamMembers || [],
        });

      if (regError) {
        throw new Error(regError.message);
      }

      // 2. Insert into meal_requirements if meals are required
      const breakfastQty = payload.meals.breakfast ? payload.accommodationParticipants * payload.meals.breakfastDays : 0;
      const lunchQty = payload.meals.lunch ? payload.accommodationParticipants * payload.meals.lunchDays : 0;
      const dinnerQty = payload.meals.dinner ? payload.accommodationParticipants * payload.meals.dinnerDays : 0;

      if (breakfastQty > 0 || lunchQty > 0 || dinnerQty > 0) {
        const { error: mealInsertErr } = await supabase.from('meal_requirements').insert({
          registration_id: registrationRecordId,
          breakfast_quantity: breakfastQty,
          lunch_quantity: lunchQty,
          dinner_quantity: dinnerQty,
          breakfast_amount: costs.breakfastAmount,
          lunch_amount: costs.lunchAmount,
          dinner_amount: costs.dinnerAmount,
        });

        if (mealInsertErr) {
          console.warn('Meal requirements insertion warning:', mealInsertErr);
        }
      }

      // 3. Admin followup record is automatically generated by PostgreSQL trigger tr_after_insert_registration
    } catch (dbErr: any) {
      console.error('Supabase database submission error:', dbErr);
      throw new Error(dbErr.message || 'Database submission failed. Please try again.');
    }
  }

  // Always keep a local copy for client confirmation and offline demo support
  const newRegistration: PreRegistration = {
    id: registrationRecordId,
    reference_id: generatedRefId,
    full_name: payload.fullName.trim(),
    mobile: payload.mobile.trim(),
    email: payload.email.trim().toLowerCase(),
    gender: payload.gender || 'Male',
    college: payload.college.trim(),
    department: payload.department.trim(),
    academic_year: payload.academicYear.trim(),
    event_category: payload.eventCategory.trim(),
    emergency_contact: payload.emergencyContact.trim(),
    accommodation_required: payload.accommodationRequired,
    accommodation_days: payload.accommodationRequired ? payload.accommodationDays : 0,
    accommodation_participants: payload.accommodationRequired ? payload.accommodationParticipants : 1,
    check_in_date: payload.accommodationRequired ? payload.checkInDate : null,
    check_out_date: payload.accommodationRequired ? payload.checkOutDate : null,
    accommodation_estimated_amount: costs.accommodationAmount,
    meal_estimated_amount: costs.mealEstimatedAmount,
    total_estimated_amount: costs.totalEstimatedAmount,
    registration_status: 'pre_registered',
    is_team: payload.isTeam || false,
    team_name: payload.teamName?.trim() || null,
    team_members: payload.teamMembers || [],
    created_at: new Date().toISOString(),
    meal_requirements: {
      breakfast_quantity: payload.meals.breakfast ? payload.accommodationParticipants * payload.meals.breakfastDays : 0,
      lunch_quantity: payload.meals.lunch ? payload.accommodationParticipants * payload.meals.lunchDays : 0,
      dinner_quantity: payload.meals.dinner ? payload.accommodationParticipants * payload.meals.dinnerDays : 0,
      breakfast_amount: costs.breakfastAmount,
      lunch_amount: costs.lunchAmount,
      dinner_amount: costs.dinnerAmount,
    },
    admin_followup: {
      followup_status: 'Pending Contact',
      coordinator_notes: null,
      updated_at: new Date().toISOString(),
    },
  };

  const currentLocals = getLocalRegistrations();
  saveLocalRegistrations([newRegistration, ...currentLocals]);

  return {
    success: true,
    referenceId: generatedRefId,
    id: registrationRecordId,
    totalEstimatedAmount: costs.totalEstimatedAmount,
  };
}

/**
 * Fetch a single Pre-Registration by its Reference ID (e.g. PRE-2026-100200)
 */
export async function getPreRegistration(referenceId: string): Promise<PreRegistration> {
  const cleanRef = referenceId.trim().toUpperCase();

  if (isSupabaseConfigured()) {
    try {
      // 1. Try public secure RPC lookup first (works for public participants & avoids leaking table)
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_pre_registration_public', {
        p_reference_id: cleanRef,
      });

      if (!rpcError && rpcData && rpcData.registration) {
        return {
          ...rpcData.registration,
          meal_requirements: rpcData.meals || undefined,
          admin_followup: rpcData.followup || undefined,
        };
      }

      // 2. Direct query with joins (for authenticated staff)
      const { data, error } = await supabase
        .from('registrations')
        .select(`
          *,
          meal_requirements (*),
          admin_followups (*)
        `)
        .eq('reference_id', cleanRef)
        .maybeSingle();

      if (!error && data) {
        return {
          ...data,
          meal_requirements: Array.isArray(data.meal_requirements) && data.meal_requirements.length > 0
            ? data.meal_requirements[0]
            : data.meal_requirements,
          admin_followup: Array.isArray(data.admin_followups) && data.admin_followups.length > 0
            ? data.admin_followups[0]
            : data.admin_followups,
        };
      }
    } catch (e) {
      console.warn('Supabase fetch failed, trying local storage:', e);
    }
  }

  // Local fallback lookup
  const locals = getLocalRegistrations();
  const match = locals.find((r) => r.reference_id.toUpperCase() === cleanRef || r.id === referenceId);
  if (match) {
    return match;
  }

  throw new Error(`Pre-registration with Reference ID "${referenceId}" was not found.`);
}

/**
 * Auto-syncs any local-only registrations to Supabase if they exist in client localStorage
 */
export async function syncLocalRegistrationsToDatabase(): Promise<void> {
  if (!isSupabaseConfigured() || typeof window === 'undefined') return;

  const locals = getLocalRegistrations();
  if (locals.length === 0) return;

  for (const reg of locals) {
    try {
      // Check if already in Supabase
      const { data: exists } = await supabase
        .from('registrations')
        .select('id')
        .eq('reference_id', reg.reference_id)
        .maybeSingle();

      if (!exists) {
        const phoneClean = reg.mobile.replace(/\D/g, '');
        const normalizedPhone = phoneClean.length >= 10 ? phoneClean.slice(-10) : reg.mobile.trim();

        const { error: insErr } = await supabase.from('registrations').insert({
          id: reg.id,
          reference_id: reg.reference_id,
          full_name: reg.full_name,
          mobile: normalizedPhone,
          email: reg.email,
          gender: reg.gender || 'Male',
          college: reg.college,
          department: reg.department || '',
          academic_year: reg.academic_year || '',
          event_category: reg.event_category || '',
          emergency_contact: reg.emergency_contact || '',
          accommodation_required: reg.accommodation_required,
          accommodation_days: reg.accommodation_days,
          accommodation_participants: reg.accommodation_participants,
          check_in_date: reg.check_in_date,
          check_out_date: reg.check_out_date,
          accommodation_estimated_amount: reg.accommodation_estimated_amount,
          meal_estimated_amount: reg.meal_estimated_amount,
          total_estimated_amount: reg.total_estimated_amount,
          registration_status: reg.registration_status || 'pre_registered',
          is_team: reg.is_team || false,
          team_name: reg.team_name,
          team_members: reg.team_members || [],
          created_at: reg.created_at,
        });

        if (!insErr && reg.meal_requirements) {
          await supabase.from('meal_requirements').insert({
            registration_id: reg.id,
            breakfast_quantity: reg.meal_requirements.breakfast_quantity || 0,
            lunch_quantity: reg.meal_requirements.lunch_quantity || 0,
            dinner_quantity: reg.meal_requirements.dinner_quantity || 0,
            breakfast_amount: reg.meal_requirements.breakfast_amount || 0,
            lunch_amount: reg.meal_requirements.lunch_amount || 0,
            dinner_amount: reg.meal_requirements.dinner_amount || 0,
          });
        }
      }
    } catch (e) {
      console.warn('Sync local registration to Supabase error:', reg.reference_id, e);
    }
  }
}

/**
 * Get all Pre-Registrations with filtering, searching, and pagination
 */
export async function getPreRegistrations(params?: {
  search?: string;
  eventCategory?: string;
  accommodationRequired?: string;
  accommodationDays?: string;
  followupStatus?: string;
}): Promise<PreRegistration[]> {
  // Sync any offline/localStorage submissions to Supabase
  await syncLocalRegistrationsToDatabase();

  let records: PreRegistration[] = [];

  if (isSupabaseConfigured()) {
    try {
      let query = supabase
        .from('registrations')
        .select(`
          *,
          meal_requirements (*),
          admin_followups (*)
        `)
        .order('created_at', { ascending: false });

      if (params?.eventCategory && params.eventCategory !== 'all') {
        query = query.eq('event_category', params.eventCategory);
      }

      if (params?.accommodationRequired && params.accommodationRequired !== 'all') {
        query = query.eq('accommodation_required', params.accommodationRequired === 'yes');
      }

      if (params?.accommodationDays && params.accommodationDays !== 'all') {
        if (params.accommodationDays === '3+') {
          query = query.gte('accommodation_days', 3);
        } else {
          query = query.eq('accommodation_days', parseInt(params.accommodationDays, 10));
        }
      }

      const { data, error } = await query;

      if (!error && data) {
        records = data.map((d: any) => ({
          ...d,
          meal_requirements: Array.isArray(d.meal_requirements) && d.meal_requirements.length > 0
            ? d.meal_requirements[0]
            : d.meal_requirements,
          admin_followup: Array.isArray(d.admin_followups) && d.admin_followups.length > 0
            ? d.admin_followups[0]
            : d.admin_followups,
        }));
      }
    } catch (e) {
      console.warn('Failed to query Supabase registrations, falling back to local storage:', e);
    }
  }

  if (records.length === 0) {
    records = getLocalRegistrations();
  }

  // In-memory search filtering (Name, Mobile, Email, College)
  if (params?.search && params.search.trim()) {
    const q = params.search.trim().toLowerCase();
    records = records.filter(
      (r) =>
        r.full_name.toLowerCase().includes(q) ||
        r.mobile.includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.college.toLowerCase().includes(q) ||
        r.reference_id.toLowerCase().includes(q)
    );
  }

  // Filter by follow-up status
  if (params?.followupStatus && params.followupStatus !== 'all') {
    records = records.filter(
      (r) => r.admin_followup?.followup_status === params.followupStatus
    );
  }

  return records;
}

/**
 * Update Coordinator Follow-up Status and Notes for a registration
 */
export async function updateCoordinatorFollowup(
  registrationId: string,
  followupStatus: CoordinatorFollowupStatus,
  coordinatorNotes?: string | null
): Promise<{ success: boolean; updatedStatus: CoordinatorFollowupStatus }> {
  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase
        .from('admin_followups')
        .upsert(
          {
            registration_id: registrationId,
            followup_status: followupStatus,
            coordinator_notes: coordinatorNotes || null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'registration_id' }
        );

      if (error) {
        console.warn('Supabase follow-up update error:', error);
      }
    } catch (e) {
      console.warn('Supabase follow-up update exception:', e);
    }
  }

  // Update local storage
  const locals = getLocalRegistrations();
  const index = locals.findIndex((r) => r.id === registrationId);
  if (index !== -1) {
    locals[index].admin_followup = {
      ...locals[index].admin_followup,
      registration_id: registrationId,
      followup_status: followupStatus,
      coordinator_notes: coordinatorNotes,
      updated_at: new Date().toISOString(),
    };
    saveLocalRegistrations(locals);
  }

  return { success: true, updatedStatus: followupStatus };
}

/**
 * Get aggregate dashboard metrics
 */
export async function getDashboardStats(): Promise<PreRegistrationStats> {
  const registrations = await getPreRegistrations();

  const totalRegistrations = registrations.length;
  let totalAccommodationParticipants = 0;
  let totalRequestedAccommodationDays = 0;
  let breakfastDemand = 0;
  let lunchDemand = 0;
  let dinnerDemand = 0;
  let estimatedAccommodationCharges = 0;
  let estimatedMealCharges = 0;
  let totalEstimatedCharges = 0;

  const followupCounts = {
    pending_contact: 0,
    contacted: 0,
    awaiting_payment: 0,
    confirmed: 0,
    cancelled: 0,
  };

  registrations.forEach((r) => {
    if (r.accommodation_required) {
      const count = r.accommodation_participants || 1;
      const days = r.accommodation_days || 0;
      totalAccommodationParticipants += count;
      totalRequestedAccommodationDays += count * days;
    }

    if (r.meal_requirements) {
      breakfastDemand += r.meal_requirements.breakfast_quantity || 0;
      lunchDemand += r.meal_requirements.lunch_quantity || 0;
      dinnerDemand += r.meal_requirements.dinner_quantity || 0;
    }

    estimatedAccommodationCharges += Number(r.accommodation_estimated_amount || 0);
    estimatedMealCharges += Number(r.meal_estimated_amount || 0);
    totalEstimatedCharges += Number(r.total_estimated_amount || 0);

    const status = r.admin_followup?.followup_status || 'Pending Contact';
    if (status === 'Pending Contact') followupCounts.pending_contact++;
    else if (status === 'Contacted') followupCounts.contacted++;
    else if (status === 'Awaiting Payment') followupCounts.awaiting_payment++;
    else if (status === 'Confirmed') followupCounts.confirmed++;
    else if (status === 'Cancelled') followupCounts.cancelled++;
  });

  return {
    total_registrations: totalRegistrations,
    total_accommodation_participants: totalAccommodationParticipants,
    total_requested_accommodation_days: totalRequestedAccommodationDays,
    breakfast_demand: breakfastDemand,
    lunch_demand: lunchDemand,
    dinner_demand: dinnerDemand,
    estimated_accommodation_charges: estimatedAccommodationCharges,
    estimated_meal_charges: estimatedMealCharges,
    total_estimated_charges: totalEstimatedCharges,
    followup_counts: followupCounts,
  };
}

/**
 * Delete a registration (Admin only)
 */
export async function deleteRegistration(id: string): Promise<boolean> {
  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase.from('registrations').delete().eq('id', id);
      if (error) throw error;
    } catch (e: any) {
      console.warn('Supabase delete error:', e);
    }
  }

  const locals = getLocalRegistrations();
  saveLocalRegistrations(locals.filter((r) => r.id !== id));
  return true;
}

/**
 * Fetch published announcements
 */
export async function getPublishedAnnouncements(): Promise<Announcement[]> {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (!error && data) {
        return data;
      }
    } catch (e) {
      console.warn('Supabase announcements query failed:', e);
    }
  }

  return [
    {
      id: 'ann-1',
      title: 'Hostel Pre-Registration Open',
      body: 'Pre-registration for GM University Ignitron 2K26 accommodation is active. No payment required online.',
      is_published: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];
}

export async function getAnnouncements(): Promise<Announcement[]> {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) return data;
    } catch {}
  }
  return getPublishedAnnouncements();
}

export async function saveAnnouncement(announcement: Partial<Announcement>): Promise<Announcement> {
  const item: Announcement = {
    id: announcement.id || (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9)),
    title: announcement.title || '',
    body: announcement.body || '',
    is_published: announcement.is_published ?? true,
    created_at: announcement.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .upsert(item)
        .select()
        .single();
      if (!error && data) return data;
    } catch {}
  }

  return item;
}

export async function deleteAnnouncement(id: string): Promise<boolean> {
  if (isSupabaseConfigured()) {
    try {
      await supabase.from('announcements').delete().eq('id', id);
    } catch {}
  }
  return true;
}

/**
 * Settings
 */
export async function getSystemSettings(): Promise<SystemSettings> {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('id', 1)
        .maybeSingle();

      if (!error && data) {
        return data;
      }
    } catch {}
  }

  return {
    id: 1,
    per_night_fee: 200,
    breakfast_fee: 50,
    lunch_fee: 60,
    dinner_fee: 60,
    updated_at: new Date().toISOString(),
  };
}

export async function updateSystemSettings(updates: Partial<SystemSettings>): Promise<SystemSettings> {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('settings')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', 1)
        .select()
        .single();

      if (!error && data) {
        return data;
      }
    } catch {}
  }

  return {
    id: 1,
    per_night_fee: updates.per_night_fee ?? 200,
    breakfast_fee: updates.breakfast_fee ?? 50,
    lunch_fee: updates.lunch_fee ?? 60,
    dinner_fee: updates.dinner_fee ?? 60,
    updated_at: new Date().toISOString(),
  };
}

/**
 * Staff Accounts (Admin access)
 */
export async function getProfiles(): Promise<Profile[]> {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        return data;
      }
    } catch {}
  }

  return [
    {
      id: 'mock-admin',
      full_name: 'Coordinator Admin',
      role: 'admin',
      email: 'admin@gmu.ac.in',
      created_at: new Date().toISOString(),
    },
  ];
}

export async function createStaffAccount(account: {
  fullName: string;
  email: string;
  password?: string;
  role: 'admin' | 'volunteer';
}): Promise<{ success: boolean; message?: string; profile?: Profile }> {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: account.email,
        password: account.password || 'TemporaryPassword123!',
        options: {
          data: {
            full_name: account.fullName,
            role: account.role,
          },
        },
      });

      if (error) {
        return { success: false, message: error.message };
      }

      if (data.user) {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          full_name: account.fullName,
          role: account.role,
        });
      }
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  return {
    success: true,
    message: 'Staff account created successfully.',
    profile: {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9),
      full_name: account.fullName,
      role: account.role,
      email: account.email,
      created_at: new Date().toISOString(),
    },
  };
}

export async function deleteStaffAccount(id: string): Promise<boolean> {
  if (isSupabaseConfigured()) {
    try {
      await supabase.from('profiles').delete().eq('id', id);
    } catch {}
  }
  return true;
}
