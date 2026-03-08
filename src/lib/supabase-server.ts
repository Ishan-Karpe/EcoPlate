import { createClient } from "@supabase/supabase-js";
import { env as privateEnv } from "$env/dynamic/private";
import { env as publicEnv } from "$env/dynamic/public";

export function getAdminSupabase() {
  const url = publicEnv.PUBLIC_SUPABASE_URL;
  const secretKey = privateEnv.SUPABASE_SECRET_KEY;

  if (!url) {
    throw new Error("Missing PUBLIC_SUPABASE_URL");
  }

  if (!secretKey) {
    throw new Error("Missing SUPABASE_SECRET_KEY");
  }

  return createClient(url, secretKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
