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

// Golden default credentials for project rfphosktmfdycfawxwit (Public Anon Key ONLY)
const DEFAULT_SUPABASE_URL = 'https://rfphosktmfdycfawxwit.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmcGhvc2t0bWZkeWNmYXd4d2l0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTU2MTY1NTksImV4cCI6MjExMTE5MjU1OX0.7qrf_vYIYav35Q2ISZfNCu6abJTE2VSZe-6dJkjV4Ao';

const rawUrl = getEnvVar('VITE_SUPABASE_URL') || DEFAULT_SUPABASE_URL;
// Normalize URL in case user provides full REST endpoint (e.g. https://xyz.supabase.co/rest/v1/)
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY') || DEFAULT_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = () => {
  return (
    Boolean(supabaseUrl) &&
    supabaseUrl !== 'https://placeholder.supabase.co' &&
    supabaseUrl !== 'https://your-project.supabase.co' &&
    Boolean(supabaseAnonKey) &&
    supabaseAnonKey !== 'placeholder-anon-key' &&
    supabaseAnonKey !== 'your-public-anon-key-here'
  );
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
