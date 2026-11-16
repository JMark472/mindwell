import { useId } from "react";
import { cn } from "@/utils/cn";

/**
 * Decorative, tiled wave pattern used behind the portal content area.
 *
 * Purely presentational: hidden from assistive technology, never intercepts
 * pointer events, and fades toward the top so headings and cards stay crisp.
 * Because the tile repeats, the pattern remains visible at any scroll depth.
 */
export default function WaveBackground({ className }: { className?: string }) {
  const rawId = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const patternId = `mw-wave-pattern-${rawId}`;
  const fadeId = `mw-wave-fade-${rawId}`;
  const maskId = `mw-wave-mask-${rawId}`;

  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        className,
      )}
    >
      <svg
        className="h-full w-full"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
      >
        <defs>
          <pattern
            id={patternId}
            width="360"
            height="220"
            patternUnits="userSpaceOnUse"
          >
            <g fill="none" strokeWidth="1.2">
              <path
                d="M0 40 C 30 10 60 10 90 40 C 120 70 150 70 180 40 C 210 10 240 10 270 40 C 300 70 330 70 360 40"
                stroke="rgba(16, 169, 155, 0.16)"
              />
              <path
                d="M0 130 C 30 100 60 100 90 130 C 120 160 150 160 180 130 C 210 100 240 100 270 130 C 300 160 330 160 360 130"
                stroke="rgba(11, 53, 95, 0.1)"
              />
            </g>
            <path
              d="M0 75 C 30 45 60 45 90 75 C 120 105 150 105 180 75 C 210 45 240 45 270 75 C 300 105 330 105 360 75 L 360 95 C 330 125 300 125 270 95 C 240 65 210 65 180 95 C 150 125 120 125 90 95 C 60 65 30 65 0 95 Z"
              fill="rgba(82, 208, 176, 0.05)"
            />
          </pattern>

          <linearGradient id={fadeId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="32%" stopColor="#ffffff" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="1" />
          </linearGradient>

          <mask id={maskId}>
            <rect width="100%" height="100%" fill={`url(#${fadeId})`} />
          </mask>
        </defs>

        <rect
          width="100%"
          height="100%"
          fill={`url(#${patternId})`}
          mask={`url(#${maskId})`}
        />
      </svg>
    </div>
  );
}
