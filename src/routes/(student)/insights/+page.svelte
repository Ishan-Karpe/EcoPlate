<script lang="ts">
  import { Motion } from "svelte-motion";
  import { Leaf, TrendingUp, Package, Share2, Target } from "lucide-svelte";
  import { appStore } from "$lib/stores/app.svelte";
  import { authStore } from "$lib/stores/auth.svelte";
  import { onMount } from "svelte";

  const MILESTONES = {
    meals: [5, 10, 25, 50, 100],
    savings: [10, 25, 50, 100, 250],
    food: [5, 10, 25, 50],
  };

  function getNextMilestone(value: number, milestones: number[]): number {
    for (const m of milestones) {
      if (value < m) return m;
    }
    return milestones[milestones.length - 1] * 2;
  }

  let shareMsg = $state(false);
  let scrollY = $state(0);
  let scrollEl: HTMLDivElement | undefined = $state();

  onMount(() => {
    void (async () => {
      await authStore.bootstrap();
      await appStore.loadUser(authStore.userId);
    })();
  });

  function handleScroll() {
    if (scrollEl) scrollY = scrollEl.scrollTop;
  }

  function handleShare() {
    const text = `I rescued ${appStore.user.totalPickups} meals with EcoPlate at UCI! Join me in fighting food waste.`;
    if (navigator.share) {
      navigator.share({ title: "EcoPlate Impact", text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text).catch(() => {});
      shareMsg = true;
      setTimeout(() => (shareMsg = false), 2000);
    }
  }

  let mealsRescued = $derived(appStore.user.totalPickups);
  let moneySaved = $derived(Math.round(mealsRescued * 4.4 * 10) / 10);
  let foodWaste = $derived((mealsRescued * 0.84).toFixed(1));
  let headerScrolled = $derived(scrollY > 40);

  let stats = $derived([
    {
      icon: "leaf" as const,
      bg: "#E8F5EE",
      value: appStore.user.totalPickups,
      label: "Meals Rescued",
      color: "#006838",
      milestone: getNextMilestone(appStore.user.totalPickups, MILESTONES.meals),
      progress: appStore.user.totalPickups,
      lighter: false,
      hideProgress: false,
    },
    {
      icon: "package" as const,
      bg: "#E8F5EE",
      value: `${foodWaste} lb`,
      label: "Food Rescued",
      color: "#006838",
      milestone: getNextMilestone(parseFloat(foodWaste), MILESTONES.food),
      progress: parseFloat(foodWaste),
      lighter: false,
      hideProgress: false,
    },
    {
      icon: "trending" as const,
      bg: "#FEF3C7",
      value: `$${moneySaved}`,
      label: "Estimated Savings",
      color: "#8B6F47",
      milestone: getNextMilestone(moneySaved, MILESTONES.savings),
      progress: moneySaved,
      lighter: true,
      hideProgress: false,
    },
    {
      icon: "target" as const,
      bg: "#E8F5EE",
      value: appStore.user.noShowCount,
      label: "No-shows",
      color: appStore.user.noShowCount > 0 ? "#C0392B" : "#006838",
      milestone: 0,
      progress: 0,
      lighter: false,
      hideProgress: true,
    },
  ]);
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
      <div class="flex items-center gap-2">
        <span style="font-size: 1rem; font-weight: 700; color: #006838">EcoPlate</span>
      </div>
      <button
        onclick={handleShare}
        class="relative p-2 rounded-full active:scale-[0.97]"
        style="background-color: transparent"
      >
        <Share2 class="w-5 h-5" style="color: rgba(26,26,26,0.55); stroke-width: 1.75" />
      </button>
    </div>

    <div class="mb-1">
      <h1
        style="font-size: clamp(1.25rem, 5vw, 1.5rem); font-weight: 600; color: #1A1A1A; letter-spacing: -0.02em"
      >
        My Impact
      </h1>
      <p style="font-size: 14px; color: rgba(26,26,26,0.55); margin-top: 2px">
        {#if appStore.user.totalPickups > 0}
          {appStore.user.totalPickups} meal{appStore.user.totalPickups !== 1 ? "s" : ""} rescued so far
        {:else}
          Your contribution to reducing food waste at UCI
        {/if}
      </p>
    </div>
    {#if shareMsg}
      <Motion
        let:motion
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <p use:motion style="font-size: 0.75rem; color: #006838; margin-top: 4px">
          Copied to clipboard!
        </p>
      </Motion>
    {/if}
  </div>

  <div
    class="flex-1 px-4 py-3 space-y-4 overflow-y-auto pb-28"
    bind:this={scrollEl}
    onscroll={handleScroll}
  >
    <!-- Personal impact stats grid -->
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
          Your Stats
        </p>
        <div class="grid grid-cols-2 gap-3">
          {#each stats as stat}
            <div
              class="rounded-2xl p-4 shadow-sm"
              style="
                background-color: {stat.lighter ? '#FFFCF5' : 'white'};
                border: 1px solid {stat.lighter ? 'rgba(139,111,71,0.12)' : 'rgba(0,104,56,0.1)'};
              "
            >
              <div
                class="w-8 h-8 rounded-lg flex items-center justify-center mb-2"
                style="background-color: {stat.bg}"
              >
                {#if stat.icon === "leaf"}
                  <Leaf class="w-4 h-4" style="color: #006838" />
                {:else if stat.icon === "package"}
                  <Package class="w-4 h-4" style="color: #006838" />
                {:else if stat.icon === "trending"}
                  <TrendingUp class="w-4 h-4" style="color: #8B6F47" />
                {:else}
                  <Target class="w-4 h-4" style="color: #006838" />
                {/if}
              </div>
              <p style="font-size: 1.5rem; font-weight: 900; color: {stat.color}; line-height: 1.1">
                {stat.value}
              </p>
              <p style="font-size: 0.68rem; color: #7A6B5A; font-weight: 600; margin-top: 3px">
                {stat.label}
              </p>
              <!-- Progress bar -->
              {#if !stat.hideProgress}
                <div class="mt-2">
                  <div
                    class="flex items-center justify-between mb-0.5"
                    style="font-size: 0.58rem; color: #B0A898"
                  >
                    <span>{stat.progress}</span>
                    <span>{stat.milestone}</span>
                  </div>
                  <div
                    class="w-full h-1.5 rounded-full overflow-hidden"
                    style="background-color: #EDE8E1"
                  >
                    <Motion
                      let:motion
                      initial={{ width: "0%" }}
                      animate={{
                        width: `${Math.min(100, stat.milestone > 0 ? (stat.progress / stat.milestone) * 100 : 0)}%`,
                      }}
                      transition={{ duration: 0.8, delay: 0.3 }}
                    >
                      <div
                        use:motion
                        class="h-full rounded-full"
                        style="background-color: {stat.color}"
                      ></div>
                    </Motion>
                  </div>
                </div>
              {/if}
            </div>
          {/each}
        </div>
      </div>
    </Motion>

    <!-- Membership / credits -->
    <Motion
      let:motion
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.18, duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
    >
      <div
        use:motion
        class="rounded-2xl p-4 shadow-sm"
        style="background-color: white; border: 1px solid rgba(0,104,56,0.1)"
      >
        <div class="flex items-center justify-between">
          <div>
            <p style="font-size: 0.875rem; font-weight: 700; color: #1C2B1C">
              {#if appStore.user.membership}
                {appStore.user.membership.plan === "basic" ? "Rescue Member" : "Rescue Premium"}
              {:else}
                Free Account
              {/if}
            </p>
            <p style="font-size: 0.75rem; color: #7A6B5A; margin-top: 2px">
              {#if appStore.user.membership}
                {appStore.user.creditsRemaining} credits remaining this month
              {:else}
                Upgrade for credits and early access
              {/if}
            </p>
          </div>
          {#if appStore.user.membership}
            <div class="px-3 py-1 rounded-full" style="background-color: #E8F5EE">
              <span style="font-size: 0.72rem; font-weight: 700; color: #006838">Active</span>
            </div>
          {:else}
            <div class="px-3 py-1 rounded-full" style="background-color: #F5F1EB">
              <span style="font-size: 0.72rem; font-weight: 600; color: #7A6B5A">Free</span>
            </div>
          {/if}
        </div>

        {#if appStore.user.membership}
          <div class="mt-3">
            <div
              class="flex items-center justify-between mb-1"
              style="font-size: 0.68rem; color: #7A6B5A"
            >
              <span>{appStore.user.creditsRemaining} left</span>
              <span>{appStore.user.membership.creditsPerMonth} total/mo</span>
            </div>
            <div class="w-full h-2 rounded-full overflow-hidden" style="background-color: #EDE8E1">
              <div
                class="h-full rounded-full transition-all"
                style="
                  width: {(appStore.user.creditsRemaining /
                  appStore.user.membership.creditsPerMonth) *
                  100}%;
                  background-color: #006838;
                "
              ></div>
            </div>
          </div>
        {/if}
      </div>
    </Motion>

    <!-- Empty state nudge -->
    {#if appStore.user.totalPickups === 0}
      <Motion
        let:motion
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25, duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
      >
        <div
          use:motion
          class="rounded-xl p-4 text-center"
          style="background-color: #E8F5EE; border: 1px solid rgba(0,104,56,0.2)"
        >
          <Leaf class="w-8 h-8 mx-auto mb-2" style="color: #006838; opacity: 0.5" />
          <p style="font-size: 0.875rem; font-weight: 600; color: #004D28">
            Your impact starts with your first box
          </p>
          <p class="mt-1" style="font-size: 0.78rem; color: #006838">
            Reserve a Rescue Box from the home screen to start tracking your stats.
          </p>
        </div>
      </Motion>
    {/if}
  </div>
</div>
