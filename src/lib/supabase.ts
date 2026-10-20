import { createClient } from "@supabase/supabase-js";

// Supabase publishable keys are intended for browser use. Authorization comes
// from Row Level Security on every table; NEVER put a service_role / sb_secret
// key or the database password in this bundle.
const URL_FALLBACK = "https://jbckbwmdrrjruznaevjh.supabase.co";
const KEY_FALLBACK = "sb_publishable_HrBb24xsClSIvAwVDrZmbw_DUU3Lxl6";

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || URL_FALLBACK;
export const supabaseKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  KEY_FALLBACK;

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
