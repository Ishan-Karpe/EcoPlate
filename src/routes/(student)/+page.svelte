<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { Motion } from "svelte-motion";
  import { appStore } from "$lib/stores/app.svelte";
  import { authStore } from "$lib/stores/auth.svelte";
  import { formatTime, calculateCurrentPrice } from "$lib/utils";
  import type { Drop } from "$lib/types";
  import {
    MapPin,
    Clock,
    ChevronRight,
    AlertCircle,
    CheckCircle2,
    Bell,
    X,
    QrCode,
    Navigation,
    Search,
    Timer,
    Camera,
  } from "lucide-svelte";
  import EcoplateLogo from "$lib/components/EcoplateLogo.svelte";
  import ImageWithFallback from "$lib/components/ImageWithFallback.svelte";

  // ─── constants ────────────────────────────────────────────────────────────
  const FILTERS = [
    "All",
    "Vegetarian",
    "Vegan",
    "Gluten-Free",
    "High Protein",
    "Dairy-Free",
  ] as const;

  function extractTags(description: string): string[] {
    const lower = description.toLowerCase();
    const tags: string[] = [];
    if (lower.includes("vegetarian") || lower.includes("veggie")) tags.push("Vegetarian");
    if (lower.includes("vegan")) tags.push("Vegan");
    if (lower.includes("gluten-free") || lower.includes("gluten free")) tags.push("Gluten-Free");
    if (
      lower.includes("protein") ||
      lower.includes("chicken") ||
      lower.includes("beef") ||
      lower.includes("steak") ||
      lower.includes("turkey")
    )
      tags.push("High Protein");
    if (lower.includes("dairy-free") || lower.includes("dairy free")) tags.push("Dairy-Free");
    return tags;
  }

  // ─── local state ─────────────────────────────────────────────────────────
  let searchQuery = $state("");
  let activeFilter = $state<string>("All");
  let scrollY = $state(0);
  let showCancel = $state(false);
  // Reactive clock — drives all countdown displays
  let now = $state(new Date());

  // ─── store reads ─────────────────────────────────────────────────────────
  const drops = $derived(appStore.drops);
  const dropsLoading = $derived(appStore.dropsLoading);
  const activeReservation = $derived(appStore.reservation);
  const user = $derived(appStore.user);
  const waitlistedDropIds = $derived(appStore.waitlistedDropIds);

  // ─── derived ─────────────────────────────────────────────────────────────
  const filteredDrops = $derived.by(() => {
    let result = drops;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (d) =>
          d.description.toLowerCase().includes(q) ||
          d.location.toLowerCase().includes(q) ||
          d.locationDetail.toLowerCase().includes(q)
      );
    }
    if (activeFilter !== "All") {
      result = result.filter((d) => extractTags(d.description).includes(activeFilter));
    }
    return result;
  });

  const activeDrops = $derived(
    filteredDrops.filter((d) => d.status === "active" && d.remainingBoxes > 0)
  );
  const soldOutDrops = $derived(
    filteredDrops.filter((d) => d.status === "active" && d.remainingBoxes === 0)
  );
  const upcomingDrops = $derived(filteredDrops.filter((d) => d.status === "upcoming"));

  const reservedDrop = $derived(
    activeReservation ? (drops.find((d) => d.id === activeReservation.dropId) ?? null) : null
  );

  const headerScrolled = $derived(scrollY > 60);

  // ─── reservation banner derived state (reactive to `now`) ─────────────────
  const reservedDropWindowState = $derived.by((): "before" | "during" | "after" => {
    if (!reservedDrop) return "before";
    const [startH, startM] = reservedDrop.windowStart.split(":").map(Number);
    const [endH, endM] = reservedDrop.windowEnd.split(":").map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    // `now` is read here so this derived re-evaluates when the clock ticks
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    if (nowMinutes < startMinutes) return "before";
    if (nowMinutes >= endMinutes) return "after";
    return "during";
  });

  const isPickedUp = $derived(activeReservation?.status === "picked_up");
  const isReady = $derived(!isPickedUp && reservedDropWindowState === "during");
  const isPast = $derived(!isPickedUp && reservedDropWindowState === "after");

  const bannerBg = $derived(
    isPickedUp ? "#004D28" : isReady ? "#005C30" : isPast ? "#4A3728" : "#006838"
  );
  const statusLabel = $derived(
    isPickedUp
      ? "Pickup Complete"
      : isReady
        ? "Ready to Pick Up"
        : isPast
          ? "Window Ended"
          : "Reserved"
  );
  const dotColor = $derived(
    isPickedUp ? "#86efac" : isReady ? "#86efac" : isPast ? "#F59E0B" : "#86efac"
  );
  const dotAnimation = $derived(
    isPickedUp
      ? "none"
      : isReady
        ? "ep-pulse 1.5s infinite"
        : isPast
          ? "none"
          : "ep-pulse 2s infinite"
  );

  // ─── helpers ─────────────────────────────────────────────────────────────
  function getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }

  /** Reads `now` so the template expression stays reactive to clock ticks. */
  function getCountdownText(windowEnd: string): string {
    const [endH, endM] = windowEnd.split(":").map(Number);
    const endMinutes = endH * 60 + endM;
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const diff = endMinutes - nowMinutes;
    if (diff <= 0) return "Closed";
    if (diff >= 60) {
      const h = Math.floor(diff / 60);
      const m = diff % 60;
      return `Closes in ${h}h ${m}min`;
    }
    return `Closes in ${diff}min`;
  }

  /** Reads `now` — same reactive pattern as getCountdownText. */
  function getLiveCountdownText(windowEnd: string): string {
    const [endH, endM] = windowEnd.split(":").map(Number);
    const endMinutes = endH * 60 + endM;
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const diff = endMinutes - nowMinutes;
    if (diff <= 0) return "Ended";
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
  }

  function handleScroll(e: Event) {
    scrollY = (e.target as HTMLElement).scrollTop;
  }

  async function handleWaitlistClick(e: MouseEvent, dropId: string) {
    e.stopPropagation();
    if (!waitlistedDropIds.has(dropId)) {
      await appStore.handleWaitlist(dropId, authStore.userId);
    }
  }

  async function confirmCancel() {
    showCancel = false;
    await appStore.handleCancelReservation(authStore.userId);
  }

  // ─── lifecycle ────────────────────────────────────────────────────────────
  let clockInterval: ReturnType<typeof setInterval>;

  onMount(async () => {
    await authStore.bootstrap();
    await appStore.loadDrops();
    if (authStore.userId) {
      await appStore.loadReservation(authStore.userId);
    }
    clockInterval = setInterval(() => {
      now = new Date();
    }, 30_000);
  });

  onDestroy(() => {
    clearInterval(clockInterval);
  });
