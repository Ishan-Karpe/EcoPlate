<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { Motion } from "svelte-motion";
  import {
    ArrowLeft,
    Package,
    MapPin,
    Clock,
    DollarSign,
    CheckCircle2,
    AlertTriangle,
    ArrowUpRight,
    TrendingUp,
    AlertCircle,
    Camera,
    Sparkles,
    X,
    ImageIcon,
    RotateCcw,
    SwitchCamera,
  } from "lucide-svelte";
  import { adminStore } from "$lib/stores/admin.svelte";
  import * as api from "$lib/api";
  import { pickDropImage } from "$lib/constants";
  import LoadingSpinner from "$lib/components/LoadingSpinner.svelte";

  // ─── Constants ────────────────────────────────────────────────────────────────
  const LOCATIONS: { value: "Brandywine" | "Anteatery"; detail: string }[] = [
    { value: "Brandywine", detail: "Side entrance, Window B" },
    { value: "Anteatery", detail: "Main lobby, counter 3" },
  ];

  // ─── Form state ───────────────────────────────────────────────────────────────
  let location = $state<"Brandywine" | "Anteatery">("Anteatery");
  let boxes = $state("30");
  let windowStart = $state("18:00");
  let windowEnd = $state("23:00");
  let priceMin = $state("3");
  let priceMax = $state("5");
  let description = $state("");
  let submitted = $state(false);

  let errors = $state<{
    description?: string;
    boxes?: string;
    time?: string;
    priceMin?: string;
    priceMax?: string;
  }>({});

  // ─── Photo + AI state ─────────────────────────────────────────────────────────
  let photoPreview = $state<string | null>(null);
  let photoBase64 = $state<string | null>(null);
  let analyzing = $state(false);
  let aiApplied = $state(false);
  let aiError = $state<string | null>(null);
  let aiTags = $state<string[]>([]);
  let fileInput = $state<HTMLInputElement | null>(null);

  // ─── Live camera state ────────────────────────────────────────────────────────
  let cameraOpen = $state(false);
  let cameraError = $state<string | null>(null);
  let facingMode = $state<"environment" | "user">("environment");
  let videoEl = $state<HTMLVideoElement | null>(null);
  let stream = $state<MediaStream | null>(null);

  // ─── Derived values from store ────────────────────────────────────────────────
  let stats = $derived(adminStore.stats);

  let currentCap = $derived(stats.locationCaps.find((c) => c.location === location) ?? null);
  let capLimit = $derived(currentCap?.currentCap ?? 30);
  let weeksAbove85 = $derived(currentCap?.consecutiveWeeksAbove85 ?? 0);
  let canIncrease = $derived(weeksAbove85 >= 2);
  let locationDetail = $derived(LOCATIONS.find((l) => l.value === location)?.detail ?? "");

  // ─── Camera helpers ───────────────────────────────────────────────────────────
  function stopCamera() {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      stream = null;
    }
  }

  async function startCamera() {
    cameraError = null;
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 960 } },
      });
      if (videoEl) {
        videoEl.srcObject = s;
      }
      stream = s;
    } catch (err) {
      console.error("Camera access error:", err);
      cameraError =
        err instanceof DOMException && err.name === "NotAllowedError"
          ? "Camera permission denied. Please allow camera access and try again."
          : "Could not access camera. Make sure no other app is using it.";
    }
  }

  // When cameraOpen changes, start/stop stream
  $effect(() => {
    if (cameraOpen) {
      startCamera();
    } else {
      stopCamera();
    }
  });

  // When facingMode changes while camera is open, restart stream
  $effect(() => {
    // track dependency
    const _fm = facingMode;
    if (cameraOpen) {
      stopCamera();
      startCamera();
    }
  });

  onDestroy(() => {
    stopCamera();
  });

  function handleCapture() {
    const video = videoEl;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement("canvas");
    const MAX_DIM = 800;
    let w = video.videoWidth;
    let h = video.videoHeight;
    if (w > MAX_DIM || h > MAX_DIM) {
      if (w > h) {
        h = Math.round((h * MAX_DIM) / w);
        w = MAX_DIM;
      } else {
        w = Math.round((w * MAX_DIM) / h);
        h = MAX_DIM;
      }
    }
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    ctx?.drawImage(video, 0, 0, w, h);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
    photoPreview = dataUrl;
    photoBase64 = dataUrl;
    aiApplied = false;
    aiError = null;
    aiTags = [];
    cameraOpen = false;
  }

  function handleFileSelect(file: File) {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_DIM = 800;
        let w = img.width;
        let h = img.height;
        if (w > MAX_DIM || h > MAX_DIM) {
          if (w > h) {
            h = Math.round((h * MAX_DIM) / w);
            w = MAX_DIM;
          } else {
            w = Math.round((w * MAX_DIM) / h);
            h = MAX_DIM;
          }
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
        photoPreview = dataUrl;
        photoBase64 = dataUrl;
        aiApplied = false;
        aiError = null;
        aiTags = [];
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  async function handleAnalyze() {
    if (!photoBase64) return;
    analyzing = true;
    aiError = null;
    aiApplied = false;
    try {
      const result = await api.analyzeFoodPhoto(photoBase64);
      if (result.description) description = result.description;
      if (result.suggestedBoxes) {
        const capped = Math.min(result.suggestedBoxes, capLimit);
        boxes = capped.toString();
      }
      if (result.suggestedPriceMin) priceMin = result.suggestedPriceMin.toString();
      if (result.suggestedPriceMax) priceMax = result.suggestedPriceMax.toString();
      if (result.tags && result.tags.length > 0) aiTags = result.tags;
      aiApplied = true;
      errors = {};
    } catch (err) {
      console.error("AI analysis failed:", err);
      aiError = err instanceof Error ? err.message : "Failed to analyze photo. Please try again.";
    } finally {
      analyzing = false;
    }
  }

  function handleRemovePhoto() {
    photoPreview = null;
    photoBase64 = null;
    aiApplied = false;
    aiError = null;
    aiTags = [];
  }

  // ─── Validation ───────────────────────────────────────────────────────────────
  function validate(): boolean {
    const newErrors: typeof errors = {};

    if (!description.trim()) {
      newErrors.description = "Description is required";
    }

    const boxCount = parseInt(boxes);
    if (!boxes.trim() || isNaN(boxCount) || boxCount < 1) {
      newErrors.boxes = "Enter at least 1 box";
    } else if (!Number.isInteger(boxCount)) {
      newErrors.boxes = "Box count must be a whole number";
    } else if (boxCount > 100) {
      newErrors.boxes = "Maximum is 100 boxes";
    } else if (boxCount > capLimit) {
      newErrors.boxes = `Maximum is ${capLimit} boxes for this location`;
    }

    if (!windowStart || !windowEnd) {
      newErrors.time = "Both start and end times are required";
    } else if (windowStart >= windowEnd) {
      newErrors.time = "End time must be after start time";
    }

    const min = parseFloat(priceMin);
    const max = parseFloat(priceMax);
    if (!priceMin.trim() || isNaN(min) || min < 1) {
      newErrors.priceMin = "Minimum price must be at least $1";
    } else if (min > 10) {
      newErrors.priceMin = "Maximum allowed price is $10";
    }
    if (!priceMax.trim() || isNaN(max) || max < 1) {
      newErrors.priceMax = "Maximum price must be at least $1";
    } else if (max > 10) {
      newErrors.priceMax = "Maximum allowed price is $10";
    } else if (!isNaN(min) && max < min) {
      newErrors.priceMax = "Max must be ≥ min price";
    }

    errors = newErrors;
    return Object.keys(newErrors).length === 0;
  }

  // ─── Submit ───────────────────────────────────────────────────────────────────
  async function handleSubmit() {
    if (!validate() || submitted) return;
    const boxCount = Math.min(parseInt(boxes) || 1, capLimit);
    submitted = true;
    // Determine imageUrl: use captured photo or pick from pool based on description
    const imageUrl = photoBase64 ?? pickDropImage(description, location);
    const success = await adminStore.handleDropSubmit(
      {
        location,
        locationDetail,
        boxes: boxCount,
        windowStart,
        windowEnd,
        priceMin: parseFloat(priceMin) || 3,
        priceMax: parseFloat(priceMax) || 5,
        description,
        imageUrl,
        dailyCap: capLimit,
        consecutiveWeeksAbove85: weeksAbove85,
      },
      { redirectDelayMs: 1500 }
    );
    if (!success) submitted = false;
  }

  onMount(async () => {
    await adminStore.loadStats();
  });
</script>

<!-- ─── Success screen ──────────────────────────────────────────────────────────── -->
<!-- Handled by store navigation; submitted briefly true during async call -->

<!-- ─── Main page ────────────────────────────────────────────────────────────────── -->
<div class="min-h-screen flex flex-col" style="background-color: #F9F6F1;">
  <!-- Header -->
  <div class="px-5 pt-12 pb-4">
    <a
      href="/admin"
      class="flex items-center gap-1 mb-4"
      style="color: #7A6B5A; font-size: 0.875rem;"
    >
      <ArrowLeft class="w-4 h-4" />
      Dashboard
    </a>
    <h1 style="font-size: 1.5rem; font-weight: 700; color: #1C2B1C;">Create Tonight's Drop</h1>
    <p class="mt-1" style="font-size: 0.875rem; color: #7A6B5A;">
      Set up Fresh Boxes for students
    </p>
  </div>

  <div class="flex-1 px-5 space-y-4 overflow-y-auto pb-4">
    <!-- Cap status banner -->
    {#if currentCap}
      <Motion
        let:motion
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
      >
        <div
          use:motion
          class="rounded-xl p-3 flex items-start gap-2"
          style="
            background-color: {canIncrease ? '#E8F5EE' : '#FEF3C7'};
            border: 1px solid {canIncrease ? 'rgba(0,104,56,0.3)' : '#FCD34D'};
          "
        >
          {#if canIncrease}
            <ArrowUpRight class="w-4 h-4 mt-0.5 shrink-0" style="color: #006838;" />
          {:else}
            <AlertTriangle class="w-4 h-4 mt-0.5 shrink-0" style="color: #D97706;" />
          {/if}
          <div>
            <p
              style="
                font-size: 0.8rem;
                font-weight: 600;
                color: {canIncrease ? '#004D28' : '#92400E'};
              "
            >
              {canIncrease
                ? `Cap eligible for increase! Currently ${capLimit} boxes/day.`
                : `Daily cap: ${capLimit} boxes/day for ${location}`}
            </p>
            <p style="font-size: 0.7rem; color: {canIncrease ? '#006838' : '#B45309'};">
              {canIncrease
                ? "Pickup rate above 85% for 2+ weeks. You can increase the cap by 10."
                : `${weeksAbove85}/2 weeks above 85% needed to increase cap.`}
            </p>
          </div>
        </div>
      </Motion>
    {/if}

    <!-- ─── Photo Capture + AI Auto-Fill ─────────────────────────────────────── -->
    <Motion
      let:motion
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1], delay: 0.02 }}
    >
      <div
        use:motion
        class="rounded-xl p-4 shadow-sm"
        style="background-color: white; border: 1px solid rgba(0,104,56,0.1);"
      >
        <div class="flex items-center gap-2 mb-3" style="font-size: 0.8rem; color: #7A6B5A;">
          <Camera class="w-3.5 h-3.5" />
          <span>Photo &amp; AI Auto-Fill</span>
          <span
            class="ml-auto px-2 py-0.5 rounded-full"
            style="
              font-size: 0.6rem;
              font-weight: 700;
              background-color: #E8F5EE;
              color: #006838;
              letter-spacing: 0.04em;
            "
          >
            NEW
          </span>
        </div>

        {#if !photoPreview}
          <div class="space-y-2">
            <p style="font-size: 0.75rem; color: #7A6B5A; line-height: 1.5;">
              Snap a photo of tonight's food and let AI auto-fill the description, box count, and
              pricing.
            </p>
            <div class="grid grid-cols-2 gap-2">
              <button
                onclick={() => (cameraOpen = true)}
                class="flex items-center justify-center gap-2 py-3 rounded-xl active:scale-[0.97] transition-transform"
                style="background-color: #006838; color: white; font-size: 0.8rem; font-weight: 600;"
              >
                <Camera class="w-4 h-4" />
                Take Photo
              </button>
              <button
                onclick={() => fileInput?.click()}
                class="flex items-center justify-center gap-2 py-3 rounded-xl active:scale-[0.97] transition-transform"
                style="background-color: #F5F1EB; color: #4A3728; font-size: 0.8rem; font-weight: 600;"
              >
                <ImageIcon class="w-4 h-4" />
                Upload
              </button>
            </div>
            <input
              bind:this={fileInput}
              type="file"
              accept="image/*"
              class="hidden"
              onchange={(e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file) handleFileSelect(file);
              }}
            />
          </div>
        {:else}
          <div class="space-y-3">
            <!-- Photo preview -->
            <div class="relative rounded-xl overflow-hidden" style="height: 180px;">
              <img src={photoPreview} alt="Tonight's food" class="w-full h-full object-cover" />
              <button
                onclick={handleRemovePhoto}
                class="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center"
                style="background-color: rgba(0,0,0,0.5);"
              >
                <X class="w-3.5 h-3.5 text-white" />
              </button>
              {#if aiApplied}
                <Motion
                  let:motion
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div
                    use:motion
                    class="absolute bottom-2 left-2 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
                    style="background-color: rgba(0,104,56,0.9);"
                  >
                    <CheckCircle2 class="w-3 h-3 text-white" />
                    <span style="font-size: 0.68rem; color: white; font-weight: 600;">
                      AI analyzed
                    </span>
                  </div>
                </Motion>
              {/if}
            </div>

            <!-- AI tags -->
            {#if aiTags.length > 0}
              <div class="flex flex-wrap gap-1.5">
                {#each aiTags as tag}
                  <span
                    class="px-2.5 py-1 rounded-full"
                    style="
                      font-size: 0.68rem;
                      font-weight: 600;
                      background-color: #E8F5EE;
                      color: #006838;
                    "
                  >
                    {tag}
                  </span>
                {/each}
              </div>
            {/if}

            <!-- Analyze / Re-analyze button -->
            {#if !aiApplied}
              <button
                onclick={handleAnalyze}
                disabled={analyzing}
                class="w-full py-3 rounded-xl flex items-center justify-center gap-2 active:scale-[0.97] transition-all"
                style="
                  background: {analyzing
                  ? 'linear-gradient(135deg, #5A9E78, #006838)'
                  : 'linear-gradient(135deg, #006838, #004D28)'};
                  color: white;
                  font-size: 0.875rem;
                  font-weight: 700;
                  box-shadow: 0 4px 16px rgba(0,104,56,0.25);
                  opacity: {analyzing ? 0.85 : 1};
                "
              >
                {#if analyzing}
                  <LoadingSpinner
                    size={16}
                    borderWidth={2}
                    color="#ffffff"
                    trackColor="rgba(255,255,255,0.3)"
                  />
                  Analyzing food...
                {:else}
                  <Sparkles class="w-4 h-4" />
                  Analyze &amp; Auto-Fill with AI
                {/if}
              </button>
            {:else}
              <button
                onclick={handleAnalyze}
                disabled={analyzing}
                class="w-full py-2.5 rounded-xl flex items-center justify-center gap-2 active:scale-[0.97] transition-all"
                style="background-color: #F5F1EB; color: #7A6B5A; font-size: 0.8rem; font-weight: 600;"
              >
                <RotateCcw class="w-3.5 h-3.5" />
                Re-analyze
              </button>
            {/if}

            <!-- AI error -->
            {#if aiError}
              <div
                class="flex items-start gap-2 p-3 rounded-xl"
                style="background-color: #FEF2F2; border: 1px solid #FECACA;"
              >
                <AlertCircle class="w-4 h-4 mt-0.5 shrink-0" style="color: #C0392B;" />
                <p style="font-size: 0.75rem; color: #C0392B; line-height: 1.4;">{aiError}</p>
              </div>
            {/if}
          </div>
        {/if}
      </div>
    </Motion>

    <!-- ─── Form fields ────────────────────────────────────────────────────────── -->
    <Motion
      let:motion
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1], delay: 0.05 }}
    >
      <div use:motion class="space-y-3">
        <!-- Location -->
        <div
          class="rounded-xl p-4 shadow-sm"
          style="background-color: white; border: 1px solid rgba(0,104,56,0.1);"
        >
          <div class="flex items-center gap-2 mb-2" style="font-size: 0.8rem; color: #7A6B5A;">
            <MapPin class="w-3.5 h-3.5" />
            Location
          </div>
          <div class="grid grid-cols-2 gap-2">
            {#each LOCATIONS as loc}
              <button
                onclick={() => (location = loc.value)}
                class="py-3 px-4 rounded-xl transition-all active:scale-[0.97]"
                style="
                  background-color: {location === loc.value ? '#006838' : '#F5F1EB'};
                  color: {location === loc.value ? 'white' : '#4A3728'};
                  font-size: 0.875rem;
                  font-weight: 600;
                "
              >
                {loc.value}
              </button>
            {/each}
          </div>
          <p class="mt-2" style="font-size: 0.72rem; color: #7A6B5A;">{locationDetail}</p>
        </div>

        <!-- Number of boxes -->
        <div
          class="rounded-xl p-4 shadow-sm"
          style="
            background-color: white;
            border: 1px solid {errors.boxes ? '#FECACA' : 'rgba(0,104,56,0.1)'};
          "
        >
          <div
            class="flex items-center gap-2 mb-2"
            style="font-size: 0.8rem; color: {errors.boxes ? '#C0392B' : '#7A6B5A'};"
          >
            <Package class="w-3.5 h-3.5" />
            Number of Fresh Boxes
            {#if aiApplied}
              <Sparkles class="w-3 h-3 ml-1" style="color: #006838;" />
            {/if}
          </div>
          <div class="flex items-center gap-3">
            <button
              onclick={() => {
                const current = parseInt(boxes) || 1;
                boxes = Math.max(1, current - 5).toString();
                errors = { ...errors, boxes: undefined };
              }}
              class="w-10 h-10 rounded-lg text-[1.25rem] active:scale-[0.9] transition-transform"
              style="background-color: #F5F1EB; color: #4A3728;"
            >
              -
            </button>
            <input
              type="number"
              value={boxes}
              oninput={(e) => {
                const raw = (e.target as HTMLInputElement).value;
                if (raw === "" || raw === "-") {
                  boxes = "";
                  return;
                }
                const val = Math.max(0, Math.min(parseInt(raw) || 0, Math.min(capLimit, 100)));
                boxes = val.toString();
                errors = { ...errors, boxes: undefined };
              }}
              class="flex-1 text-center rounded-lg px-3 py-2.5 outline-none"
              style="background-color: #F5F1EB; font-size: 1.25rem; font-weight: 700; color: #1C2B1C;"
            />
            <button
              onclick={() => {
                const current = parseInt(boxes) || 0;
                boxes = Math.min(Math.min(capLimit, 100), current + 5).toString();
                errors = { ...errors, boxes: undefined };
              }}
              class="w-10 h-10 rounded-lg text-[1.25rem] active:scale-[0.9] transition-transform"
              style="background-color: #F5F1EB; color: #4A3728;"
            >
              +
            </button>
          </div>
          <div class="flex items-center justify-between mt-2">
            <p style="font-size: 0.7rem; color: #7A6B5A;">
              Max: {Math.min(capLimit, 100)} boxes/day
            </p>
            {#if parseInt(boxes) >= Math.min(capLimit, 100)}
              <p style="font-size: 0.7rem; font-weight: 500; color: #D97706;">At cap</p>
            {/if}
          </div>
          {#if errors.boxes}
            <div class="flex items-center gap-1.5 mt-2">
              <AlertCircle class="w-3.5 h-3.5 shrink-0" style="color: #C0392B;" />
              <p style="font-size: 0.72rem; color: #C0392B;">{errors.boxes}</p>
            </div>
          {/if}
        </div>

        <!-- Pickup window -->
        <div
          class="rounded-xl p-4 shadow-sm"
          style="
            background-color: white;
            border: 1px solid {errors.time ? '#FECACA' : 'rgba(0,104,56,0.1)'};
          "
        >
          <div
            class="flex items-center gap-2 mb-2"
            style="font-size: 0.8rem; color: {errors.time ? '#C0392B' : '#7A6B5A'};"
          >
            <Clock class="w-3.5 h-3.5" />
            Pickup Window
          </div>
          <div class="flex items-center gap-2">
            <input
              type="time"
              value={windowStart}
              onchange={(e) => {
                windowStart = (e.target as HTMLInputElement).value;
                errors = { ...errors, time: undefined };
              }}
              class="flex-1 rounded-lg px-3 py-2.5 outline-none"
              style="
                background-color: #F5F1EB;
                font-size: 0.875rem;
                color: #1C2B1C;
                border: {errors.time ? '1px solid #FECACA' : 'none'};
              "
            />
            <span style="color: #7A6B5A;">to</span>
            <input
              type="time"
              value={windowEnd}
              onchange={(e) => {
                windowEnd = (e.target as HTMLInputElement).value;
                errors = { ...errors, time: undefined };
              }}
              class="flex-1 rounded-lg px-3 py-2.5 outline-none"
              style="
                background-color: #F5F1EB;
                font-size: 0.875rem;
                color: #1C2B1C;
                border: {errors.time ? '1px solid #FECACA' : 'none'};
              "
            />
          </div>
          {#if errors.time}
            <div class="flex items-center gap-1.5 mt-2">
              <AlertCircle class="w-3.5 h-3.5 shrink-0" style="color: #C0392B;" />
              <p style="font-size: 0.72rem; color: #C0392B;">{errors.time}</p>
            </div>
          {/if}
        </div>

        <!-- Price range -->
        <div
          class="rounded-xl p-4 shadow-sm"
          style="
            background-color: white;
            border: 1px solid {errors.priceMin || errors.priceMax
            ? '#FECACA'
            : 'rgba(0,104,56,0.1)'};
          "
        >
          <div
            class="flex items-center gap-2 mb-2"
            style="font-size: 0.8rem; color: {errors.priceMin || errors.priceMax
              ? '#C0392B'
              : '#7A6B5A'};"
          >
            <DollarSign class="w-3.5 h-3.5" />
            Price Range
            {#if aiApplied}
              <Sparkles class="w-3 h-3 ml-1" style="color: #006838;" />
            {/if}
          </div>
          <div class="flex items-center gap-3">
            <div class="flex-1">
              <p style="font-size: 0.7rem; color: #7A6B5A; margin-bottom: 4px;">Min ($)</p>
              <input
                type="number"
                min="1"
                max="10"
                value={priceMin}
                oninput={(e) => {
                  priceMin = (e.target as HTMLInputElement).value;
                  errors = { ...errors, priceMin: undefined, priceMax: undefined };
                }}
                class="w-full text-center rounded-lg px-3 py-2.5 outline-none"
                style="
                  background-color: #F5F1EB;
                  font-size: 1.125rem;
                  font-weight: 700;
                  color: #1C2B1C;
                  border: {errors.priceMin ? '1.5px solid #FECACA' : 'none'};
                "
              />
            </div>
            <span style="color: #7A6B5A; padding-top: 20px;">–</span>
            <div class="flex-1">
              <p style="font-size: 0.7rem; color: #7A6B5A; margin-bottom: 4px;">Max ($)</p>
              <input
                type="number"
                min="1"
                max="10"
                value={priceMax}
                oninput={(e) => {
                  priceMax = (e.target as HTMLInputElement).value;
                  errors = { ...errors, priceMax: undefined };
                }}
                class="w-full text-center rounded-lg px-3 py-2.5 outline-none"
                style="
                  background-color: #F5F1EB;
                  font-size: 1.125rem;
                  font-weight: 700;
                  color: #1C2B1C;
                  border: {errors.priceMax ? '1.5px solid #FECACA' : 'none'};
                "
              />
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
          <p class="mt-2" style="font-size: 0.7rem; color: #7A6B5A;">
            Dynamic pricing: low supply + high demand skews toward max.
          </p>
        </div>

        <!-- Description -->
        <div
          class="rounded-xl p-4 shadow-sm"
          style="background-color: white; border: 1px solid {errors.description
            ? '#FECACA'
            : 'rgba(0,104,56,0.1)'};"
        >
          <div
            class="flex items-center gap-2 mb-2"
            style="font-size: 0.8rem; color: {errors.description ? '#C0392B' : '#7A6B5A'};"
          >
            What's in tonight's box?
            {#if aiApplied}
              <Sparkles class="w-3 h-3 ml-1" style="color: #006838;" />
            {/if}
          </div>
          <textarea
            value={description}
            oninput={(e) => {
              description = (e.target as HTMLTextAreaElement).value;
              errors = { ...errors, description: undefined };
            }}
            placeholder="e.g., Pasta bar: penne arrabbiata, grilled chicken, roasted vegetables"
            rows={3}
            class="w-full rounded-lg px-3 py-2.5 outline-none resize-none"
            style="background-color: #F5F1EB; font-size: 0.875rem; color: #1C2B1C; border: {errors.description
              ? '1px solid #FECACA'
              : 'none'};"
          ></textarea>
          {#if errors.description}
            <div class="flex items-center gap-1.5 mt-2">
              <AlertCircle class="w-3.5 h-3.5 shrink-0" style="color: #C0392B;" />
              <p style="font-size: 0.72rem; color: #C0392B;">
                {errors.description}
              </p>
            </div>
          {/if}
        </div>

        <!-- Forecast placeholder -->
        <div
          class="rounded-xl p-5 text-center"
          style="background-color: white; border: 1px solid rgba(0,104,56,0.1);"
        >
          <TrendingUp class="w-8 h-8 mx-auto mb-3" style="color: #006838; opacity: 0.4;" />
          <p style="font-size: 0.875rem; font-weight: 500; color: #7A6B5A;">
            After 30+ days of data, Forecast v1 (ML-assisted) will be available.
          </p>
        </div>
      </div>
    </Motion>
  </div>

  <!-- Submit button -->
  <div class="px-5 pb-8 pt-4">
    <button
      onclick={handleSubmit}
      disabled={submitted}
      class="w-full py-4 rounded-2xl active:scale-[0.98] transition-transform"
      style="
        background-color: {submitted ? '#5A9E78' : '#006838'};
        color: white;
        font-size: 1.125rem;
        font-weight: 700;
        box-shadow: 0 4px 20px rgba(0,104,56,0.3);
      "
    >
      {#if submitted}
        <span class="flex items-center justify-center gap-2">
          <LoadingSpinner
            size={20}
            borderWidth={2}
            color="#ffffff"
            trackColor="rgba(255,255,255,0.3)"
          />
          Posting Drop...
        </span>
      {:else}
        Post Drop
      {/if}
    </button>
  </div>
</div>

<!-- ─── Live Camera Modal ──────────────────────────────────────────────────────── -->
{#if cameraOpen}
  <div class="fixed inset-0 z-50 flex flex-col" style="background-color: #000;">
    <!-- Camera top bar -->
    <div
      class="flex items-center justify-between px-5 pt-12 pb-3"
      style="background-color: rgba(0,0,0,0.6);"
    >
      <button
        onclick={() => (cameraOpen = false)}
        class="w-9 h-9 rounded-full flex items-center justify-center"
        style="background-color: rgba(255,255,255,0.15);"
      >
        <X class="w-5 h-5 text-white" />
      </button>
      <span style="font-size: 0.9rem; font-weight: 700; color: white;">Take Photo</span>
      <button
        onclick={() => {
          stopCamera();
          facingMode = facingMode === "environment" ? "user" : "environment";
        }}
        class="w-9 h-9 rounded-full flex items-center justify-center"
        style="background-color: rgba(255,255,255,0.15);"
      >
        <SwitchCamera class="w-4.5 h-4.5 text-white" />
      </button>
    </div>

    <!-- Video feed -->
    <div class="flex-1 relative overflow-hidden flex items-center justify-center">
      <!-- svelte-ignore a11y_media_has_caption -->
      <video
        bind:this={videoEl}
        autoplay
        playsinline
        muted
        class="w-full h-full object-cover"
        style="transform: {facingMode === 'user' ? 'scaleX(-1)' : 'none'};"
      ></video>

      <!-- Viewfinder corners -->
      <div
        class="absolute inset-8 pointer-events-none"
        style="border: 2px solid rgba(255,255,255,0.25); border-radius: 20px;"
      ></div>

      <!-- Error overlay -->
      {#if cameraError}
        <div
          class="absolute bottom-6 left-4 right-4 flex items-start gap-2.5 p-4 rounded-2xl"
          style="background-color: rgba(192,57,43,0.92);"
        >
          <AlertCircle class="w-5 h-5 text-white shrink-0 mt-0.5" />
          <div>
            <p style="font-size: 0.8rem; font-weight: 700; color: white;">Camera unavailable</p>
            <p style="font-size: 0.72rem; color: rgba(255,255,255,0.8); margin-top: 2px;">
              {cameraError}
            </p>
          </div>
        </div>
      {/if}
    </div>

    <!-- Capture bar -->
    <div
      class="flex items-center justify-center py-8 px-5"
      style="background-color: rgba(0,0,0,0.6);"
    >
      <button
        onclick={handleCapture}
        aria-label="Capture photo"
        class="active:scale-[0.9] transition-transform"
      >
        <div
          class="w-[72px] h-[72px] rounded-full flex items-center justify-center"
          style="border: 4px solid white;"
        >
          <div class="w-[58px] h-[58px] rounded-full" style="background-color: white;"></div>
        </div>
      </button>
    </div>
  </div>
{/if}
