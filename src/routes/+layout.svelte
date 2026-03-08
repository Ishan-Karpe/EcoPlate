<script lang="ts">
  import "../app.css";
  import { onMount } from "svelte";
  import { page } from "$app/state";
  import { Motion } from "svelte-motion";
  import { Toaster, toast } from "svelte-sonner";
  import { authStore } from "$lib/stores/auth.svelte";

  let { children } = $props();

  type BeforeInstallPromptEvent = Event & {
    prompt: () => Promise<void>;
  };

  let deferredInstallPrompt = $state<BeforeInstallPromptEvent | null>(null);

  onMount(() => {
    void authStore.bootstrap();

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      deferredInstallPrompt = event as BeforeInstallPromptEvent;

      toast("Install EcoPlate for quicker pickup access", {
        action: {
          label: "Install",
          onClick: async () => {
            if (!deferredInstallPrompt) return;
            await deferredInstallPrompt.prompt();
            deferredInstallPrompt = null;
          },
        },
      });
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  });
</script>

<div
  class="w-full min-h-screen max-w-md mx-auto relative overflow-hidden shadow-2xl"
  style="background-color: #F9F6F1; font-family: 'DM Sans', system-ui, -apple-system, sans-serif;"
>
  {#key page.url.pathname}
    <Motion
      let:motion
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
    >
      <div use:motion class="w-full min-h-screen">
        {@render children()}
      </div>
    </Motion>
  {/key}

  <Toaster position="top-center" richColors />
</div>
