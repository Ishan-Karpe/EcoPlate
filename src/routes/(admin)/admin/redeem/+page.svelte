<script lang="ts">
  import { onDestroy } from "svelte";
  import { goto } from "$app/navigation";
  import { Motion } from "svelte-motion";
  import {
    ArrowLeft,
    CheckCircle2,
    XCircle,
    Clock,
    AlertTriangle,
    ScanLine,
    Keyboard,
    Camera,
    CameraOff,
    FlipHorizontal,
  } from "lucide-svelte";
  import jsQR from "jsqr";
  import { adminStore } from "$lib/stores/admin.svelte";

  type InputMode = "code" | "qr";
  type ResultState = "success" | "expired" | "invalid" | null;
  type CameraState = "idle" | "requesting" | "active" | "denied" | "error";

  function parseEcoPlateQR(raw: string): string | null {
    const parts = raw.trim().split(":");
    if (parts[0] === "ECOPLATE" && parts[1] && parts[1].length === 6) {
      return parts[1].toUpperCase();
    }

    const bare = raw.trim().toUpperCase();
    if (/^[A-Z0-9]{6}$/.test(bare)) return bare;
    return null;
  }

  let mode = $state<InputMode>("qr");
  let code = $state("");
  let result = $state<ResultState>(null);
  let redeemedCode = $state("");

  let cameraState = $state<CameraState>("idle");
  let facingMode = $state<"environment" | "user">("environment");
  let detectedCode = $state<string | null>(null);
  let scannerActive = $state(false);

  let videoEl = $state<HTMLVideoElement | null>(null);
  let canvasEl = $state<HTMLCanvasElement | null>(null);

  let stream: MediaStream | null = null;
  let rafId: number | null = null;
  let resultLocked = false;

  let recentRedemptions = $derived(adminStore.recentRedemptions);

  function cancelScanLoop() {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  function stopCamera() {
    cancelScanLoop();

    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      stream = null;
    }

    if (videoEl) {
      videoEl.srcObject = null;
    }

    scannerActive = false;
    cameraState = "idle";
    detectedCode = null;
    resultLocked = false;
  }

  async function startCamera(facing: "environment" | "user" = facingMode) {
    stopCamera();
    cameraState = "requesting";
    result = null;
    resultLocked = false;

    try {
      const media = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      stream = media;

      if (videoEl) {
        videoEl.srcObject = media;
        await videoEl.play();
      }

      cameraState = "active";
      scannerActive = true;
    } catch (error) {
      const name = (error as { name?: string } | null)?.name;
      if (name === "NotAllowedError" || name === "PermissionDeniedError") {
        cameraState = "denied";
      } else {
        cameraState = "error";
      }
    }
  }

  function flipCamera() {
    const nextFacing = facingMode === "environment" ? "user" : "environment";
    facingMode = nextFacing;
    void startCamera(nextFacing);
  }

  async function handleCheck(inputCode: string) {
    const upperCode = inputCode.toUpperCase().trim();
    if (!upperCode || upperCode.length < 6) return;

    const redeemResult = await adminStore.handleRedeemCode(upperCode);

    if (redeemResult.valid) {
      result = "success";
      redeemedCode = upperCode;
      setTimeout(() => {
        result = null;
        code = "";
        resultLocked = false;
        detectedCode = null;
      }, 3500);
      return;
    }

    if (
      redeemResult.reason === "Already redeemed" ||
      redeemResult.reason === "Code expired or cancelled"
    ) {
      result = "expired";
      setTimeout(() => {
        result = null;
        resultLocked = false;
        detectedCode = null;
      }, 4000);
      return;
    }

    result = "invalid";
    setTimeout(() => {
      result = null;
      resultLocked = false;
      detectedCode = null;
    }, 3000);
  }

  function scanFrame() {
    if (!scannerActive) return;

    const video = videoEl;
    const canvas = canvasEl;

    if (!video || !canvas || video.readyState < 2) {
      rafId = requestAnimationFrame(scanFrame);
      return;
    }

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) {
      rafId = requestAnimationFrame(scanFrame);
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const qr = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: "dontInvert",
    });

    if (qr && !resultLocked) {
      const parsed = parseEcoPlateQR(qr.data);
      if (parsed) {
        resultLocked = true;
        detectedCode = parsed;
        scannerActive = false;
        void handleCheck(parsed);
        return;
      }
    }

    rafId = requestAnimationFrame(scanFrame);
  }

  $effect(() => {
    if (!scannerActive) {
      cancelScanLoop();
      return;
    }

    rafId = requestAnimationFrame(scanFrame);

    return () => {
      cancelScanLoop();
    };
  });

  $effect(() => {
    if (mode !== "qr") {
      stopCamera();
    }
  });

  onDestroy(() => {
    stopCamera();
  });
