<script lang="ts">
  import { Motion } from "svelte-motion";
  import EcoplateLogo from "$lib/components/EcoplateLogo.svelte";
  import {
    Clock,
    MapPin,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Package,
    ChevronRight,
    Star,
    QrCode,
    RefreshCw,
  } from "lucide-svelte";
  import { appStore } from "$lib/stores/app.svelte";
  import { authStore } from "$lib/stores/auth.svelte";
  import * as api from "$lib/api";
  import type { Reservation } from "$lib/types";
  import { onMount } from "svelte";

  type FilterTab = "all" | "active" | "completed" | "cancelled";

  const STATUS_CONFIG: Record<
    string,
    { label: string; color: string; bg: string; icon: "clock" | "check" | "x" | "alert" }
  > = {
    reserved: { label: "Active", color: "#006838", bg: "#E8F5EE", icon: "clock" },
    picked_up: { label: "Picked Up", color: "#006838", bg: "#E8F5EE", icon: "check" },
    cancelled: { label: "Cancelled", color: "#92400E", bg: "#FEF3C7", icon: "x" },
    no_show: { label: "No-Show", color: "#DC2626", bg: "#FEE2E2", icon: "alert" },
  };

  function formatDate(iso: string): string {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;

    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  }

  function formatTime(time: string): string {
    const [h, m] = time.split(":").map(Number);
    const ampm = h >= 12 ? "PM" : "AM";
    const hour = h % 12 || 12;
    return `${hour}:${m.toString().padStart(2, "0")} ${ampm}`;
  }

  let orders = $state<Reservation[]>([]);
  let loading = $state(true);
  let filter = $state<FilterTab>("all");
  let refreshing = $state(false);
  let scrollY = $state(0);
  let scrollEl: HTMLDivElement | undefined = $state();
  let mounted = true;

  onMount(() => {
    void (async () => {
      await authStore.bootstrap();
      await loadOrders();
    })();
    return () => {
      mounted = false;
    };
  });

  function handleScroll() {
    if (scrollEl) scrollY = scrollEl.scrollTop;
  }

  async function loadOrders(showRefresh = false) {
    if (showRefresh) refreshing = true;
    else loading = true;
    try {
      const res = await api.getReservations(authStore.userId);
      if (mounted) {
        orders = res.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }
    } catch (err) {
      console.error("Failed to load order history:", err);
    } finally {
      if (mounted) {
        loading = false;
        refreshing = false;
      }
    }
  }

  let filtered = $derived(
    orders.filter((o) => {
      if (filter === "all") return true;
      if (filter === "active") return o.status === "reserved";
      if (filter === "completed") return o.status === "picked_up";
      if (filter === "cancelled") return o.status === "cancelled" || o.status === "no_show";
      return true;
    })
  );

  let totalSpent = $derived(
    orders
      .filter((o) => o.status === "picked_up")
      .reduce((sum, o) => sum + (o.currentPrice ?? 0), 0)
  );
  let totalPickups = $derived(orders.filter((o) => o.status === "picked_up").length);

  const FILTERS: { id: FilterTab; label: string }[] = [
    { id: "all", label: "All" },
    { id: "active", label: "Active" },
    { id: "completed", label: "Completed" },
    { id: "cancelled", label: "Cancelled" },
  ];

  let headerScrolled = $derived(scrollY > 40);

  function handleViewActivePickup() {
    if (appStore.reservation) {
      appStore.handleViewCode(appStore.reservation.dropId);
    }
  }
</script>

