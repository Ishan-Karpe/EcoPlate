<script lang="ts">
  import { onMount } from "svelte";
  import { Motion } from "svelte-motion";
  import {
    Package,
    CheckCircle2,
    TrendingUp,
    Star,
    Plus,
    ScanLine,
    ArrowLeft,
    Leaf,
    UserX,
    AlertTriangle,
    ArrowUpRight,
    BarChart2,
    Settings2,
  } from "lucide-svelte";
  import { adminStore } from "$lib/stores/admin.svelte";
  import { appStore } from "$lib/stores/app.svelte";
  import { formatTime } from "$lib/utils";
  import EcoplateLogo from "$lib/components/EcoplateLogo.svelte";
  import ImageWithFallback from "$lib/components/ImageWithFallback.svelte";

  // svelte5-chartjs keeps a Svelte component API while supporting Svelte 5.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let LineChart = $state<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let BarChart = $state<any>(null);
  let chartReady = $state(false);

  type TabKey = "overview" | "analytics" | "forecast";

  let activeTab = $state<TabKey>("overview");
  let chartView = $state<"bar" | "area">("area");
  let hoveredDay = $state<string | null>(null);

  const tabs: { key: TabKey; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "analytics", label: "Analytics" },
    { key: "forecast", label: "Forecast" },
  ];

  let stats = $derived(adminStore.stats);
  let drops = $derived(appStore.drops);
  let visibleDrops = $derived(
    drops.filter((d) => d.status === "active" || d.status === "upcoming")
  );
  let selectedDay = $derived(
    hoveredDay ? (stats.recentDrops.find((d) => d.date === hoveredDay) ?? null) : null
  );

  onMount(async () => {
    // Load chart libs dynamically (browser-only) then fetch data
    const [chartModule, svelteChartModule] = await Promise.all([
      import("chart.js"),
      import("svelte5-chartjs"),
    ]);

    const {
      Chart,
      Tooltip,
      CategoryScale,
      LinearScale,
      LineElement,
      PointElement,
      LineController,
      BarElement,
      BarController,
      Filler,
    } = chartModule;

    Chart.register(
      CategoryScale,
      LinearScale,
      LineElement,
      PointElement,
      LineController,
      BarElement,
      BarController,
      Filler,
      Tooltip
    );

    LineChart = svelteChartModule.Line;
    BarChart = svelteChartModule.Bar;
    chartReady = true;

    await Promise.all([adminStore.loadStats(), appStore.loadDrops()]);
  });

  // --- Chart data (reactive) ---
  let lineData = $derived({
    labels: stats.recentDrops.map((d) => d.date),
    datasets: [
      {
        label: "Posted",
        data: stats.recentDrops.map((d) => d.posted),
        borderColor: "#8B6F47",
        borderWidth: 2,
        pointRadius: 3,
        pointBackgroundColor: "#8B6F47",
        backgroundColor: "rgba(139,111,71,0.2)",
        fill: true,
        tension: 0.4,
      },
      {
        label: "Picked Up",
        data: stats.recentDrops.map((d) => d.pickedUp),
        borderColor: "#006838",
        borderWidth: 2.5,
        pointRadius: 3,
        pointBackgroundColor: "#006838",
        backgroundColor: "rgba(0,104,56,0.25)",
        fill: true,
        tension: 0.4,
      },
    ],
  });

  let barData = $derived({
    labels: stats.recentDrops.map((d) => d.date),
    datasets: [
      {
        label: "Posted",
        data: stats.recentDrops.map((d) => d.posted),
        backgroundColor: stats.recentDrops.map((d) =>
          d.date === hoveredDay ? "rgba(139,111,71,1)" : "rgba(139,111,71,0.25)"
        ),
        borderRadius: 4,
      },
      {
        label: "Picked Up",
        data: stats.recentDrops.map((d) => d.pickedUp),
        backgroundColor: stats.recentDrops.map((d) =>
          d.date === hoveredDay ? "#006838" : "rgba(0,104,56,0.5)"
        ),
        borderRadius: 4,
      },
    ],
  });

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "white",
        titleColor: "#1C2B1C",
        bodyColor: "#7A6B5A",
        borderColor: "rgba(0,104,56,0.15)",
        borderWidth: 1,
        padding: 10,
        cornerRadius: 8,
      },
    },
    scales: {
      x: {
        grid: { color: "rgba(0,104,56,0.06)" },
        ticks: { color: "#7A6B5A", font: { size: 11 } },
        border: { display: false },
      },
      y: { display: false },
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onHover: (_event: any, elements: Array<{ index: number }>) => {
      if (elements.length > 0) {
        hoveredDay = stats.recentDrops[elements[0].index]?.date ?? null;
      } else {
        hoveredDay = null;
      }
    },
  };
