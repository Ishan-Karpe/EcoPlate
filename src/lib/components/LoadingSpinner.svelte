<script lang="ts">
  let {
    size = 20,
    borderWidth = 2,
    color = "#ffffff",
    trackColor = "rgba(255,255,255,0.3)",
    className = "",
  }: {
    size?: number;
    borderWidth?: number;
    color?: string;
    trackColor?: string;
    className?: string;
  } = $props();
</script>

<div
  class={`rounded-full animate-spin ${className}`}
  style="
    width: {size}px;
    height: {size}px;
    border: {borderWidth}px solid {trackColor};
    border-top-color: {color};
  "
  aria-hidden="true"
></div>
