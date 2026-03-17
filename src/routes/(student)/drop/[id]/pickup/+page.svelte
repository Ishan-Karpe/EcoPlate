<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import { Motion } from "svelte-motion";
  import QRCode from "qrcode";
  import { Check, Clock, Copy, Home, MapPin, Package } from "lucide-svelte";
  import { appStore } from "$lib/stores/app.svelte";
  import { authStore } from "$lib/stores/auth.svelte";
  import { formatTime } from "$lib/utils";

  const paramId = $derived(page.params.id);
  const reservation = $derived(appStore.reservation);
  const resolvedDropId = $derived(reservation?.dropId ?? paramId);
  const drop = $derived(
    appStore.drops.find((d) => d.id === resolvedDropId) ?? appStore.selectedDrop
  );

  let copied = $state(false);
  let countdown = $state(8);
  let autoReturning = $state(true);
  let qrDataUrl = $state("");

  onMount(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    void (async () => {
      await authStore.bootstrap();
      if (appStore.drops.length === 0) {
        await appStore.loadDrops();
      }
      await appStore.loadReservation(authStore.userId);

      if (reservation && drop) {
        qrDataUrl = await QRCode.toDataURL(`ECOPLATE:${reservation.pickupCode}:${drop.location}`);
      }

      interval = setInterval(async () => {
        if (!autoReturning) return;
        countdown -= 1;
        if (countdown <= 0) {
          clearInterval(interval);
          await goto("/");
        }
      }, 1000);
    })();
    return () => clearInterval(interval);
  });

  async function goHome() {
    autoReturning = false;
    await goto("/");
  }

  async function copyCode() {
    if (!reservation) return;
    const value = reservation.pickupCode;
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(value);
    }
    copied = true;
    setTimeout(() => {
      copied = false;
    }, 2000);
  }
</script>

