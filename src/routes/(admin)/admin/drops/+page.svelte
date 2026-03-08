<script lang="ts">
  import { onMount } from "svelte";
  import { Motion } from "svelte-motion";
  import { goto } from "$app/navigation";
  import { appStore } from "$lib/stores/app.svelte";
  import { adminStore } from "$lib/stores/admin.svelte";
  import { formatTime } from "$lib/utils";
  import ImageWithFallback from "$lib/components/ImageWithFallback.svelte";
  import LoadingSpinner from "$lib/components/LoadingSpinner.svelte";
  import {
    ArrowLeft,
    Pencil,
    Trash2,
    Clock,
    Package,
    AlertTriangle,
    CheckCircle2,
  } from "lucide-svelte";

  let deleteConfirm = $state<string | null>(null);
  let deleting = $state(false);
  let deletedId = $state<string | null>(null);

  let drops = $derived(appStore.drops);
  let activeDrops = $derived(drops.filter((d) => d.status === "active" || d.status === "upcoming"));
  let endedDrops = $derived(drops.filter((d) => d.status === "ended"));

  onMount(async () => {
    await appStore.loadDrops();
  });

  async function openEdit(dropId: string) {
    await goto(`/admin/drops/${dropId}/edit`);
  }

  async function handleDelete(dropId: string) {
    deleting = true;
    try {
      await adminStore.handleDeleteDrop(dropId);
      await appStore.loadDrops();
      deletedId = dropId;
      setTimeout(() => {
        deleteConfirm = null;
        deletedId = null;
      }, 1200);
    } finally {
      deleting = false;
    }
  }
</script>

