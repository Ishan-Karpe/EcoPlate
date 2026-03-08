<script lang="ts">
  let {
    iconSize,
    label = "EcoPlate",
    subLabel,
    textColor = "#1C2B1C",
    subTextColor = "rgba(255,255,255,0.6)",
    fontSize = "1.125rem",
    className = "",
    iconOnly = false,
    size = 64,
    color = "#8B6F47",
  }: {
    iconSize?: number;
    label?: string;
    subLabel?: string;
    textColor?: string;
    subTextColor?: string;
    fontSize?: string;
    className?: string;
    iconOnly?: boolean;
    size?: number;
    color?: string;
  } = $props();

  let fSizePx = $derived(Number.parseFloat(fontSize) * 16);
  let subPx = $derived(subLabel ? 0.65 * 16 + 2 : 0);
  let autoSize = $derived(Math.round(fSizePx + subPx + 2));
  let resolvedSize = $derived(iconOnly ? size : (iconSize ?? autoSize));
  let iconColor = $derived(
    iconOnly
      ? color
      : textColor === "white" || textColor === "#fff" || textColor === "#ffffff"
        ? "rgba(255,255,255,0.92)"
        : "#8B6F47"
  );
</script>

{#if iconOnly}
  <svg
    width={resolvedSize}
    height={resolvedSize}
    viewBox="0 0 48 48"
    fill="none"
    aria-hidden="true"
    class={className}
    style="flex-shrink: 0; display: block;"
  >
    <circle cx="24" cy="24" r="22" stroke={iconColor} stroke-width="1.8" fill="none" />
    <circle cx="24" cy="24" r="17" stroke={iconColor} stroke-width="1.5" fill="none" />
    <path
      d="M24 14 C27.5 18, 29.5 21.5, 29.5 25 C29.5 29, 27 32.5, 24 35 C21 32.5, 18.5 29, 18.5 25 C18.5 21.5, 20.5 18, 24 14Z"
      stroke={iconColor}
      stroke-width="1.8"
      fill="none"
      stroke-linejoin="round"
    />
    <line
      x1="24"
      y1="16"
      x2="24"
      y2="33.5"
      stroke={iconColor}
      stroke-width="1.5"
      stroke-linecap="round"
    />
  </svg>
{:else}
  <div class={`flex items-center gap-2 ${className}`}>
    <svg
      width={resolvedSize}
      height={resolvedSize}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
      style="flex-shrink: 0; display: block;"
    >
      <circle cx="24" cy="24" r="22" stroke={iconColor} stroke-width="1.8" fill="none" />
      <circle cx="24" cy="24" r="17" stroke={iconColor} stroke-width="1.5" fill="none" />
      <path
        d="M24 14 C27.5 18, 29.5 21.5, 29.5 25 C29.5 29, 27 32.5, 24 35 C21 32.5, 18.5 29, 18.5 25 C18.5 21.5, 20.5 18, 24 14Z"
        stroke={iconColor}
        stroke-width="1.8"
        fill="none"
        stroke-linejoin="round"
      />
      <line
        x1="24"
        y1="16"
        x2="24"
        y2="33.5"
        stroke={iconColor}
        stroke-width="1.5"
        stroke-linecap="round"
      />
    </svg>

    <div class="flex flex-col justify-center" style="line-height: 1;">
      <span
        style="
          font-family: 'DM Sans', sans-serif;
          font-weight: 800;
          font-size: {fontSize};
          color: {textColor};
          letter-spacing: -0.02em;
          line-height: 1.2;
          display: block;
        "
      >
        {label}
      </span>
      {#if subLabel}
        <span
          style="
            display: block;
            font-size: 0.65rem;
            line-height: 1.1;
            color: {subTextColor};
            margin-top: 2px;
          "
        >
          {subLabel}
        </span>
      {/if}
    </div>
  </div>
{/if}
