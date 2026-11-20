import { Outlet, useLocation } from "react-router";
import { AppSidebar, AppHeader, MobileBottomNav } from "@/layout/AppShell";
import AnimatedBackground from "@/components/ui/AnimatedBackground";
import PageTransition from "@/components/ui/PageTransition";
import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/utils/cn";

export { AppSidebar, AppHeader, MobileBottomNav };

type PageMeta = {
  title: string;
  subtitle?: string;
  documentTitle?: string;
};

const studentMeta: Record<string, PageMeta> = {
  "/student/dashboard": { title: "Dashboard", subtitle: "Your wellbeing overview, quick actions, and support tools." },
  "/student/check-in": { title: "Mood Check-In", subtitle: "Reflect on how you feel and track your wellbeing over time." },
  "/student/appointments/book": { title: "Book Counseling", subtitle: "Find a counselor and request a session that fits your schedule." },
  "/student/appointments": { title: "Appointments", subtitle: "View and manage your counseling appointments." },
  "/student/appointments/confirmation": { title: "Appointment Request Sent", subtitle: "Your request has been submitted." },
  "/student/callsessions": { title: "Call Sessions", subtitle: "Join and manage your audio or video counseling sessions." },
  "/student/call-sessions": { title: "Call Sessions", subtitle: "Join and manage your audio or video counseling sessions." },
  "/student/messages": { title: "Messages", subtitle: "Chat securely with your counselors." },
  "/student/assistant": { title: "AI Assistant", subtitle: "Get supportive, responsible mental health guidance and information." },
  "/student/resources": { title: "Resources", subtitle: "Explore guides and tools for your mental wellbeing." },
  "/student/mood-history": { title: "Mood History", subtitle: "Review your mood trends and reflections." },
  "/student/notifications": { title: "Notifications", subtitle: "Stay updated on important activity." },
  "/student/profile": { title: "My Profile", subtitle: "Manage your personal information and account settings." },
  "/student/help": { title: "Help & Crisis", subtitle: "Find urgent support resources and crisis contacts." },
  "/student/assessment": { title: "Wellbeing Assessment", subtitle: "Complete a self-reflection assessment." },
  "/student/assessment-results": { title: "Assessment Results", subtitle: "Review your assessment results and guidance." },
};

const counselorMeta: Record<string, PageMeta> = {
  "/counselor/dashboard": { title: "Dashboard", subtitle: "Overview of requests, sessions, and student support activity." },
  "/counselor/requests": { title: "Appointment Requests", subtitle: "Review and respond to student appointment requests." },
  "/counselor/schedule": { title: "Schedule", subtitle: "Manage your availability and upcoming sessions." },
  "/counselor/cases": { title: "Student Management", subtitle: "View and support students in your caseload." },
  "/counselor/callsessions": { title: "Call Sessions", subtitle: "Join and manage counseling call sessions." },
  "/counselor/call-sessions": { title: "Call Sessions", subtitle: "Join and manage counseling call sessions." },
  "/counselor/messages": { title: "Messages", subtitle: "Communicate securely with students." },
  "/counselor/assistant": { title: "AI Assistant", subtitle: "Get supportive guidance for counselor workflows and mental health topics." },
  "/counselor/notes": { title: "Session Notes", subtitle: "Document and review counseling session notes." },
  "/counselor/resources": { title: "Resources", subtitle: "Access and share helpful wellbeing resources." },
  "/counselor/profile": { title: "My Profile", subtitle: "Manage your counselor profile and account settings." },
  "/counselor/notifications": { title: "Notifications", subtitle: "Stay updated on appointment and account activity." },
};

