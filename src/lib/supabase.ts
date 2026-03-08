import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { env as publicEnv } from "$env/dynamic/public";

let browserClient: SupabaseClient | null = null;

function resolvePublicEnv() {
  const url = publicEnv.PUBLIC_SUPABASE_URL;
  const publishableKey = publicEnv.PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new Error(
      "Missing Supabase public environment variables: PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_PUBLISHABLE_KEY"
    );
  }

  return { url, publishableKey };
}

export function getBrowserSupabase(): SupabaseClient {
  if (!browserClient) {
    const { url, publishableKey } = resolvePublicEnv();
    browserClient = createBrowserClient(url, publishableKey);
  }

  return browserClient;
}