</script>

<div class="min-h-screen flex flex-col" style="background-color: #F9F6F1;">
  <div class="px-5 pt-12 pb-5 rounded-b-[2rem] shadow-sm" style="background-color: #006838;">
    <button
      onclick={async () => {
        stopCamera();
        await goto("/admin");
      }}
      class="flex items-center gap-1 mb-4 active:opacity-80"
      style="font-size: 0.875rem; color: rgba(255,255,255,0.7);"
    >
      <ArrowLeft class="w-4 h-4" />
      Dashboard
    </button>
    <h1 style="font-size: 1.375rem; font-weight: 600; color: white;">Scan to Redeem</h1>
    <p style="font-size: 0.875rem; color: rgba(255,255,255,0.7); margin-top: 4px;">
      {recentRedemptions.length > 0
        ? `${recentRedemptions.length} picked up today`
        : "Scan QR or enter pickup code"}
    </p>
  </div>

  <div class="flex-1 px-4 py-5 space-y-4 overflow-y-auto pb-10">
    <div class="flex rounded-2xl p-1" style="background-color: #EDE8E1;">
      <button
        onclick={() => {
          mode = "qr";
          result = null;
          code = "";
        }}
        class="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl transition-all"
        style="
          background-color: {mode === 'qr' ? 'white' : 'transparent'};
          color: {mode === 'qr' ? '#006838' : '#7A6B5A'};
          font-size: 0.875rem;
          font-weight: 700;
          box-shadow: {mode === 'qr' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none'};
        "
      >
        <ScanLine class="w-4 h-4" />
        Scan QR
      </button>
      <button
        onclick={() => {
          mode = "code";
          result = null;
        }}
        class="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl transition-all"
        style="
          background-color: {mode === 'code' ? 'white' : 'transparent'};
          color: {mode === 'code' ? '#006838' : '#7A6B5A'};
          font-size: 0.875rem;
          font-weight: 700;
          box-shadow: {mode === 'code' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none'};
        "
      >
        <Keyboard class="w-4 h-4" />
        Enter Code
      </button>
    </div>

    {#if mode === "qr"}
      <Motion let:motion initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div
          use:motion
          class="rounded-2xl overflow-hidden shadow-sm"
          style="background-color: white; border: 1px solid rgba(0,104,56,0.1);"
        >
          <div
            class="relative flex items-center justify-center overflow-hidden"
            style="height: 280px; background-color: #0F1A0F;"
          >
            <video
              bind:this={videoEl}
              class="absolute inset-0 w-full h-full object-cover"
              playsinline
              muted
              style="display: {cameraState === 'active' ? 'block' : 'none'}"
            ></video>
            <canvas bind:this={canvasEl} class="hidden"></canvas>

            {#if cameraState === "idle"}
              <div class="text-center px-6">
                <Camera class="w-14 h-14 mx-auto mb-3" style="color: rgba(255,255,255,0.25);" />
                <p style="color: rgba(255,255,255,0.6); font-size: 0.875rem; font-weight: 600;">
                  Camera is off
                </p>
                <p class="mt-1" style="color: rgba(255,255,255,0.35); font-size: 0.75rem;">
                  Tap "Start Camera" below to activate
                </p>
              </div>
            {/if}

            {#if cameraState === "requesting"}
              <div class="text-center">
                <Motion
                  let:motion
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                >
                  <div
                    use:motion
                    class="w-10 h-10 rounded-full border-2 border-t-transparent mx-auto mb-3"
                    style="border-color: rgba(134,239,172,0.6); border-top-color: transparent;"
                  ></div>
                </Motion>
                <p style="color: rgba(255,255,255,0.6); font-size: 0.875rem;">
                  Requesting camera access...
                </p>
              </div>
            {/if}

            {#if cameraState === "denied"}
              <div class="text-center px-6">
                <CameraOff class="w-12 h-12 mx-auto mb-3" style="color: #f87171;" />
                <p style="color: #fca5a5; font-size: 0.875rem; font-weight: 600;">
                  Camera access denied
                </p>
                <p class="mt-1" style="color: rgba(255,255,255,0.4); font-size: 0.72rem;">
                  Allow camera permission in your browser settings, then try again.
                </p>
              </div>
            {/if}

            {#if cameraState === "error"}
              <div class="text-center px-6">
                <CameraOff class="w-12 h-12 mx-auto mb-3" style="color: #fbbf24;" />
                <p style="color: #fde68a; font-size: 0.875rem; font-weight: 600;">
                  Camera unavailable
                </p>
                <p class="mt-1" style="color: rgba(255,255,255,0.4); font-size: 0.72rem;">
                  No camera found or it's in use by another app.
                </p>
              </div>
            {/if}

            {#if cameraState === "active"}
              <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div class="relative w-52 h-52">
                  <div
                    class="absolute top-0 left-0 w-9 h-9"
                    style="border-top: 3px solid #86efac; border-left: 3px solid #86efac; border-radius: 4px 0 0 0;"
                  ></div>
                  <div
                    class="absolute top-0 right-0 w-9 h-9"
                    style="border-top: 3px solid #86efac; border-right: 3px solid #86efac; border-radius: 0 4px 0 0;"
                  ></div>
                  <div
                    class="absolute bottom-0 left-0 w-9 h-9"
                    style="border-bottom: 3px solid #86efac; border-left: 3px solid #86efac; border-radius: 0 0 0 4px;"
                  ></div>
                  <div
                    class="absolute bottom-0 right-0 w-9 h-9"
                    style="border-bottom: 3px solid #86efac; border-right: 3px solid #86efac; border-radius: 0 0 4px 0;"
                  ></div>

                  {#if scannerActive}
                    <Motion
                      let:motion
                      initial={{ top: "4px" }}
                      animate={{ top: "calc(100% - 4px)" }}
                      transition={{
                        duration: 1.6,
                        ease: "linear",
                        repeat: Infinity,
                        repeatType: "reverse",
                      }}
                    >
                      <div
                        use:motion
                        class="absolute left-1 right-1 h-0.5"
                        style="background-color: #86efac; box-shadow: 0 0 10px 2px rgba(134,239,172,0.6);"
                      ></div>
                    </Motion>
                  {/if}

                  {#if detectedCode}
                    <Motion
                      let:motion
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                    >
                      <div
                        use:motion
                        class="absolute inset-0 flex items-center justify-center rounded-lg"
                        style="background-color: rgba(0,104,56,0.55);"
                      >
                        <CheckCircle2 class="w-16 h-16" style="color: #86efac;" />
                      </div>
                    </Motion>
                  {/if}
                </div>
              </div>

              <div class="absolute bottom-3 left-0 right-0 text-center">
                <span
                  class="px-3 py-1 rounded-full"
                  style="
                    background-color: rgba(0,0,0,0.5);
                    color: {detectedCode ? '#86efac' : 'rgba(255,255,255,0.7)'};
                    font-size: 0.75rem;
                    font-weight: 600;
                  "
                >
                  {detectedCode ? `Detected: ${detectedCode}` : "Point at student's QR code"}
                </span>
              </div>

              <button
                onclick={flipCamera}
                class="absolute top-3 right-3 p-2 rounded-full"
                style="background-color: rgba(0,0,0,0.45);"
                title="Flip camera"
              >
                <FlipHorizontal class="w-4 h-4 text-white" />
              </button>
            {/if}
          </div>

          <div class="p-4 space-y-2">
            {#if cameraState === "idle" || cameraState === "denied" || cameraState === "error"}
              <button
                onclick={() => startCamera(facingMode)}
                class="w-full py-3.5 rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                style="
                  background-color: #006838;
                  color: white;
                  font-size: 1rem;
                  font-weight: 700;
                  box-shadow: 0 4px 16px rgba(0,104,56,0.3);
                "
              >
                <Camera class="w-4 h-4" />
                Start Camera
              </button>
            {:else if cameraState === "requesting"}
              <button
                disabled
                class="w-full py-3.5 rounded-xl"
                style="background-color: #EDE8E1; color: #7A6B5A; font-size: 1rem; font-weight: 600;"
              >
                Waiting for permission...
              </button>
            {:else}
              <button
                onclick={stopCamera}
                class="w-full py-3.5 rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                style="background-color: #EDE8E1; color: #7A6B5A; font-size: 1rem; font-weight: 600;"
              >
                <CameraOff class="w-4 h-4" />
                Stop Camera
              </button>
            {/if}

            <p class="text-center" style="font-size: 0.72rem; color: #7A6B5A;">
              {cameraState === "active"
                ? "Scanning automatically - hold steady over the QR code"
                : "Camera access is required for QR scanning"}
            </p>
          </div>
        </div>
      </Motion>
    {/if}

    {#if mode === "code"}
      <Motion let:motion initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div
          use:motion
          class="rounded-2xl p-6 shadow-sm"
          style="background-color: white; border: 1px solid rgba(0,104,56,0.1);"
        >
          <p class="text-center mb-4" style="font-size: 0.8rem; font-weight: 600; color: #7A6B5A;">
            Enter student's 6-digit code
          </p>
          <input
            type="text"
            value={code}
            oninput={(e) => {
              code = (e.currentTarget as HTMLInputElement).value.toUpperCase().slice(0, 6);
              result = null;
            }}
            placeholder="XXXXXX"
            maxlength={6}
            class="w-full text-center rounded-xl px-4 py-4 outline-none"
            style="
              background-color: #F5F1EB;
              font-size: 2rem;
              font-weight: 900;
              letter-spacing: 0.2em;
              font-family: monospace;
              color: #006838;
              border: 1px solid rgba(0,104,56,0.15);
            "
            onkeydown={(e) => {
              if (e.key === "Enter") {
                void handleCheck(code);
              }
            }}
          />
          <button
            onclick={() => handleCheck(code)}
            disabled={code.length < 6}
            class="w-full mt-4 py-3.5 rounded-xl transition-all active:scale-[0.98]"
            style="
              background-color: {code.length < 6 ? '#EDE8E1' : '#006838'};
              color: {code.length < 6 ? '#7A6B5A' : 'white'};
              font-size: 1rem;
              font-weight: 700;
              cursor: {code.length < 6 ? 'default' : 'pointer'};
              box-shadow: {code.length >= 6 ? '0 4px 16px rgba(0,104,56,0.3)' : 'none'};
            "
          >
            Verify &amp; Redeem
          </button>
        </div>
      </Motion>
    {/if}

    {#if result === "success"}
      <Motion
        let:motion
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
      >
        <div
          use:motion
          class="rounded-xl p-4 flex items-center gap-3"
          style="background-color: #E8F5EE; border: 1px solid rgba(0,104,56,0.3);"
        >
          <CheckCircle2 class="w-8 h-8 shrink-0" style="color: #006838;" />
          <div>
            <p style="font-size: 0.875rem; font-weight: 700; color: #004D28;">Pickup confirmed!</p>
            <p style="font-size: 0.8rem; color: #006838;">
              Code <span style="font-family: monospace; font-weight: 700;">{redeemedCode}</span> verified.
              Hand the box to the student.
            </p>
          </div>
        </div>
      </Motion>
    {/if}

    {#if result === "expired"}
      <Motion
        let:motion
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
      >
        <div
          use:motion
          class="rounded-xl p-4 flex items-center gap-3"
          style="background-color: #FEF3C7; border: 1px solid #FCD34D;"
        >
          <Clock class="w-8 h-8 shrink-0" style="color: #D97706;" />
          <div>
            <p style="font-size: 0.875rem; font-weight: 700; color: #92400E;">Code expired</p>
            <p style="font-size: 0.8rem; color: #B45309;">
              This pickup window has ended or the reservation was cancelled.
            </p>
          </div>
        </div>
      </Motion>
    {/if}

    {#if result === "invalid"}
      <Motion
        let:motion
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
      >
        <div
          use:motion
          class="rounded-xl p-4 flex items-center gap-3"
          style="background-color: #FEE2E2; border: 1px solid #FECACA;"
        >
          <XCircle class="w-8 h-8 shrink-0" style="color: #C0392B;" />
          <div>
            <p style="font-size: 0.875rem; font-weight: 700; color: #7F1D1D;">Code not found</p>
            <p style="font-size: 0.8rem; color: #991B1B;">
              No active reservation matches this code.
            </p>
          </div>
        </div>
      </Motion>
    {/if}

    {#if result === "expired" || result === "invalid"}
      <Motion
        let:motion
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div
          use:motion
          class="rounded-xl p-3 flex items-start gap-2"
          style="background-color: #F5F1EB;"
        >
          <AlertTriangle class="w-4 h-4 mt-0.5 shrink-0" style="color: #8B6F47;" />
          <p style="font-size: 0.75rem; color: #7A6B5A;">
            <strong>Support fallback:</strong> If the student insists they have a valid reservation, check
            dashboard reservation details or contact EcoPlate support.
          </p>
        </div>
      </Motion>
    {/if}

    <div>
      <div class="flex items-center justify-between mb-3">
        <p style="font-size: 0.8rem; font-weight: 600; color: #7A6B5A;">Pickups today</p>
        {#if recentRedemptions.length > 0}
          <span
            class="px-2 py-0.5 rounded-full"
            style="background-color: #E8F5EE; color: #006838; font-size: 0.7rem; font-weight: 700;"
          >
            {recentRedemptions.length} confirmed
          </span>
        {/if}
      </div>

      {#if recentRedemptions.length === 0}
        <div
          class="rounded-xl p-6 text-center"
          style="background-color: white; border: 1px solid rgba(0,104,56,0.1);"
        >
          <ScanLine class="w-8 h-8 mx-auto mb-2" style="color: rgba(0,104,56,0.25);" />
          <p style="font-size: 0.875rem; color: #7A6B5A;">No pickups yet today</p>
          <p class="mt-1" style="font-size: 0.78rem; color: #7A6B5A;">
            Confirmed pickups will appear here. Resets at midnight.
          </p>
        </div>
      {:else}
        <div class="space-y-2">
          {#each recentRedemptions as entry, i (`${entry.code}-${i}`)}
            <Motion
              let:motion
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <div
                use:motion
                class="rounded-xl px-4 py-3 flex items-center justify-between shadow-sm"
                style="background-color: white; border: 1px solid rgba(0,104,56,0.1);"
              >
                <div>
                  <span
                    style="
                      font-family: monospace;
                      font-weight: 700;
                      font-size: 0.9375rem;
                      color: #006838;
                      letter-spacing: 0.05em;
                    "
                  >
                    {entry.code}
                  </span>
                  {#if entry.location}
                    <p style="font-size: 0.7rem; color: #7A6B5A;">{entry.location}</p>
                  {/if}
                </div>
                <div class="flex items-center gap-1.5">
                  <CheckCircle2 class="w-3.5 h-3.5" style="color: #006838;" />
                  <span style="font-size: 0.75rem; color: #7A6B5A;">{entry.time}</span>
                </div>
              </div>
            </Motion>
          {/each}
        </div>
      {/if}
    </div>
  </div>
</div>
