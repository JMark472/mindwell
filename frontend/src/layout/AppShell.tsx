import { NavLink, useNavigate } from "react-router";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/utils/cn";
import PatternBackdrop from "@/components/ui/PatternBackdrop";
import MindPattern from "@/components/ui/MindPattern";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import { useState } from "react";
import UserAvatar from "@/components/profile/UserAvatar";
import {
  BarChart3,
  Bell,
  BookOpen,
  Bot,
  CalendarClock,
  CalendarDays,
  CalendarPlus,
  CalendarRange,
  FileText,
  HeartPulse,
  Inbox,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Menu,
  MessageSquare,
  NotebookPen,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react";


interface SidebarLink {
  to: string;
  label: string;
  icon: LucideIcon;
}

const studentLinks: SidebarLink[] = [
  { to: "/student/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/student/check-in", label: "Mood Check-In", icon: HeartPulse },
  { to: "/student/appointments/book", label: "Book Counseling", icon: CalendarPlus },
  { to: "/student/appointments", label: "My Appointments", icon: CalendarDays },
  { to: "/student/callsessions", label: "Call Sessions", icon: CalendarClock },
  { to: "/student/messages", label: "Messages", icon: MessageSquare },
  { to: "/student/assistant", label: "AI Assistant", icon: Bot },
  { to: "/student/resources", label: "Resources", icon: BookOpen },
  { to: "/student/notifications", label: "Notifications", icon: Bell },
  { to: "/student/profile", label: "Profile & Settings", icon: Settings },
  { to: "/student/help", label: "Help & Crisis", icon: LifeBuoy },
];

const counselorLinks: SidebarLink[] = [
  { to: "/counselor/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/counselor/requests", label: "Appointment Requests", icon: Inbox },
  { to: "/counselor/cases", label: "Student Management", icon: Users },
  { to: "/counselor/callsessions", label: "Call Sessions", icon: CalendarClock },
  { to: "/counselor/messages", label: "Messages", icon: MessageSquare },
  { to: "/counselor/assistant", label: "AI Assistant", icon: Bot },
  { to: "/counselor/schedule", label: "Schedule", icon: CalendarRange },
  { to: "/counselor/notes", label: "Session Notes", icon: NotebookPen },
  { to: "/counselor/resources", label: "Resources", icon: BookOpen },
  { to: "/counselor/profile", label: "Profile & Settings", icon: Settings },
];

const adminLinks: SidebarLink[] = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/users", label: "User Management", icon: Users },
  { to: "/admin/appointments", label: "Appointments", icon: CalendarClock },
  { to: "/admin/callsessions", label: "Call Sessions", icon: CalendarClock },
  { to: "/admin/assistant", label: "AI Assistant", icon: Bot },
  { to: "/admin/content", label: "Content", icon: FileText },
  { to: "/admin/reports", label: "Reports & Analytics", icon: BarChart3 },
  { to: "/admin/settings", label: "Settings & Audit", icon: ShieldCheck },
];



