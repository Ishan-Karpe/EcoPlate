<script lang="ts">
  import { Motion } from "svelte-motion";
  import EcoplateLogo from "$lib/components/EcoplateLogo.svelte";
  import {
    User,
    CreditCard,
    ChevronDown,
    CheckCircle2,
    Shield,
    Zap,
    Info,
    Users,
    LogOut,
    Lock,
  } from "lucide-svelte";
  import { appStore } from "$lib/stores/app.svelte";
  import { authStore } from "$lib/stores/auth.svelte";
  import { signOut } from "$lib/auth";
  import { goto } from "$app/navigation";
  import type { Membership } from "$lib/types";
  import { onMount } from "svelte";

  type Plan = "none" | "basic" | "premium";

  const PLANS: {
    id: Plan;
    name: string;
    monthlyPrice: string;
    annualPrice: string;
    credits: number;
    earlyAccess: boolean;
    comingSoon?: boolean;
    features: string[];
  }[] = [
    {
      id: "none",
      name: "Free Tier",
      monthlyPrice: "Free",
      annualPrice: "Free",
      credits: 0,
      earlyAccess: false,
      features: ["Browse available drops", "Pay per box at listed price ($3–5)"],
    },
    {
      id: "basic",
      name: "Rescue Member",
      comingSoon: true,
      monthlyPrice: "$15 / mo",
      annualPrice: "$12 / mo",
      credits: 7,
      earlyAccess: false,
      features: ["7 Fresh Credits per month", "Use credits at checkout", "Reservation history"],
    },
    {
      id: "premium",
      name: "Rescue Premium",
      comingSoon: true,
      monthlyPrice: "$30 / mo",
      annualPrice: "$24 / mo",
      credits: 15,
      earlyAccess: true,
      features: [
        "15 Fresh Credits per month",
        "Early access to drops",
        "Priority waitlist position",
        "Everything in Member",
      ],
    },
  ];

  const COMPARISON: {
    feature: string;
    free: boolean | string;
    basic: boolean | string;
    premium: boolean | string;
  }[] = [
    { feature: "Browse & reserve", free: true, basic: true, premium: true },
    { feature: "Monthly credits", free: "-", basic: "7", premium: "15" },
    { feature: "Pay per box ($3–5)", free: true, basic: true, premium: true },
    { feature: "Early access (30 min)", free: false, basic: false, premium: true },
    { feature: "Priority waitlist", free: false, basic: false, premium: true },
    { feature: "Impact tracking", free: false, basic: true, premium: true },
  ];

  let selectedPlan = $state<Plan>(appStore.user.membership?.plan ?? "none");
  let saved = $state(false);
  let billingCycle = $state<"monthly" | "annual">("monthly");
  let showWhyUpgrade = $state(false);
  let showEarlyAccessTip = $state(false);
  let scrollY = $state(0);
  let scrollEl: HTMLDivElement | undefined = $state();

  onMount(() => {
    void (async () => {
      await authStore.bootstrap();
      await appStore.loadUser(authStore.userId);
      selectedPlan = appStore.user.membership?.plan ?? "none";
    })();
  });

  function handleScroll() {
    if (scrollEl) scrollY = scrollEl.scrollTop;
  }

  let currentPlanId = $derived(appStore.user.membership?.plan ?? "none");
  let planChanged = $derived(selectedPlan !== currentPlanId);
  let headerScrolled = $derived(scrollY > 40);

  function actionLabel(): string {
    if (saved) return "Saved!";
    if (!planChanged) return "Plan is up to date";
    return `Switch to ${PLANS.find((p) => p.id === selectedPlan)?.name ?? ""}`;
  }

  async function handleAction() {
    if (!planChanged) return;
    const userId = authStore.userId;
    let membership: Membership | null = null;
    let creditsRemaining = 0;

    if (selectedPlan === "basic") {
      membership = {
        plan: "basic",
        monthlyPrice: 14.99,
        creditsPerMonth: 7,
        earlyAccess: false,
        monthsUnderUsed: 0,
      };
      creditsRemaining = 7;
    } else if (selectedPlan === "premium") {
      membership = {
        plan: "premium",
        monthlyPrice: 24.99,
        creditsPerMonth: 15,
        earlyAccess: true,
        monthsUnderUsed: 0,
      };
      creditsRemaining = 15;
    }

    await appStore.handleUpdatePlan(userId, membership, creditsRemaining);
    saved = true;
    setTimeout(() => (saved = false), 2500);
  }

  async function handleSignOut() {
    await signOut();
    await goto("/auth");
  }

  function handleSignIn() {
    goto("/auth");
  }

  function handleAdminAccess() {
    goto("/admin/login");
  }
