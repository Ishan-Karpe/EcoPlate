<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { Motion } from "svelte-motion";
  import {
    ArrowLeft,
    UserX,
    AlertTriangle,
    RotateCcw,
    Gift,
    Shield,
    RefreshCw,
  } from "lucide-svelte";
  import { adminStore } from "$lib/stores/admin.svelte";

  let pendingId = $state<string | null>(null);

  let noShows = $derived(adminStore.noShows);
  let loading = $derived(adminStore.noShowsLoading);

  let markedCount = $derived(noShows.filter((n) => n.alreadyMarked).length);
  let releasedCount = $derived(noShows.filter((n) => n.boxStatus === "released").length);
  let repeatCount = $derived(noShows.filter((n) => n.repeatOffender).length);

  onMount(async () => {
    await adminStore.loadNoShows();
  });

  async function handleMark(reservationId: string, boxStatus: "released" | "donated" | "disposed") {
    pendingId = reservationId;
    await adminStore.handleMarkNoShow(reservationId, boxStatus);
    pendingId = null;
  }
</script>

<div class="min-h-screen flex flex-col" style="background-color: #F9F6F1;">
  <div class="px-5 pt-12 pb-4">
    <button
      onclick={() => goto("/admin")}
      class="flex items-center gap-1 mb-4"
      style="color: #7A6B5A; font-size: 0.875rem;"
    >
      <ArrowLeft class="w-4 h-4" />
      Dashboard
    </button>
    <h1 style="font-size: 1.5rem; font-weight: 700; color: #1C2B1C;">No-show Management</h1>
    <p class="mt-1" style="font-size: 0.875rem; color: #7A6B5A;">
      Track unclaimed reservations and apply policies
    </p>
  </div>

  <div class="flex-1 px-5 space-y-4 overflow-y-auto pb-8">
    <Motion let:motion initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div use:motion class="rounded-xl p-4 space-y-3" style="background-color: #F0EBE3;">
        <div class="flex items-center gap-2">
          <Shield class="w-4 h-4" style="color: #8B6F47;" />
          <span style="font-size: 0.8rem; font-weight: 600; color: #4A3728;">No-show Policy</span>
        </div>
        <div class="space-y-2" style="font-size: 0.75rem; color: #7A6B5A;">
          {#each ["Reservation held until pickup window ends", "If not picked up: marked as no-show", "Repeat no-shows (3+): lose early access privileges", "Credit returned only if cancelled before window starts", "Unclaimed boxes: released to app or directed to donation/disposal"] as rule, i}
            <div class="flex items-start gap-2">
              <span style="color: #006838; margin-top: 1px;">{i + 1}.</span>
              <p>{rule}</p>
            </div>
          {/each}
        </div>
      </div>
    </Motion>

    <Motion
      let:motion
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 }}
    >
      <div use:motion class="grid grid-cols-3 gap-2">
        <div
          class="rounded-xl p-3 text-center shadow-sm"
          style="background-color: white; border: 1px solid rgba(0,104,56,0.1);"
        >
          <p style="font-size: 1.25rem; font-weight: 800; color: #C0392B;">
            {loading ? "-" : noShows.length}
          </p>
          <p style="font-size: 0.65rem; color: #7A6B5A;">No-shows tonight</p>
        </div>
        <div
          class="rounded-xl p-3 text-center shadow-sm"
          style="background-color: white; border: 1px solid rgba(0,104,56,0.1);"
        >
          <p style="font-size: 1.25rem; font-weight: 800; color: #006838;">
            {loading ? "-" : releasedCount}
          </p>
          <p style="font-size: 0.65rem; color: #7A6B5A;">Boxes released</p>
        </div>
        <div
          class="rounded-xl p-3 text-center shadow-sm"
          style="background-color: white; border: 1px solid rgba(0,104,56,0.1);"
        >
          <p style="font-size: 1.25rem; font-weight: 800; color: #D97706;">
            {loading ? "-" : repeatCount}
          </p>
          <p style="font-size: 0.65rem; color: #7A6B5A;">Repeat offenders</p>
        </div>
      </div>
    </Motion>

    <Motion
      let:motion
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <div use:motion>
        <div class="flex items-center justify-between mb-2">
          <p style="font-size: 0.8rem; font-weight: 600; color: #7A6B5A;">Tonight's No-shows</p>
          <span style="font-size: 0.7rem; color: #7A6B5A;">{markedCount} marked</span>
        </div>

        {#if loading}
          <div
            class="rounded-xl p-8 flex items-center justify-center gap-2"
            style="background-color: white; border: 1px solid rgba(0,104,56,0.1);"
          >
            <RefreshCw class="w-4 h-4 animate-spin" style="color: #006838;" />
            <p style="font-size: 0.875rem; color: #7A6B5A;">Loading no-shows...</p>
          </div>
        {:else if noShows.length === 0}
          <div
            class="rounded-xl p-8 text-center"
            style="background-color: white; border: 1px solid rgba(0,104,56,0.1);"
          >
            <UserX class="w-10 h-10 mx-auto mb-3" style="color: rgba(0,104,56,0.25);" />
            <p style="font-size: 0.875rem; font-weight: 600; color: #4A6B4A;">
              No no-shows right now
            </p>
            <p class="mt-1" style="font-size: 0.78rem; color: #7A6B5A;">
              Reservations with ended windows and unclaimed boxes appear here.
            </p>
          </div>
        {:else}
          <div class="space-y-3">
            {#each noShows as noShow (noShow.reservationId)}
              <Motion let:motion initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <div
                  use:motion
                  class="rounded-xl p-3.5 shadow-sm"
                  style="background-color: white; border: 1px solid rgba(0,104,56,0.1);"
                >
                  <div class="flex items-center justify-between mb-2">
                    <div class="flex items-center gap-2">
                      <span
                        style="
                          font-family: monospace;
                          font-weight: 700;
                          font-size: 0.9rem;
                          color: #1C2B1C;
                          letter-spacing: 0.05em;
                        "
                      >
                        {noShow.code}
                      </span>
                      {#if noShow.repeatOffender}
                        <span
                          class="px-1.5 py-0.5 rounded-full flex items-center gap-0.5"
                          style="
                            background-color: #FEE2E2;
                            color: #C0392B;
                            font-size: 0.6rem;
                            font-weight: 600;
                          "
                        >
                          <AlertTriangle class="w-2.5 h-2.5" />
                          Repeat
                        </span>
                      {/if}
                    </div>
                    <span style="font-size: 0.75rem; color: #7A6B5A;">{noShow.time}</span>
                  </div>

                  <p style="font-size: 0.75rem; color: #7A6B5A; margin-bottom: 10px;">
                    {noShow.location}
                  </p>

                  {#if noShow.alreadyMarked && noShow.boxStatus}
                    <span
                      class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full"
                      style="
                        background-color: {noShow.boxStatus === 'released'
                        ? '#E8F5EE'
                        : noShow.boxStatus === 'donated'
                          ? '#EFF6FF'
                          : '#F5F1EB'};
                        color: {noShow.boxStatus === 'released'
                        ? '#006838'
                        : noShow.boxStatus === 'donated'
                          ? '#2563EB'
                          : '#7A6B5A'};
                        font-size: 0.7rem;
                        font-weight: 500;
                      "
                    >
                      {#if noShow.boxStatus === "released"}
                        <RotateCcw class="w-3 h-3" /> Released to app
                      {:else if noShow.boxStatus === "donated"}
                        <Gift class="w-3 h-3" /> Sent to Maize & Blue Cupboard
                      {:else}
                        <UserX class="w-3 h-3" /> Disposed
                      {/if}
                    </span>
                  {:else}
                    <div class="flex gap-2">
                      <button
                        onclick={() => handleMark(noShow.reservationId, "released")}
                        disabled={pendingId === noShow.reservationId}
                        class="flex-1 py-2 rounded-lg flex items-center justify-center gap-1 active:scale-[0.97] transition-all"
                        style="
                          background-color: #E8F5EE;
                          color: #006838;
                          font-size: 0.72rem;
                          font-weight: 600;
                          opacity: {pendingId === noShow.reservationId ? 0.6 : 1};
                        "
                      >
                        <RotateCcw class="w-3 h-3" />
                        Release
                      </button>
                      <button
                        onclick={() => handleMark(noShow.reservationId, "donated")}
                        disabled={pendingId === noShow.reservationId}
                        class="flex-1 py-2 rounded-lg flex items-center justify-center gap-1 active:scale-[0.97] transition-all"
                        style="
                          background-color: #EFF6FF;
                          color: #2563EB;
                          font-size: 0.72rem;
                          font-weight: 600;
                          opacity: {pendingId === noShow.reservationId ? 0.6 : 1};
                        "
                      >
                        <Gift class="w-3 h-3" />
                        Donate
                      </button>
                      <button
                        onclick={() => handleMark(noShow.reservationId, "disposed")}
                        disabled={pendingId === noShow.reservationId}
                        class="flex-1 py-2 rounded-lg flex items-center justify-center gap-1 active:scale-[0.97] transition-all"
                        style="
                          background-color: #F5F1EB;
                          color: #7A6B5A;
                          font-size: 0.72rem;
                          font-weight: 600;
                          opacity: {pendingId === noShow.reservationId ? 0.6 : 1};
                        "
                      >
                        <UserX class="w-3 h-3" />
                        Dispose
                      </button>
                    </div>
                  {/if}
                </div>
              </Motion>
            {/each}
          </div>
        {/if}
      </div>
    </Motion>

    <Motion
      let:motion
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <div
        use:motion
        class="rounded-xl p-4"
        style="background-color: #E8F5EE; border: 1px solid rgba(0,104,56,0.2);"
      >
        <p style="font-size: 0.8rem; font-weight: 600; color: #004D28; margin-bottom: 6px;">
          Unclaimed Box Handling
        </p>
        <p style="font-size: 0.75rem; color: #006838;">
          Unclaimed boxes can be released back to the app while the window is active. After the
          window closes, route remaining boxes to the Maize & Blue Cupboard food pantry (via the
          Food Recovery Network) or responsible disposal.
        </p>
      </div>
    </Motion>
  </div>
</div>
