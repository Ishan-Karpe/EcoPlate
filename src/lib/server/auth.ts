/**
 * Server-side auth utilities.
 *
 * These helpers run in SvelteKit server hooks / +page.server.ts files.
 * Client-side auth (signIn, signUp, etc.) lives in `$lib/auth`.
 */
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