const adminMeta: Record<string, PageMeta> = {
  "/admin/dashboard": { title: "Dashboard", subtitle: "System overview, key metrics, and administrative insights." },
  "/admin/users": { title: "User Management", subtitle: "Manage student, counselor, and admin accounts." },
  "/admin/appointments": { title: "Appointments", subtitle: "Monitor and manage appointments across the system." },
  "/admin/callsessions": { title: "Call Sessions", subtitle: "Monitor call sessions and activity." },
  "/admin/call-sessions": { title: "Call Sessions", subtitle: "Monitor call sessions and activity." },
  "/admin/content": { title: "Content Management", subtitle: "Manage resources and platform content." },
  "/admin/reports": { title: "Reports & Analytics", subtitle: "Review system reports and analytics." },
  "/admin/settings": { title: "System Settings", subtitle: "Configure system settings and review audit information." },
  "/admin/notifications": { title: "Notifications", subtitle: "Review account and platform activity updates." },
};

function resolveMeta(pathname: string, fallbackTitle: string): PageMeta {
  const pool = pathname.startsWith("/student")
    ? studentMeta
    : pathname.startsWith("/counselor")
      ? counselorMeta
      : pathname.startsWith("/admin")
        ? adminMeta
        : {};

  if (pool[pathname]) return pool[pathname];

  // Dynamic routes (e.g. /student/resources/:slug, /student/appointments/:id)
  const entries = Object.entries(pool).sort((a, b) => b[0].length - a[0].length);
  for (const [key, value] of entries) {
    if (pathname === key || pathname.startsWith(key + "/")) return value;
  }

  return { title: fallbackTitle };
}

export default function PortalLayout({
  title: fallbackTitle,
  subtitle: fallbackSubtitle,
}: {
  title?: string;
  subtitle?: string;
}) {
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  const meta = useMemo(
    () => resolveMeta(pathname, fallbackTitle ?? "MindWell"),
    [pathname, fallbackTitle],
  );

  const resolvedTitle = meta.title || fallbackTitle || "MindWell";
  const resolvedSubtitle = meta.subtitle ?? fallbackSubtitle;

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    function onResize() {
      if (window.innerWidth >= 1024) setMobileOpen(false);
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusTimer = window.setTimeout(() => {
      const firstVisible = Array.from(
        drawerRef.current?.querySelectorAll<HTMLElement>("a, button") ?? [],
      ).find((element) => element.offsetParent !== null);
      firstVisible?.focus();
    }, 0);

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMobileOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileOpen]);

  useEffect(() => {
    const pageName = resolvedTitle || fallbackTitle || "MindWell";
    document.title = `${pageName} | MindWell`;
  }, [resolvedTitle, fallbackTitle]);

  return (
    <div className="relative flex min-h-screen bg-canvas">
      <a href="#main-content" className="mw-skip-link">
        Skip to main content
      </a>
      {mobileOpen ? (
        <button
          type="button"
          aria-label="Close navigation menu"
          className="fixed inset-0 z-50 bg-[#0A3D33]/55 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}
      <div
        ref={drawerRef}
        className={cn(
          "fixed inset-y-0 left-0 z-[60] flex w-72 max-w-[85vw] shrink-0 transform transition-transform duration-150 ease-out lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:max-w-none lg:translate-x-0",
          sidebarCollapsed ? "lg:w-20" : "lg:w-72",
          mobileOpen ? "visible translate-x-0" : "invisible -translate-x-full lg:visible",
        )}
        role={mobileOpen ? "dialog" : undefined}
        aria-modal={mobileOpen ? true : undefined}
        aria-label={mobileOpen ? "Navigation" : undefined}
      >
        <AppSidebar
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((value) => !value)}
          onNavigate={() => setMobileOpen(false)}
        />
      </div>
      <main
        id="main-content"
        className="mw-main-with-bottom-nav relative min-w-0 flex-1 overflow-x-clip px-4 pt-5 sm:px-6 sm:pt-6 lg:px-10 lg:pt-10"
      >
        <AnimatedBackground variant="portal" />
        <div className="relative z-10 mx-auto max-w-7xl">
          <AppHeader
            title={resolvedTitle}
            subtitle={resolvedSubtitle}
            onOpenMenu={() => setMobileOpen(true)}
          />
          <PageTransition>
            <Outlet />
          </PageTransition>
        </div>
      </main>
      <MobileBottomNav />
    </div>
  );
}
