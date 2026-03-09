/**
 * Server-side auth utilities.
 *
 * These helpers run in SvelteKit server hooks / +page.server.ts files.
 * Client-side auth (signIn, signUp, etc.) lives in `$lib/auth`.
 */
import { json } from "@sveltejs/kit";
import type { RequestEvent } from "@sveltejs/kit";

/** Extract the authenticated user from a request event, or null if unauthenticated. */
export function getSessionUser(event: RequestEvent) {
  return event.locals.session?.user ?? null;
}

/** True when the session belongs to an admin. */
export function isAdmin(event: RequestEvent): boolean {
  const user = getSessionUser(event);
  if (!user) return false;
  const role =
    (user.user_metadata?.role as string | undefined) ??
    (user.app_metadata?.role as string | undefined);
  return role === "admin";
}

/** True when the session user matches the given userId, or userId is a guest. */
export function isOwnerOrGuest(event: RequestEvent, userId: string): boolean {
  if (userId.startsWith("guest-")) return true;
  const user = getSessionUser(event);
  return user?.id === userId;
}

/**
 * Guard for admin-only API routes.
 * Returns a 401/403 Response if the caller is not an admin, or null if authorized.
 *
 * Usage:
 *   const denied = requireAdmin(event);
 *   if (denied) return denied;
 */
export function requireAdmin(event: RequestEvent): Response | null {
  const user = getSessionUser(event);
  if (!user) return json({ error: "Authentication required" }, { status: 401 });
  const role =
    (user.user_metadata?.role as string | undefined) ??
    (user.app_metadata?.role as string | undefined);
  if (role !== "admin") return json({ error: "Admin access required" }, { status: 403 });
  return null;
}