{#if reservation && drop}
  <div class="min-h-screen flex flex-col items-center" style="background-color: #F9F6F1">
    <!-- Animated checkmark -->
    <div class="pt-20 pb-4 text-center">
      <Motion
        let:motion
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 220, damping: 18 }}
      >
        <div
          use:motion
          class="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 relative"
          style="background-color: #006838"
        >
          <Check class="w-10 h-10 text-white" style="stroke-width: 2.5" />
          <!-- Ring ripple -->
          <div
            class="absolute inset-0 rounded-full ep-ripple"
            style="border: 2px solid #006838"
          ></div>
        </div>
      </Motion>
      <Motion
        let:motion
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h1 use:motion style="font-size: 24px; font-weight: 700; color: #1A1A1A">
          You're all set!
        </h1>
      </Motion>
      <Motion
        let:motion
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <p use:motion style="font-size: 15px; color: rgba(26,26,26,0.55); margin-top: 4px">
          Your Fresh Box is reserved
        </p>
      </Motion>
    </div>

    <!-- Code Card - Glass Card -->
    <Motion
      let:motion
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
    >
      <div
        use:motion
        class="mx-5 w-full max-w-[320px] rounded-[20px] overflow-hidden"
        style="background-color: hsla(0,0%,100%,0.65); backdrop-filter: blur(20px) saturate(1.4); border: 1px solid hsla(30,32%,41%,0.12); box-shadow: inset 0 1px 0 hsla(0,0%,100%,0.5), 0 8px 32px hsla(30,32%,41%,0.10), 0 2px 8px hsla(0,0%,0%,0.04)"
      >
        <div class="flex flex-col items-center pt-5 pb-4 px-5">
          <p
            class="mb-3"
            style="font-size: 11px; font-weight: 500; letter-spacing: 0.08em; text-transform: uppercase; color: rgba(26,26,26,0.55)"
          >
            Your Pickup Code
          </p>
          <div class="p-3 rounded-xl" style="background-color: white">
            {#if qrDataUrl}
              <img src={qrDataUrl} alt="Pickup QR code" width="160" height="160" />
            {/if}
          </div>
        </div>

        <div class="mx-5 border-t border-dashed" style="border-color: rgba(0,0,0,0.06)"></div>

        <div class="px-5 pt-4 pb-5 text-center">
          <div class="flex items-center justify-center gap-3">
            <p style="font-size: 2rem; font-weight: 700; letter-spacing: 4px; color: #006838">
              {reservation.pickupCode}
            </p>
            <button
              onclick={copyCode}
              class="p-2 rounded-xl active:scale-[0.95] transition-transform"
              style="background-color: rgba(0,104,56,0.08); color: #006838"
              title="Copy code"
            >
              {#if copied}
                <Check class="w-4 h-4" />
              {:else}
                <Copy class="w-4 h-4" />
              {/if}
            </button>
          </div>
          <p class="mt-1" style="font-size: 12px; color: rgba(26,26,26,0.55)">
            {copied ? "Copied to clipboard!" : "Show this to staff at pickup"}
          </p>
        </div>
      </div>
    </Motion>

    <!-- Pickup details summary -->
    <Motion
      let:motion
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.45 }}
    >
      <div use:motion class="w-full px-5 mt-5 space-y-3">
        <div class="flex items-center gap-2">
          <MapPin class="w-4 h-4" style="color: rgba(26,26,26,0.55); stroke-width: 1.75" />
          <span style="font-size: 14px; color: #1A1A1A">{drop.location}, {drop.locationDetail}</span
          >
        </div>
        <div class="flex items-center gap-2">
          <Clock class="w-4 h-4" style="color: rgba(26,26,26,0.55); stroke-width: 1.75" />
          <span style="font-size: 14px; color: #1A1A1A"
            >Pick up before {formatTime(drop.windowEnd)}</span
          >
        </div>
        <div class="flex items-center gap-2">
          <Package class="w-4 h-4" style="color: rgba(26,26,26,0.55); stroke-width: 1.75" />
          <span style="font-size: 14px; color: #1A1A1A">1 x Fresh Box</span>
        </div>
      </div>
    </Motion>

    <!-- Payment note -->
    <Motion
      let:motion
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.55 }}
    >
      <div use:motion class="w-full px-5 mt-4">
        <div class="rounded-xl p-3 text-center" style="background-color: #F0EBE3">
          <p style="font-size: 13px; color: rgba(26,26,26,0.55)">
            {#if reservation.paymentMethod === "credit"}
              1 Fresh Credit used
            {:else if reservation.paymentMethod === "card"}
              ${reservation.currentPrice} charged to your card
            {:else}
              Pay ${reservation.currentPrice} at pickup
            {/if}
          </p>
        </div>
      </div>
    </Motion>

    <!-- Action buttons -->
    <Motion
      let:motion
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
    >
      <div use:motion class="w-full px-5 pb-24 pt-6 space-y-3 mt-auto">
        <button
          onclick={goHome}
          class="w-full py-3.5 rounded-full flex items-center justify-center gap-2 active:scale-[0.97] transition-transform"
          style="background-color: #006838; color: white; font-size: 16px; font-weight: 600; box-shadow: 0 8px 24px hsla(153,100%,20%,0.20)"
        >
          <Home class="w-5 h-5" />
          Go to Home Screen
          {#if autoReturning}
            <span
              class="ml-1 px-2 py-0.5 rounded-full"
              style="background-color: rgba(255,255,255,0.25); font-size: 13px; font-weight: 700"
              >{countdown}s</span
            >
          {/if}
        </button>
        <p class="text-center" style="font-size: 12px; color: rgba(26,26,26,0.55)">
          Your code is accessible from the home screen banner anytime.
        </p>
      </div>
    </Motion>
  </div>
{:else}
  <div
    class="min-h-screen flex items-center justify-center px-6 text-center"
    style="background-color: #F9F6F1"
  >
    <div>
      <p style="font-size: 1rem; font-weight: 600; color: #1C2B1C">No active pickup code</p>
      <button
        onclick={goHome}
        class="mt-4 px-5 py-2.5 rounded-full"
        style="background-color: #006838; color: white; font-size: 0.875rem; font-weight: 600"
        >Back to Home</button
      >
    </div>
  </div>
{/if}

<style>
  .ep-ripple {
    animation: ep-ripple-anim 1s 0.3s ease-out forwards;
    opacity: 0.3;
  }
  @keyframes ep-ripple-anim {
    to {
      transform: scale(2);
      opacity: 0;
    }
  }
</style>
