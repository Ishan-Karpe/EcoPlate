<script lang="ts">
  import { goto } from "$app/navigation";
  import { Motion } from "svelte-motion";
  import {
    GraduationCap,
    Store,
    CheckCircle2,
    ChevronRight,
    ArrowRight,
    Search,
    QrCode,
    ShoppingBag,
    Leaf,
  } from "lucide-svelte";
  import { markOnboardingComplete } from "$lib/auth";

  type OnboardingStep = "college" | "role" | "discover" | "reserve" | "pickup";
  type UserRole = "student" | "partner";

  const COLLEGES = [
    { name: "UC Irvine", available: true },
    { name: "UCLA", available: false },
    { name: "UC Berkeley", available: false },
    { name: "UC San Diego", available: false },
    { name: "UC Davis", available: false },
    { name: "UC Santa Barbara", available: false },
    { name: "UC Santa Cruz", available: false },
    { name: "UC Riverside", available: false },
    { name: "UC Merced", available: false },
  ] as const;

  const steps: OnboardingStep[] = ["college", "role", "discover", "reserve", "pickup"];

  let step = $state<OnboardingStep>("college");
  let selectedCollege = $state("UC Irvine");
  let collegeSearch = $state("");
  let showCollegeDropdown = $state(false);
  let selectedRole = $state<UserRole | null>(null);

  const filteredColleges = $derived(
    COLLEGES.filter((college) => college.name.toLowerCase().includes(collegeSearch.toLowerCase()))
  );
  const stepIndex = $derived(steps.indexOf(step));
  const totalSteps = steps.length;

  function goNext() {
    const current = steps.indexOf(step);
    if (current < steps.length - 1) {
      step = steps[current + 1];
    }
  }

  function goBack() {
    const current = steps.indexOf(step);
    if (current > 0) {
      step = steps[current - 1];
    }
  }

  function handleSkip() {
    markOnboardingComplete();
    goto("/");
  }

  function handleComplete() {
    markOnboardingComplete();
    goto("/");
  }
</script>

