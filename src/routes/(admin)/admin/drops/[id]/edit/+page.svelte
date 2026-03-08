<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/state";
  import { goto } from "$app/navigation";
  import { Motion } from "svelte-motion";
  import {
    ArrowLeft,
    CheckCircle2,
    MapPin,
    FileText,
    Package,
    Clock,
    DollarSign,
    AlertCircle,
  } from "lucide-svelte";
  import { appStore } from "$lib/stores/app.svelte";
  import { adminStore } from "$lib/stores/admin.svelte";
  import type { Drop } from "$lib/types";
  import ImageWithFallback from "$lib/components/ImageWithFallback.svelte";
  import LoadingSpinner from "$lib/components/LoadingSpinner.svelte";

  const dropId = $derived(page.params.id);
  let drop = $derived(appStore.drops.find((d) => d.id === dropId) ?? null);

  let initializedId = $state<string | null>(null);
  let description = $state("");
  let boxes = $state("");
  let windowStart = $state("");
  let windowEnd = $state("");
  let priceMin = $state("");
  let priceMax = $state("");
  let status = $state<"active" | "upcoming" | "ended">("upcoming");
  let saving = $state(false);
  let saved = $state(false);
  let errors = $state<{
    boxes?: string;
    time?: string;
    priceMin?: string;
    priceMax?: string;
  }>({});

  let reserved = $derived(drop ? drop.totalBoxes - drop.remainingBoxes : 0);

  $effect(() => {
    if (!drop) return;
    if (initializedId === drop.id) return;
    initializedId = drop.id;
    description = drop.description;
    boxes = String(drop.totalBoxes);
    windowStart = drop.windowStart;
    windowEnd = drop.windowEnd;
    priceMin = String(drop.priceMin);
    priceMax = String(drop.priceMax);
    status = drop.status;
  });

  onMount(async () => {
    if (appStore.drops.length === 0) {
      await appStore.loadDrops();
    }
  });

  async function back() {
    await goto("/admin/drops");
  }

  function validate() {
    const nextErrors: typeof errors = {};
    const boxCount = parseInt(boxes, 10);

    if (!boxes.trim() || isNaN(boxCount) || boxCount < 1) {
      nextErrors.boxes = "Enter at least 1 box";
    } else if (boxCount < reserved) {
      nextErrors.boxes = `Cannot be less than ${reserved} (already reserved)`;
    }

    if (!windowStart || !windowEnd) {
      nextErrors.time = "Both start and end times are required";
    } else if (windowStart >= windowEnd) {
      nextErrors.time = "End time must be after start time";
    }

    const min = parseFloat(priceMin);
    const max = parseFloat(priceMax);

    if (!priceMin.trim() || isNaN(min) || min < 1) {
      nextErrors.priceMin = "Minimum price must be at least $1";
    } else if (min > 10) {
      nextErrors.priceMin = "Maximum allowed price is $10";
    }

    if (!priceMax.trim() || isNaN(max) || max < 1) {
      nextErrors.priceMax = "Maximum price must be at least $1";
    } else if (max > 10) {
      nextErrors.priceMax = "Maximum allowed price is $10";
    } else if (!isNaN(min) && max < min) {
      nextErrors.priceMax = "Max must be greater than or equal to min price";
    }

    errors = nextErrors;
    return Object.keys(nextErrors).length === 0;
  }

  async function save() {
    if (!drop || saving) return;
    if (!validate()) return;

    saving = true;
    const newTotal = parseInt(boxes, 10) || drop.totalBoxes;
    const boxDiff = newTotal - drop.totalBoxes;

    const updates: Partial<Drop> = {
      description,
      totalBoxes: newTotal,
      remainingBoxes: Math.max(0, drop.remainingBoxes + boxDiff),
      windowStart,
      windowEnd,
      priceMin: parseFloat(priceMin) || drop.priceMin,
      priceMax: parseFloat(priceMax) || drop.priceMax,
      status,
    };

    try {
      await adminStore.handleSaveDropEdits(drop.id, updates);
      await appStore.loadDrops();
      saved = true;
      setTimeout(() => {
        void goto("/admin/drops");
      }, 1200);
    } finally {
      saving = false;
    }
  }
