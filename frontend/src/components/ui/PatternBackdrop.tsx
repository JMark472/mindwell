import { useId } from "react";
import { cn } from "@/utils/cn";

/**
 * Decorative topographic pattern used behind the left rail and panel headers.
 *
 * Purely presentational: hidden from assistive technology, never intercepts
 * pointer events, and uses a vertical mask so text stays perfectly readable.
 * `useId` namespaces the SVG ids so the pattern can be rendered more than once
 * on the same page without collisions.
 */
export default function PatternBackdrop({
  className,
  curved = true,
}: {
  className?: string;
  curved?: boolean;
}) {
  const rawId = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const dotsId = `mw-dots-${rawId}`;
  const fadeId = `mw-fade-${rawId}`;
  const maskId = `mw-mask-${rawId}`;

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
        preserveAspectRatio="xMidYMin slice"
      >
        <defs>
          <pattern id={dotsId} width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="1.5" cy="1.5" r="1.1" fill="rgba(16, 169, 155, 0.38)" />
            <circle cx="13.5" cy="13.5" r="0.7" fill="rgba(11, 53, 95, 0.18)" />
          </pattern>

          <linearGradient id={fadeId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="55%" stopColor="#ffffff" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>

          <mask id={maskId}>
            <rect width="100%" height="100%" fill={`url(#${fadeId})`} />
          </mask>
        </defs>

        <g mask={`url(#${maskId})`}>
          <rect width="100%" height="100%" fill={`url(#${dotsId})`} opacity="0.55" />

          {curved ? (
            <>
              <g fill="none" stroke="rgba(11, 53, 95, 0.14)" strokeWidth="1">
                <path d="M-40 64 C 44 6, 158 128, 320 56" />
                <path d="M-40 94 C 44 36, 158 158, 320 86" />
                <path d="M-40 124 C 44 66, 158 188, 320 116" />
              </g>
              <g fill="none" stroke="rgba(16, 169, 155, 0.16)" strokeWidth="1">
                <path d="M-30 208 C 70 148, 152 258, 300 188" />
                <path d="M-30 238 C 70 178, 152 288, 300 218" />
              </g>
            </>
          ) : null}
        </g>
      </svg>

      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-mint-soft/70 to-transparent" />
    </div>
  );
}
