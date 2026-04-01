<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { Motion } from "svelte-motion";
  import { Mail, Lock, User, Eye, EyeOff, ArrowRight, AlertCircle } from "lucide-svelte";
  import { onAuthStateChange, signIn, signUp } from "$lib/auth";
  import EcoplateLogo from "$lib/components/EcoplateLogo.svelte";
  import LoadingSpinner from "$lib/components/LoadingSpinner.svelte";

  let mode = $state<"login" | "signup">("login");
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

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      error = "Please enter a valid email address";
      return;
    }
    if (password.length < 6) {
      error = "Password must be at least 6 characters";
      return;
    }
    if (mode === "signup" && !name.trim()) {
      error = "Please enter your name";
      return;
    }

    loading = true;
    try {
      if (mode === "signup") {
        const result = await signUp(email.trim(), password, name.trim());
        if ("error" in result) {
          error = result.error;
        }
      } else {
        const result = await signIn(email.trim(), password);
        if ("error" in result) {
          error = result.error;
        }
      }
    } catch (err) {
      error = err instanceof Error ? err.message : "Something went wrong";
    } finally {
      loading = false;
    }
  }

  function switchMode(nextMode: "login" | "signup") {
    mode = nextMode;
    error = "";
  }
</script>

<div class="min-h-screen flex flex-col" style="background-color: #F9F6F1">
  <Motion let:motion initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
    <div use:motion class="px-6 pt-20 pb-6 flex flex-col items-center">
      <Motion
        let:motion
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
      >
        <div use:motion class="mb-5">
          <EcoplateLogo iconOnly={true} size={56} color="#006838" />
        </div>
      </Motion>

      <h1
        style="font-family: 'DM Sans', sans-serif; font-weight: 800; font-size: 1.75rem; color: #006838; letter-spacing: -0.03em; line-height: 1"
      >
        EcoPlate
      </h1>
      <p
        class="mt-2.5"
        style="font-size: 0.8rem; font-weight: 500; color: #8B6F47; letter-spacing: 0.12em; text-transform: uppercase"
      >
        Affordable Fresh Boxes near UCI
      </p>
    </div>
  </Motion>

  <div class="px-6 mb-4">
    <div class="flex items-center p-1 rounded-full" style="background-color: #EDE8E1">
      <button
        onclick={() => switchMode("login")}
        class="flex-1 py-2.5 rounded-full text-center transition-all"
        style={`background-color: ${mode === "login" ? "white" : "transparent"}; color: ${mode === "login" ? "#1C2B1C" : "#7A6B5A"}; font-size: 0.875rem; font-weight: 600; box-shadow: ${mode === "login" ? "0 1px 4px rgba(0,0,0,0.08)" : "none"}`}
      >
        Sign In
      </button>
      <button
        onclick={() => switchMode("signup")}
        class="flex-1 py-2.5 rounded-full text-center transition-all"
        style={`background-color: ${mode === "signup" ? "white" : "transparent"}; color: ${mode === "signup" ? "#1C2B1C" : "#7A6B5A"}; font-size: 0.875rem; font-weight: 600; box-shadow: ${mode === "signup" ? "0 1px 4px rgba(0,0,0,0.08)" : "none"}`}
      >
        Create Account
      </button>
    </div>
  </div>

  <div class="flex-1 px-6">
    {#key mode}
      <Motion
        let:motion
        initial={{ opacity: 0, x: mode === "signup" ? 20 : -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: mode === "signup" ? -20 : 20 }}
        transition={{ duration: 0.2 }}
      >
        <div
          use:motion
          class="rounded-2xl p-5 space-y-4 shadow-sm"
          style="background-color: white; border: 1px solid rgba(0,104,56,0.08)"
        >
          <h2 style="font-size: 1.125rem; font-weight: 700; color: #1C2B1C">
            {mode === "login" ? "Welcome back" : "Join EcoPlate"}
          </h2>

          {#if mode === "signup"}
            <Motion
              let:motion
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div use:motion>
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
            </Motion>
          {/if}

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
                placeholder={mode === "signup" ? "At least 6 characters" : "Your password"}
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
              {mode === "login" ? "Sign In" : "Create Account"}
              <ArrowRight class="w-4 h-4" />
            {/if}
          </button>
        </div>
      </Motion>
    {/key}

    {#if mode === "signup"}
      <Motion
        let:motion
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <div use:motion class="mt-4 space-y-2">
          {#each ["Reserve Fresh Boxes from $7", "Track your food rescue impact", "Optional plan upgrades for credits"] as perk}
            <div class="flex items-center gap-2 px-1">
              <div
                class="w-1.5 h-1.5 rounded-full shrink-0"
                style="background-color: #006838"
              ></div>
              <span style="font-size: 0.8rem; color: #7A6B5A">{perk}</span>
            </div>
          {/each}
        </div>
      </Motion>
    {/if}
  </div>

  <div class="px-6 pb-10 pt-4">
    <p class="text-center" style="font-size: 0.72rem; color: #B0A898">
      Affordable Fresh Boxes near UCI
    </p>
    <button
      onclick={() => goto("/admin/login")}
      class="w-full py-2 mt-2 text-center"
      style="font-size: 0.62rem; color: rgba(176,168,152,0.35); font-weight: 500; letter-spacing: 0.02em; background: none; border: none"
    >
      Partner Staff Portal
    </button>
  </div>
</div>
