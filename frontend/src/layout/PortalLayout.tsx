import { Outlet, useLocation } from "react-router";
import { AppSidebar, AppHeader } from "@/layout/AppShell";
import AnimatedBackground from "@/components/ui/AnimatedBackground";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/utils/cn";

export { AppSidebar, AppHeader };

type PageMeta = {
  title: string;
  subtitle?: string;
  documentTitle?: string;
};

const studentMeta: Record<string, PageMeta> = {
  "/student/dashboard": { title: "Dashboard" },
  "/student/check-in": { title: "Mood Check-In" },
  "/student/appointments/book": { title: "Book Counseling" },
  "/student/appointments": { title: "Appointments" },
  "/student/appointments/confirmation": { title: "Appointment Request Sent" },
  "/student/callsessions": { title: "Call Sessions" },
  "/student/call-sessions": { title: "Call Sessions" },
  "/student/messages": { title: "Messages" },
  "/student/assistant": { title: "AI Assistant" },
  "/student/resources": { title: "Resources" },
  "/student/mood-history": { title: "Mood History" },
  "/student/notifications": { title: "Notifications" },
  "/student/profile": { title: "My Profile" },
  "/student/help": { title: "Help & Crisis" },
  "/student/assessment": { title: "Wellbeing Assessment" },
  "/student/assessment-results": { title: "Assessment Results" },
};

const counselorMeta: Record<string, PageMeta> = {
  "/counselor/dashboard": { title: "Dashboard" },
  "/counselor/requests": { title: "Appointment Requests" },
  "/counselor/schedule": { title: "Schedule" },
  "/counselor/cases": { title: "Student Management" },
  "/counselor/callsessions": { title: "Call Sessions" },
  "/counselor/call-sessions": { title: "Call Sessions" },
  "/counselor/messages": { title: "Messages" },
  "/counselor/assistant": { title: "AI Assistant" },
  "/counselor/notes": { title: "Session Notes" },
  "/counselor/resources": { title: "Resources" },
  "/counselor/profile": { title: "My Profile" },
};

const adminMeta: Record<string, PageMeta> = {
  "/admin/dashboard": { title: "Dashboard" },
  "/admin/users": { title: "User Management" },
  "/admin/counselors": { title: "Counselor Management" },
  "/admin/students": { title: "Student Management" },
  "/admin/appointments": { title: "Appointment Management" },
  "/admin/callsessions": { title: "Call Session Monitoring" },
  "/admin/call-sessions": { title: "Call Session Monitoring" },
  "/admin/content": { title: "Content" },
  "/admin/reports": { title: "System Reports" },
  "/admin/settings": { title: "System Settings" },
};

function getMeta(pathname: string): PageMeta | null {
  if (pathname.startsWith("/student/")) {
    if (studentMeta[pathname]) return studentMeta[pathname];
    if (pathname.startsWith("/student/appointments/") && pathname.split("/").length === 5) {
      return { title: "Appointment Details" };
    }
    if (pathname.startsWith("/student/resources/")) {
      return { title: "Resource" };
    }
    return null;
  }
  if (pathname.startsWith("/counselor/")) {
    if (counselorMeta[pathname]) return counselorMeta[pathname];
    if (pathname.startsWith("/counselor/cases/")) {
      return { title: "Case Details" };
    }
    return null;
  }
  if (pathname.startsWith("/admin/")) {
    return adminMeta[pathname] ?? null;
  }
  return null;
}

export default function AppShell({
  title: fallbackTitle,
  subtitle: fallbackSubtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const meta = useMemo(() => getMeta(pathname), [pathname]);
  const resolvedTitle = meta?.title ?? fallbackTitle;
  const resolvedSubtitle = meta?.subtitle ?? fallbackSubtitle;

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    const pageName = resolvedTitle || fallbackTitle;
    document.title = `${pageName} | MindWell`;
  }, [resolvedTitle, fallbackTitle]);

  return (
    <div className="relative flex min-h-screen bg-canvas">
      <a href="#main-content" className="mw-skip-link">
        Skip to main content
      </a>
      <div className="hidden lg:sticky lg:top-0 lg:block lg:h-screen lg:shrink-0">
        <AppSidebar />
      </div>
      {mobileOpen ? (
        <div
          className="fixed inset-0 z-40 bg-navy/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation"
      >
        <AppSidebar onNavigate={() => setMobileOpen(false)} />
      </div>
      <main id="main-content" className="relative flex-1 overflow-hidden px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
        <AnimatedBackground variant="portal" />
        {/* Keying on the path restarts the subtle entrance animation per route. */}
        <div key={pathname} className="mw-rise relative z-10 mx-auto max-w-7xl">
          <AppHeader title={resolvedTitle} subtitle={resolvedSubtitle} onOpenMenu={() => setMobileOpen(true)} />
          <Outlet />
        </div>
      </main>
    </div>
  );
}
