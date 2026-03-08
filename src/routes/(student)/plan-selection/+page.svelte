<script lang="ts">
  import { Check, Zap, Shield, ArrowRight } from "lucide-svelte";
  import type { Membership } from "$lib/types";
  import { Motion } from "svelte-motion";
  import { appStore } from "$lib/stores/app.svelte";

  import { authStore } from "$lib/stores/auth.svelte";
  import { onMount } from "svelte";

  type Plan = "none" | "basic" | "premium";

  let selectedPlan = $state<Plan>("none");

  onMount(() => {
    void (async () => {
      await authStore.bootstrap();
    })();
  });

  async function handleSelect() {
    const userId = authStore.userId;
    let membership: Membership | null = null;
    let creditsRemaining = 0;

    if (selectedPlan === "basic") {
      membership = {
        plan: "basic",
        monthlyPrice: 15,
        creditsPerMonth: 7,
        earlyAccess: false,
        monthsUnderUsed: 0,
      };
      creditsRemaining = 7;
    } else if (selectedPlan === "premium") {
      membership = {
        plan: "premium",
        monthlyPrice: 30,
        creditsPerMonth: 15,
        earlyAccess: true,
        monthsUnderUsed: 0,
      };
      creditsRemaining = 15;
    }

    await appStore.handleUpdatePlan(userId, membership, creditsRemaining);
  }

  const plans: {
    id: Plan;
    title: string;
    badge: string;
    price: string;
    priceNote: string;
    features: string[];
    accent?: boolean;
    premium?: boolean;
  }[] = [
    {
      id: "none",
      title: "Free Tier",
      badge: "",
      price: "",
      priceNote: "Pay per box ($3-$5 each)",
      features: ["Drop alerts when boxes go live", "Impact tracking", "No monthly commitment"],
    },
    {
      id: "basic",
      title: "Rescue Basic",
      badge: "Popular",
      price: "$15/mo",
      priceNote: "~$2.14 per meal",
      features: [
        "7 Rescue Credits/month",
        "Credits roll for 30 days",
        "Drop alerts + priority support",
      ],
      accent: true,
    },
    {
      id: "premium",
      title: "Rescue Premium",
      badge: "",
      price: "$30/mo",
      priceNote: "~$2.00 per meal",
      features: [
        "15 Rescue Credits/month",
        "Early access - reserve before others",
        "Credits roll for 30 days",
      ],
      premium: true,
    },
  ];
</script>

<div class="min-h-screen flex flex-col" style="background-color: #F9F6F1">
  <div class="px-5 pt-14 pb-4">
    <Motion
      let:motion
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
    >
      <div use:motion>
        <h1 style="font-size: 1.375rem; font-weight: 700; color: #1C2B1C">Choose your plan</h1>
        <p class="mt-1" style="font-size: 0.875rem; color: #7A6B5A">
          Stay free or upgrade for credits at a better rate. You can always change later.
        </p>
      </div>
    </Motion>
  </div>

  <div class="flex-1 px-5 space-y-3 overflow-y-auto pb-4">
    {#each plans as plan, index}
      <Motion
        let:motion
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1, duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
      >
        <button
          use:motion
          onclick={() => (selectedPlan = plan.id)}
          class="w-full rounded-xl p-4 text-left transition-all active:scale-[0.98]"
          style="background-color: {selectedPlan === plan.id
            ? '#E8F5EE'
            : 'white'}; border: {selectedPlan === plan.id
            ? '2px solid #006838'
            : '2px solid rgba(0,104,56,0.12)'};"
        >
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-2">
              <span style="font-size: 0.9375rem; font-weight: 700; color: #1C2B1C"
                >{plan.title}</span
              >
              {#if plan.badge}
                <span
                  class="px-2 py-0.5 rounded-full"
                  style="background-color: #E8F5EE; color: #006838; font-size: 0.6rem; font-weight: 700;"
                >
                  {plan.badge}
                </span>
              {/if}
              {#if plan.premium}
                <Zap class="w-3.5 h-3.5" style="color: #8B6F47" />
              {/if}
            </div>
            <div
              class="w-5 h-5 rounded-full border-2 flex items-center justify-center"
              style="border-color: {selectedPlan === plan.id ? '#006838' : '#D0C8BF'}"
            >
              {#if selectedPlan === plan.id}
                <Check class="w-3 h-3" style="color: #006838" />
              {/if}
            </div>
          </div>

          {#if plan.price}
            <div class="flex items-baseline gap-1 mb-2">
              <span style="font-size: 1.375rem; font-weight: 800; color: #006838">{plan.price}</span
              >
            </div>
          {/if}

          <p class="mb-2" style="font-size: 0.78rem; color: #7A6B5A">{plan.priceNote}</p>

          <div class="space-y-1">
            {#each plan.features as feature}
              <div class="flex items-center gap-2">
                <Check class="w-3.5 h-3.5 shrink-0" style="color: #006838" />
                <span style="font-size: 0.78rem; color: #4A3728">{feature}</span>
              </div>
            {/each}
          </div>
        </button>
      </Motion>
    {/each}

    <!-- Fairness policy -->
    <Motion
      let:motion
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
    >
      <div
        use:motion
        class="rounded-xl p-3 flex items-start gap-2"
        style="background-color: #F0EBE3"
      >
        <Shield class="w-4 h-4 mt-0.5 shrink-0" style="color: #8B6F47" />
        <p style="font-size: 0.7rem; color: #7A6B5A">
          <strong>Fairness policy:</strong> If you use less than 50% of credits for 2 months due to low
          supply, you can auto-downgrade the next month.
        </p>
      </div>
    </Motion>
  </div>

  <div class="px-5 pb-24 pt-3">
    <Motion
      let:motion
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
    >
      <button
        use:motion
        onclick={handleSelect}
        class="w-full py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
        style="background-color: #006838; color: white; font-size: 1.125rem; font-weight: 700; box-shadow: 0 4px 20px rgba(0,104,56,0.3);"
      >
        {#if selectedPlan === "none"}
          Stay on Free Tier
        {:else if selectedPlan === "basic"}
          Start Basic - $15/mo
        {:else}
          Start Premium - $30/mo
        {/if}
        <ArrowRight class="w-5 h-5" />
      </button>
    </Motion>
    <p class="text-center mt-2" style="font-size: 0.68rem; color: #C4BAB0">
      You can always change your plan from your profile
    </p>
  </div>
</div>