</script>

{#if saved}
  <div
    class="min-h-screen flex flex-col items-center justify-center px-5"
    style="background-color: #F9F6F1;"
  >
    <div class="text-center">
      <CheckCircle2 class="w-10 h-10 mx-auto mb-4" style="color: #006838;" />
      <h2 style="font-size: 1.375rem; font-weight: 700; color: #1C2B1C;">Drop updated!</h2>
      <p class="mt-2" style="font-size: 0.875rem; color: #7A6B5A;">Changes saved.</p>
    </div>
  </div>
{:else if drop}
  <div class="min-h-screen flex flex-col" style="background-color: #F9F6F1;">
    <div class="px-5 pt-12 pb-4">
      <button
        onclick={back}
        class="flex items-center gap-1 mb-4"
        style="color: #7A6B5A; font-size: 0.875rem;"
      >
        <ArrowLeft class="w-4 h-4" />
        Manage Drops
      </button>
      <h1 style="font-size: 1.5rem; font-weight: 700; color: #1C2B1C;">Edit Drop</h1>
      <p class="mt-1" style="font-size: 0.875rem; color: #7A6B5A;">{drop.location} - {drop.date}</p>
    </div>

    <div class="flex-1 px-5 space-y-3 overflow-y-auto pb-4">
      {#if drop.imageUrl}
        <Motion let:motion initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div use:motion class="rounded-xl overflow-hidden shadow-sm" style="height: 120px;">
            <ImageWithFallback
              src={drop.imageUrl}
              alt={drop.location}
              class="w-full h-full object-cover"
            />
          </div>
        </Motion>
      {/if}

      <Motion
        let:motion
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.02 }}
      >
        <div
          use:motion
          class="rounded-xl p-4 shadow-sm"
          style="background-color: white; border: 1px solid rgba(0,104,56,0.1);"
        >
          <label class="flex items-center gap-2 mb-2" style="font-size: 0.8rem; color: #7A6B5A;"
            ><MapPin class="w-3.5 h-3.5" />Location</label
          >
          <div
            class="py-2.5 px-4 rounded-xl"
            style="background-color: #F5F1EB; font-size: 0.875rem; font-weight: 600; color: #4A3728;"
          >
            {drop.location}
            <span class="ml-2" style="font-size: 0.72rem; color: #7A6B5A; font-weight: 400;"
              >(cannot be changed)</span
            >
          </div>
        </div>
      </Motion>

      <Motion
        let:motion
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.04 }}
      >
        <div
          use:motion
          class="rounded-xl p-4 shadow-sm"
          style="background-color: white; border: 1px solid rgba(0,104,56,0.1);"
        >
          <p class="flex items-center gap-2 mb-2" style="font-size: 0.8rem; color: #7A6B5A;">
            Status
          </p>
          <div class="grid grid-cols-3 gap-2">
            {#each ["active", "upcoming", "ended"] as const as s}
              <button
                onclick={() => (status = s)}
                class="py-2.5 rounded-xl transition-all active:scale-[0.97]"
                style="background-color: {status === s
                  ? s === 'active'
                    ? '#006838'
                    : s === 'upcoming'
                      ? '#D97706'
                      : '#7A6B5A'
                  : '#F5F1EB'}; color: {status === s
                  ? 'white'
                  : '#4A3728'}; font-size: 0.8rem; font-weight: 600;"
              >
                {s === "active" ? "Active" : s === "upcoming" ? "Upcoming" : "Ended"}
              </button>
            {/each}
          </div>
        </div>
      </Motion>

      <Motion
        let:motion
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.06 }}
      >
        <div
          use:motion
          class="rounded-xl p-4 shadow-sm"
          style="background-color: white; border: 1px solid rgba(0,104,56,0.1);"
        >
          <label class="flex items-center gap-2 mb-2" style="font-size: 0.8rem; color: #7A6B5A;"
            ><FileText class="w-3.5 h-3.5" />Description</label
          >
          <textarea
            value={description}
            oninput={(e) => (description = (e.currentTarget as HTMLTextAreaElement).value)}
            rows={3}
            class="w-full rounded-xl px-4 py-3 outline-none resize-none"
            style="background-color: #F5F1EB; font-size: 0.875rem; color: #1C2B1C; border: none; line-height: 1.5;"
            placeholder="Describe tonight's Rescue Box contents..."
          ></textarea>
        </div>
      </Motion>

      <Motion
        let:motion
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
      >
        <div
          use:motion
          class="rounded-xl p-4 shadow-sm"
          style="background-color: white; border: 1px solid {errors.boxes
            ? '#FECACA'
            : 'rgba(0,104,56,0.1)'};"
        >
          <label
            class="flex items-center gap-2 mb-2"
            style="font-size: 0.8rem; color: {errors.boxes ? '#C0392B' : '#7A6B5A'};"
            ><Package class="w-3.5 h-3.5" />Total Rescue Boxes</label
          >
          <div class="flex items-center gap-3">
            <button
              onclick={() => {
                const current = parseInt(boxes, 10) || 1;
                boxes = String(Math.max(reserved, current - 5));
                errors = { ...errors, boxes: undefined };
              }}
              class="w-10 h-10 rounded-lg text-[1.25rem] active:scale-[0.9] transition-transform"
              style="background-color: #F5F1EB; color: #4A3728;"
              >-
            </button>
            <input
              type="number"
              value={boxes}
              oninput={(e) => {
                boxes = (e.currentTarget as HTMLInputElement).value;
                errors = { ...errors, boxes: undefined };
              }}
              class="flex-1 text-center rounded-lg px-3 py-2.5 outline-none"
              style="background-color: #F5F1EB; font-size: 1.25rem; font-weight: 700; color: #1C2B1C;"
            />
            <button
              onclick={() => {
                const current = parseInt(boxes, 10) || 0;
                boxes = String(current + 5);
                errors = { ...errors, boxes: undefined };
              }}
              class="w-10 h-10 rounded-lg text-[1.25rem] active:scale-[0.9] transition-transform"
              style="background-color: #F5F1EB; color: #4A3728;"
              >+
            </button>
          </div>
          {#if reserved > 0}
            <p class="mt-2" style="font-size: 0.7rem; color: #D97706;">
              {reserved} already reserved (minimum total)
            </p>
          {/if}
          {#if errors.boxes}
            <div class="flex items-center gap-1.5 mt-2">
              <AlertCircle class="w-3.5 h-3.5 shrink-0" style="color: #C0392B;" />
              <p style="font-size: 0.72rem; color: #C0392B;">{errors.boxes}</p>
            </div>
          {/if}
        </div>
      </Motion>

      <Motion
        let:motion
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div
          use:motion
          class="rounded-xl p-4 shadow-sm"
          style="background-color: white; border: 1px solid {errors.time
            ? '#FECACA'
            : 'rgba(0,104,56,0.1)'};"
        >
          <label
            class="flex items-center gap-2 mb-2"
            style="font-size: 0.8rem; color: {errors.time ? '#C0392B' : '#7A6B5A'};"
            ><Clock class="w-3.5 h-3.5" />Pickup Window</label
          >
          <div class="flex items-center gap-2">
            <input
              type="time"
              value={windowStart}
              onchange={(e) => {
                windowStart = (e.currentTarget as HTMLInputElement).value;
                errors = { ...errors, time: undefined };
              }}
              class="flex-1 rounded-lg px-3 py-2.5 outline-none"
              style="background-color: #F5F1EB; font-size: 0.875rem; color: #1C2B1C; border: {errors.time
                ? '1px solid #FECACA'
                : 'none'};"
            />
            <span style="color: #7A6B5A;">to</span>
            <input
              type="time"
              value={windowEnd}
              onchange={(e) => {
                windowEnd = (e.currentTarget as HTMLInputElement).value;
                errors = { ...errors, time: undefined };
              }}
              class="flex-1 rounded-lg px-3 py-2.5 outline-none"
              style="background-color: #F5F1EB; font-size: 0.875rem; color: #1C2B1C; border: {errors.time
                ? '1px solid #FECACA'
                : 'none'};"
            />
          </div>
          {#if errors.time}
            <div class="flex items-center gap-1.5 mt-2">
              <AlertCircle class="w-3.5 h-3.5 shrink-0" style="color: #C0392B;" />
              <p style="font-size: 0.72rem; color: #C0392B;">{errors.time}</p>
            </div>
          {/if}
        </div>
      </Motion>

      <Motion
        let:motion
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
      >
        <div
          use:motion
          class="rounded-xl p-4 shadow-sm"
          style="background-color: white; border: 1px solid {errors.priceMin || errors.priceMax
            ? '#FECACA'
            : 'rgba(0,104,56,0.1)'};"
        >
          <label
            class="flex items-center gap-2 mb-2"
            style="font-size: 0.8rem; color: {errors.priceMin || errors.priceMax
              ? '#C0392B'
              : '#7A6B5A'};"><DollarSign class="w-3.5 h-3.5" />Price Range</label
          >
          <div class="flex items-center gap-2">
            <div class="flex-1">
              <div
                class="flex items-center rounded-lg overflow-hidden"
                style="background-color: #F5F1EB;"
              >
                <span class="pl-3 pr-1" style="font-size: 0.875rem; color: #7A6B5A;">$</span>
                <input
                  type="number"
                  value={priceMin}
                  oninput={(e) => {
                    priceMin = (e.currentTarget as HTMLInputElement).value;
                    errors = { ...errors, priceMin: undefined };
                  }}
                  class="flex-1 px-1 py-2.5 outline-none"
                  style="background-color: transparent; font-size: 1rem; font-weight: 700; color: #1C2B1C;"
                  step="1"
                  min="1"
                  max="10"
                />
              </div>
              <p class="mt-1 text-center" style="font-size: 0.65rem; color: #7A6B5A;">Min</p>
            </div>
            <span style="color: #7A6B5A; margin-bottom: 16px;">to</span>
            <div class="flex-1">
              <div
                class="flex items-center rounded-lg overflow-hidden"
                style="background-color: #F5F1EB;"
              >
                <span class="pl-3 pr-1" style="font-size: 0.875rem; color: #7A6B5A;">$</span>
                <input
                  type="number"
                  value={priceMax}
                  oninput={(e) => {
                    priceMax = (e.currentTarget as HTMLInputElement).value;
                    errors = { ...errors, priceMax: undefined };
                  }}
                  class="flex-1 px-1 py-2.5 outline-none"
                  style="background-color: transparent; font-size: 1rem; font-weight: 700; color: #1C2B1C;"
                  step="1"
                  min="1"
                  max="10"
                />
              </div>
              <p class="mt-1 text-center" style="font-size: 0.65rem; color: #7A6B5A;">Max</p>
            </div>
          </div>
          {#if errors.priceMin || errors.priceMax}
            <div class="flex items-center gap-1.5 mt-2">
              <AlertCircle class="w-3.5 h-3.5 shrink-0" style="color: #C0392B;" />
              <p style="font-size: 0.72rem; color: #C0392B;">
                {errors.priceMin || errors.priceMax}
              </p>
            </div>
          {/if}
        </div>
      </Motion>

      <Motion
        let:motion
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.14 }}
      >
        <div use:motion class="pt-2 pb-6">
          <button
            onclick={save}
            disabled={saving}
            class="w-full py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
            style="background-color: #006838; color: white; font-size: 1rem; font-weight: 700; box-shadow: 0 4px 16px rgba(0,104,56,0.3); opacity: {saving
              ? 0.7
              : 1};"
          >
            {#if saving}
              <LoadingSpinner
                size={16}
                borderWidth={2}
                color="#ffffff"
                trackColor="rgba(255,255,255,0.3)"
              />
              Saving changes...
            {:else}
              <CheckCircle2 class="w-4 h-4" />
              Save Changes
            {/if}
          </button>
        </div>
      </Motion>
    </div>
  </div>
{:else}
  <div
    class="min-h-screen flex items-center justify-center px-6 text-center"
    style="background-color: #F9F6F1;"
  >
    <div>
      <p style="font-size: 1rem; font-weight: 600; color: #1C2B1C;">Drop not found</p>
      <button
        onclick={back}
        class="mt-4 px-5 py-2.5 rounded-full"
        style="background-color: #006838; color: white; font-size: 0.875rem; font-weight: 600;"
        >Back</button
      >
    </div>
  </div>
{/if}