</script>

<!-- ─── Drop card snippet (shared across all three sections) ─────────────── -->
{#snippet dropCard(drop: Drop, soldOut: boolean, upcoming: boolean, delay: number)}
  {@const tags = extractTags(drop.description)}
  {@const currentPrice = calculateCurrentPrice(drop)}
  {@const urgency = !soldOut && !upcoming && drop.remainingBoxes > 0 && drop.remainingBoxes <= 5}
  {@const countdownText = !soldOut && !upcoming ? getCountdownText(drop.windowEnd) : ""}
  {@const isClosingSoon =
    !soldOut &&
    !upcoming &&
    (() => {
      const [endH, endM] = drop.windowEnd.split(":").map(Number);
      const endMin = endH * 60 + endM;
      const nowMin = now.getHours() * 60 + now.getMinutes();
      return endMin - nowMin > 0 && endMin - nowMin <= 15;
    })()}
  {@const isClosed = countdownText === "Closed"}
  {@const isWaitlisted = waitlistedDropIds.has(drop.id)}
  <Motion
    let:motion
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
  >
    <div
      use:motion
      class="rounded-[20px] overflow-hidden {soldOut ? 'opacity-70' : ''}"
      style="background-color: white; border: 1px solid hsla(30,32%,41%,0.12); box-shadow: 0 2px 16px hsla(30,32%,41%,0.06), 0 1px 4px hsla(0,0%,0%,0.03)"
    >
      <button
        onclick={() => appStore.handleSelectDrop(drop)}
        class="w-full text-left active:scale-[0.97] transition-transform"
        style="transition-duration: 100ms"
      >
        <div class="flex items-stretch">
          <!-- Food image -->
          <div class="w-[100px] shrink-0 relative overflow-hidden" style="min-height: 100px">
            <ImageWithFallback
              src={drop.imageUrl}
              alt={drop.location}
              class="w-full h-full object-cover"
              style="border-radius: 16px 0 0 16px; filter: {soldOut ? 'grayscale(60%)' : 'none'}"
            />
            <!-- Real photo badge -->
            {#if drop.imageUrl.startsWith("data:") && !soldOut && !upcoming}
              <div
                class="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded-md flex items-center gap-0.5"
                style="background-color: rgba(0,104,56,0.85); color: white; font-size: 0.5rem; font-weight: 700; letter-spacing: 0.03em"
              >
                <Camera class="w-2 h-2" />
                Real photo
              </div>
            {/if}
            <!-- Status badges -->
            {#if isClosingSoon}
              <div
                class="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md"
                style="background-color: #DC2626; color: white; font-size: 0.58rem; font-weight: 700"
              >
                Closing Soon
              </div>
            {:else if urgency}
              <div
                class="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md"
                style="background-color: #F59E0B; color: white; font-size: 0.6rem; font-weight: 700"
              >
                {drop.remainingBoxes} left!
              </div>
            {:else if soldOut}
              <div
                class="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md"
                style="background-color: rgba(0,0,0,0.55); color: white; font-size: 0.6rem; font-weight: 700"
              >
                Sold out
              </div>
            {:else if upcoming}
              <div
                class="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md"
                style="background-color: #8B6F47; color: white; font-size: 0.6rem; font-weight: 700"
              >
                Soon
              </div>
            {/if}
          </div>

          <!-- Content -->
          <div class="flex-1 p-3 min-w-0 flex flex-col">
            <div class="flex items-start justify-between gap-1">
              <div class="flex items-center gap-1.5 min-w-0">
                <p class="truncate" style="font-size: 0.9rem; font-weight: 700; color: #1C2B1C">
                  {drop.location}
                </p>
                <span
                  class="px-1.5 py-0.5 rounded-full shrink-0"
                  style="background-color: #F0EBE3; color: #7A6B5A; font-size: 0.55rem; font-weight: 700"
                >
                  {drop.location === "Brandywine" ? "BW" : "ANT"}
                </span>
              </div>
              <ChevronRight class="w-4 h-4 shrink-0 mt-0.5" style="color: #7A6B5A" />
            </div>

            <p
              class="mt-0.5 line-clamp-2"
              style="font-size: 0.73rem; color: #7A6B5A; line-height: 1.4"
            >
              {drop.description}
            </p>

            <!-- Countdown chip -->
            {#if !soldOut && !upcoming && countdownText}
              <div class="flex items-center gap-2 mt-1.5 flex-wrap" style="font-size: 0.65rem">
                <span
                  class="flex items-center gap-1 px-1.5 py-0.5 rounded-md shrink-0"
                  style="background-color: {isClosed
                    ? 'rgba(0,0,0,0.55)'
                    : '#F59E0B'}; color: white; font-size: 0.58rem; font-weight: 700; white-space: nowrap"
                >
                  <Timer class="w-2.5 h-2.5" />
                  {countdownText}
                </span>
              </div>
            {/if}

            <!-- Time + location detail -->
            <div
              class="flex items-center gap-2.5 mt-1.5"
              style="font-size: 0.68rem; color: #7A6B5A"
            >
              <span class="flex items-center gap-1 whitespace-nowrap">
                <Clock class="w-3 h-3" />
                {formatTime(drop.windowStart)}–{formatTime(drop.windowEnd)}
              </span>
              <span class="flex items-center gap-1 truncate">
                <MapPin class="w-3 h-3 shrink-0" />
                <span class="truncate">{drop.locationDetail}</span>
              </span>
            </div>

            <!-- Tags + price -->
            <div class="flex items-center justify-between mt-2">
              <div class="flex items-center gap-1.5">
                {#each tags.slice(0, 2) as tag}
                  <span
                    class="px-2 py-0.5 rounded-full"
                    style="background-color: rgba(0,104,56,0.08); color: #006838; font-size: 0.55rem; font-weight: 500; letter-spacing: 0.06em; text-transform: uppercase"
                  >
                    {tag}
                  </span>
                {/each}
              </div>
              <span
                class="px-2 py-0.5 rounded-lg"
                style="font-size: 16px; font-weight: 700; color: {soldOut ? '#7A6B5A' : '#006838'}"
              >
                ${currentPrice}
              </span>
            </div>
          </div>
        </div>
      </button>

      <!-- Waitlist button (sold-out cards only) -->
      {#if soldOut}
        <div class="px-3 pb-3" style="border-top: 1px solid rgba(0,104,56,0.08)">
          <button
            onclick={(e) => handleWaitlistClick(e, drop.id)}
            disabled={isWaitlisted}
            class="w-full mt-2.5 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-[0.97]"
            style="background-color: {isWaitlisted ? '#E8F5EE' : '#8B6F47'}; color: {isWaitlisted
              ? '#006838'
              : 'white'}; font-size: 0.8rem; font-weight: 600; cursor: {isWaitlisted
              ? 'default'
              : 'pointer'}"
          >
            {#if isWaitlisted}
              <CheckCircle2 class="w-3.5 h-3.5" />
              Already Waitlisted
            {:else}
              <Bell class="w-3.5 h-3.5" />
              Join Waitlist
            {/if}
          </button>
        </div>
      {/if}
    </div>
  </Motion>
{/snippet}

<!-- ─── Page shell ─────────────────────────────────────────────────────────── -->
<div class="min-h-screen flex flex-col relative" style="background-color: #F9F6F1">
  <!-- ── Sticky header (scroll-aware glass) ──────────────────────────────── -->
  <div
    class="px-5 pt-14 pb-4"
    style="
      background-color: {headerScrolled ? 'rgba(255,255,255,0.82)' : '#F9F6F1'};
      backdrop-filter: {headerScrolled ? 'blur(20px) saturate(1.4)' : 'none'};
      -webkit-backdrop-filter: {headerScrolled ? 'blur(20px) saturate(1.4)' : 'none'};
      border-bottom: {headerScrolled ? '1px solid rgba(0,104,56,0.08)' : '1px solid transparent'};
      box-shadow: {headerScrolled ? '0 2px 16px rgba(0,0,0,0.04)' : 'none'};
      transition: background-color 280ms cubic-bezier(0.32,0.72,0,1),
                  backdrop-filter 280ms cubic-bezier(0.32,0.72,0,1),
                  border-bottom-color 280ms cubic-bezier(0.32,0.72,0,1),
                  box-shadow 280ms cubic-bezier(0.32,0.72,0,1);
    "
  >
    <!-- Logo row -->
    <div class="flex items-center justify-between mb-4">
      <EcoplateLogo iconSize={36} fontSize="1.5rem" textColor="#006838" />
      <div></div>
    </div>

    <!-- Greeting -->
    <div class="mb-3">
      <h1
        style="font-size: clamp(1.25rem, 5vw, 1.5rem); font-weight: 600; color: #1A1A1A; letter-spacing: -0.02em"
      >
        {getGreeting()}{user.name ? `, ${user.name}` : ""}
      </h1>
      <p style="font-size: 14px; color: rgba(26,26,26,0.55); margin-top: 2px">
        {activeDrops.length > 0
          ? `${activeDrops.length} Fresh Box${activeDrops.length !== 1 ? "es" : ""} available nearby`
          : "No boxes available right now"}
      </p>
    </div>
  </div>

  <!-- ── "No account needed" badge ──────────────────────────────────────── -->
  {#if !user.hasAccount}
    <div class="px-5 pb-2">
      <div
        class="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-full mx-auto w-fit"
        style="background-color: rgba(0,104,56,0.08)"
      >
        <CheckCircle2 class="w-3 h-3" style="color: #006838" />
        <span
          style="font-size: 11px; font-weight: 500; color: #006838; letter-spacing: 0.08em; text-transform: uppercase"
        >
          No account needed to reserve
        </span>
      </div>
    </div>
  {/if}

  <!-- ── Live status banner (shown when there's no active reservation) ───── -->
  {#if !activeReservation && activeDrops.length > 0}
    <div class="px-5 pt-2 pb-1">
      <div
        class="rounded-[20px] px-4 py-3 flex items-center justify-between"
        style="background-color: hsla(0,0%,100%,0.65); backdrop-filter: blur(20px) saturate(1.4); border: 1px solid hsla(38,38%,59%,0.15); box-shadow: inset 0 1px 0 hsla(0,0%,100%,0.5)"
      >
        <div class="flex items-center gap-2.5">
          <div
            class="w-2 h-2 rounded-full shrink-0"
            style="background-color: #006838; animation: ep-pulse 2s ease infinite; filter: drop-shadow(0 0 8px hsla(153,100%,20%,0.3))"
          ></div>
          <div>
            <span
              style="font-size: 11px; font-weight: 500; color: #006838; letter-spacing: 0.08em; text-transform: uppercase"
            >
              Live Now
            </span>
            <p style="font-size: 14px; font-weight: 600; color: #1A1A1A; margin-top: 1px">
              {activeDrops[0]?.location} –
              {activeDrops.reduce((sum, d) => sum + d.remainingBoxes, 0)} boxes left
            </p>
          </div>
        </div>
        <!-- Live countdown display (reads `now` reactively) -->
        <span
          style="font-size: 16px; font-weight: 700; color: #E8A849; filter: drop-shadow(0 0 6px hsla(35,76%,60%,0.4)); font-variant-numeric: tabular-nums"
        >
          {getLiveCountdownText(activeDrops[0]?.windowEnd ?? "20:00")}
        </span>
      </div>
    </div>
  {/if}

  <!-- ── Search bar ─────────────────────────────────────────────────────── -->
  <div class="px-4 pt-3">
    <div
      class="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl"
      style="background-color: white; border: 1px solid rgba(0,104,56,0.12); box-shadow: 0 1px 4px rgba(0,0,0,0.04)"
    >
      <Search class="w-4 h-4 shrink-0" style="color: #7A6B5A" />
      <input
        type="text"
        placeholder="Search meals, locations..."
        bind:value={searchQuery}
        class="flex-1 bg-transparent outline-none"
        style="font-size: 0.85rem; color: #1C2B1C"
      />
      {#if searchQuery}
        <button onclick={() => (searchQuery = "")}>
          <X class="w-3.5 h-3.5" style="color: #7A6B5A" />
        </button>
      {/if}
    </div>
  </div>

  <!-- ── Filter chips ──────────────────────────────────────────────────── -->
  <div class="px-4 pt-3 pb-1 flex gap-2 overflow-x-auto" style="scrollbar-width: none">
    {#each FILTERS as f}
      <button
        onclick={() => (activeFilter = f)}
        class="shrink-0 px-3 py-1.5 rounded-full transition-all"
        style="background-color: {activeFilter === f
          ? '#006838'
          : 'white'}; color: {activeFilter === f
          ? 'white'
          : '#7A6B5A'}; font-size: 0.72rem; font-weight: 600; border: 1px solid {activeFilter === f
          ? '#006838'
          : 'rgba(0,104,56,0.12)'}"
      >
        {f}
      </button>
    {/each}
  </div>

  <!-- ── Active reservation banner ──────────────────────────────────────── -->
  {#if activeReservation && reservedDrop}
    {#key activeReservation.id}
      <Motion
        let:motion
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
      >
        <div use:motion class="mx-5 mt-3">
          <div
            class="rounded-2xl overflow-hidden shadow-md relative"
            style="border: 1.5px solid {bannerBg}"
          >
            <!-- Banner top section -->
            <div class="px-4 pt-3.5 pb-3" style="background-color: {bannerBg}">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <div
                    class="w-2 h-2 rounded-full"
                    style="background-color: {dotColor}; animation: {dotAnimation}"
                  ></div>
                  <span class="text-white" style="font-size: 0.8rem; font-weight: 700">
                    {statusLabel}
                  </span>
                </div>
                {#if !isReady && !isPast && !isPickedUp}
                  <button
                    onclick={() => (showCancel = true)}
                    class="text-white/50 active:text-white/80"
                  >
                    <X class="w-4 h-4" />
                  </button>
                {/if}
              </div>

              {#if isPickedUp}
                <p class="text-white mt-1.5" style="font-size: 0.9rem; font-weight: 600">
                  Your meal has been picked up!
                </p>
                <p class="text-white/70 mt-0.5" style="font-size: 0.75rem">
                  {reservedDrop.location} · Tell us how it was
                </p>
              {:else if isReady}
                <p class="text-white mt-1.5" style="font-size: 0.9rem; font-weight: 600">
                  Head to {reservedDrop.locationDetail}
                </p>
                <p class="text-white/70 mt-0.5" style="font-size: 0.75rem">
                  Window closes at {formatTime(reservedDrop.windowEnd)} · Show your code at the counter
                </p>
              {:else if isPast}
                <p class="text-white mt-1.5" style="font-size: 0.9rem; font-weight: 600">
                  Pickup window has ended
                </p>
                <p class="text-white/70 mt-0.5" style="font-size: 0.75rem">
                  {reservedDrop.location} ·
                  {formatTime(reservedDrop.windowStart)}–{formatTime(reservedDrop.windowEnd)}
                </p>
              {:else}
                <p class="text-white mt-1.5" style="font-size: 0.9rem; font-weight: 600">
                  Your box at {reservedDrop.location} is reserved
                </p>
                <p class="text-white/70 mt-0.5" style="font-size: 0.75rem">
                  Pickup opens at {formatTime(reservedDrop.windowStart)} · {reservedDrop.locationDetail}
                </p>
              {/if}
            </div>

            <!-- Action buttons -->
            <div class="px-4 py-3 flex gap-2" style="background-color: #E8F5EE">
              {#if isPickedUp}
                <button
                  onclick={() => appStore.handlePickedUp()}
                  class="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl active:scale-[0.97] transition-transform shadow-sm"
                  style="background-color: #006838; color: white; font-size: 0.875rem; font-weight: 700"
                >
                  <CheckCircle2 class="w-4 h-4" />
                  Rate Your Meal
                </button>
              {:else if isReady}
                <button
                  onclick={() => appStore.handleViewCode(activeReservation.dropId)}
                  class="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl active:scale-[0.97] transition-transform shadow-sm"
                  style="background-color: #006838; color: white; font-size: 0.8rem; font-weight: 700"
                >
                  <QrCode class="w-3.5 h-3.5" />
                  Show Pickup Code
                </button>
              {:else if isPast}
                <button
                  onclick={() => appStore.handleViewCode(activeReservation.dropId)}
                  class="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border active:scale-[0.97] transition-transform"
                  style="background-color: white; border-color: rgba(0,104,56,0.2); color: #006838; font-size: 0.8rem; font-weight: 600"
                >
                  <QrCode class="w-3.5 h-3.5" />
                  Show Code
                </button>
              {:else}
                <button
                  onclick={() => appStore.handleViewCode(activeReservation.dropId)}
                  class="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border active:scale-[0.97] transition-transform"
                  style="background-color: white; border-color: rgba(0,104,56,0.2); color: #006838; font-size: 0.8rem; font-weight: 600"
                >
                  <QrCode class="w-3.5 h-3.5" />
                  Show Code
                </button>
                <button
                  onclick={() => (showCancel = true)}
                  class="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border active:scale-[0.97] transition-transform"
                  style="background-color: white; border-color: rgba(192,57,43,0.2); color: #C0392B; font-size: 0.8rem; font-weight: 600"
                >
                  <X class="w-3.5 h-3.5" />
                  Cancel
                </button>
              {/if}
            </div>

            <!-- Footer strips -->
            {#if isReady}
              <div
                class="px-4 py-2 flex items-center gap-2"
                style="background-color: #D4EDDA; border-top: 1px solid rgba(0,104,56,0.1)"
              >
                <Navigation class="w-3 h-3" style="color: #006838" />
                <p style="font-size: 0.72rem; color: #004D28">
                  Window open – show your code to staff at the counter to complete pickup.
                </p>
              </div>
            {/if}
            {#if isPickedUp}
              <div
                class="px-4 py-2 flex items-center gap-2"
                style="background-color: #D4EDDA; border-top: 1px solid rgba(0,104,56,0.1)"
              >
                <CheckCircle2 class="w-3 h-3" style="color: #006838" />
                <p style="font-size: 0.72rem; color: #004D28">
                  Verified by dining staff · Share your experience below
                </p>
              </div>
            {/if}

            <!-- Cancel confirmation overlay -->
            {#if showCancel}
              <div
                class="absolute inset-0 flex items-center justify-center z-50"
                style="background-color: rgba(249,246,241,0.95)"
              >
                <div class="mx-4 text-center p-6 rounded-2xl bg-white shadow-xl w-full">
                  <div
                    class="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
                    style="background-color: #FEF3C7"
                  >
                    <AlertCircle class="w-6 h-6" style="color: #D97706" />
                  </div>
                  <p style="font-size: 1rem; font-weight: 700; color: #1C2B1C">
                    Cancel reservation?
                  </p>
                  <p class="mt-1" style="font-size: 0.8rem; color: #7A6B5A">
                    Your box goes back to someone else.
                    {#if activeReservation.paymentMethod === "card"}
                      Your card will be refunded.{/if}
                    {#if activeReservation.paymentMethod === "credit"}
                      Your credit will be returned.{/if}
                  </p>
                  <div class="flex gap-2 mt-4">
                    <button
                      onclick={() => (showCancel = false)}
                      class="flex-1 py-2.5 rounded-xl"
                      style="background-color: #EDE8E1; color: #7A6B5A; font-size: 0.875rem; font-weight: 600"
                    >
                      Keep it
                    </button>
                    <button
                      onclick={confirmCancel}
                      class="flex-1 py-2.5 rounded-xl"
                      style="background-color: #C0392B; color: white; font-size: 0.875rem; font-weight: 600"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            {/if}
          </div>
        </div>
      </Motion>
    {/key}
  {/if}

  <!-- ── Scrollable drop list ──────────────────────────────────────────── -->
  <div class="flex-1 px-4 py-3 space-y-5 overflow-y-auto pb-28" onscroll={handleScroll}>
    <!-- Loading skeleton -->
    {#if dropsLoading}
      <div class="space-y-3">
        {#each [1, 2, 3] as _i}
          <div
            class="rounded-2xl overflow-hidden animate-pulse"
            style="background-color: white; border: 1px solid rgba(0,104,56,0.08)"
          >
            <div class="flex">
              <div class="w-[90px] h-[110px] shrink-0" style="background-color: #EDE8E1"></div>
              <div class="flex-1 p-3 space-y-2">
                <div class="h-4 rounded" style="background-color: #EDE8E1; width: 60%"></div>
                <div class="h-3 rounded" style="background-color: #F0EBE3; width: 90%"></div>
                <div class="h-3 rounded" style="background-color: #F0EBE3; width: 70%"></div>
                <div class="flex gap-2">
                  <div class="h-3 rounded" style="background-color: #EDE8E1; width: 40%"></div>
                  <div class="h-3 rounded" style="background-color: #EDE8E1; width: 30%"></div>
                </div>
              </div>
            </div>
          </div>
        {/each}
      </div>
    {/if}

    <!-- ── Available Now ─────────────────────────────────────────────────── -->
    {#if !dropsLoading && activeDrops.length > 0}
      <Motion
        let:motion
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div use:motion>
          <!-- Section header with pulsing dot -->
          <div class="flex items-center gap-2">
            <div
              class="w-2 h-2 rounded-full"
              style="background-color: #006838; animation: ep-pulse 2s ease infinite; filter: drop-shadow(0 0 8px rgba(0,104,56,0.3))"
            ></div>
            <span
              style="font-size: 11px; font-weight: 500; letter-spacing: 0.08em; text-transform: uppercase; color: #006838"
            >
              Available Now ({activeDrops.length})
            </span>
          </div>
          <div class="space-y-3 mt-3">
            {#each activeDrops as drop, i (drop.id)}
              {@render dropCard(drop, false, false, 0.15 + i * 0.07)}
            {/each}
          </div>
        </div>
      </Motion>
    {/if}

    <!-- ── Starting Soon ──────────────────────────────────────────────────── -->
    {#if !dropsLoading && upcomingDrops.length > 0}
      <Motion
        let:motion
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <div use:motion>
          <div class="flex items-center gap-2">
            <div class="w-6 h-px" style="background-color: rgba(139,111,71,0.3)"></div>
            <span
              style="font-size: 11px; font-weight: 500; letter-spacing: 0.08em; text-transform: uppercase; color: #8B6F47"
            >
              Starting Soon ({upcomingDrops.length})
            </span>
          </div>
          <div class="space-y-3 mt-3">
            {#each upcomingDrops as drop, i (drop.id)}
              {@render dropCard(drop, false, true, 0.3 + i * 0.07)}
            {/each}
          </div>
        </div>
      </Motion>
    {/if}

    <!-- ── Sold Out ───────────────────────────────────────────────────────── -->
    {#if !dropsLoading && soldOutDrops.length > 0}
      <Motion
        let:motion
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div use:motion>
          <div class="flex items-center gap-2">
            <AlertCircle class="w-3.5 h-3.5" style="color: #7A6B5A" />
            <span
              style="font-size: 11px; font-weight: 500; letter-spacing: 0.08em; text-transform: uppercase; color: #7A6B5A"
            >
              Sold Out ({soldOutDrops.length})
            </span>
          </div>
          <div class="space-y-3 mt-3">
            {#each soldOutDrops as drop, i (drop.id)}
              {@render dropCard(drop, true, false, 0.45 + i * 0.07)}
            {/each}
          </div>
        </div>
      </Motion>
    {/if}

    <!-- ── Empty state ───────────────────────────────────────────────────── -->
    {#if !dropsLoading && filteredDrops.length === 0}
      <Motion let:motion initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div use:motion class="text-center py-16">
          <div
            class="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style="background-color: #E8F5EE"
          >
            <Search class="w-8 h-8" style="color: #006838" />
          </div>
          <p class="text-[1rem]" style="font-weight: 600; color: #1C2B1C">
            {searchQuery || activeFilter !== "All" ? "No matches found" : "No drops tonight"}
          </p>
          <p class="text-[0.875rem] mt-1" style="color: #7A6B5A">
            {searchQuery || activeFilter !== "All"
              ? "Try a different search or filter"
              : "Check back tomorrow for fresh Fresh Boxes!"}
          </p>
        </div>
      </Motion>
    {/if}
  </div>
</div>

<style>
  @keyframes ep-pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.4;
    }
  }
</style>
