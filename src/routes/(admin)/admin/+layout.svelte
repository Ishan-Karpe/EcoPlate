<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/state";
  import { goto } from "$app/navigation";
  import { Motion } from "svelte-motion";
  import { getBrowserSupabase } from "$lib/supabase";

  let { children } = $props();

  onMount(async () => {
    const pathname = page.url.pathname;
    if (pathname === "/admin/login") return;

    const sb = getBrowserSupabase();
    const {
      data: { user },
    } = await sb.auth.getUser();
    const role =
      (user?.user_metadata?.role as string | undefined) ??
      (user?.app_metadata?.role as string | undefined);

    if (!user || role !== "admin") {
      await goto("/admin/login");
    }
  });
</script>

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
