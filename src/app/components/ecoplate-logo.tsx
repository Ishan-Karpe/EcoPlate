/**
 * EcoPlate logo — inline SVG so strokes are infinitely sharp at any size.
 * Concentric rings + leaf icon with centre vein.
 * On dark (green) backgrounds the icon is automatically drawn in white.
 */

interface LogoIconProps {
  size: number;
  color?: string;
}

function LogoIcon({ size, color = "#8B6F47" }: LogoIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
      style={{ flexShrink: 0, display: "block" }}
    >
      {/* Outer ring */}
      <circle cx="24" cy="24" r="22" stroke={color} strokeWidth="1.8" fill="none" />

      {/* Inner ring */}
      <circle cx="24" cy="24" r="17" stroke={color} strokeWidth="1.5" fill="none" />

      {/* Leaf shape — rounded, smaller */}
      <path
        d="M24 14 C27.5 18, 29.5 21.5, 29.5 25 C29.5 29, 27 32.5, 24 35 C21 32.5, 18.5 29, 18.5 25 C18.5 21.5, 20.5 18, 24 14Z"
        stroke={color}
        strokeWidth="1.8"
        fill="none"
        strokeLinejoin="round"
      />

      {/* Leaf centre vein (midrib) */}
      <line
        x1="24" y1="16" x2="24" y2="33.5"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

interface EcoplateLogoProps {
  /** Override the icon pixel size. Auto-calculated from fontSize + subLabel if omitted. */
  iconSize?: number;
  /** Wordmark text. Defaults to "EcoPlate". */
  label?: string;
  /** Optional secondary line (tagline / section name). */
  subLabel?: string;
  /** Main label colour. Pass "white" when on a dark background. */
  textColor?: string;
  /** Sub-label colour. */
  subTextColor?: string;
  /** CSS font-size for the main label (e.g. "1.2rem"). */
  fontSize?: string;
  className?: string;
}

export function EcoplateLogo({
  iconSize,
  label = "EcoPlate",
  subLabel,
  textColor = "#1C2B1C",
  subTextColor = "rgba(255,255,255,0.6)",
  fontSize = "1.125rem",
  className = "",
}: EcoplateLogoProps) {
  // Auto-size icon to span the full height of the text block
  const fSizePx = parseFloat(fontSize) * 16;
  const subPx = subLabel ? 0.65 * 16 + 2 : 0;
  const autoSize = Math.round(fSizePx + subPx + 2);
  const resolvedSize = iconSize ?? autoSize;

  // On dark backgrounds (white text) draw the icon in white so it's clearly visible.
  const iconColor =
    textColor === "white" || textColor === "#fff" || textColor === "#ffffff"
      ? "rgba(255,255,255,0.92)"
      : "#8B6F47";

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <LogoIcon size={resolvedSize} color={iconColor} />
      <div className="flex flex-col justify-center" style={{ lineHeight: 1 }}>
        <span
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 800,
            fontSize,
            color: textColor,
            letterSpacing: "-0.02em",
            lineHeight: 1.2,
            display: "block",
          }}
        >
          {label}
        </span>
        {subLabel && (
          <span
            style={{
              display: "block",
              fontSize: "0.65rem",
              lineHeight: 1.1,
              color: subTextColor,
              marginTop: "2px",
            }}
          >
            {subLabel}
          </span>
        )}
      </div>
    </div>
  );
}

/** Standalone centred icon — used on login / success screens. */
export function EcoplateLogo_Icon({
  size = 64,
  color = "#8B6F47",
}: {
  size?: number;
  color?: string;
}) {
  return <LogoIcon size={size} color={color} />;
}