import { useId } from "react";
import { cn } from "@/utils/cn";

/**
 * Mind-themed decorative pattern for the navy sidebar.
 *
 * Repeats brain, heart, lightbulb, thought-bubble and sparkle motifs (drawn
 * from Lucide's 24×24 line icons) with faint neural connections between them.
 * Purely presentational: hidden from assistive technology and never receives
 * pointer events.
 */
export default function MindPattern({ className }: { className?: string }) {
  const rawId = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const patternId = `mw-mind-pattern-${rawId}`;
  const fadeId = `mw-mind-fade-${rawId}`;
  const maskId = `mw-mind-mask-${rawId}`;

  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        className,
      )}
    >
      <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern
            id={patternId}
            width="220"
            height="220"
            patternUnits="userSpaceOnUse"
          >
            {/* Neural links */}
            <g
              fill="none"
              stroke="rgba(255, 255, 255, 0.09)"
              strokeWidth="0.9"
              strokeDasharray="2 4"
            >
              <path d="M70 44 C 104 25 132 28 148 38" />
              <path d="M170 48 C 150 78 138 100 146 118" />
              <path d="M60 152 C 90 150 110 130 124 112" />
              <path d="M92 30 C 96 58 88 84 78 106" />
            </g>
            <g fill="rgba(255, 255, 255, 0.2)">
              <circle cx="92" cy="30" r="1.6" />
              <circle cx="112" cy="68" r="1.2" />
              <circle cx="76" cy="110" r="1.4" />
              <circle cx="188" cy="72" r="1.2" />
              <circle cx="120" cy="190" r="1.4" />
              <circle cx="200" cy="198" r="1.1" />
            </g>

            <g
              fill="none"
              stroke="rgba(255, 255, 255, 0.17)"
              strokeWidth="1.1"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* Brain */}
              <g transform="translate(24 20) scale(1.9)">
                <path d="M12 18V5" />
                <path d="M15 13a4.17 4.17 0 0 1-3-4 4.17 4.17 0 0 1-3 4" />
                <path d="M17.707 6.294A3 3 0 1 0 12 5a3 3 0 1 0-5.707 1.294" />
                <path d="M17.996 5.125a4 4 0 0 1 2.526 5.77" />
                <path d="M18 18a4 4 0 0 0 2-7.465" />
                <path d="M19.967 17.482a4 4 0 1 1-7.967.517 4 4 0 1 1-7.967-.517" />
                <path d="M6 18a4 4 0 0 1-2-7.465" />
                <path d="M6.004 5.125a4 4 0 0 0-2.526 5.77" />
              </g>

              {/* Thought bubble */}
              <g transform="translate(142 22) scale(1.45)">
                <path d="M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719" />
              </g>

              {/* Heart pulse */}
              <g transform="translate(150 118) scale(1.75)">
                <path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5" />
                <path d="M3.22 13H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27" />
              </g>

              {/* Lightbulb */}
              <g transform="translate(28 140) scale(1.55)">
                <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
                <path d="M9 18h6" />
                <path d="M10 22h4" />
              </g>

              {/* Sparkles */}
              <g
                transform="translate(96 92) scale(1.2)"
                stroke="rgba(82, 208, 176, 0.4)"
              >
                <path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z" />
                <path d="M20 2v4" />
                <path d="M22 4h-4" />
                <circle cx="4" cy="20" r="2" />
              </g>
            </g>
          </pattern>

          <linearGradient id={fadeId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="55%" stopColor="#ffffff" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.25" />
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
