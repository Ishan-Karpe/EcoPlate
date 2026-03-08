<script lang="ts">
  import type { HTMLImgAttributes } from "svelte/elements";

  const ERROR_IMG_SRC =
    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODgiIGhlaWdodD0iODgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgc3Ryb2tlPSIjMDAwIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBvcGFjaXR5PSIuMyIgZmlsbD0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIzLjciPjxyZWN0IHg9IjE2IiB5PSIxNiIgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiByeD0iNiIvPjxwYXRoIGQ9Im0xNiA1OCAxNi0xOCAzMiAzMiIvPjxjaXJjbGUgY3g9IjUzIiBjeT0iMzUiIHI9IjciLz48L3N2Zz4KCg==";

  let { src, alt, class: className, style, ...rest }: HTMLImgAttributes = $props();

  let didError = $state(false);

  $effect(() => {
    src;
    didError = false;
  });
</script>

{#if didError}
  <div class={`inline-block bg-gray-100 text-center align-middle ${className ?? ""}`} {style}>
    <div class="flex items-center justify-center w-full h-full">
      <img src={ERROR_IMG_SRC} alt="Error loading image" data-original-url={src} {...rest} />
    </div>
  </div>
{:else}
  <img
    {src}
    {alt}
    class={className}
    {style}
    onerror={() => {
      didError = true;
    }}
    {...rest}
  />
{/if}
