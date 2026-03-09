/**
 * Central database module.
 *
 * Re-exports Supabase clients from their dedicated modules so the rest of the
 * codebase can import from a single `$lib/server/db` entry-point.
 */
export { getAdminSupabase } from "$lib/supabase-server";
export { get, set, del, mset, mget, mdel, getByPrefix } from "$lib/kv";
