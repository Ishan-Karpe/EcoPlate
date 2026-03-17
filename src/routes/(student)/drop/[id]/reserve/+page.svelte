<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import { Motion } from "svelte-motion";
  import {
    ArrowLeft,
    ChevronRight,
    Clock,
    CreditCard,
    Lock,
    MapPin,
    ShieldCheck,
    Wallet,
    Zap,
  } from "lucide-svelte";
  import { appStore } from "$lib/stores/app.svelte";
  import { authStore } from "$lib/stores/auth.svelte";
  import { calculateCurrentPrice, formatTime } from "$lib/utils";
  import ImageWithFallback from "$lib/components/ImageWithFallback.svelte";

  const dropId = $derived(page.params.id);
  const drop = $derived(appStore.drops.find((d) => d.id === dropId) ?? appStore.selectedDrop);
  const user = $derived(appStore.user);

  const hasCredits = $derived(Boolean(user.membership && user.creditsRemaining > 0));
  const hasSavedCard = $derived(user.hasCardSaved);

  let paymentMethod = $state<"card" | "credit" | "pay_at_pickup">("pay_at_pickup");
  let showCardEntry = $state(false);
  let isConfirming = $state(false);

  let cardNumber = $state("");
  let expiry = $state("");
  let cvc = $state("");
  let fieldErrors = $state<{ cardNumber?: string; expiry?: string; cvc?: string }>({});

  onMount(async () => {
    await authStore.bootstrap();
    if (appStore.drops.length === 0) {
      await appStore.loadDrops();
    }
    await appStore.loadUser(authStore.userId);
    // Set smart default based on loaded user state (mirrors legacy decision tree)
    if (user.membership && user.creditsRemaining > 0) {
      paymentMethod = "credit";
    } else if (user.hasCardSaved) {
      paymentMethod = "card";
    }
  });

  function formatCardNumber(val: string): string {
    const digits = val.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(.{4})/g, "$1 ").trim();
  }

  function formatExpiry(val: string): string {
    const digits = val.replace(/\D/g, "").slice(0, 4);
    return digits.length >= 3 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
  }

  async function confirm() {
    if (!drop || isConfirming) return;

    if (paymentMethod === "card" && !hasSavedCard) {
      showCardEntry = true;
      return;
    }

    isConfirming = true;
    await appStore.handleConfirmReservation({
      dropId: drop.id,
      userId: authStore.userId,
      paymentMethod,
    });
    isConfirming = false;
  }

  async function submitCard() {
    if (!drop || isConfirming) return;
    const digits = cardNumber.replace(/\s/g, "");
    const errs: typeof fieldErrors = {};

    if (digits.length < 16 || !/^[0-9]{16}$/.test(digits)) {
      errs.cardNumber = "Enter a valid 16-digit card number";
    }
    if (expiry.length < 5) {
      errs.expiry = "Enter expiry in MM/YY format";
    } else {
      const parts = expiry.split("/");
      const mm = parts[0] ?? "";
      const yy = parts[1] ?? "";
      const month = parseInt(mm, 10);
      const year = 2000 + parseInt(yy, 10);
      if (isNaN(month) || isNaN(year) || month < 1 || month > 12) {
        errs.expiry = "Enter a valid expiry date";
      } else {
        const now = new Date();
        if (
          year < now.getFullYear() ||
          (year === now.getFullYear() && month < now.getMonth() + 1)
        ) {
          errs.expiry = "Card has expired";
        }
      }
    }
    const cvcDigits = cvc.replace(/\D/g, "");
    if (cvcDigits.length < 3) {
      errs.cvc = "CVC must be 3-4 digits";
    }

    if (Object.keys(errs).length > 0) {
      fieldErrors = errs;
      return;
    }
    fieldErrors = {};
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
  {#if showCardEntry}
    <!-- Card entry view -->
    <div class="min-h-screen flex flex-col" style="background-color: #F9F6F1">
      <div class="px-5 pt-12 pb-4">
        <button
          onclick={() => (showCardEntry = false)}
          class="flex items-center gap-1 mb-4"
          style="color: #7A6B5A; font-size: 0.875rem"
        >
          <ArrowLeft class="w-4 h-4" />
          Back
        </button>
        <h1 style="font-size: 1.375rem; font-weight: 700; color: #1C2B1C">Add your card</h1>
        <p class="mt-1" style="font-size: 0.875rem; color: #7A6B5A">
          Saved securely. Never asked again.
        </p>
      </div>

      <div class="flex-1 px-5 space-y-4 overflow-y-auto pb-4">
        <!-- Order summary -->
        <div
          class="rounded-2xl overflow-hidden shadow-sm"
          style="background-color: white; border: 1px solid rgba(0,104,56,0.1)"
        >
          <div class="relative h-28 overflow-hidden">
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
                  Rescue Box · {drop.location}
                </p>
                <p class="text-white/70" style="font-size: 0.75rem">
                  {formatTime(drop.windowStart)} – {formatTime(drop.windowEnd)}
                </p>
              </div>
            </div>
          </div>
          <div
            class="px-4 py-3 flex items-center justify-between"
            style="border-top: 1px solid rgba(0,104,56,0.08)"
          >
            <span style="font-size: 0.875rem; color: #7A6B5A">Tonight's price</span>
            <span style="font-size: 1.25rem; font-weight: 800; color: #006838"
              >${calculateCurrentPrice(drop)}</span
            >
          </div>
        </div>

        <!-- Card form -->
        <div
          class="rounded-2xl p-5 space-y-4 shadow-sm"
          style="background-color: white; border: 1px solid rgba(0,104,56,0.1)"
        >
          <div class="flex items-center gap-2 mb-1">
            <Lock class="w-4 h-4" style="color: #006838" />
            <p style="font-size: 0.8rem; font-weight: 600; color: #1C2B1C">Secure card entry</p>
          </div>

          <!-- Card number -->
          <div>
            <label
              for="card-number"
              style="font-size: 0.75rem; font-weight: 600; color: {fieldErrors.cardNumber
                ? '#C0392B'
                : '#7A6B5A'}">Card number</label
            >
            <input
              id="card-number"
              type="text"
              inputmode="numeric"
              value={cardNumber}
              oninput={(e) => {
                cardNumber = formatCardNumber((e.currentTarget as HTMLInputElement).value);
                fieldErrors = { ...fieldErrors, cardNumber: undefined };
              }}
              placeholder="1234 5678 9012 3456"
              class="w-full mt-1.5 px-4 py-3 rounded-xl outline-none"
              style="background-color: #F5F1EB; font-size: 1rem; font-family: monospace; letter-spacing: 0.05em; color: #1C2B1C; border: 1.5px solid {fieldErrors.cardNumber
                ? '#FECACA'
                : 'transparent'}"
            />
            {#if fieldErrors.cardNumber}
              <p style="font-size: 0.72rem; color: #C0392B; margin-top: 4px">
                {fieldErrors.cardNumber}
              </p>
            {/if}
          </div>

          <div class="grid grid-cols-2 gap-3">
            <!-- Expiry -->
            <div>
              <label
                for="card-expiry"
                style="font-size: 0.75rem; font-weight: 600; color: {fieldErrors.expiry
                  ? '#C0392B'
                  : '#7A6B5A'}">Expiry</label
              >
              <input
                id="card-expiry"
                type="text"
                inputmode="numeric"
                value={expiry}
                oninput={(e) => {
                  expiry = formatExpiry((e.currentTarget as HTMLInputElement).value);
                  fieldErrors = { ...fieldErrors, expiry: undefined };
                }}
                placeholder="MM/YY"
                class="w-full mt-1.5 px-4 py-3 rounded-xl outline-none"
                style="background-color: #F5F1EB; font-size: 1rem; font-family: monospace; color: #1C2B1C; border: 1.5px solid {fieldErrors.expiry
                  ? '#FECACA'
                  : 'transparent'}"
              />
              {#if fieldErrors.expiry}
                <p style="font-size: 0.68rem; color: #C0392B; margin-top: 4px">
                  {fieldErrors.expiry}
                </p>
              {/if}
            </div>
            <!-- CVC -->
            <div>
              <label
                for="card-cvc"
                style="font-size: 0.75rem; font-weight: 600; color: {fieldErrors.cvc
                  ? '#C0392B'
                  : '#7A6B5A'}">CVC</label
              >
              <input
                id="card-cvc"
                type="text"
                inputmode="numeric"
                value={cvc}
                oninput={(e) => {
                  cvc = (e.currentTarget as HTMLInputElement).value.replace(/\D/g, "").slice(0, 4);
                  fieldErrors = { ...fieldErrors, cvc: undefined };
                }}
                placeholder="•••"
                class="w-full mt-1.5 px-4 py-3 rounded-xl outline-none"
                style="background-color: #F5F1EB; font-size: 1rem; font-family: monospace; color: #1C2B1C; border: 1.5px solid {fieldErrors.cvc
                  ? '#FECACA'
                  : 'transparent'}"
              />
              {#if fieldErrors.cvc}
                <p style="font-size: 0.68rem; color: #C0392B; margin-top: 4px">{fieldErrors.cvc}</p>
              {/if}
            </div>
          </div>

          <div class="flex items-center gap-2">
            <Lock class="w-3 h-3" style="color: #7A6B5A" />
            <p style="font-size: 0.72rem; color: #7A6B5A">
              Your card is saved for future reservations. You won't be asked again.
            </p>
          </div>
        </div>
      </div>

      <div class="px-5 pb-24 pt-3">
        <button
          onclick={submitCard}
          disabled={isConfirming}
          class="w-full py-4 rounded-2xl active:scale-[0.98] transition-transform"
          style="background-color: {isConfirming
            ? '#4A9B6A'
            : '#006838'}; color: white; font-size: 1.125rem; font-weight: 700; box-shadow: 0 4px 20px rgba(0,104,56,0.3)"
        >
          {isConfirming ? "Reserving..." : `Pay $${calculateCurrentPrice(drop)} and Reserve`}
        </button>
        <p class="text-center mt-2" style="font-size: 0.7rem; color: #7A6B5A">
          Cancel before the window for a full refund.
        </p>
      </div>
    </div>
  {:else}
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

        <!-- Payment method selection -->
        <Motion
          let:motion
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div use:motion>
            <p class="mb-2" style="font-size: 0.8rem; font-weight: 600; color: #7A6B5A">
              Payment method
            </p>
            <div class="space-y-2">
              {#if hasCredits}
                <button
                  onclick={() => (paymentMethod = "credit")}
                  class="w-full rounded-xl p-3.5 flex items-center gap-3 text-left transition-colors"
                  style="border: 2px solid {paymentMethod === 'credit'
                    ? '#006838'
                    : 'rgba(0,104,56,0.12)'}; background-color: {paymentMethod === 'credit'
                    ? '#E8F5EE'
                    : 'white'}"
                >
                  <div
                    class="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                    style="background-color: {paymentMethod === 'credit'
                      ? '#006838'
                      : '#EDE8E1'}; color: {paymentMethod === 'credit' ? 'white' : '#7A6B5A'}"
                  >
                    <Wallet class="w-4 h-4" />
                  </div>
                  <div class="min-w-0 flex-1">
                    <div class="flex items-center gap-2">
                      <p style="font-size: 0.875rem; font-weight: 600; color: #1C2B1C">
                        Use Fresh Credit
                      </p>
                      <span
                        class="px-1.5 py-0.5 rounded-md"
                        style="background-color: #E8F5EE; color: #006838; font-size: 0.6rem; font-weight: 700"
                        >Fastest</span
                      >
                    </div>
                    <p style="font-size: 0.75rem; color: #7A6B5A">
                      {user.creditsRemaining} credit{user.creditsRemaining !== 1 ? "s" : ""} remaining
                    </p>
                  </div>
                  <div
                    class="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0"
                    style="border-color: {paymentMethod === 'credit' ? '#006838' : '#D0C8BF'}"
                  >
                    {#if paymentMethod === "credit"}<div
                        class="w-2.5 h-2.5 rounded-full"
                        style="background-color: #006838"
                      ></div>{/if}
                  </div>
                </button>
              {/if}

              <button
                onclick={() => (paymentMethod = "card")}
                class="w-full rounded-xl p-3.5 flex items-center gap-3 text-left transition-colors"
                style="border: 2px solid {paymentMethod === 'card'
                  ? '#006838'
                  : 'rgba(0,104,56,0.12)'}; background-color: {paymentMethod === 'card'
                  ? '#E8F5EE'
                  : 'white'}"
              >
                <div
                  class="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                  style="background-color: {paymentMethod === 'card'
                    ? '#006838'
                    : '#EDE8E1'}; color: {paymentMethod === 'card' ? 'white' : '#7A6B5A'}"
                >
                  <CreditCard class="w-4 h-4" />
                </div>
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-2">
                    <p style="font-size: 0.875rem; font-weight: 600; color: #1C2B1C">
                      {hasSavedCard ? `Saved card ••••${user.cardLast4}` : "Pay by card"}
                    </p>
                    {#if hasSavedCard && !hasCredits}
                      <span
                        class="px-1.5 py-0.5 rounded-md"
                        style="background-color: #E8F5EE; color: #006838; font-size: 0.6rem; font-weight: 700"
                        >One tap</span
                      >
                    {/if}
                  </div>
                  <p style="font-size: 0.75rem; color: #7A6B5A">
                    {hasSavedCard
                      ? `$${calculateCurrentPrice(drop)} charged now, one tap`
                      : "Enter card details next"}
                  </p>
                </div>
                <div
                  class="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0"
                  style="border-color: {paymentMethod === 'card' ? '#006838' : '#D0C8BF'}"
                >
                  {#if paymentMethod === "card"}<div
                      class="w-2.5 h-2.5 rounded-full"
                      style="background-color: #006838"
                    ></div>{/if}
                </div>
              </button>

              <button
                onclick={() => (paymentMethod = "pay_at_pickup")}
                class="w-full rounded-xl p-3.5 flex items-center gap-3 text-left transition-colors"
                style="border: 2px solid {paymentMethod === 'pay_at_pickup'
                  ? '#006838'
                  : 'rgba(0,104,56,0.12)'}; background-color: {paymentMethod === 'pay_at_pickup'
                  ? '#E8F5EE'
                  : 'white'}"
              >
                <div
                  class="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                  style="background-color: {paymentMethod === 'pay_at_pickup'
                    ? '#006838'
                    : '#EDE8E1'}; color: {paymentMethod === 'pay_at_pickup' ? 'white' : '#7A6B5A'}"
                >
                  <MapPin class="w-4 h-4" />
                </div>
                <div class="min-w-0 flex-1">
                  <p style="font-size: 0.875rem; font-weight: 600; color: #1C2B1C">Pay at pickup</p>
                  <p style="font-size: 0.75rem; color: #7A6B5A">
                    Pay ${calculateCurrentPrice(drop)} at the counter
                  </p>
                </div>
                <div
                  class="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0"
                  style="border-color: {paymentMethod === 'pay_at_pickup' ? '#006838' : '#D0C8BF'}"
                >
                  {#if paymentMethod === "pay_at_pickup"}<div
                      class="w-2.5 h-2.5 rounded-full"
                      style="background-color: #006838"
                    ></div>{/if}
                </div>
              </button>
            </div>
          </div>
        </Motion>

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