export function AppSidebar({ onNavigate, className }: { onNavigate?: () => void; className?: string } = {}) {
  const { user, logout } = useAuth();
  const unread = useUnreadMessages();

  const links =
    user?.role === "admin" ? adminLinks : user?.role === "counselor" ? counselorLinks : studentLinks;

  return (
    <aside
      className={cn(
        "mw-scrollbar relative isolate flex h-full w-[280px] flex-col overflow-hidden border-r border-white/10 bg-gradient-to-b from-navy-800 via-navy to-navy-700 text-white shadow-[40px_0_80px_-60px_rgba(11,53,95,1)]",
        className,
      )}
    >
      <PatternBackdrop curved className="opacity-25 [mask-image:radial-gradient(ellipse_at_top,black,transparent)]" />
      <MindPattern className="opacity-70" />
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-teal/15 to-transparent" />
      <div className="absolute -left-20 top-16 h-40 w-40 rounded-full bg-teal/10 blur-3xl" />

      <div className="relative z-10 flex items-center gap-3 px-6 pt-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 shadow-[0_20px_60px_-30px_rgba(82,208,176,1)] ring-1 ring-white/15 backdrop-blur">
          <img src="/logo.png" alt="Mindwell" className="h-8 w-8 rounded-field object-cover" />
        </div>
        <div>
          <p className="text-sm font-semibold tracking-tight">Mindwell</p>
          <p className="text-[11px] uppercase tracking-[0.28em] text-white/40">
            {user?.role}
          </p>
        </div>
        <span className="ml-auto flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/70 ring-1 ring-white/10">
          <Sparkles aria-hidden="true" strokeWidth={1.8} className="h-4 w-4" />
        </span>
      </div>

      <nav className="relative z-10 mt-6 flex-1 px-4" aria-label="Main navigation">
        <ul className="flex flex-col gap-1">
          {links.map((link) => {
            const Icon = link.icon;
            const showBadge = link.to.endsWith("/messages") && unread > 0;
            return (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    cn(
                      "group relative flex items-center gap-2.5 rounded-field px-3 py-2 text-sm transition-all duration-200",
                      isActive
                        ? "bg-gradient-to-r from-white/15 to-white/5 font-medium text-white shadow-[0_20px_60px_-30px_rgba(82,208,176,1)] ring-1 ring-white/15"
                        : "text-white/70 hover:bg-white/10 hover:text-white",
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive ? (
                        <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-mint shadow-[0_0_0_6px_rgba(82,208,176,0.12)]" />
                      ) : null}
                      <Icon
                        aria-hidden="true"
                        strokeWidth={1.8}
                        className={cn(
                          "h-[18px] w-[18px] shrink-0 transition-colors",
                          isActive ? "text-mint" : "text-white/40 group-hover:text-white/80",
                        )}
                      />
                      <span className="truncate">{link.label}</span>
                      {showBadge ? (
                        <span
                          aria-label={`${unread} unread message${unread === 1 ? "" : "s"}`}
                          className="ml-auto rounded-pill bg-mint px-1.5 py-0.5 text-[10px] font-semibold leading-none text-navy"
                        >
                          {unread > 9 ? "9+" : unread}
                        </span>
                      ) : null}
                    </>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="relative z-10 mx-4 mb-4 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
        <UserAvatar size="md" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{user?.fullName}</p>
          <p className="truncate text-xs text-white/50">{user?.email}</p>
        </div>
        <button
          onClick={() => void logout()}
          aria-label="Sign out"
          className="flex h-9 w-9 items-center justify-center rounded-full text-white/50 transition-colors hover:bg-white/10 hover:text-white"
        >
          <LogOut aria-hidden="true" strokeWidth={1.8} className="h-4 w-4" />
        </button>
      </div>
    </aside>
  );
}

export function AppHeader({
  title,
  subtitle,
  onOpenMenu,
}: {
  title: string;
  subtitle?: string;
  onOpenMenu?: () => void;
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const unread = useUnreadMessages();
  const [searchQuery, setSearchQuery] = useState("");

  const canMessage = user?.role === "student" || user?.role === "counselor";
  const messagesHref =
    user?.role === "counselor" ? "/counselor/messages" : "/student/messages";
  const now = new Date();
  const dateLabel = now.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const searchRoutes = {
    student: [
      { keywords: ["dashboard"], path: "/student/dashboard" },
      { keywords: ["mood", "check"], path: "/student/check-in" },
      { keywords: ["book", "appointment", "counseling"], path: "/student/appointments/book" },
      { keywords: ["appointments"], path: "/student/appointments" },
      { keywords: ["call", "session"], path: "/student/callsessions" },
      { keywords: ["message"], path: "/student/messages" },
      { keywords: ["ai", "assistant"], path: "/student/assistant" },
      { keywords: ["resource"], path: "/student/resources" },
      { keywords: ["notification"], path: "/student/notifications" },
      { keywords: ["profile"], path: "/student/profile" },
      { keywords: ["help", "crisis"], path: "/student/help" },
    ],
    counselor: [
      { keywords: ["dashboard"], path: "/counselor/dashboard" },
      { keywords: ["request"], path: "/counselor/requests" },
      { keywords: ["schedule"], path: "/counselor/schedule" },
      { keywords: ["student", "case"], path: "/counselor/cases" },
      { keywords: ["call"], path: "/counselor/callsessions" },
      { keywords: ["message"], path: "/counselor/messages" },
      { keywords: ["ai", "assistant"], path: "/counselor/assistant" },
      { keywords: ["note"], path: "/counselor/notes" },
      { keywords: ["resource"], path: "/counselor/resources" },
      { keywords: ["profile"], path: "/counselor/profile" },
    ],
    admin: [
      { keywords: ["dashboard"], path: "/admin/dashboard" },
      { keywords: ["user", "management"], path: "/admin/users" },
      { keywords: ["appointment"], path: "/admin/appointments" },
      { keywords: ["call"], path: "/admin/callsessions" },
      { keywords: ["ai", "assistant"], path: "/admin/assistant" },
      { keywords: ["content"], path: "/admin/content" },
      { keywords: ["report"], path: "/admin/reports" },
      { keywords: ["setting"], path: "/admin/settings" },
    ],
  };

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    const query = searchQuery.toLowerCase().trim();
    if (!query || !user?.role) return;
    
    const routes = searchRoutes[user.role as keyof typeof searchRoutes] || [];
    for (const route of routes) {
      if (route.keywords.some(k => query.includes(k))) {
        navigate(route.path);
        setSearchQuery("");
        return;
      }
    }
    const dashboardPath = user.role === "admin" ? "/admin/dashboard" : user.role === "counselor" ? "/counselor/dashboard" : "/student/dashboard";
    navigate(dashboardPath);
    setSearchQuery("");
  }

  return (
    <header className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-center gap-3">
        {onOpenMenu ? (
          <button
            type="button"
            onClick={onOpenMenu}
            aria-label="Open navigation"
            className="flex h-10 w-10 items-center justify-center rounded-field border border-white/70 bg-white/80 text-ink-600 shadow-card backdrop-blur-xl transition-colors hover:bg-white lg:hidden"
          >
            <Menu aria-hidden="true" strokeWidth={1.8} className="h-5 w-5" />
          </button>
        ) : null}
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.28em] text-ink-300">
            <span>Mindwell</span>
            <span className="hidden sm:inline-block h-1 w-1 rounded-full bg-ink-300" />
            <span className="hidden sm:inline">{dateLabel}</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl lg:text-display">{title}</h1>
          {subtitle ? <p className="text-sm text-ink-400">{subtitle}</p> : null}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <form
          onSubmit={handleSearchSubmit}
          className="hidden items-center gap-2 rounded-full border border-white/70 bg-white/80 px-3 py-1.5 text-xs text-ink-400 shadow-card backdrop-blur-xl md:flex"
        >
          <Search aria-hidden="true" strokeWidth={1.8} className="h-4 w-4" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search across Mindwell"
            className="w-40 bg-transparent text-sm text-ink placeholder:text-ink-400 focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-pill bg-navy-050 px-1.5 py-0.5 text-[10px] hover:bg-teal/10"
          >
            Go
          </button>
        </form>

        {user?.role === "student" ? (
          <NavLink
            to="/student/notifications"
            aria-label="Notifications"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/70 bg-white/80 text-ink-600 shadow-card backdrop-blur-xl transition-colors hover:bg-white hover:text-ink"
          >
            <Bell aria-hidden="true" strokeWidth={1.8} className="h-[18px] w-[18px]" />
          </NavLink>
        ) : null}

        {canMessage ? (
          <NavLink
            to={messagesHref}
            aria-label={
              unread > 0
                ? `Messages, ${unread} unread message${unread === 1 ? "" : "s"}`
                : "Messages"
            }
            className="relative flex h-10 w-10 items-center justify-center rounded-full border border-white/70 bg-white/80 text-ink-600 shadow-card backdrop-blur-xl transition-colors hover:bg-white hover:text-ink"
          >
            <MessageSquare
              aria-hidden="true"
              strokeWidth={1.8}
              className="h-[18px] w-[18px]"
            />
            {unread > 0 ? (
              <span
                aria-hidden="true"
                className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-pill bg-gradient-to-r from-teal to-mint px-1 text-[10px] font-semibold leading-none text-white ring-2 ring-white"
              >
                {unread > 9 ? "9+" : unread}
              </span>
            ) : null}
          </NavLink>
        ) : null}
      </div>
    </header>
  );
}
