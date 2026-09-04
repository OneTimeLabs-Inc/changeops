import { createClient } from "@supabase/supabase-js";
import { env } from "../config/env";

/**
 * Shared OneTime Labs Supabase client.
 *
 * ChangeOps, Licensing, OTLES, and the shared OneTime Labs platform now use
 * the same Supabase project. Keep a single browser auth client so GoTrue does
 * not create multiple instances that compete for the same session storage key.
 */
export const supabase = createClient(
  env.supabaseUrl,
  env.supabasePublishableKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
);
