<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import { Motion } from "svelte-motion";
  import {
    ArrowLeft,
    Clock,
    MapPin,
    ShieldCheck,
    Zap,
  } from "lucide-svelte";
  import { appStore } from "$lib/stores/app.svelte";
  import { authStore } from "$lib/stores/auth.svelte";
  import { calculateCurrentPrice, formatTime } from "$lib/utils";
  import ImageWithFallback from "$lib/components/ImageWithFallback.svelte";

  const dropId = $derived(page.params.id);
  const drop = $derived(appStore.drops.find((d) => d.id === dropId) ?? appStore.selectedDrop);
  const user = $derived(appStore.user);

  let isConfirming = $state(false);
  let reservationError = $state("");

  onMount(async () => {
    await authStore.bootstrap();
    if (appStore.drops.length === 0) {
      await appStore.loadDrops();
    }
    await appStore.loadUser(authStore.userId);
  });

  async function confirm() {
    if (!drop || isConfirming) return;
    isConfirming = true;
    reservationError = "";
    try {
      await appStore.handleConfirmReservation({
        dropId: drop.id,
        userId: authStore.userId,
        paymentMethod: "pay_at_pickup",
      });
    } catch {
      reservationError = "Something went wrong. Please try again.";
    } finally {
      isConfirming = false;
    }
  }

  async function submitCard() {
    if (!drop || isConfirming) return;
    isConfirming = true;
    await appStore.handleConfirmReservation({
      dropId: drop.id,
      userId: authStore.userId,
      paymentMethod: "card",
      cardLast4: digits.slice(-4),
    });
    isConfirming = false;
  }

  async function backToDetail() {
    await goto(`/drop/${dropId}`);
  }
</script>

