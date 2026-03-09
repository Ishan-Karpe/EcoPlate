<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import * as api from "$lib/api";
  import { authStore } from "$lib/stores/auth.svelte";
  import { hasCompletedOnboarding, hasPlacedFirstOrder, markFirstOrderPlaced } from "$lib/auth";
  import BottomNav from "$lib/components/BottomNav.svelte";
  import { appStore } from "$lib/stores/app.svelte";

  let { children } = $props();

  // Auth-related routes (onboarding, auth, post-order-signup) now live
  // in the (auth) layout group which has no bottom nav at all.
  const hiddenNavRoutes = new Set(["/plan-selection"]);

  const pathname = $derived(page.url.pathname);
  const showBottomNav = $derived(!hiddenNavRoutes.has(pathname));

  let gateReady = $state(false);

  function shouldForceOnboarding() {
    return !hasCompletedOnboarding() && !hasPlacedFirstOrder();
  }

  async function enforceOnboardingForPath(path: string) {
    const forceOnboarding = shouldForceOnboarding();
    if (forceOnboarding && path !== "/onboarding") {
      await goto("/onboarding");
      return;
    }

    if (!forceOnboarding && path === "/onboarding") {
      await goto("/");
    }
  }

  onMount(async () => {
    await authStore.bootstrap();

    // Backfill for returning users who have already placed an order.
    if (!hasPlacedFirstOrder() && authStore.userId) {
      try {
        const reservations = await api.getReservations(authStore.userId);
        if (reservations.length > 0) {
          markFirstOrderPlaced();
        }
      } catch {
        // Fail open; skip backfill if network is unavailable.
      }
    }

    gateReady = true;
    await enforceOnboardingForPath(page.url.pathname);
  });

  $effect(() => {
    if (!gateReady) return;
    void enforceOnboardingForPath(page.url.pathname);
  });
</script>

<div class="w-full min-h-screen relative">
  <div class={showBottomNav && gateReady ? "pb-24" : ""}>
    {#if gateReady}
      {@render children()}
    {:else}
      <div class="min-h-screen"></div>
    {/if}
  </div>

  {#if gateReady && showBottomNav}
    <BottomNav {pathname} hasActiveReservation={Boolean(appStore.reservation)} />
  {/if}
</div>