<div class="min-h-screen flex flex-col" style="background-color: #F9F6F1;">
  <div class="px-5 pt-12 pb-5 rounded-b-[2rem] shadow-sm" style="background-color: #006838;">
    <a
      href="/admin"
      class="flex items-center gap-1 mb-4 active:opacity-80"
      style="font-size: 0.875rem; color: rgba(255,255,255,0.7);"
    >
      <ArrowLeft class="w-4 h-4" />
      Dashboard
    </a>
    <h1 style="font-size: 1.375rem; font-weight: 600; color: white;">Manage Drops</h1>
    <p style="font-size: 0.875rem; color: rgba(255,255,255,0.7); margin-top: 4px;">
      {drops.length} total drop{drops.length !== 1 ? "s" : ""}{activeDrops.length > 0
        ? ` / ${activeDrops.length} active`
        : ""}
    </p>
  </div>

  <div class="flex-1 px-4 py-5 space-y-5 overflow-y-auto pb-10">
    {#if activeDrops.length > 0}
      <div>
        <p style="font-size: 0.78rem; font-weight: 600; color: #7A6B5A; margin-bottom: 8px;">
          Active / Upcoming
        </p>
        <div class="space-y-3">
          {#each activeDrops as drop, i (drop.id)}
            <Motion
              let:motion
              initial={{ opacity: 0, y: 12 }}
              animate={{
                opacity: deletedId === drop.id ? 0 : 1,
                y: deletedId === drop.id ? -10 : 0,
                scale: deletedId === drop.id ? 0.95 : 1,
              }}
              transition={{ duration: 0.28, delay: i * 0.04, ease: [0.32, 0.72, 0, 1] }}
            >
              <div
                use:motion
                class="rounded-xl overflow-hidden shadow-sm"
                style="background-color: white; border: 1px solid rgba(0,104,56,0.1);"
              >
                <div class="flex">
                  {#if drop.imageUrl}
                    <div class="w-20 shrink-0 overflow-hidden">
                      <ImageWithFallback
                        src={drop.imageUrl}
                        alt={drop.location}
                        class="w-full h-full object-cover"
                      />
                    </div>
                  {/if}
                  <div class="flex-1 p-3 min-w-0">
                    <div class="flex items-start justify-between gap-2">
                      <div class="min-w-0">
                        <div class="flex items-center gap-2">
                          <p
                            class="truncate"
                            style="font-size: 0.875rem; font-weight: 700; color: #1C2B1C;"
                          >
                            {drop.location}
                          </p>
                          <span
                            class="px-1.5 py-0.5 rounded-full shrink-0"
                            style="font-size: 0.6rem; font-weight: 700; background-color: {drop.status ===
                            'active'
                              ? '#E8F5EE'
                              : '#FEF3C7'}; color: {drop.status === 'active'
                              ? '#006838'
                              : '#92400E'};"
                          >
                            {drop.status === "active" ? "LIVE" : "SOON"}
                          </span>
                        </div>
                        {#if drop.description}
                          <p
                            class="truncate"
                            style="font-size: 0.72rem; color: #7A6B5A; max-width: 100%;"
                          >
                            {drop.description}
                          </p>
                        {/if}
                      </div>
                    </div>

                    <div class="flex items-center gap-3 mt-2">
                      <div class="flex items-center gap-1">
                        <Clock class="w-3 h-3" style="color: #7A6B5A;" />
                        <span style="font-size: 0.68rem; color: #7A6B5A;"
                          >{formatTime(drop.windowStart)} - {formatTime(drop.windowEnd)}</span
                        >
                      </div>
                      <div class="flex items-center gap-1">
                        <Package class="w-3 h-3" style="color: #7A6B5A;" />
                        <span style="font-size: 0.68rem; color: #7A6B5A;"
                          >{drop.remainingBoxes}/{drop.totalBoxes}</span
                        >
                      </div>
                      {#if drop.totalBoxes - drop.remainingBoxes > 0}
                        <span style="font-size: 0.68rem; color: #006838; font-weight: 600;">
                          {drop.totalBoxes - drop.remainingBoxes} reserved
                        </span>
                      {/if}
                    </div>

                    <div class="flex items-center gap-2 mt-2.5">
                      <button
                        onclick={() => openEdit(drop.id)}
                        class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg active:scale-[0.96] transition-transform"
                        style="background-color: #E8F5EE; color: #006838; font-size: 0.72rem; font-weight: 600;"
                      >
                        <Pencil class="w-3 h-3" />
                        Edit
                      </button>
                      <button
                        onclick={() => (deleteConfirm = drop.id)}
                        class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg active:scale-[0.96] transition-transform"
                        style="background-color: #FEE2E2; color: #C0392B; font-size: 0.72rem; font-weight: 600;"
                      >
                        <Trash2 class="w-3 h-3" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </Motion>
          {/each}
        </div>
      </div>
    {/if}

    {#if endedDrops.length > 0}
      <div>
        <p style="font-size: 0.78rem; font-weight: 600; color: #7A6B5A; margin-bottom: 8px;">
          Ended
        </p>
        <div class="space-y-3">
          {#each endedDrops as drop, i (drop.id)}
            <Motion
              let:motion
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, delay: i * 0.04, ease: [0.32, 0.72, 0, 1] }}
            >
              <div
                use:motion
                class="rounded-xl overflow-hidden shadow-sm"
                style="background-color: white; border: 1px solid rgba(0,0,0,0.06); opacity: 0.7;"
              >
                <div class="flex">
                  {#if drop.imageUrl}
                    <div class="w-20 shrink-0 overflow-hidden">
                      <ImageWithFallback
                        src={drop.imageUrl}
                        alt={drop.location}
                        class="w-full h-full object-cover"
                      />
                    </div>
                  {/if}
                  <div class="flex-1 p-3 min-w-0">
                    <div class="flex items-start justify-between gap-2">
                      <div class="min-w-0">
                        <div class="flex items-center gap-2">
                          <p
                            class="truncate"
                            style="font-size: 0.875rem; font-weight: 700; color: #1C2B1C;"
                          >
                            {drop.location}
                          </p>
                          <span
                            class="px-1.5 py-0.5 rounded-full shrink-0"
                            style="font-size: 0.6rem; font-weight: 700; background-color: #F5F1EB; color: #7A6B5A;"
                            >ENDED</span
                          >
                        </div>
                        {#if drop.description}
                          <p
                            class="truncate"
                            style="font-size: 0.72rem; color: #7A6B5A; max-width: 100%;"
                          >
                            {drop.description}
                          </p>
                        {/if}
                      </div>
                    </div>

                    <div class="flex items-center gap-3 mt-2">
                      <div class="flex items-center gap-1">
                        <Clock class="w-3 h-3" style="color: #7A6B5A;" />
                        <span style="font-size: 0.68rem; color: #7A6B5A;"
                          >{formatTime(drop.windowStart)} - {formatTime(drop.windowEnd)}</span
                        >
                      </div>
                      <div class="flex items-center gap-1">
                        <Package class="w-3 h-3" style="color: #7A6B5A;" />
                        <span style="font-size: 0.68rem; color: #7A6B5A;"
                          >{drop.remainingBoxes}/{drop.totalBoxes}</span
                        >
                      </div>
                    </div>

                    <div class="flex items-center gap-2 mt-2.5">
                      <button
                        onclick={() => openEdit(drop.id)}
                        class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg active:scale-[0.96] transition-transform"
                        style="background-color: #E8F5EE; color: #006838; font-size: 0.72rem; font-weight: 600;"
                      >
                        <Pencil class="w-3 h-3" />
                        Edit
                      </button>
                      <button
                        onclick={() => (deleteConfirm = drop.id)}
                        class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg active:scale-[0.96] transition-transform"
                        style="background-color: #FEE2E2; color: #C0392B; font-size: 0.72rem; font-weight: 600;"
                      >
                        <Trash2 class="w-3 h-3" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </Motion>
          {/each}
        </div>
      </div>
    {/if}

    {#if drops.length === 0}
      <Motion let:motion initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div use:motion class="flex flex-col items-center justify-center py-20 text-center">
          <div
            class="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
            style="background-color: #E8F5EE;"
          >
            <Package class="w-8 h-8" style="color: #006838; opacity: 0.6;" />
          </div>
          <p style="font-size: 0.9375rem; font-weight: 500; color: #7A6B5A;">
            No drops created yet
          </p>
          <p class="mt-1" style="font-size: 0.8rem; color: #B0A898;">
            Create a drop from the dashboard to get started.
          </p>
        </div>
      </Motion>
    {/if}
  </div>

  {#if deleteConfirm}
    <div
      class="fixed inset-0 z-50 flex items-center justify-center px-6"
      style="background-color: rgba(0,0,0,0.5);"
      role="button"
      tabindex="0"
      aria-label="Close delete confirmation"
      onclick={(e) => {
        if (e.target === e.currentTarget && !deleting) deleteConfirm = null;
      }}
      onkeydown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && !deleting) deleteConfirm = null;
      }}
    >
      <Motion
        let:motion
        initial={{ scale: 0.92, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
      >
        <div
          use:motion
          class="w-full max-w-sm rounded-2xl p-6 shadow-xl"
          style="background-color: white;"
        >
          {#if deletedId}
            <div class="text-center py-4">
              <CheckCircle2 class="w-12 h-12 mx-auto mb-3" style="color: #006838;" />
              <p style="font-size: 1rem; font-weight: 700; color: #1C2B1C;">Drop deleted</p>
              <p class="mt-1" style="font-size: 0.8rem; color: #7A6B5A;">
                All active reservations have been cancelled.
              </p>
            </div>
          {:else}
            <div class="flex items-start gap-3 mb-5">
              <div
                class="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                style="background-color: #FEE2E2;"
              >
                <AlertTriangle class="w-5 h-5" style="color: #C0392B;" />
              </div>
              <div>
                <p style="font-size: 1rem; font-weight: 700; color: #1C2B1C;">Delete this drop?</p>
                <p class="mt-1" style="font-size: 0.8rem; color: #7A6B5A; line-height: 1.5;">
                  This will permanently remove the drop and cancel all active reservations.
                </p>
              </div>
            </div>

            <div class="flex gap-3">
              <button
                onclick={() => (deleteConfirm = null)}
                disabled={deleting}
                class="flex-1 py-3 rounded-xl active:scale-[0.97] transition-transform"
                style="background-color: #F5F1EB; color: #4A3728; font-size: 0.875rem; font-weight: 600;"
              >
                Cancel
              </button>
              <button
                onclick={() => {
                  if (deleteConfirm) {
                    void handleDelete(deleteConfirm);
                  }
                }}
                disabled={deleting}
                class="flex-1 py-3 rounded-xl flex items-center justify-center gap-2 active:scale-[0.97] transition-transform"
                style="background-color: #C0392B; color: white; font-size: 0.875rem; font-weight: 700; opacity: {deleting
                  ? 0.7
                  : 1};"
              >
                {#if deleting}
                  <LoadingSpinner
                    size={16}
                    borderWidth={2}
                    color="#ffffff"
                    trackColor="rgba(255,255,255,0.3)"
                  />
                  Deleting...
                {:else}
                  <Trash2 class="w-4 h-4" />
                  Delete Drop
                {/if}
              </button>
            </div>
          {/if}
        </div>
      </Motion>
    </div>
  {/if}
</div>
