import { createServerClient } from "@supabase/ssr";
import type { Handle } from "@sveltejs/kit";
import { redirect } from "@sveltejs/kit";
import { env as publicEnv } from "$env/dynamic/public";

function resolveSupabaseConfig() {
  const url = publicEnv.PUBLIC_SUPABASE_URL;
  const publishableKey = publicEnv.PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new Error(
      "Missing Supabase config: PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_PUBLISHABLE_KEY"
    );
  }

  return { url, publishableKey };
}

export const handle: Handle = async ({ event, resolve }) => {
  const { url, publishableKey } = resolveSupabaseConfig();

  event.locals.supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll: () => event.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value, options }) => {
          event.cookies.set(name, value, { ...options, path: "/" });
        });
      },
    },
  });

  const {
    data: { session },
  } = await event.locals.supabase.auth.getSession();
  event.locals.session = session;

  const pathname = event.url.pathname;
  const adminLoginPath = "/admin/login";
  const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/");
  if (isAdminRoute && pathname !== adminLoginPath) {
    const role =
      (session?.user?.user_metadata?.role as string | undefined) ??
      (session?.user?.app_metadata?.role as string | undefined);

    if (role !== "admin") {
      throw redirect(303, adminLoginPath);
    }
  }

  return resolve(event, {
    filterSerializedResponseHeaders: (name) =>
      name === "content-range" || name === "x-supabase-api-version",
  });
};
