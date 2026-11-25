// =============================================================================
// SUPABASE CLIENT (FRONTEND)
//
// Golden Rules:
// 1. Initialized strictly with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.
// 2. The service role key is NEVER exposed to or used by the browser.
// 3. Includes fallback check so developers get clear guidance if env vars are missing.
// =============================================================================

import { createClient } from '@supabase/supabase-js';

const getEnvVar = (key: string): string => {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    return import.meta.env[key];
  }
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key] as string;
  }
  return '';
};

const rawUrl = getEnvVar('VITE_SUPABASE_URL') || 'https://placeholder.supabase.co';
// Normalize URL in case user provides full REST endpoint (e.g. https://xyz.supabase.co/rest/v1/)
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY') || 'placeholder-anon-key';

export const isSupabaseConfigured = () => {
  const url = getEnvVar('VITE_SUPABASE_URL');
  const key = getEnvVar('VITE_SUPABASE_ANON_KEY');
  return (
    Boolean(url) &&
    url !== 'https://placeholder.supabase.co' &&
    url !== 'https://your-project.supabase.co' &&
    Boolean(key) &&
    key !== 'placeholder-anon-key' &&
    key !== 'your-public-anon-key-here'
  );
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
