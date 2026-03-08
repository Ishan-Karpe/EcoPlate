import { browser } from "$app/environment";
import {
  getOrCreateGuestId,
  getSession,
  hasCompletedOnboarding,
  onAuthStateChange,
} from "$lib/auth";

let authReady = $state(false);
let authUser = $state<{ userId: string; email: string; name: string } | null>(null);
let userId = $derived(authUser?.userId ?? (browser ? getOrCreateGuestId() : "guest-server"));
let isGuest = $derived(!authUser);

let authSubscription: { unsubscribe: () => void } | null = null;

export const authStore = {
  get authReady() {
    return authReady;
  },
  get authUser() {
    return authUser;
  },
  get userId() {
    return userId;
  },
  get isGuest() {
    return isGuest;
  },
  async bootstrap() {
    if (!browser || authReady) return;

    const session = await getSession();
    if (session) {
      authUser = session;
    } else {
      authUser = null;
      if (!hasCompletedOnboarding()) {
        getOrCreateGuestId();
      }
    }
    authReady = true;

    if (!authSubscription) {
      authSubscription = onAuthStateChange((sessionState) => {
        authUser = sessionState;
      });
    }
  },
  teardown() {
    authSubscription?.unsubscribe();
    authSubscription = null;
  },
};
