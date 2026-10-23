import { Outlet, useLocation } from "react-router";
import { AppSidebar, AppHeader } from "@/layout/AppShell";
import AnimatedBackground from "@/components/ui/AnimatedBackground";

export { AppSidebar, AppHeader };

export default function AppShell({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  const { pathname } = useLocation();

  return (
    <div className="flex min-h-screen bg-canvas">
      <a href="#main-content" className="mw-skip-link">
        Skip to main content
      </a>
      <AppSidebar />
      <main id="main-content" className="relative flex-1 overflow-hidden px-8 py-8">
        <AnimatedBackground variant="portal" />
        {/* Keying on the path restarts the subtle entrance animation per route. */}
        <div key={pathname} className="mw-rise relative z-10 mx-auto max-w-6xl">
          <AppHeader title={title} subtitle={subtitle} />
          <Outlet />
        </div>
      </main>
    </div>
  );
}
