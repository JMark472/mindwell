import { useLocation } from "react-router";
import { cn } from "@/utils/cn";

/**
 * Lightweight route transition wrapper.
 *
 * The key is derived from the pathname so React remounts the route content and
 * replays the CSS entrance animation without needing an animation library.
 * All motion is disabled automatically by the global reduced-motion rules.
 */
export default function PageTransition({
  children,
  className,
  stagger = true,
}: {
  children: React.ReactNode;
  className?: string;
  stagger?: boolean;
}) {
  const { pathname } = useLocation();

  return (
    <div
      key={pathname}
      className={cn("mw-page-enter", stagger && "mw-stagger", className)}
    >
      {children}
    </div>
  );
}
