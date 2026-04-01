<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import { Motion } from "svelte-motion";
  import {
    ArrowLeft,
    Bell,
    CheckCircle2,
    Clock,
    MapPin,
    ShieldCheck,
    Share2,
    Zap,
  } from "lucide-svelte";
  import { appStore } from "$lib/stores/app.svelte";
  import { authStore } from "$lib/stores/auth.svelte";
  import { calculateCurrentPrice, formatTime } from "$lib/utils";
  import ImageWithFallback from "$lib/components/ImageWithFallback.svelte";

  const dropId = $derived(page.params.id);
  const drop = $derived(appStore.drops.find((d) => d.id === dropId) ?? appStore.selectedDrop);
  const soldOut = $derived(drop ? drop.remainingBoxes === 0 : false);
  const upcoming = $derived(drop ? drop.status === "upcoming" : false);
  const urgency = $derived(drop ? !soldOut && !upcoming && drop.remainingBoxes <= 5 : false);
  const waitlisted = $derived(drop ? appStore.waitlistedDropIds.has(drop.id) : false);
  const currentPrice = $derived(drop ? calculateCurrentPrice(drop) : 0);
  const fillPct = $derived(
    drop && drop.totalBoxes > 0 ? (drop.reservedBoxes / drop.totalBoxes) * 100 : 0
  );
  const supplyRatio = $derived(
    drop && drop.totalBoxes > 0 ? drop.remainingBoxes / drop.totalBoxes : 1
  );
  const priceTrend = $derived(
    supplyRatio > 0.5
      ? "High supply - lowest price"
      : supplyRatio < 0.2
        ? "Low supply - at max price"
        : "Moderate supply"
  );
  const menuItems = $derived(
    drop
      ? drop.description
          .replace(/\.$/, "")
          .split(/,\s*(?:and\s+)?/)
          .map((s: string) => s.trim())
          .filter(Boolean)
      : []
  );

  let now = $state(new Date());
  let timer: ReturnType<typeof setInterval>;

  onMount(() => {
    void (async () => {
      await authStore.bootstrap();
      if (appStore.drops.length === 0) {
        await appStore.loadDrops();
      }
      timer = setInterval(() => {
        now = new Date();
      }, 30000);
    })();
    return () => clearInterval(timer);
  });

  function countdownText(windowEnd: string): string {
    const [h, m] = windowEnd.split(":").map(Number);
    const end = h * 60 + m;
    const cur = now.getHours() * 60 + now.getMinutes();
    const diff = end - cur;
    if (diff <= 0) return "Closed";
    if (diff >= 60)
      return `${Math.floor(diff / 60)}:${(diff % 60).toString().padStart(2, "0")} left`;
    return `${diff}:00 left`;
  }

  async function handleReserve() {
    if (!drop) return;
    await appStore.handleReserve(drop);
  }

  async function handleWaitlist() {
    if (!drop || waitlisted) return;
    await appStore.handleWaitlist(drop.id, authStore.userId);
  }

  async function handleBack() {
    await goto("/");
  }
</script>