</script>

<div class="min-h-screen flex flex-col" style="background-color: #F9F6F1;">
  <!-- ── Header ── -->
  <div class="px-5 pt-12 pb-5 rounded-b-[2rem] shadow-sm" style="background-color: #006838;">
    <div class="flex items-center justify-between mb-4">
      <EcoplateLogo
        label="EcoPlate Staff"
        subLabel="Admin Dashboard"
        textColor="white"
        subTextColor="rgba(255,255,255,0.6)"
      />

      <button
        onclick={() => adminStore.handleAdminLogout()}
        class="flex items-center gap-1 text-white/70 px-3 py-1.5 rounded-full border border-white/20 active:bg-white/10"
        style="font-size: 0.8rem;"
      >
        <ArrowLeft class="w-3.5 h-3.5" />
        Exit
      </button>
    </div>

    <!-- Quick actions -->
    <div class="grid grid-cols-4 gap-2">
      <a
        href="/admin/drops/new"
        class="rounded-xl py-3 flex items-center justify-center gap-1.5 active:scale-[0.96] transition-transform"
        style="background-color: rgba(255,255,255,0.18);"
      >
        <span class="text-white"><Plus class="w-4 h-4" /></span>
        <span class="text-white" style="font-size: 0.78rem; font-weight: 600;">New Drop</span>
      </a>
      <a
        href="/admin/redeem"
        class="rounded-xl py-3 flex items-center justify-center gap-1.5 active:scale-[0.96] transition-transform"
        style="background-color: rgba(255,255,255,0.18);"
      >
        <span class="text-white"><ScanLine class="w-4 h-4" /></span>
        <span class="text-white" style="font-size: 0.78rem; font-weight: 600;">Redeem</span>
      </a>
      <a
        href="/admin/no-shows"
        class="rounded-xl py-3 flex items-center justify-center gap-1.5 active:scale-[0.96] transition-transform"
        style="background-color: rgba(255,255,255,0.18);"
      >
        <span class="text-white"><UserX class="w-4 h-4" /></span>
        <span class="text-white" style="font-size: 0.78rem; font-weight: 600;">No-shows</span>
      </a>
      <a
        href="/admin/drops"
        class="rounded-xl py-3 flex items-center justify-center gap-1.5 active:scale-[0.96] transition-transform"
        style="background-color: rgba(255,255,255,0.18);"
      >
        <span class="text-white"><Settings2 class="w-4 h-4" /></span>
        <span class="text-white" style="font-size: 0.78rem; font-weight: 600;">Manage</span>
      </a>
    </div>
  </div>

  <!-- ── Tabs ── -->
  <div class="px-4 pt-4">
    <div class="flex rounded-2xl p-1" style="background-color: #EDE8E1;">
      {#each tabs as tab}
        <button
          onclick={() => {
            activeTab = tab.key;
          }}
          class="flex-1 py-2 rounded-xl transition-all"
          style="background-color: {activeTab === tab.key
            ? 'white'
            : 'transparent'}; color: {activeTab === tab.key
            ? '#006838'
            : '#7A6B5A'}; font-size: 0.8rem; font-weight: 700; box-shadow: {activeTab === tab.key
            ? '0 2px 8px rgba(0,0,0,0.08)'
            : 'none'};"
        >
          {tab.label}
        </button>
      {/each}
    </div>
  </div>

  <!-- ── Tab content ── -->
  {#key activeTab}
    <Motion
      let:motion
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div use:motion class="flex-1 px-4 py-4 space-y-4 overflow-y-auto pb-10">
        {#if activeTab === "overview"}
          <!-- Active drops section -->
          {#if visibleDrops.length > 0}
            <Motion let:motion initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div use:motion>
                <p
                  style="font-size: 0.78rem; font-weight: 600; color: #7A6B5A; margin-bottom: 8px;"
                >
                  Active Tonight
                </p>
                <div class="space-y-2">
                  {#each visibleDrops as drop (drop.id)}
                    <div
                      class="rounded-xl overflow-hidden flex items-stretch shadow-sm"
                      style="background-color: white; border: 1px solid rgba(0,104,56,0.1);"
                    >
                      <div class="w-16 h-16 shrink-0 overflow-hidden">
                        <ImageWithFallback
                          src={drop.imageUrl}
                          alt={drop.location}
                          class="w-full h-full object-cover"
                        />
                      </div>
                      <div class="flex-1 px-3 py-2 flex items-center justify-between min-w-0">
                        <div class="min-w-0">
                          <p
                            style="font-size: 0.8rem; font-weight: 700; color: #1C2B1C;"
                            class="truncate"
                          >
                            {drop.location}
                          </p>
                          <p style="font-size: 0.7rem; color: #7A6B5A;">
                            {formatTime(drop.windowStart)}–{formatTime(drop.windowEnd)}
                          </p>
                        </div>
                        <div class="text-right ml-2 shrink-0">
                          <p style="font-size: 0.9rem; font-weight: 800; color: #006838;">
                            {drop.remainingBoxes}/{drop.totalBoxes}
                          </p>
                          <p style="font-size: 0.65rem; color: #7A6B5A;">remaining</p>
                        </div>
                      </div>
                    </div>
                  {/each}
                </div>
              </div>
            </Motion>
          {/if}

          <!-- Stats Grid -->
          <Motion
            let:motion
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <div use:motion class="grid grid-cols-3 gap-2">
              <!-- Posted -->
              <div
                class="rounded-xl p-3 shadow-sm"
                style="background-color: white; border: 1px solid rgba(0,104,56,0.1);"
              >
                <div class="flex items-center gap-1.5 mb-1">
                  <Package class="w-3.5 h-3.5" style="color: #006838;" />
                  <span style="font-size: 0.6rem; font-weight: 500; color: #7A6B5A;">Posted</span>
                </div>
                <p style="font-size: 1.375rem; font-weight: 800; color: #1C2B1C;">
                  {stats.totalBoxesPosted}
                </p>
              </div>
              <!-- Picked Up -->
              <div
                class="rounded-xl p-3 shadow-sm"
                style="background-color: white; border: 1px solid rgba(0,104,56,0.1);"
              >
                <div class="flex items-center gap-1.5 mb-1">
                  <CheckCircle2 class="w-3.5 h-3.5" style="color: #006838;" />
                  <span style="font-size: 0.6rem; font-weight: 500; color: #7A6B5A;">Picked Up</span
                  >
                </div>
                <p style="font-size: 1.375rem; font-weight: 800; color: #1C2B1C;">
                  {stats.totalBoxesPickedUp}
                </p>
              </div>
              <!-- Pickup Rate -->
              <div
                class="rounded-xl p-3 shadow-sm"
                style="background-color: white; border: 1px solid rgba(0,104,56,0.1);"
              >
                <div class="flex items-center gap-1.5 mb-1">
                  <TrendingUp class="w-3.5 h-3.5" style="color: #006838;" />
                  <span style="font-size: 0.6rem; font-weight: 500; color: #7A6B5A;"
                    >Pickup Rate</span
                  >
                </div>
                <p style="font-size: 1.375rem; font-weight: 800; color: #1C2B1C;">
                  {stats.pickupRate}%
                </p>
              </div>
              <!-- No-show -->
              <div
                class="rounded-xl p-3 shadow-sm"
                style="background-color: white; border: 1px solid rgba(0,104,56,0.1);"
              >
                <div class="flex items-center gap-1.5 mb-1">
                  <UserX class="w-3.5 h-3.5" style="color: #C0392B;" />
                  <span style="font-size: 0.6rem; font-weight: 500; color: #7A6B5A;">No-show</span>
                </div>
                <p style="font-size: 1.375rem; font-weight: 800; color: #1C2B1C;">
                  {stats.noShowRate}%
                </p>
              </div>
              <!-- Rating -->
              <div
                class="rounded-xl p-3 shadow-sm"
                style="background-color: white; border: 1px solid rgba(0,104,56,0.1);"
              >
                <div class="flex items-center gap-1.5 mb-1">
                  <Star class="w-3.5 h-3.5" style="color: #F59E0B;" />
                  <span style="font-size: 0.6rem; font-weight: 500; color: #7A6B5A;">Rating</span>
                </div>
                <p style="font-size: 1.375rem; font-weight: 800; color: #1C2B1C;">
                  {stats.avgRating}
                </p>
              </div>
              <!-- Drops -->
              <div
                class="rounded-xl p-3 shadow-sm"
                style="background-color: white; border: 1px solid rgba(0,104,56,0.1);"
              >
                <div class="flex items-center gap-1.5 mb-1">
                  <Leaf class="w-3.5 h-3.5" style="color: #006838;" />
                  <span style="font-size: 0.6rem; font-weight: 500; color: #7A6B5A;">Drops</span>
                </div>
                <p style="font-size: 1.375rem; font-weight: 800; color: #1C2B1C;">
                  {stats.totalDrops}
                </p>
              </div>
            </div>
          </Motion>

          <!-- Location caps -->
          <Motion
            let:motion
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div
              use:motion
              class="rounded-xl p-4 shadow-sm"
              style="background-color: white; border: 1px solid rgba(0,104,56,0.1);"
            >
              <div class="flex items-center gap-2 mb-3">
                <AlertTriangle class="w-4 h-4" style="color: #D97706;" />
                <span style="font-size: 0.8rem; font-weight: 600; color: #1C2B1C;">
                  Daily Caps by Location
                </span>
              </div>
              <div class="space-y-2">
                {#each stats.locationCaps as cap (cap.location)}
                  <div
                    class="flex items-center justify-between py-1.5"
                    style="border-bottom: 1px solid rgba(0,104,56,0.08);"
                  >
                    <div>
                      <p style="font-size: 0.8rem; font-weight: 500; color: #1C2B1C;">
                        {cap.location}
                      </p>
                      <p style="font-size: 0.65rem;">
                        {#if cap.consecutiveWeeksAbove85 >= 2}
                          <span class="flex items-center gap-0.5" style="color: #006838;">
                            <ArrowUpRight class="w-3 h-3" />
                            Eligible for +10 increase
                          </span>
                        {:else}
                          <span style="color: #7A6B5A;">
                            {cap.consecutiveWeeksAbove85}/2 weeks above 85%
                          </span>
                        {/if}
                      </p>
                    </div>
                    <div class="text-right">
                      <p style="font-size: 0.9rem; font-weight: 700; color: #006838;">
                        {cap.currentCap}
                      </p>
                      <p style="font-size: 0.6rem; color: #7A6B5A;">boxes/day</p>
                    </div>
                  </div>
                {/each}
              </div>
            </div>
          </Motion>

          <!-- Environmental Impact -->
          <Motion
            let:motion
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <div
              use:motion
              class="rounded-xl p-4"
              style="background: linear-gradient(135deg, #E8F5EE 0%, #F0EBE3 100%); border: 1px solid rgba(0,104,56,0.2);"
            >
              <div class="flex items-center gap-2 mb-3">
                <Leaf class="w-4 h-4" style="color: #006838;" />
                <p style="font-size: 0.8rem; font-weight: 600; color: #004D28;">
                  Environmental Impact (Pilot)
                </p>
              </div>
              <div class="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p style="font-size: 1.25rem; font-weight: 800; color: #006838;">
                    {stats.totalBoxesPickedUp}
                  </p>
                  <p style="font-size: 0.65rem; color: #4A6B4A;">meals rescued</p>
                </div>
                <div>
                  <p style="font-size: 1.25rem; font-weight: 800; color: #006838;">
                    ~{Math.round(stats.totalBoxesPickedUp * 1.5)}
                  </p>
                  <p style="font-size: 0.65rem; color: #4A6B4A;">lbs diverted</p>
                </div>
                <div>
                  <p style="font-size: 1.25rem; font-weight: 800; color: #006838;">
                    ~{Math.round(stats.totalBoxesPickedUp * 1.5 * 0.68)}
                  </p>
                  <p style="font-size: 0.65rem; color: #4A6B4A;">kg CO2 saved</p>
                </div>
              </div>
            </div>
          </Motion>
        {:else if activeTab === "analytics"}
          <!-- Key metrics -->
          <div class="grid grid-cols-2 gap-3">
            <!-- Pickup rate card -->
            <div
              class="rounded-xl p-4 shadow-sm"
              style="background-color: white; border: 1px solid rgba(0,104,56,0.1);"
            >
              <div class="flex items-center gap-1.5 mb-1">
                <TrendingUp class="w-4 h-4" style="color: #006838;" />
                <span style="font-size: 0.7rem; font-weight: 600; color: #7A6B5A;">Pickup Rate</span
                >
              </div>
              <p style="font-size: 1.75rem; font-weight: 900; color: #006838;">
                {stats.pickupRate}%
              </p>
              <div
                class="mt-2 h-1.5 rounded-full overflow-hidden"
                style="background-color: #EDE8E1;"
              >
                <Motion
                  let:motion
                  initial={{ width: "0%" }}
                  animate={{ width: `${stats.pickupRate}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                >
                  <div
                    use:motion
                    class="h-full rounded-full"
                    style="background-color: #006838;"
                  ></div>
                </Motion>
              </div>
            </div>
            <!-- Avg rating card -->
            <div
              class="rounded-xl p-4 shadow-sm"
              style="background-color: white; border: 1px solid rgba(0,104,56,0.1);"
            >
              <div class="flex items-center gap-1.5 mb-1">
                <Star class="w-4 h-4" style="color: #F59E0B;" />
                <span style="font-size: 0.7rem; font-weight: 600; color: #7A6B5A;">Avg Rating</span>
              </div>
              <p style="font-size: 1.75rem; font-weight: 900; color: #1C2B1C;">
                {stats.avgRating}
              </p>
              <div class="flex gap-0.5 mt-2">
                {#each [1, 2, 3, 4, 5] as s (s)}
                  <div
                    class="h-1.5 flex-1 rounded-full"
                    style="background-color: {s <= Math.round(stats.avgRating)
                      ? '#F59E0B'
                      : '#EDE8E1'};"
                  ></div>
                {/each}
              </div>
            </div>
          </div>

          <!-- Weekly chart -->
          <div
            class="rounded-xl p-4 shadow-sm"
            style="background-color: white; border: 1px solid rgba(0,104,56,0.1);"
          >
            <div class="flex items-center justify-between mb-1">
              <div class="flex items-center gap-2">
                <BarChart2 class="w-4 h-4" style="color: #006838;" />
                <span style="font-size: 0.875rem; font-weight: 700; color: #1C2B1C;">This Week</span
                >
              </div>
              <div class="flex rounded-lg p-0.5" style="background-color: #F5F1EB;">
                {#each ["area", "bar"] as const as v (v)}
                  <button
                    onclick={() => {
                      chartView = v;
                    }}
                    class="px-2.5 py-1 rounded-md transition-all"
                    style="background-color: {chartView === v
                      ? 'white'
                      : 'transparent'}; color: {chartView === v
                      ? '#006838'
                      : '#7A6B5A'}; font-size: 0.7rem; font-weight: 600; box-shadow: {chartView ===
                    v
                      ? '0 1px 4px rgba(0,0,0,0.08)'
                      : 'none'};"
                  >
                    {v === "area" ? "Trend" : "Bar"}
                  </button>
                {/each}
              </div>
            </div>

            <!-- Selected day detail panel -->
            <div
              style="height: 52px; margin-bottom: 8px; opacity: {selectedDay
                ? 1
                : 0}; transition: opacity 0.18s ease; pointer-events: {selectedDay
                ? 'auto'
                : 'none'};"
            >
              <div class="flex gap-3 p-2 rounded-xl h-full" style="background-color: #E8F5EE;">
                <div class="text-center">
                  <p style="font-size: 0.65rem; color: #7A6B5A;">Posted</p>
                  <p style="font-size: 0.9rem; font-weight: 700; color: #1C2B1C;">
                    {selectedDay?.posted ?? "-"}
                  </p>
                </div>
                <div class="text-center">
                  <p style="font-size: 0.65rem; color: #7A6B5A;">Picked Up</p>
                  <p style="font-size: 0.9rem; font-weight: 700; color: #006838;">
                    {selectedDay?.pickedUp ?? "-"}
                  </p>
                </div>
                <div class="text-center">
                  <p style="font-size: 0.65rem; color: #7A6B5A;">No-shows</p>
                  <p style="font-size: 0.9rem; font-weight: 700; color: #C0392B;">
                    {selectedDay?.noShows ?? "-"}
                  </p>
                </div>
                <div class="text-center">
                  <p style="font-size: 0.65rem; color: #7A6B5A;">Rate</p>
                  <p style="font-size: 0.9rem; font-weight: 700; color: #006838;">
                    {selectedDay
                      ? `${Math.round((selectedDay.pickedUp / Math.max(selectedDay.posted, 1)) * 100)}%`
                      : "-"}
                  </p>
                </div>
              </div>
            </div>

            <!-- Chart (client-only via dynamic import) -->
            <div style="height: 160px;">
              {#if chartReady && LineChart && BarChart}
                {#key chartView}
                  {@const ActiveChart = chartView === "area" ? LineChart : BarChart}
                  <ActiveChart
                    data={chartView === "area" ? lineData : barData}
                    options={chartOptions}
                  />
                {/key}
              {:else}
                <div class="flex items-center justify-center h-full">
                  <p style="font-size: 0.8rem; color: #7A6B5A;">Loading chart…</p>
                </div>
              {/if}
            </div>

            <!-- Legend -->
            <div
              class="flex items-center gap-4 mt-3 pt-3"
              style="border-top: 1px solid rgba(0,104,56,0.08);"
            >
              <div class="flex items-center gap-1.5">
                <div class="w-3 h-2 rounded-sm" style="background-color: #006838;"></div>
                <span style="font-size: 0.7rem; color: #7A6B5A;">Picked up</span>
              </div>
              <div class="flex items-center gap-1.5">
                <div class="w-3 h-2 rounded-sm" style="background-color: #8B6F47;"></div>
                <span style="font-size: 0.7rem; color: #7A6B5A;">Posted</span>
              </div>
              <div class="flex items-center gap-1.5">
                <div class="w-2 h-2 rounded-full" style="background-color: #C0392B;"></div>
                <span style="font-size: 0.7rem; color: #7A6B5A;">No-shows</span>
              </div>
            </div>
          </div>

          <!-- By Location -->
          <Motion
            let:motion
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div
              use:motion
              class="rounded-xl p-4 shadow-sm"
              style="background-color: white; border: 1px solid rgba(0,104,56,0.1);"
            >
              <p
                style="font-size: 0.875rem; font-weight: 700; color: #1C2B1C; margin-bottom: 12px;"
              >
                By Location
              </p>
              {#each stats.locationCaps as cap, i (cap.location)}
                {@const rate = 78 + i * 7}
                <div class="mb-3">
                  <div class="flex items-center justify-between mb-1">
                    <span style="font-size: 0.8rem; font-weight: 500; color: #4A3728;">
                      {cap.location}
                    </span>
                    <span style="font-size: 0.78rem; font-weight: 700; color: #006838;">
                      {rate}%
                    </span>
                  </div>
                  <div class="h-2 rounded-full overflow-hidden" style="background-color: #EDE8E1;">
                    <Motion
                      let:motion
                      initial={{ width: "0%" }}
                      animate={{ width: `${rate}%` }}
                      transition={{ duration: 0.8, delay: 0.2 + i * 0.1, ease: "easeOut" }}
                    >
                      <div
                        use:motion
                        class="h-full rounded-full"
                        style="background: linear-gradient(to right, #006838, {i % 2 === 0
                          ? '#009958'
                          : '#8B6F47'});"
                      ></div>
                    </Motion>
                  </div>
                </div>
              {/each}
            </div>
          </Motion>

          <!-- Food Rescue Impact -->
          <Motion
            let:motion
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <div
              use:motion
              class="rounded-xl p-4"
              style="background: linear-gradient(135deg, #E8F5EE 0%, #F0EBE3 100%); border: 1px solid rgba(0,104,56,0.2);"
            >
              <div class="flex items-center gap-2 mb-3">
                <Leaf class="w-4 h-4" style="color: #006838;" />
                <p style="font-size: 0.8rem; font-weight: 700; color: #004D28;">
                  Food Rescue Impact
                </p>
              </div>
              <div class="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p style="font-size: 1.1rem; font-weight: 800; color: #006838;">
                    {stats.totalBoxesPickedUp}
                  </p>
                  <p style="font-size: 0.65rem; color: #4A6B4A;">meals rescued</p>
                </div>
                <div>
                  <p style="font-size: 1.1rem; font-weight: 800; color: #006838;">
                    ~{Math.round(stats.totalBoxesPickedUp * 1.5)} lbs
                  </p>
                  <p style="font-size: 0.65rem; color: #4A6B4A;">food diverted</p>
                </div>
                <div>
                  <p style="font-size: 1.1rem; font-weight: 800; color: #006838;">
                    ~{Math.round(stats.totalBoxesPickedUp * 1.5 * 0.68)} kg
                  </p>
                  <p style="font-size: 0.65rem; color: #4A6B4A;">CO2 prevented</p>
                </div>
              </div>
            </div>
          </Motion>
        {:else}
          <!-- Forecast tab -->
          <Motion let:motion initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div
              use:motion
              class="flex flex-col items-center justify-center py-20 px-4 text-center"
            >
              <div
                class="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
                style="background-color: #E8F5EE;"
              >
                <TrendingUp class="w-8 h-8" style="color: #006838; opacity: 0.6;" />
              </div>
              <p
                style="font-size: 0.9375rem; font-weight: 500; color: #7A6B5A; line-height: 1.6; max-width: 280px;"
              >
                After 30+ days of data, Forecast v1 (ML-assisted) will be available.
              </p>
            </div>
          </Motion>
        {/if}
      </div>
    </Motion>
  {/key}
</div>
