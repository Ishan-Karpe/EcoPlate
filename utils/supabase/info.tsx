const env = import.meta.env as Record<string, string | undefined>;

const fallbackProjectId = "hesshtxutlaxoxciqkhn";

export const projectId =
  env.PUBLIC_SUPABASE_URL?.replace(/^https:\/\//, "").split(".")[0]
  ?? fallbackProjectId;

export const supabaseUrl =
  env.PUBLIC_SUPABASE_URL
  ?? `https://${projectId}.supabase.co`;

export const publishableKey =
  env.SUPABASE_PUBLISHABLE_KEY
  ?? env.PUBLIC_SUPABASE_PUBLISHABLE_KEY
  ?? "";

export const supabasePublishableKey = publishableKey;