{#if drop}
  <div class="min-h-screen flex flex-col" style="background-color: #F9F6F1">
    <!-- Hero image -->
    <div class="relative" style="height: 42vh; min-height: 280px">
      <ImageWithFallback
        src={drop.imageUrl}
        alt={drop.description}
        class="w-full h-full object-cover"
        style="filter: {soldOut ? 'grayscale(50%)' : 'none'}"
      />
      <div
        class="absolute inset-0"
        style="background: linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, transparent 30%, transparent 50%, rgba(249,246,241,1) 100%)"
      ></div>
      <!-- Back button -->
      <button
        onclick={handleBack}
        class="absolute top-14 left-5 w-9 h-9 rounded-full flex items-center justify-center active:scale-[0.97]"
        style="background-color: hsla(0,0%,100%,0.6); backdrop-filter: blur(12px)"
      >
        <ArrowLeft class="w-5 h-5 text-white" style="stroke-width: 1.75" />
      </button>
      <!-- Share button -->
      <button
        class="absolute top-14 right-5 w-9 h-9 rounded-full flex items-center justify-center active:scale-[0.97]"
        style="background-color: hsla(0,0%,100%,0.6); backdrop-filter: blur(12px)"
      >
        <Share2 class="w-5 h-5 text-white" style="stroke-width: 1.75" />
      </button>
      <!-- Status badges -->
      <div class="absolute bottom-16 right-5">
        {#if urgency}
          <span
            class="px-2.5 py-1 rounded-full"
            style="background-color: #E8A849; color: white; font-size: 0.7rem; font-weight: 700"
            >Only {drop.remainingBoxes} left!</span
          >
        {/if}
        {#if soldOut}
          <span
            class="px-2.5 py-1 rounded-full"
            style="background-color: rgba(0,0,0,0.6); color: white; font-size: 0.7rem; font-weight: 700"
            >Sold out</span
          >
        {/if}
        {#if upcoming}
          <span
            class="px-2.5 py-1 rounded-full"
            style="background-color: #8B6F47; color: white; font-size: 0.7rem; font-weight: 700"
            >Starting soon</span
          >
        {/if}
      </div>
    </div>

    <!-- Content area -->
    <div
      class="flex-1 -mt-6 rounded-t-3xl overflow-y-auto pb-4"
      style="background-color: white; box-shadow: 0 -8px 32px hsla(30,32%,41%,0.10), 0 -2px 8px hsla(0,0%,0%,0.04)"
    >
      <div class="px-5 pt-6 space-y-5">
        <!-- Location + timing row -->
        <div class="flex items-start justify-between">
          <div>
            <h1
              style="font-size: clamp(1.125rem, 3.5vw, 1.375rem); font-weight: 600; color: #1A1A1A; letter-spacing: -0.02em"
            >
              {drop.location}
            </h1>
            <div class="flex items-center gap-1 mt-1">
              <Clock class="w-4 h-4" style="color: rgba(26,26,26,0.55); stroke-width: 1.75" />
              <span style="font-size: 13px; color: rgba(26,26,26,0.55)"
                >Available until {formatTime(drop.windowEnd)}</span
              >
            </div>
          </div>
          <span
            class="px-2.5 py-1 rounded-full shrink-0"
            style="background-color: hsla(35,76%,60%,0.10); color: #E8A849; font-size: 13px; font-weight: 700"
            >{countdownText(drop.windowEnd)}</span
          >
        </div>

        <!-- Price block -->
        <div>
          <div class="flex items-baseline gap-2">
            <span style="font-size: 28px; font-weight: 700; color: #006838">${currentPrice}.00</span
            >
            <span style="font-size: 14px; color: rgba(26,26,26,0.55); text-decoration: line-through"
              >Retail ~$11</span
            >
          </div>
          <div class="mt-1">
            <span
              class="inline-flex items-center px-2.5 py-1 rounded-full"
              style="background-color: rgba(0,104,56,0.08); font-size: 11px; font-weight: 500; color: #006838; letter-spacing: 0.08em; text-transform: uppercase"
            >
              {Math.round((1 - currentPrice / 11) * 100)}% off retail
            </span>
          </div>
        </div>

        <!-- What's Inside -->
        <div>
          <div class="flex items-center gap-2">
            <div class="w-6 h-px" style="background-color: hsla(30,32%,41%,0.3)"></div>
            <span
              style="font-size: 11px; font-weight: 500; color: rgba(26,26,26,0.55); letter-spacing: 0.08em; text-transform: uppercase"
              >What's Inside</span
            >
          </div>
          <div class="space-y-2 mt-3">
            {#each menuItems as item}
              <div class="flex items-center gap-2.5">
                <div
                  class="w-1.5 h-1.5 rounded-full shrink-0"
                  style="background-color: #E8A849"
                ></div>
                <span style="font-size: 15px; color: #1A1A1A"
                  >{item.charAt(0).toUpperCase() + item.slice(1)}</span
                >
              </div>
            {/each}
          </div>
        </div>

        <!-- Dietary tags -->
        <div class="flex gap-2 overflow-x-auto" style="scrollbar-width: none">
          {#each ["Gluten-Free", "High Protein", "Dairy-Free"] as tag}
            <span
              class="shrink-0 px-2.5 py-1 rounded-full"
              style="background-color: rgba(0,104,56,0.08); font-size: 11px; font-weight: 500; color: #006838; letter-spacing: 0.08em; text-transform: uppercase"
              >{tag}</span
            >
          {/each}
        </div>

        <!-- Pickup Details -->
        <div>
          <div class="flex items-center gap-2">
            <div class="w-6 h-px" style="background-color: hsla(30,32%,41%,0.3)"></div>
            <span
              style="font-size: 11px; font-weight: 500; color: rgba(26,26,26,0.55); letter-spacing: 0.08em; text-transform: uppercase"
              >Pickup Details</span
            >
          </div>
          <div
            class="mt-3 rounded-2xl overflow-hidden"
            style="border: 1px solid hsla(30,32%,41%,0.12)"
          >
            <div class="h-28 relative" style="background-color: #EDE8E1">
              <div class="absolute inset-0 flex items-center justify-center">
                <MapPin class="w-8 h-8" style="color: #006838" />
              </div>
            </div>
            <div class="p-4">
              <p style="font-size: 14px; font-weight: 500; color: #1A1A1A">
                {drop.location}, {drop.locationDetail}
              </p>
            </div>
          </div>
        </div>

        <!-- Dynamic pricing context -->
        {#if !soldOut}
          <div class="flex items-center gap-2">
            <Zap class="w-3.5 h-3.5 shrink-0" style="color: #8B6F47; stroke-width: 1.75" />
            <p style="font-size: 0.72rem; color: rgba(26,26,26,0.55)">
              <span style="font-weight: 600">Dynamic pricing: </span>{priceTrend} - Range $5-$8
            </p>
          </div>
        {/if}

        <!-- Demand bar -->
        {#if !soldOut}
          <div>
            <div
              class="flex items-center justify-between mb-1.5"
              style="font-size: 0.7rem; color: rgba(26,26,26,0.55)"
            >
              <span>{drop.reservedBoxes} reserved</span>
              <span>{drop.remainingBoxes} available</span>
            </div>
            <div class="w-full h-2 rounded-full overflow-hidden" style="background-color: #EDE8E1">
              <Motion
                let:motion
                initial={{ width: "0%" }}
                animate={{ width: `${fillPct}%` }}
                transition={{ duration: 0.7, delay: 0.2 }}
              >
                <div
                  use:motion
                  class="h-full rounded-full"
                  style="background-color: {urgency ? '#E8A849' : '#006838'}"
                ></div>
              </Motion>
            </div>
          </div>
        {/if}

        <!-- Sold out waitlist -->
        {#if soldOut}
          <Motion
            let:motion
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div use:motion class="space-y-3">
              <div
                class="rounded-xl p-4 text-center"
                style="background-color: #FEF3C7; border: 1px solid #FCD34D"
              >
                <p style="font-size: 0.875rem; font-weight: 600; color: #92400E">
                  All boxes have been claimed
                </p>
                <p class="mt-1" style="font-size: 0.8rem; color: #B45309">
                  Boxes may open up if someone cancels. Join the waitlist!
                </p>
              </div>
              <button
                onclick={handleWaitlist}
                disabled={waitlisted}
                class="w-full py-3.5 rounded-full flex items-center justify-center gap-2 active:scale-[0.97] transition-transform"
                style="background-color: {waitlisted
                  ? 'rgba(0,104,56,0.08)'
                  : '#8B6F47'}; color: {waitlisted
                  ? '#006838'
                  : 'white'}; font-weight: 600; font-size: 16px; cursor: {waitlisted
                  ? 'default'
                  : 'pointer'}"
              >
                {#if waitlisted}
                  <CheckCircle2 class="w-4 h-4" />
                  Already Waitlisted
                {:else}
                  <Bell class="w-4 h-4" />
                  Join Waitlist
                {/if}
              </button>
              {#if !waitlisted}
                <p class="text-center" style="font-size: 0.7rem; color: rgba(26,26,26,0.55)">
                  We'll notify you if a box opens up
                </p>
              {/if}
            </div>
          </Motion>
        {/if}

        <!-- Trust signal -->
        <div class="flex items-center gap-2 justify-center py-1">
          <ShieldCheck class="w-4 h-4" style="color: #006838; stroke-width: 1.75" />
          <span style="font-size: 13px; color: rgba(26,26,26,0.55)"
            >Food handled by dining staff</span
          >
        </div>
      </div>
    </div>

    {#if !soldOut}
      <Motion
        let:motion
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div use:motion class="px-5 pb-24 pt-3" style="background-color: white">
          <button
            onclick={handleReserve}
            class="w-full py-3.5 rounded-full flex items-center justify-center gap-3 active:scale-[0.97] transition-transform"
            style="background-color: #006838; color: white; font-size: 16px; font-weight: 600; box-shadow: 0 8px 24px hsla(153,100%,20%,0.20)"
          >
            Reserve This Box - ${currentPrice}.00
          </button>
          <p class="text-center mt-2" style="font-size: 13px; color: rgba(26,26,26,0.55)">
            No account needed. Reserve in seconds.
          </p>
        </div>
      </Motion>
    {/if}
  </div>
{:else}
  <div
    class="min-h-screen flex items-center justify-center px-6 text-center"
    style="background-color: #F9F6F1"
  >
    <div>
      <p style="font-size: 1rem; font-weight: 600; color: #1C2B1C">Drop not found</p>
      <button
        onclick={handleBack}
        class="mt-4 px-5 py-2.5 rounded-full"
        style="background-color: #006838; color: white; font-size: 0.875rem; font-weight: 600"
        >Back to Home</button
      >
    </div>
  </div>
{/if}