<div class="flex flex-col min-h-screen" style="background-color: #F9F6F1">
  <!-- Header -->
  <div
    class="px-5 pt-14 pb-4 transition-all z-10"
    style="
      background-color: {headerScrolled ? 'rgba(255,255,255,0.82)' : '#F9F6F1'};
      backdrop-filter: {headerScrolled ? 'blur(20px) saturate(1.4)' : 'none'};
      -webkit-backdrop-filter: {headerScrolled ? 'blur(20px) saturate(1.4)' : 'none'};
      border-bottom: {headerScrolled ? '1px solid rgba(0,104,56,0.08)' : '1px solid transparent'};
      box-shadow: {headerScrolled ? '0 2px 16px rgba(0,0,0,0.04)' : 'none'};
      transition-duration: 280ms;
      transition-timing-function: cubic-bezier(0.32,0.72,0,1);
    "
  >
    <div class="flex items-center justify-between mb-4">
      <EcoplateLogo iconSize={36} fontSize="1.5rem" textColor="#006838" />
      <button
        onclick={() => loadOrders(true)}
        class="relative p-2 rounded-full active:scale-[0.97]"
        style="background-color: transparent"
      >
        <RefreshCw
          class="w-5 h-5 {refreshing ? 'animate-spin' : ''}"
          style="color: rgba(26,26,26,0.55); stroke-width: 1.75"
        />
      </button>
    </div>

    <div class="mb-1">
      <h1
        style="font-size: clamp(1.25rem, 5vw, 1.5rem); font-weight: 600; color: #1A1A1A; letter-spacing: -0.02em"
      >
        Order History
      </h1>
      <p style="font-size: 14px; color: rgba(26,26,26,0.55); margin-top: 2px">
        {#if orders.length > 0}
          {orders.length} reservation{orders.length !== 1 ? "s" : ""} total
        {:else}
          Your past and current reservations
        {/if}
      </p>
    </div>
  </div>

  <!-- Summary strip -->
  {#if totalPickups > 0}
    <Motion
      let:motion
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05, duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
    >
      <div
        use:motion
        class="mx-4 rounded-2xl p-3.5 flex items-center justify-around shadow-sm"
        style="background-color: white; border: 1px solid rgba(0,104,56,0.1);"
      >
        <div class="text-center">
          <p style="font-size: 1.1rem; font-weight: 800; color: #006838">{totalPickups}</p>
          <p style="font-size: 0.65rem; color: #7A6B5A; font-weight: 500">Pickups</p>
        </div>
        <div class="w-px h-8" style="background-color: rgba(0,104,56,0.1)"></div>
        <div class="text-center">
          <p style="font-size: 1.1rem; font-weight: 800; color: #006838">
            ${totalSpent.toFixed(0)}
          </p>
          <p style="font-size: 0.65rem; color: #7A6B5A; font-weight: 500">Total Saved</p>
        </div>
        <div class="w-px h-8" style="background-color: rgba(0,104,56,0.1)"></div>
        <div class="text-center">
          <p style="font-size: 1.1rem; font-weight: 800; color: #006838">{orders.length}</p>
          <p style="font-size: 0.65rem; color: #7A6B5A; font-weight: 500">Total Orders</p>
        </div>
      </div>
    </Motion>
  {/if}

  <!-- Active reservation banner -->
  {#if appStore.reservation && appStore.reservation.status === "reserved"}
    <Motion
      let:motion
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
    >
      <button
        use:motion
        onclick={handleViewActivePickup}
        class="mx-4 mt-3 rounded-2xl p-3.5 flex items-center gap-3 active:scale-[0.99] transition-transform"
        style="background-color: #E8F5EE; border: 2px solid #006838;"
      >
        <div
          class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style="background-color: #006838"
        >
          <QrCode class="w-5 h-5 text-white" />
        </div>
        <div class="flex-1 min-w-0 text-left">
          <p style="font-size: 0.85rem; font-weight: 700; color: #006838">Active Pickup</p>
          <p style="font-size: 0.72rem; color: #5A9E78">
            {appStore.reservation.dropLocation} · Code: {appStore.reservation.pickupCode}
          </p>
        </div>
        <ChevronRight class="w-5 h-5 shrink-0" style="color: #006838" />
      </button>
    </Motion>
  {/if}

  <!-- Filter tabs -->
  <Motion
    let:motion
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ delay: 0.1, duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
  >
    <div use:motion class="flex gap-2 px-4 mt-4 mb-3">
      {#each FILTERS as f}
        <button
          onclick={() => (filter = f.id)}
          class="px-3.5 py-1.5 rounded-full transition-all"
          style="
          background-color: {filter === f.id ? '#006838' : 'white'};
          color: {filter === f.id ? 'white' : '#7A6B5A'};
          font-size: 0.73rem;
          font-weight: 600;
          border: 1px solid {filter === f.id ? '#006838' : 'rgba(0,104,56,0.12)'};
        "
        >
          {f.label}
        </button>
      {/each}
    </div>
  </Motion>

  <!-- Orders list -->
  <div class="flex-1 px-4 pb-28 overflow-y-auto" bind:this={scrollEl} onscroll={handleScroll}>
    {#if loading}
      <div class="space-y-3 mt-1">
        {#each [1, 2, 3] as i}
          <div class="rounded-2xl p-4 animate-pulse" style="background-color: white">
            <div class="flex gap-3">
              <div class="w-16 h-16 rounded-xl" style="background-color: #EDE8E1"></div>
              <div class="flex-1 space-y-2">
                <div class="h-4 w-3/4 rounded" style="background-color: #EDE8E1"></div>
                <div class="h-3 w-1/2 rounded" style="background-color: #EDE8E1"></div>
                <div class="h-3 w-1/3 rounded" style="background-color: #EDE8E1"></div>
              </div>
            </div>
          </div>
        {/each}
      </div>
    {:else if filtered.length === 0}
      <Motion
        let:motion
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
      >
        <div use:motion class="flex flex-col items-center justify-center py-16 text-center">
          <div
            class="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style="background-color: #EDE8E1"
          >
            <Package class="w-7 h-7" style="color: #B0A898" />
          </div>
          <p style="font-size: 0.95rem; font-weight: 700; color: #1C2B1C; margin-bottom: 4px">
            {filter === "all" ? "No orders yet" : `No ${filter} orders`}
          </p>
          <p style="font-size: 0.78rem; color: #7A6B5A">
            {filter === "all"
              ? "Reserve a Fresh Box from the Home tab to get started."
              : "Try switching to a different filter."}
          </p>
        </div>
      </Motion>
    {:else}
      <div>
        <div class="space-y-3">
          {#each filtered as order, idx}
            {@const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.reserved}
            <Motion
              let:motion
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04, duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
            >
              <div
                use:motion
                class="rounded-2xl p-4 shadow-sm"
                style="
                background-color: white;
                border: 1px solid {order.status === 'reserved' ? '#006838' : 'rgba(0,104,56,0.08)'};
              "
              >
                <div class="flex gap-3">
                  <!-- Image -->
                  <div
                    class="w-16 h-16 rounded-xl bg-cover bg-center shrink-0"
                    style="
                    background-image: {order.dropImageUrl ? `url(${order.dropImageUrl})` : 'none'};
                    background-color: {order.dropImageUrl ? 'transparent' : '#EDE8E1'};
                  "
                  ></div>

                  <!-- Info -->
                  <div class="flex-1 min-w-0">
                    <div class="flex items-start justify-between gap-2">
                      <p
                        class="truncate"
                        style="font-size: 0.88rem; font-weight: 700; color: #1C2B1C"
                      >
                        {order.dropLocation}
                      </p>
                      <!-- Status badge -->
                      <span
                        class="flex items-center gap-1 px-2 py-0.5 rounded-full shrink-0"
                        style="
                        background-color: {cfg.bg};
                        color: {cfg.color};
                        font-size: 0.6rem;
                        font-weight: 700;
                      "
                      >
                        {#if cfg.icon === "clock"}
                          <Clock class="w-3.5 h-3.5" />
                        {:else if cfg.icon === "check"}
                          <CheckCircle2 class="w-3.5 h-3.5" />
                        {:else if cfg.icon === "x"}
                          <XCircle class="w-3.5 h-3.5" />
                        {:else}
                          <AlertTriangle class="w-3.5 h-3.5" />
                        {/if}
                        {cfg.label}
                      </span>
                    </div>

                    <div class="flex items-center gap-1.5 mt-1">
                      <MapPin class="w-3 h-3 shrink-0" style="color: #B0A898" />
                      <p class="truncate" style="font-size: 0.72rem; color: #7A6B5A">
                        {order.dropLocationDetail}
                      </p>
                    </div>

                    <div class="flex items-center gap-3 mt-1.5">
                      <div class="flex items-center gap-1">
                        <Clock class="w-3 h-3 shrink-0" style="color: #B0A898" />
                        <span style="font-size: 0.68rem; color: #7A6B5A">
                          {formatTime(order.dropWindowStart ?? "")} &ndash; {formatTime(
                            order.dropWindowEnd ?? ""
                          )}
                        </span>
                      </div>
                      <span style="font-size: 0.68rem; color: #B0A898">
                        {formatDate(order.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>

                <!-- Bottom row: price + rating + code -->
                <div
                  class="flex items-center justify-between mt-3 pt-2.5"
                  style="border-top: 1px solid rgba(0,104,56,0.06)"
                >
                  <div class="flex items-center gap-3">
                    <span style="font-size: 0.82rem; font-weight: 800; color: #006838">
                      ${(order.currentPrice ?? 0).toFixed(2)}
                    </span>
                    <span
                      class="px-1.5 py-0.5 rounded-md"
                      style="font-size: 0.6rem; font-weight: 600; background-color: #F5F1EB; color: #7A6B5A"
                    >
                      {order.paymentMethod === "credit"
                        ? "Credit"
                        : order.paymentMethod === "card"
                          ? "Card"
                          : "Pay at Pickup"}
                    </span>
                  </div>

                  <div class="flex items-center gap-2">
                    {#if order.rating}
                      <div class="flex items-center gap-0.5">
                        <Star class="w-3 h-3" style="color: #F59E0B; fill: #F59E0B" />
                        <span style="font-size: 0.68rem; font-weight: 600; color: #7A6B5A">
                          {order.rating}
                        </span>
                      </div>
                    {/if}
                    {#if order.status === "reserved"}
                      <span
                        class="font-mono"
                        style="font-size: 0.72rem; font-weight: 700; color: #006838; letter-spacing: 0.1em"
                      >
                        {order.pickupCode}
                      </span>
                    {/if}
                  </div>
                </div>
              </div>
            </Motion>
          {/each}
        </div>
      </div>
    {/if}
  </div>
</div>