<div class="min-h-screen flex flex-col" style="background-color: #F9F6F1">
  <div class="px-6 pt-14 pb-2">
    <div class="flex items-center gap-1.5">
      {#each Array.from({ length: totalSteps }) as _, i}
        <div class="flex-1 h-1 rounded-full overflow-hidden" style="background-color: #EDE8E1">
          <Motion
            let:motion
            initial={{ width: 0 }}
            animate={{ width: i <= stepIndex ? "100%" : "0%" }}
            transition={{ duration: 0.3 }}
          >
            <div use:motion class="h-full rounded-full" style="background-color: #006838"></div>
          </Motion>
        </div>
      {/each}
    </div>
    <div class="flex items-center justify-between mt-2">
      <span style="font-size: 0.68rem; color: #7A6B5A; font-weight: 600"
        >Step {stepIndex + 1} of {totalSteps}</span
      >
      {#if stepIndex > 0 && stepIndex < totalSteps - 1}
        <span class="flex items-center gap-0.5" style="font-size: 0.68rem; color: #7A6B5A">
          {#each Array.from({ length: stepIndex }) as _, i}
            <CheckCircle2 class="w-3 h-3" style="color: #006838" />
          {/each}
        </span>
      {/if}
    </div>
  </div>

  {#key step}
    <Motion
      let:motion
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
    >
      <div use:motion class="flex-1 flex flex-col px-6 pb-10">
        {#if step === "college"}
          <div class="flex justify-center mt-6 mb-6">
            <svg
              width="56"
              height="56"
              viewBox="0 0 48 48"
              fill="none"
              aria-hidden="true"
              style="flex-shrink: 0; display: block"
            >
              <circle cx="24" cy="24" r="22" stroke="#8B6F47" stroke-width="1.8" fill="none" />
              <circle cx="24" cy="24" r="17" stroke="#8B6F47" stroke-width="1.5" fill="none" />
              <path
                d="M24 14 C27.5 18, 29.5 21.5, 29.5 25 C29.5 29, 27 32.5, 24 35 C21 32.5, 18.5 29, 18.5 25 C18.5 21.5, 20.5 18, 24 14Z"
                stroke="#8B6F47"
                stroke-width="1.8"
                fill="none"
                stroke-linejoin="round"
              />
              <line
                x1="24"
                y1="16"
                x2="24"
                y2="33.5"
                stroke="#8B6F47"
                stroke-width="1.5"
                stroke-linecap="round"
              />
            </svg>
          </div>

          <h1 style="font-size: 1.5rem; font-weight: 800; color: #1C2B1C; text-align: center">
            Welcome to EcoPlate
          </h1>
          <p class="text-center mt-2 mb-8" style="font-size: 0.875rem; color: #7A6B5A">
            Let's get you set up in 30 seconds
          </p>

          <label
            for="college-search"
            style="font-size: 0.78rem; font-weight: 700; color: #4A3728; margin-bottom: 8px; display: block"
          >
            Choose Your College
          </label>

          <div class="relative">
            <div
              class="flex items-center gap-2 px-4 py-3.5 rounded-2xl cursor-pointer"
              style="background-color: white; border: 2px solid rgba(0,104,56,0.2); box-shadow: 0 2px 8px rgba(0,0,0,0.04)"
            >
              <Search class="w-4 h-4 shrink-0" style="color: #8B6F47" />
              <input
                id="college-search"
                type="text"
                placeholder="Search colleges..."
                value={showCollegeDropdown ? collegeSearch : selectedCollege}
                oninput={(e) => {
                  collegeSearch = (e.currentTarget as HTMLInputElement).value;
                  showCollegeDropdown = true;
                }}
                onfocus={() => {
                  showCollegeDropdown = true;
                  collegeSearch = "";
                }}
                class="flex-1 bg-transparent outline-none"
                style="font-size: 0.9375rem; color: #1C2B1C"
              />
              <ChevronRight
                class="w-4 h-4 shrink-0 transition-transform"
                style={`color: #7A6B5A; transform: ${showCollegeDropdown ? "rotate(90deg)" : "rotate(0deg)"}`}
              />
            </div>

            {#if showCollegeDropdown}
              <Motion
                let:motion
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
              >
                <div
                  use:motion
                  class="absolute top-full left-0 right-0 mt-1 rounded-xl overflow-hidden z-10 max-h-48 overflow-y-auto"
                  style="background-color: white; border: 1px solid rgba(0,104,56,0.12); box-shadow: 0 8px 24px rgba(0,0,0,0.1)"
                >
                  {#each filteredColleges as college}
                    <button
                      onclick={() => {
                        if (!college.available) return;
                        selectedCollege = college.name;
                        showCollegeDropdown = false;
                        collegeSearch = "";
                      }}
                      class="w-full text-left px-4 py-3 flex items-center justify-between transition-colors"
                      style={`background-color: ${selectedCollege === college.name ? "#E8F5EE" : "transparent"}; border-bottom: 1px solid #F8F5F0; opacity: ${college.available ? 1 : 0.45}; cursor: ${college.available ? "pointer" : "default"}`}
                    >
                      <span
                        style={`font-size: 0.85rem; color: ${college.available ? "#1C2B1C" : "#A09890"}; font-weight: ${selectedCollege === college.name ? 700 : 400}`}
                      >
                        {college.name}
                      </span>
                      {#if selectedCollege === college.name && college.available}
                        <CheckCircle2 class="w-4 h-4" style="color: #006838" />
                      {:else if !college.available}
                        <span style="font-size: 0.62rem; color: #B0A898; font-weight: 600"
                          >Coming soon</span
                        >
                      {/if}
                    </button>
                  {/each}
                </div>
              </Motion>
            {/if}
          </div>

          <div class="flex-1"></div>

          <button
            onclick={goNext}
            disabled={!selectedCollege}
            class="w-full py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
            style={`background-color: ${selectedCollege ? "#006838" : "#C4B9A8"}; color: white; font-size: 1rem; font-weight: 700; box-shadow: ${selectedCollege ? "0 4px 16px rgba(0,104,56,0.3)" : "none"}; cursor: ${selectedCollege ? "pointer" : "not-allowed"}`}
          >
            Continue
            <ArrowRight class="w-4 h-4" />
          </button>

          <button
            onclick={handleSkip}
            class="w-full mt-3 py-2 text-center"
            style="font-size: 0.78rem; color: #B0A898">Skip for Demo</button
          >
        {:else if step === "role"}
          <h1
            class="mt-6 mb-2"
            style="font-size: 1.375rem; font-weight: 800; color: #1C2B1C; text-align: center"
          >
            Choose Your Role at {selectedCollege}
          </h1>
          <p class="text-center mb-8" style="font-size: 0.85rem; color: #7A6B5A">
            This helps us personalize your experience
          </p>

          <div class="space-y-3 mb-auto">
            <button
              onclick={() => (selectedRole = "student")}
              class="w-full rounded-2xl p-5 text-left transition-all active:scale-[0.99]"
              style={`background-color: ${selectedRole === "student" ? "#E8F5EE" : "white"}; border: 2px solid ${selectedRole === "student" ? "#006838" : "rgba(0,104,56,0.1)"}; box-shadow: ${selectedRole === "student" ? "0 4px 16px rgba(0,104,56,0.12)" : "0 1px 4px rgba(0,0,0,0.04)"}`}
            >
              <div class="flex items-start gap-4">
                <div
                  class="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
                  style="background-color: #E8F5EE"
                >
                  <GraduationCap class="w-6 h-6" style="color: #006838" />
                </div>
                <div>
                  <p style="font-size: 1rem; font-weight: 700; color: #1C2B1C">I'm a Student</p>
                  <p style="font-size: 0.8rem; color: #7A6B5A; margin-top: 2px">
                    Find affordable rescued meals near you
                  </p>
                </div>
              </div>
            </button>

            <button
              onclick={() => (selectedRole = "partner")}
              class="w-full rounded-2xl p-5 text-left transition-all active:scale-[0.99]"
              style={`background-color: ${selectedRole === "partner" ? "#FEF3C7" : "white"}; border: 2px solid ${selectedRole === "partner" ? "#D97706" : "rgba(0,104,56,0.1)"}; box-shadow: ${selectedRole === "partner" ? "0 4px 16px rgba(217,119,6,0.12)" : "0 1px 4px rgba(0,0,0,0.04)"}`}
            >
              <div class="flex items-start gap-4">
                <div
                  class="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
                  style="background-color: #FEF3C7"
                >
                  <Store class="w-6 h-6" style="color: #D97706" />
                </div>
                <div>
                  <p style="font-size: 1rem; font-weight: 700; color: #1C2B1C">
                    I'm a Dining Partner
                  </p>
                  <p style="font-size: 0.8rem; color: #7A6B5A; margin-top: 2px">
                    Post surplus food responsibly
                  </p>
                </div>
              </div>
            </button>
          </div>

          <div class="flex-1"></div>

          <button
            onclick={goNext}
            disabled={!selectedRole}
            class="w-full py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
            style={`background-color: ${selectedRole ? "#006838" : "#C4B9A8"}; color: white; font-size: 1rem; font-weight: 700; box-shadow: ${selectedRole ? "0 4px 16px rgba(0,104,56,0.3)" : "none"}; cursor: ${selectedRole ? "pointer" : "not-allowed"}`}
          >
            Continue
            <ArrowRight class="w-4 h-4" />
          </button>

          <button
            onclick={goBack}
            class="w-full mt-3 py-2 text-center"
            style="font-size: 0.78rem; color: #8B6F47">Back to College Selection</button
          >
        {:else if step === "discover"}
          <div class="flex-1 flex flex-col items-center justify-center">
            <div
              class="w-24 h-24 rounded-full flex items-center justify-center mb-6"
              style="background-color: #E8F5EE"
            >
              <QrCode class="w-12 h-12" style="color: #006838" />
            </div>
            <h1 style="font-size: 1.5rem; font-weight: 800; color: #1C2B1C; text-align: center">
              Discover Rescue Boxes
            </h1>
            <p
              class="text-center mt-3 mb-2"
              style="font-size: 0.9rem; color: #7A6B5A; max-width: 280px"
            >
              Scan the QR code at any dining hall to see tonight's available Rescue Boxes.
            </p>
            <p class="text-center mb-auto" style="font-size: 0.78rem; color: #B0A898">
              No account required to browse
            </p>
          </div>

          <div class="flex-1"></div>

          <button
            onclick={goNext}
            class="w-full py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
            style="background-color: #006838; color: white; font-size: 1rem; font-weight: 700; box-shadow: 0 4px 16px rgba(0,104,56,0.3)"
          >
            Continue
            <ArrowRight class="w-4 h-4" />
          </button>
        {:else if step === "reserve"}
          <div class="flex-1 flex flex-col items-center justify-center">
            <div
              class="w-24 h-24 rounded-full flex items-center justify-center mb-6"
              style="background-color: #E8F5EE"
            >
              <ShoppingBag class="w-12 h-12" style="color: #006838" />
            </div>
            <h1 style="font-size: 1.5rem; font-weight: 800; color: #1C2B1C; text-align: center">
              Reserve in Seconds
            </h1>
            <p
              class="text-center mt-3 mb-2"
              style="font-size: 0.9rem; color: #7A6B5A; max-width: 280px"
            >
              Pick a box, tap reserve, done. It takes less than 30 seconds.
            </p>
            <p class="text-center mb-auto" style="font-size: 0.78rem; color: #B0A898">
              Rescue Boxes from $3-5 each
            </p>
          </div>

          <div class="flex-1"></div>

          <button
            onclick={goNext}
            class="w-full py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
            style="background-color: #006838; color: white; font-size: 1rem; font-weight: 700; box-shadow: 0 4px 16px rgba(0,104,56,0.3)"
          >
            Continue
            <ArrowRight class="w-4 h-4" />
          </button>
        {:else}
          <div class="flex-1 flex flex-col items-center justify-center">
            <div
              class="w-24 h-24 rounded-full flex items-center justify-center mb-6"
              style="background-color: #E8F5EE"
            >
              <Leaf class="w-12 h-12" style="color: #006838" />
            </div>
            <h1 style="font-size: 1.5rem; font-weight: 800; color: #1C2B1C; text-align: center">
              Pick Up and Make Impact
            </h1>
            <p
              class="text-center mt-3 mb-2"
              style="font-size: 0.9rem; color: #7A6B5A; max-width: 300px"
            >
              Collect within 90 minutes and reduce food waste and emissions.
            </p>
            <p class="text-center mb-auto" style="font-size: 0.78rem; color: #B0A898">
              Every box rescued makes a difference
            </p>
          </div>

          <div class="flex-1"></div>

          <button
            onclick={handleComplete}
            class="w-full py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
            style="background-color: #006838; color: white; font-size: 1rem; font-weight: 700; box-shadow: 0 4px 16px rgba(0,104,56,0.3)"
          >
            Get Started
            <ArrowRight class="w-4 h-4" />
          </button>
        {/if}
      </div>
    </Motion>
  {/key}
</div>
