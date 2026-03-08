import { getBrowserSupabase } from "$lib/supabase";

type SessionUser = { userId: string; email: string; name: string };

export async function signUp(
  email: string,
  password: string,
  name: string
): Promise<{ userId: string } | { error: string }> {
  const res = await fetch("/api/auth/signup", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password, name }),
  });
  const payload = await res.json();

  if (!res.ok) {
    return { error: payload.error ?? "Sign up failed" };
  }

  const sb = getBrowserSupabase();
  const { error: signInErr } = await sb.auth.signInWithPassword({ email, password });
  if (signInErr) {
    return { error: signInErr.message };
  }

  return { userId: payload.userId };
}

export async function signIn(
  email: string,
  password: string
): Promise<{ userId: string } | { error: string }> {
  const sb = getBrowserSupabase();
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) {
    return { error: error.message };
  }
  return { userId: data.user?.id ?? "" };
}

export async function signOut(): Promise<void> {
  const sb = getBrowserSupabase();
  await sb.auth.signOut();
}

export async function getSession(): Promise<SessionUser | null> {
  const sb = getBrowserSupabase();
  const { data } = await sb.auth.getSession();
  if (!data?.session?.user) return null;
  const user = data.session.user;
  return {
    userId: user.id,
    email: user.email ?? "",
    name: (user.user_metadata?.name as string) ?? "",
  };
}

export function onAuthStateChange(callback: (session: SessionUser | null) => void) {
  const sb = getBrowserSupabase();
  const { data } = sb.auth.onAuthStateChange((_event, session) => {
    if (session?.user) {
      callback({
        userId: session.user.id,
        email: session.user.email ?? "",
        name: (session.user.user_metadata?.name as string) ?? "",
      });
    } else {
      callback(null);
    }
  });
  return data.subscription;
}

export function getOrCreateGuestId(): string {
  const key = "ecoplate_guest_id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = `guest-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    localStorage.setItem(key, id);
  }
  return id;
}

export function hasCompletedOnboarding(): boolean {
  return localStorage.getItem("ecoplate_onboarded") === "true";
}

export function markOnboardingComplete(): void {
  localStorage.setItem("ecoplate_onboarded", "true");
}

export function hasPlacedFirstOrder(): boolean {
  return localStorage.getItem("ecoplate_first_order_placed") === "true";
}

export function markFirstOrderPlaced(): void {
  localStorage.setItem("ecoplate_first_order_placed", "true");
}
