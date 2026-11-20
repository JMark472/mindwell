import { useEffect, useRef, useState } from "react";

/**
 * Lightweight, dependency-free count-up for real numeric KPI values.
 * Honors prefers-reduced-motion and falls back to the original value
 * when the data is not a finite number.
 */
export default function AnimatedCounter({
  value,
  duration = 650,
  className,
}: {
  value: number | string;
  duration?: number;
  className?: string;
}) {
  const numeric = typeof value === "number" ? value : Number(value);
  const previous = useRef(0);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!Number.isFinite(numeric)) {
      setDisplay(0);
      return;
    }

    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      setDisplay(numeric);
      previous.current = numeric;
      return;
    }

    const from = previous.current;
    const start = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(from + (numeric - from) * eased));
      if (progress < 1) {
        frame = window.requestAnimationFrame(tick);
      } else {
        previous.current = numeric;
      }
    };

    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [numeric, duration]);

  if (!Number.isFinite(numeric)) return <>{value}</>;

  return <span className={className}>{new Intl.NumberFormat().format(display)}</span>;
}