</script>

<div class="min-h-screen flex flex-col" style="background-color: #F9F6F1">
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
      <div></div>
    </div>

    <div class="mb-1">
      <h1
        style="font-size: clamp(1.25rem, 5vw, 1.5rem); font-weight: 600; color: #1A1A1A; letter-spacing: -0.02em"
      >
        {appStore.user.hasAccount ? "My Account" : "Profile"}
      </h1>
      <p style="font-size: 14px; color: rgba(26,26,26,0.55); margin-top: 2px">
        {appStore.user.hasAccount
          ? "Membership, credits, and preferences"
          : "Create an account to unlock perks"}
      </p>
    </div>
  </div>

  <div
    class="flex-1 px-4 py-3 space-y-4 overflow-y-auto pb-28"
    bind:this={scrollEl}
    onscroll={handleScroll}
  >
    <!-- Account status card -->
    <Motion
      let:motion
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
    >
      <div
        use:motion
        class="rounded-2xl p-4 shadow-sm"
        style="background-color: white; border: 1px solid rgba(0,104,56,0.1)"
      >
        <div class="flex items-center gap-3">
          <div
            class="w-11 h-11 rounded-full flex items-center justify-center"
            style="background-color: #E8F5EE"
          >
            <User class="w-5 h-5" style="color: #006838" />
          </div>
          <div class="flex-1 min-w-0">
            <p style="font-size: 0.9rem; font-weight: 700; color: #1C2B1C">
              {authStore.authUser?.name || "UCI Student"}
            </p>
            {#if authStore.authUser?.email}
              <p style="font-size: 0.68rem; color: #B0A898; margin-top: 0">
                {authStore.authUser.email}
              </p>
            {/if}
            <p style="font-size: 0.73rem; color: #7A6B5A; margin-top: 1px">
              {#if appStore.user.membership}
                {appStore.user.membership.plan === "basic" ? "Rescue Member" : "Rescue Premium"} · {appStore
                  .user.creditsRemaining} credits left
              {:else}
                Free account · No active plan
              {/if}
            </p>
          </div>
          <div class="px-2.5 py-1 rounded-full" style="background-color: #E8F5EE">
            <span style="font-size: 0.68rem; font-weight: 700; color: #006838">Active</span>
          </div>
        </div>
      </div>
    </Motion>

    <!-- Billing cycle toggle -->
    <Motion
      let:motion
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05, duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
    >
      <div
        use:motion
        class="flex items-center justify-center gap-1 p-1 rounded-full mx-auto w-fit"
        style="background-color: #EDE8E1"
      >
        <button
          onclick={() => (billingCycle = "monthly")}
          class="px-4 py-1.5 rounded-full transition-all"
          style="
            background-color: {billingCycle === 'monthly' ? 'white' : 'transparent'};
            color: {billingCycle === 'monthly' ? '#1C2B1C' : '#7A6B5A'};
            font-size: 0.78rem;
            font-weight: 600;
            box-shadow: {billingCycle === 'monthly' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none'};
          "
        >
          Monthly
        </button>
        <button
          onclick={() => (billingCycle = "annual")}
          class="px-4 py-1.5 rounded-full transition-all flex items-center gap-1"
          style="
            background-color: {billingCycle === 'annual' ? 'white' : 'transparent'};
            color: {billingCycle === 'annual' ? '#1C2B1C' : '#7A6B5A'};
            font-size: 0.78rem;
            font-weight: 600;
            box-shadow: {billingCycle === 'annual' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none'};
          "
        >
          Annual
          <span
            class="px-1.5 py-0.5 rounded-full"
            style="background-color: #E8F5EE; color: #006838; font-size: 0.58rem; font-weight: 700"
          >
            Save 20%
          </span>
        </button>
      </div>
    </Motion>

    <!-- Membership plan selection -->
    <Motion
      let:motion
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
    >
      <div use:motion>
        <p
          class="mb-3"
          style="font-size: 0.72rem; font-weight: 700; letter-spacing: 0.07em; text-transform: uppercase; color: #7A6B5A"
        >
          {appStore.user.hasAccount ? "Change Plan" : "Choose a Plan"}
        </p>
        <div class="space-y-3">
          {#each PLANS as plan}
            {@const isCurrent = plan.id === currentPlanId}
            {@const isSelected = plan.id === selectedPlan}
            {@const isFreeTier = plan.id === "none"}
            {@const isMostPopular = plan.id === "basic"}
            {@const isPaidPlan = plan.id !== "none"}
            {@const isLockedForGuest = authStore.isGuest && isPaidPlan}
            {@const isComingSoon = plan.comingSoon === true}
            {@const price = billingCycle === "annual" ? plan.annualPrice : plan.monthlyPrice}
            <button
              onclick={() => {
                if (isLockedForGuest || isComingSoon) return;
                selectedPlan = plan.id;
              }}
              class="w-full text-left rounded-2xl p-4 transition-all active:scale-[0.99] relative"
              style="
                background-color: {isLockedForGuest
                ? '#F5F1EB'
                : isSelected
                  ? isFreeTier
                    ? '#F5F1EB'
                    : '#E8F5EE'
                  : isFreeTier
                    ? '#FAFAF8'
                    : 'white'};
                border: 2px solid {isLockedForGuest
                ? 'rgba(0,0,0,0.06)'
                : isSelected
                  ? '#006838'
                  : isFreeTier
                    ? 'rgba(0,0,0,0.06)'
                    : 'rgba(0,104,56,0.1)'};
                box-shadow: {isSelected && !isLockedForGuest
                ? '0 2px 12px rgba(0,104,56,0.1)'
                : '0 1px 4px rgba(0,0,0,0.04)'};
                opacity: {isLockedForGuest || isComingSoon ? 0.6 : isFreeTier && !isSelected ? 0.85 : 1};
                cursor: {isLockedForGuest || isComingSoon ? 'default' : 'pointer'};
              "
            >
              <!-- Locked badge for guests -->
              {#if isLockedForGuest && !isComingSoon}
                <div
                  class="absolute -top-2.5 right-4 px-2 py-0.5 rounded-full flex items-center gap-1"
                  style="background-color: #EDE8E1; color: #7A6B5A; font-size: 0.58rem; font-weight: 700"
                >
                  <Lock class="w-2.5 h-2.5" />
                  Account required
                </div>
              {/if}

              <!-- Coming soon badge -->
              {#if isComingSoon}
                <div
                  class="absolute -top-2.5 right-4 px-2 py-0.5 rounded-full flex items-center gap-1"
                  style="background-color: #EDE8E1; color: #7A6B5A; font-size: 0.58rem; font-weight: 700"
                >
                  <Lock class="w-2.5 h-2.5" />
                  Coming soon
                </div>
              {/if}

              <!-- Most Popular badge -->
              {#if isMostPopular && !isComingSoon}
                <div
                  class="absolute -top-2.5 left-4 px-2.5 py-0.5 rounded-full"
                  style="background-color: #006838; color: white; font-size: 0.6rem; font-weight: 700"
                >
                  Most Popular
                </div>
              {/if}

              <div class="flex items-start gap-3">
                <div
                  class="w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 shrink-0"
                  style="
                    border-color: {isSelected ? '#006838' : '#C4B9A8'};
                    background-color: {isSelected ? '#006838' : 'transparent'};
                  "
                >
                  {#if isSelected}
                    <div class="w-2 h-2 rounded-full bg-white"></div>
                  {/if}
                </div>

                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 flex-wrap">
                    <p
                      style="font-size: {isFreeTier
                        ? '0.85rem'
                        : '0.9rem'}; font-weight: 700; color: #1C2B1C"
                    >
                      {plan.name}
                    </p>
                    {#if isCurrent}
                      <span
                        class="px-1.5 py-0.5 rounded-full"
                        style="background-color: #006838; color: white; font-size: 0.58rem; font-weight: 700"
                      >
                        Current
                      </span>
                    {/if}
                    {#if plan.earlyAccess}
                      <span
                        role="button"
                        tabindex="0"
                        onclick={(e) => {
                          e.stopPropagation();
                          showEarlyAccessTip = !showEarlyAccessTip;
                        }}
                        onkeydown={(e) => {
                          if (e.key === "Enter") {
                            e.stopPropagation();
                            showEarlyAccessTip = !showEarlyAccessTip;
                          }
                        }}
                        class="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full cursor-pointer"
                        style="background-color: #FEF3C7; color: #92400E; font-size: 0.58rem; font-weight: 700"
                      >
                        <Zap class="w-2.5 h-2.5" />
                        Early Access
                        <Info class="w-2.5 h-2.5 ml-0.5" />
                      </span>
                    {/if}
                  </div>

                  <!-- Early access tooltip -->
                  {#if plan.earlyAccess && showEarlyAccessTip}
                    <Motion
                      let:motion
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      <div
                        use:motion
                        class="mt-1 px-2.5 py-1.5 rounded-lg"
                        style="background-color: #FEF3C7; border: 1px solid #FCD34D"
                      >
                        <p style="font-size: 0.68rem; color: #92400E">
                          Reserve 30 minutes before general release. Be first in line for every
                          drop.
                        </p>
                      </div>
                    </Motion>
                  {/if}

                  <p
                    style="font-size: {isFreeTier
                      ? '0.9rem'
                      : '1rem'}; font-weight: 900; color: #006838; margin-top: 2px"
                  >
                    {price}
                  </p>

                  {#if plan.credits > 0}
                    <p
                      style="font-size: 0.72rem; color: #8B6F47; font-weight: 600; margin-top: 1px"
                    >
                      {plan.credits} Fresh Credits/month - use like cash at checkout
                    </p>
                  {/if}

                  {#if plan.id !== "none"}
                    <p style="font-size: 0.65rem; color: #B0A898; margin-top: 2px">
                      Cancel anytime
                    </p>
                  {/if}

                  <div class="mt-2 space-y-1">
                    {#each plan.features as feature}
                      <div class="flex items-center gap-1.5">
                        <CheckCircle2
                          class="w-3 h-3 shrink-0"
                          style="color: {isSelected ? '#006838' : '#C4B9A8'}"
                        />
                        <span style="font-size: 0.72rem; color: #7A6B5A">{feature}</span>
                      </div>
                    {/each}
                  </div>
                </div>
              </div>
            </button>
          {/each}
        </div>
      </div>
    </Motion>

    <!-- Social proof -->
    <Motion
      let:motion
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
    >
      <div use:motion class="flex items-center justify-center gap-2 py-2">
        <Users class="w-3.5 h-3.5" style="color: #006838" />
        <p style="font-size: 0.75rem; color: #006838; font-weight: 600">
          94 students are on Rescue Member
        </p>
      </div>
    </Motion>

    <!-- Mini comparison table -->
    <Motion
      let:motion
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.18, duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
    >
      <div
        use:motion
        class="rounded-2xl overflow-hidden shadow-sm"
        style="background-color: white; border: 1px solid rgba(0,104,56,0.1)"
      >
        <div class="px-4 py-3" style="border-bottom: 1px solid #F0EBE3">
          <p style="font-size: 0.78rem; font-weight: 700; color: #1C2B1C">Plan Comparison</p>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full" style="font-size: 0.68rem">
            <thead>
              <tr style="border-bottom: 1px solid #F0EBE3">
                <th class="text-left px-3 py-2" style="color: #7A6B5A; font-weight: 600">Feature</th
                >
                <th class="text-center px-2 py-2" style="color: #7A6B5A; font-weight: 600">Free</th>
                <th class="text-center px-2 py-2" style="color: #006838; font-weight: 700"
                  >Member</th
                >
                <th class="text-center px-2 py-2" style="color: #8B6F47; font-weight: 700"
                  >Premium</th
                >
              </tr>
            </thead>
            <tbody>
              {#each COMPARISON as row, i}
                <tr
                  style="border-bottom: {i < COMPARISON.length - 1 ? '1px solid #F8F5F0' : 'none'}"
                >
                  <td class="px-3 py-2" style="color: #4A3728">{row.feature}</td>
                  {#each ["free", "basic", "premium"] as const as col}
                    {@const val = row[col]}
                    <td class="text-center px-2 py-2">
                      {#if typeof val === "boolean"}
                        {#if val}
                          <CheckCircle2 class="w-3.5 h-3.5 mx-auto" style="color: #006838" />
                        {:else}
                          <span style="color: #D5CFC7">&ndash;</span>
                        {/if}
                      {:else}
                        <span style="font-weight: 700; color: #006838">{val}</span>
                      {/if}
                    </td>
                  {/each}
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>
    </Motion>

    <!-- Why upgrade? collapsible -->
    <Motion
      let:motion
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
    >
      <div
        use:motion
        class="rounded-2xl overflow-hidden shadow-sm"
        style="background-color: white; border: 1px solid rgba(0,104,56,0.1)"
      >
        <button
          onclick={() => (showWhyUpgrade = !showWhyUpgrade)}
          class="w-full flex items-center justify-between px-4 py-3"
        >
          <span style="font-size: 0.82rem; font-weight: 700; color: #1C2B1C">Why upgrade?</span>
          <ChevronDown
            class="w-4 h-4 transition-transform"
            style="color: #7A6B5A; transform: {showWhyUpgrade ? 'rotate(180deg)' : 'rotate(0)'}"
          />
        </button>
        {#if showWhyUpgrade}
          <Motion
            let:motion
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div use:motion class="overflow-hidden">
              <div class="px-4 pb-4 space-y-2">
                {#each ["Save up to 40% versus pay-per-box pricing over a month", "Never miss a drop with early access and priority waitlist", "Track your environmental impact and food rescue history", "Credits roll over for one month if unused"] as item}
                  <div class="flex items-start gap-2">
                    <CheckCircle2 class="w-3.5 h-3.5 mt-0.5 shrink-0" style="color: #006838" />
                    <p style="font-size: 0.75rem; color: #7A6B5A; line-height: 1.4">{item}</p>
                  </div>
                {/each}
              </div>
            </div>
          </Motion>
        {/if}
      </div>
    </Motion>

    <!-- Action button -->
    <Motion
      let:motion
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25, duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
    >
      <div use:motion>
        <button
          onclick={handleAction}
          disabled={!planChanged}
          class="w-full py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
          style="
            background-color: {saved ? '#004D28' : !planChanged ? '#EDE8E1' : '#006838'};
            color: {!planChanged && !saved ? '#7A6B5A' : 'white'};
            font-size: 1rem;
            font-weight: 700;
            box-shadow: {!planChanged ? 'none' : '0 4px 20px rgba(0,104,56,0.28)'};
            cursor: {!planChanged ? 'default' : 'pointer'};
          "
        >
          {#if saved}
            <CheckCircle2 class="w-5 h-5" />
            Saved!
          {:else}
            {actionLabel()}
          {/if}
        </button>
      </div>
    </Motion>

    <!-- Additional settings -->
    <Motion
      let:motion
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
    >
      <div
        use:motion
        class="rounded-2xl overflow-hidden shadow-sm"
        style="background-color: white; border: 1px solid rgba(0,104,56,0.1)"
      >
        <div>
          <div class="flex items-center gap-3 p-4">
            <div
              class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style="background-color: #F5F1EB"
            >
              <CreditCard class="w-4 h-4" style="color: #8B6F47" />
            </div>
            <div class="flex-1 text-left">
              <p style="font-size: 0.875rem; font-weight: 600; color: #1C2B1C">Payment Method</p>
              <p style="font-size: 0.72rem; color: #7A6B5A">
                {appStore.user.hasCardSaved
                  ? `Card ending in ${appStore.user.cardLast4}`
                  : "No saved card"}
              </p>
            </div>
          </div>
          <div style="height: 1px; background-color: #F0EBE3; margin-left: 60px"></div>
        </div>
        <div class="p-4">
          <div class="flex items-center gap-3 mb-2">
            <div
              class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style="background-color: #F5F1EB"
            >
              <Shield class="w-4 h-4" style="color: #8B6F47" />
            </div>
            <p style="font-size: 0.875rem; font-weight: 600; color: #1C2B1C">Privacy & Data</p>
          </div>
          <p style="font-size: 0.72rem; color: #7A6B5A; line-height: 1.5; padding-left: 44px">
            EcoPlate collects only the data necessary to operate the UCI food rescue program: your
            name, email, reservation history, and payment information. We do not sell or share your
            data with third parties. You may request deletion of your account and associated data at
            any time by contacting the EcoPlate team.
          </p>
        </div>
      </div>
    </Motion>

    <!-- Privacy note -->
    <p class="text-center pb-2" style="font-size: 0.7rem; color: #7A6B5A">
      EcoPlate is not intended for collecting sensitive personal information. Data is used solely
      for the UCI food rescue program.
    </p>

    <!-- Sign out (authenticated users) -->
    {#if !authStore.isGuest}
      <Motion
        let:motion
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
      >
        <div use:motion>
          <button
            onclick={handleSignOut}
            class="w-full py-3.5 rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
            style="background-color: white; color: #C0392B; font-size: 0.9rem; font-weight: 600; border: 1px solid rgba(192,57,43,0.15);"
          >
            <LogOut class="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </Motion>
    {/if}

    <!-- Sign in (guest users) -->
    {#if authStore.isGuest}
      <Motion
        let:motion
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
      >
        <div use:motion>
          <button
            onclick={handleSignIn}
            class="w-full py-3.5 rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
            style="background-color: #006838; color: white; font-size: 0.9rem; font-weight: 700; box-shadow: 0 4px 20px rgba(0,104,56,0.3);"
          >
            <User class="w-4 h-4" />
            Sign In or Create Account
          </button>
        </div>
      </Motion>
    {/if}

    <!-- Staff access - barely visible -->
    <button
      onclick={handleAdminAccess}
      class="w-full py-2 text-center"
      style="font-size: 0.62rem; color: rgba(176,168,152,0.35); font-weight: 500; letter-spacing: 0.02em; background: none; border: none;"
    >
      Staff Portal
    </button>
  </div>
</div>
