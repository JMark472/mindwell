import { Outlet } from "react-router";
import { AppSidebar, AppHeader } from "@/layout/AppShell";

export { AppSidebar, AppHeader };

export default function AppShell({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex min-h-screen bg-canvas">
      <a href="#main-content" className="mw-skip-link">
        Skip to main content
      </a>
      <AppSidebar />
      <main id="main-content" className="flex-1 px-8 py-8">
        <div className="mx-auto max-w-6xl">
          <AppHeader title={title} subtitle={subtitle} />
          <Outlet />
        </div>
      </main>
    </div>
  );
}
