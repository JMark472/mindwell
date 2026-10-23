import { cn } from "@/utils/cn";

/**
 * Decorative, purely presentational backdrop.
 *
 * The parent must be `relative` (and normally `overflow-hidden`). All layers
 * are hidden from assistive technology and never intercept pointer events.
 * Motion freezes automatically under `prefers-reduced-motion`.
 */
export default function AnimatedBackground({
  variant = "auth",
  className,
}: {
  variant?: "auth" | "portal";
  className?: string;
}) {
  if (variant === "portal") {
    return (
      <div
        aria-hidden="true"
        className={cn("mw-scene opacity-60", className)}
      >
        <div className="mw-orb mw-orb-mint -right-20 -top-24 h-[340px] w-[340px]" />
        <div className="mw-orb mw-orb-sky -left-24 top-24 h-[300px] w-[300px]" />
        <div className="mw-scene-grid absolute inset-0 opacity-30" />
      </div>
    );
  }

  return (
    <div aria-hidden="true" className={cn("mw-scene", className)}>
      <div className="absolute inset-0 bg-gradient-to-br from-mint-soft via-canvas to-sky" />
      <div className="mw-orb mw-orb-mint -left-28 -top-24 h-[430px] w-[430px]" />
      <div className="mw-orb mw-orb-teal -right-24 top-[8%] h-[370px] w-[370px]" />
      <div className="mw-orb mw-orb-sky bottom-[-22%] left-[28%] h-[480px] w-[480px]" />
      <div className="mw-scene-rings" />
      <div className="mw-scene-grid absolute inset-0" />
    </div>
  );
}
