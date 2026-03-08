<script lang="ts">
  import { ClipboardList, Home, TrendingUp, User } from "lucide-svelte";
  import { Motion } from "svelte-motion";

  let {
    pathname,
    hasActiveReservation = false,
  }: {
    pathname: string;
    hasActiveReservation?: boolean;
  } = $props();

  const tabs = [
    { href: "/", label: "Home", icon: Home },
    { href: "/insights", label: "Impact", icon: TrendingUp },
    { href: "/orders", label: "Orders", icon: ClipboardList },
    { href: "/settings", label: "Profile", icon: User },
  ] as const;

  const isOrdersActive = (path: string) => path === "/orders";
  const isTabActive = (href: string, path: string) => {
    if (href === "/") {
      return path === "/" || path.startsWith("/drop/") || path === "/rating";
    }
    return path === href || path.startsWith(`${href}/`);
  };
</script>

<div
  class="absolute bottom-0 left-0 right-0 z-50"
  style="
    background-color: white;
    border-top-left-radius: 16px;
    border-top-right-radius: 16px;
    box-shadow: 0 -8px 32px hsla(30,32%,41%,0.10), 0 -2px 8px hsla(0,0%,0%,0.04);
  "
>
  <div class="flex items-center">
    {#each tabs as tab}
      {@const active = isTabActive(tab.href, pathname)}
      <a
        href={tab.href}
        class="flex-1 flex flex-col items-center py-3 gap-1 relative transition-colors active:scale-[0.97]"
      >
        <span
          style={`color: ${active ? "#006838" : "rgba(26,26,26,0.55)"}; transition: color 0.15s; stroke-width: 1.75;`}
        >
          <tab.icon class="w-5 h-5" />
        </span>
        <span
          style={`font-size: 10px; font-weight: ${active ? 600 : 500}; color: ${
            active ? "#006838" : "rgba(26,26,26,0.55)"
          }; letter-spacing: 0.02em;`}
        >
          {tab.label}
        </span>

        {#if active}
          <Motion let:motion layoutId="nav-dot">
            <div
              use:motion
              class="absolute top-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
              style="background-color: #006838"
            ></div>
          </Motion>
        {/if}

        {#if tab.href === "/orders" && hasActiveReservation && !isOrdersActive(pathname)}
          <div
            class="absolute top-2 right-1/2 translate-x-3 w-1.5 h-1.5 rounded-full"
            style="background-color: #E8A849"
          ></div>
        {/if}
      </a>
    {/each}
  </div>
  <div style="height: env(safe-area-inset-bottom, 0px)"></div>
</div>
