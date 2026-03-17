<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { Motion } from "svelte-motion";
  import { Mail, Lock, User, Eye, EyeOff, ArrowRight, Leaf, AlertCircle } from "lucide-svelte";
  import { onAuthStateChange, signUp } from "$lib/auth";
  import LoadingSpinner from "$lib/components/LoadingSpinner.svelte";

  let email = $state("");
  let password = $state("");
  let name = $state("");
  let showPassword = $state(false);
  let loading = $state(false);
  let error = $state("");

  onMount(() => {
    const subscription = onAuthStateChange((session) => {
      if (session) {
        goto("/");
      }
    });

    return () => subscription.unsubscribe();
  });

  async function handleSubmit() {
    error = "";

    if (!name.trim()) {
      error = "Please enter your name";
      return;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      error = "Please enter a valid email address";
      return;
    }
    if (password.length < 6) {
      error = "Password must be at least 6 characters";
      return;
    }

    loading = true;
    try {
      const result = await signUp(email.trim(), password, name.trim());
      if ("error" in result) {
        error = result.error;
      }
    } catch (err) {
      error = err instanceof Error ? err.message : "Something went wrong";
    } finally {
      loading = false;
    }
  }
</script>

<div class="min-h-screen flex flex-col" style="background-color: #F9F6F1">
  <Motion let:motion initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
    <div use:motion class="px-6 pt-14 pb-4 flex flex-col items-center">
      <Motion
        let:motion
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
      >
        <div
          use:motion
          class="w-20 h-20 rounded-full flex items-center justify-center mb-4"
          style="background-color: #E8F5EE"
        >
          <Leaf class="w-10 h-10" style="color: #006838" />
        </div>
      </Motion>

      <h1 style="font-size: 1.375rem; font-weight: 800; color: #1C2B1C; text-align: center">
        You rescued your first box!
      </h1>
      <p class="mt-1.5 text-center" style="font-size: 0.875rem; color: #7A6B5A; max-width: 280px">
        Create an account to track your impact, get drop alerts, and never miss a meal.
      </p>
    </div>
  </Motion>

  <div class="flex-1 px-6">
    <Motion
      let:motion
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
    >
      <div
        use:motion
        class="rounded-2xl p-5 space-y-4 shadow-sm"
        style="background-color: white; border: 1px solid rgba(0,104,56,0.08)"
      >
        <h2 style="font-size: 1.125rem; font-weight: 700; color: #1C2B1C">Create your account</h2>

        <div>
          <label
            class="flex items-center gap-1.5 mb-1.5"
            style="font-size: 0.75rem; font-weight: 600; color: #7A6B5A"
          >
            <User class="w-3.5 h-3.5" />
            Your name
          </label>
          <input
            type="text"
            value={name}
            oninput={(e) => (name = (e.currentTarget as HTMLInputElement).value)}
            placeholder="First name"
            maxlength={100}
            class="w-full px-4 py-3 rounded-xl outline-none transition-colors"
            style="background-color: #F5F1EB; font-size: 1rem; color: #1C2B1C"
          />
        </div>

        <div>
          <label
            class="flex items-center gap-1.5 mb-1.5"
            style="font-size: 0.75rem; font-weight: 600; color: #7A6B5A"
          >
            <Mail class="w-3.5 h-3.5" />
            Email address
          </label>
          <input
            type="email"
            value={email}
            oninput={(e) => (email = (e.currentTarget as HTMLInputElement).value)}
            placeholder="you@uci.edu"
            maxlength={254}
            class="w-full px-4 py-3 rounded-xl outline-none transition-colors"
            style="background-color: #F5F1EB; font-size: 1rem; color: #1C2B1C"
            onkeydown={(e) => {
              if (e.key === "Enter") handleSubmit();
            }}
          />
        </div>

        <div>
          <label
            class="flex items-center gap-1.5 mb-1.5"
            style="font-size: 0.75rem; font-weight: 600; color: #7A6B5A"
          >
            <Lock class="w-3.5 h-3.5" />
            Password
          </label>
          <div class="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              oninput={(e) => (password = (e.currentTarget as HTMLInputElement).value)}
              placeholder="At least 6 characters"
              maxlength={128}
              class="w-full px-4 py-3 pr-11 rounded-xl outline-none transition-colors"
              style="background-color: #F5F1EB; font-size: 1rem; color: #1C2B1C"
              onkeydown={(e) => {
                if (e.key === "Enter") handleSubmit();
              }}
            />
            <button
              type="button"
              onclick={() => (showPassword = !showPassword)}
              class="absolute right-3 top-1/2 -translate-y-1/2 p-1"
              style="color: #7A6B5A"
            >
              {#if showPassword}
                <EyeOff class="w-4 h-4" />
              {:else}
                <Eye class="w-4 h-4" />
              {/if}
            </button>
          </div>
        </div>

        {#if error}
          <Motion
            let:motion
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
          >
            <div
              use:motion
              class="flex items-start gap-2 px-3 py-2.5 rounded-xl"
              style="background-color: #FEF2F2; border: 1px solid #FECACA"
            >
              <AlertCircle class="w-4 h-4 mt-0.5 shrink-0" style="color: #DC2626" />
              <p style="font-size: 0.8rem; color: #991B1B; line-height: 1.4">{error}</p>
            </div>
          </Motion>
        {/if}

        <button
          onclick={handleSubmit}
          disabled={loading}
          class="w-full py-3.5 rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
          style={`background-color: ${loading ? "#004D28" : "#006838"}; color: white; font-size: 1rem; font-weight: 700; box-shadow: 0 4px 20px rgba(0,104,56,0.3); opacity: ${loading ? 0.85 : 1}`}
        >
          {#if loading}
            <LoadingSpinner
              size={20}
              borderWidth={2}
              color="#ffffff"
              trackColor="rgba(255,255,255,0.3)"
            />
          {:else}
            Create Account
            <ArrowRight class="w-4 h-4" />
          {/if}
        </button>
      </div>
    </Motion>

    <Motion
      let:motion
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <div use:motion class="mt-4 space-y-2">
        {#each ["Get notified when Fresh Boxes drop", "Track your food rescue impact", "Optional plan upgrades for credits"] as perk}
          <div class="flex items-center gap-2 px-1">
            <div class="w-1.5 h-1.5 rounded-full shrink-0" style="background-color: #006838"></div>
            <span style="font-size: 0.8rem; color: #7A6B5A">{perk}</span>
          </div>
        {/each}
      </div>
    </Motion>
  </div>

  <div class="px-6 pb-10 pt-4">
    <p class="text-center" style="font-size: 0.72rem; color: #B0A898">
      UCI Campus Food Rescue Program
    </p>
    <button
      onclick={() => goto("/admin/login")}
      class="w-full py-2 mt-2 text-center"
      style="font-size: 0.62rem; color: rgba(176,168,152,0.35); font-weight: 500; letter-spacing: 0.02em; background: none; border: none"
    >
      Dining Hall Staff Portal
    </button>
  </div>
</div>