{#if drop}
  {#if true}
    <!-- Confirm reservation view -->
    <div class="min-h-screen flex flex-col" style="background-color: #F9F6F1">
      <!-- Header -->
      <div class="px-5 pt-12 pb-4">
        <button
          onclick={backToDetail}
          class="flex items-center gap-1 mb-4"
          style="color: #7A6B5A; font-size: 0.875rem"
        >
          <ArrowLeft class="w-4 h-4" />
          Back
        </button>
        <h1 style="font-size: 1.5rem; font-weight: 700; color: #1C2B1C">Confirm your box</h1>
        <p class="mt-1" style="font-size: 0.875rem; color: #7A6B5A">
          You're about to rescue a meal.
        </p>
      </div>

      <div class="flex-1 px-5 space-y-4 overflow-y-auto pb-4">
        <!-- Food photo + order summary -->
        <Motion let:motion initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div
            use:motion
            class="rounded-2xl overflow-hidden shadow-sm"
            style="background-color: white; border: 1px solid rgba(0,104,56,0.1)"
          >
            <div class="relative h-36 overflow-hidden">
              <ImageWithFallback
                src={drop.imageUrl}
                alt={drop.location}
                class="w-full h-full object-cover"
              />
              <div
                class="absolute inset-0 flex items-end px-4 pb-3"
                style="background: linear-gradient(to top, rgba(0,0,0,0.55), transparent)"
              >
                <div>
                  <p class="text-white" style="font-size: 1rem; font-weight: 700">
                    Fresh Box · {drop.location}
                  </p>
                  <p class="text-white/70" style="font-size: 0.75rem">{drop.locationDetail}</p>
                </div>
              </div>
            </div>
            <div class="p-4 space-y-3">
              <div class="flex items-center gap-3">
                <Clock class="w-4 h-4 shrink-0" style="color: #006838" />
                <div>
                  <p style="font-size: 0.875rem; font-weight: 500; color: #1C2B1C">
                    {formatTime(drop.windowStart)} – {formatTime(drop.windowEnd)}
                  </p>
                  <p style="font-size: 0.75rem; color: #7A6B5A">90-minute pickup window</p>
                </div>
              </div>
              <div class="flex items-center gap-3">
                <MapPin class="w-4 h-4 shrink-0" style="color: #006838" />
                <p style="font-size: 0.875rem; font-weight: 500; color: #1C2B1C">
                  {drop.locationDetail}
                </p>
              </div>
              <div
                class="flex items-center justify-between pt-3"
                style="border-top: 1px solid rgba(0,104,56,0.1)"
              >
                <div>
                  <span style="font-size: 0.875rem; color: #7A6B5A">Tonight's price</span>
                  <div class="flex items-center gap-1 mt-0.5">
                    <Zap class="w-3 h-3" style="color: #8B6F47" />
                    <span style="font-size: 0.68rem; color: #8B6F47">Dynamic $3-$5</span>
                  </div>
                </div>
                <span style="font-size: 1.375rem; font-weight: 800; color: #006838"
                  >${calculateCurrentPrice(drop)}</span
                >
              </div>
            </div>
          </div>
        </Motion>

        <!-- Payment -->
        <Motion
          let:motion
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div
            use:motion
            class="rounded-xl p-3.5 flex items-center gap-3"
            style="background-color: white; border: 2px solid rgba(0,104,56,0.12)"
          >
            <div
              class="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
              style="background-color: #E8F5EE"
            >
              <MapPin class="w-4 h-4" style="color: #006838" />
            </div>
            <div>
              <p style="font-size: 0.875rem; font-weight: 600; color: #1C2B1C">Pay at the counter</p>
              <p style="font-size: 0.75rem; color: #7A6B5A">
                ${calculateCurrentPrice(drop)} — cash or card tap when you pick up
              </p>
            </div>
          </div>
        </Motion>

        <!-- Reservation error -->
        {#if reservationError}
          <div
            class="rounded-xl p-3 flex items-center gap-2"
            style="background-color: #FEE2E2; border: 1px solid #FECACA"
          >
            <p style="font-size: 0.8rem; color: #991B1B; font-weight: 600">{reservationError}</p>
          </div>
        {/if}

        <!-- How pickup works -->
        <Motion
          let:motion
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <div use:motion class="rounded-2xl p-4 space-y-3" style="background-color: #F0EBE3">
            <p style="font-size: 0.8rem; font-weight: 600; color: #4A3728">How pickup works</p>
            {#each ["You'll get a QR code + 6-digit pickup code", "Show either one to staff at the pickup counter", "Grab your Fresh Box and enjoy!"] as step, i}
              <div class="flex items-center gap-2.5">
                <div
                  class="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                  style="background-color: #006838; color: white; font-size: 0.65rem; font-weight: 700"
                >
                  {i + 1}
                </div>
                <span style="font-size: 0.8rem; color: #4A3728">{step}</span>
              </div>
            {/each}
          </div>
        </Motion>

        <!-- No-show warning -->
        <Motion
          let:motion
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div
            use:motion
            class="rounded-xl p-3"
            style="background-color: #FEF3C7; border: 1px solid #FCD34D"
          >
            <p style="font-size: 0.75rem; color: #92400E">
              <strong>No-show policy:</strong> If you can't make it, cancel from the home screen before
              the window starts. Repeat no-shows may lose early access.
            </p>
          </div>
        </Motion>

        <!-- Trust signal -->
        <div class="flex items-center gap-2 justify-center py-1">
          <ShieldCheck class="w-4 h-4" style="color: #006838" />
          <span style="font-size: 0.75rem; color: #7A6B5A">Food handled by campus dining staff</span
          >
        </div>
      </div>

      <!-- Confirm Button -->
      <Motion
        let:motion
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <div use:motion class="px-5 pb-24 pt-3">
          <button
            onclick={confirm}
            disabled={isConfirming}
            class="w-full py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
            style="background-color: {isConfirming
              ? '#4A9B6A'
              : '#006838'}; color: white; font-size: 1.125rem; font-weight: 700; box-shadow: 0 4px 20px rgba(0,104,56,0.3)"
          >
            {#if isConfirming}
              Reserving...
            {:else if paymentMethod === "credit"}
              Use 1 Credit and Reserve
              <ChevronRight class="w-5 h-5" />
            {:else if paymentMethod === "card" && hasSavedCard}
              Pay ${calculateCurrentPrice(drop)} and Reserve
              <ChevronRight class="w-5 h-5" />
            {:else if paymentMethod === "card"}
              Continue to Payment
              <ChevronRight class="w-5 h-5" />
            {:else}
              Reserve and Pay at Pickup
              <ChevronRight class="w-5 h-5" />
            {/if}
          </button>
          <p class="text-center mt-2" style="font-size: 0.7rem; color: #7A6B5A">
            {paymentMethod === "card" && !hasSavedCard
              ? "You'll enter card details on the next screen."
              : "Cancel before window opens for a full refund."}
          </p>
        </div>
      </Motion>
    </div>
  {/if}
{:else}
  <div
    class="min-h-screen flex items-center justify-center px-6 text-center"
    style="background-color: #F9F6F1"
  >
    <div>
      <p style="font-size: 1rem; font-weight: 600; color: #1C2B1C">Drop not found</p>
      <button
        onclick={backToDetail}
        class="mt-4 px-5 py-2.5 rounded-full"
        style="background-color: #006838; color: white; font-size: 0.875rem; font-weight: 600"
        >Back</button
      >
    </div>
  </div>
{/if}
