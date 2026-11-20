import { NavLink, useNavigate } from "react-router";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/utils/cn";
import PatternBackdrop from "@/components/ui/PatternBackdrop";
import MindPattern from "@/components/ui/MindPattern";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import { useEffect, useMemo, useRef, useState } from "react";
import UserAvatar from "@/components/profile/UserAvatar";
import Dropdown, { DROPDOWN_OPEN_EVENT, announceDropdownOpen } from "@/components/ui/Dropdown";
import {
  BarChart3,
  Bell,
  BookOpen,
  Bot,
  CalendarClock,
  CalendarDays,
  CalendarPlus,
  CalendarRange,
  ChevronDown,
  ChevronRight,
  FileText,
  HeartPulse,
  Inbox,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Menu,
  MessageSquare,
  NotebookPen,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";

const SEARCH_MENU_ID = "mw-header-search-menu";

interface SidebarLink {
  to: string;
  label: string;
  icon: LucideIcon;
  group?: string;
}

const studentLinks: SidebarLink[] = [
  { to: "/student/dashboard", label: "Dashboard", icon: LayoutDashboard, group: "Overview" },
  { to: "/student/notifications", label: "Notifications", icon: Bell },
  { to: "/student/check-in", label: "Mood Check-In", icon: HeartPulse, group: "Wellbeing" },
  { to: "/student/mood-history", label: "Mood History", icon: HeartPulse },
  { to: "/student/assessment", label: "Wellbeing Assessment", icon: HeartPulse },
  { to: "/student/resources", label: "Resources", icon: BookOpen },
  { to: "/student/appointments/book", label: "Book Counseling", icon: CalendarPlus, group: "Counseling" },
  { to: "/student/appointments", label: "My Appointments", icon: CalendarDays },
  { to: "/student/callsessions", label: "Call Sessions", icon: CalendarClock },
  { to: "/student/messages", label: "Messages", icon: MessageSquare },
  { to: "/student/assistant", label: "AI Assistant", icon: Bot },
  { to: "/student/profile", label: "Profile & Settings", icon: Settings, group: "Account" },
  { to: "/student/help", label: "Help & Crisis", icon: LifeBuoy },
];

const counselorLinks: SidebarLink[] = [
  { to: "/counselor/dashboard", label: "Dashboard", icon: LayoutDashboard, group: "Overview" },
  { to: "/counselor/notifications", label: "Notifications", icon: Bell },
  { to: "/counselor/requests", label: "Appointment Requests", icon: Inbox, group: "Counseling" },
  { to: "/counselor/cases", label: "Student Management", icon: Users },
  { to: "/counselor/schedule", label: "Schedule", icon: CalendarRange },
  { to: "/counselor/callsessions", label: "Call Sessions", icon: CalendarClock },
  { to: "/counselor/notes", label: "Session Notes", icon: NotebookPen },
  { to: "/counselor/messages", label: "Messages", icon: MessageSquare },
  { to: "/counselor/assistant", label: "AI Assistant", icon: Bot },
  { to: "/counselor/resources", label: "Resources", icon: BookOpen, group: "Resources" },
  { to: "/counselor/profile", label: "My Profile", icon: Settings, group: "Account" },
];

const adminLinks: SidebarLink[] = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard, group: "Overview" },
  { to: "/admin/notifications", label: "Notifications", icon: Bell },
  { to: "/admin/users", label: "User Management", icon: Users, group: "Management" },
  { to: "/admin/appointments", label: "Appointments", icon: CalendarRange },
  { to: "/admin/callsessions", label: "Call Sessions", icon: CalendarClock },
  { to: "/admin/content", label: "Content Management", icon: FileText },
  { to: "/admin/reports", label: "Reports & Analytics", icon: BarChart3, group: "Insights" },
  { to: "/admin/settings", label: "System Settings", icon: Settings, group: "Account" },
];

const studentBottomNav: SidebarLink[] = [
  { to: "/student/dashboard", label: "Home", icon: LayoutDashboard },
  { to: "/student/appointments", label: "Appts", icon: CalendarDays },
  { to: "/student/messages", label: "Messages", icon: MessageSquare },
  { to: "/student/resources", label: "Resources", icon: BookOpen },
  { to: "/student/profile", label: "Profile", icon: Settings },
];

const counselorBottomNav: SidebarLink[] = [
  { to: "/counselor/dashboard", label: "Home", icon: LayoutDashboard },
  { to: "/counselor/requests", label: "Requests", icon: Inbox },
  { to: "/counselor/schedule", label: "Schedule", icon: CalendarRange },
  { to: "/counselor/messages", label: "Messages", icon: MessageSquare },
  { to: "/counselor/profile", label: "Profile", icon: Settings },
];

const adminBottomNav: SidebarLink[] = [
  { to: "/admin/dashboard", label: "Home", icon: LayoutDashboard },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/appointments", label: "Appts", icon: CalendarRange },
  { to: "/admin/reports", label: "Reports", icon: BarChart3 },
  { to: "/admin/settings", label: "Settings", icon: Settings },
];

function useNavLinks() {
  const { user } = useAuth();
  if (user?.role === "counselor") return counselorLinks;
  if (user?.role === "admin") return adminLinks;
  return studentLinks;
}

function useBottomNavLinks() {
  const { user } = useAuth();
  if (user?.role === "counselor") return counselorBottomNav;
  if (user?.role === "admin") return adminBottomNav;
  return studentBottomNav;
}

export function AppSidebar({
  onNavigate,
  collapsed = false,
  onToggleCollapse,
}: {
  onNavigate?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}) {
  const links = useNavLinks();
  const unread = useUnreadMessages();

  return (
    <aside
      className={cn(
        "relative flex h-full shrink-0 flex-col overflow-hidden border-r border-[#1B6B5A] bg-[#0A3D33] text-white transition-[width] duration-300 ease-out",
        collapsed ? "w-20" : "w-72",
      )}
    >
      <PatternBackdrop className="opacity-10" curved={false} />
      <MindPattern className="opacity-40" />

      <div className="relative z-10 flex h-full flex-col">
        <div className={cn("flex items-center gap-3 px-5 pb-4 pt-6", collapsed && "justify-center px-2")}>
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/10 shadow-card">
            <img src="/logo.png" alt="Mindwell logo" className="h-8 w-8 rounded-field object-cover" />
          </div>
          {!collapsed ? (
            <div className="min-w-0 flex-1">
              <p className="text-base font-semibold tracking-tight">Mindwell</p>
              <p className="flex items-center gap-1.5 text-xs text-white/90">
                <Sparkles aria-hidden="true" strokeWidth={1.8} className="h-3.5 w-3.5 text-mint" />
                Wellness &amp; counseling
              </p>
            </div>
          ) : null}
          {onToggleCollapse ? (
            <button
              type="button"
              onClick={onToggleCollapse}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              className={cn(
                "hidden h-9 w-9 items-center justify-center rounded-xl border border-white/15 text-white/90 transition-colors hover:bg-white/10 hover:text-white lg:flex",
                collapsed && "absolute -right-3 top-7 z-20 bg-[#0A3D33] shadow-card",
              )}
            >
              {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            </button>
          ) : null}
          {onNavigate ? (
            <button
              type="button"
              onClick={onNavigate}
              aria-label="Close navigation menu"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/15 text-white/90 transition-colors hover:bg-white/10 hover:text-white lg:hidden"
            >
              <X className="h-5 w-5" />
            </button>
          ) : null}
        </div>

        <nav
          aria-label="Primary"
          className={cn("mw-scrollbar mt-2 flex flex-1 flex-col gap-1 overflow-y-auto pb-4", collapsed ? "px-2" : "px-3")}
        >
          {links.map((link) => {
            const showBadge = link.label === "Messages" && unread > 0;
            const Icon = link.icon;
            return (
              <div key={link.to}>
                {link.group && !collapsed ? (
                  <p className="px-3 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/85">
                    {link.group}
                  </p>
                ) : null}
                <NavLink
                  to={link.to}
                  onClick={onNavigate}
                  title={collapsed ? link.label : undefined}
                  className={({ isActive }) =>
                    cn(
                      "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200",
                      collapsed && "justify-center px-0",
                      isActive
                        ? "bg-white text-primary-deep shadow-card"
                        : "text-white hover:bg-white/10 hover:text-white",
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive ? (
                        <span className="absolute inset-y-2 left-0 w-1 rounded-full bg-primary" />
                      ) : null}
                      <span
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors",
                          isActive
                            ? "bg-light-mint text-primary-dark"
                            : "bg-white/5 text-white group-hover:bg-white/15",
                        )}
                      >
                        <Icon aria-hidden="true" strokeWidth={1.8} className="h-[18px] w-[18px]" />
                      </span>
                      {!collapsed ? <span className="flex-1 truncate font-medium">{link.label}</span> : null}
                      {!collapsed && showBadge ? (
                        <span className="flex h-5 min-w-5 items-center justify-center rounded-pill bg-primary-dark px-1.5 text-[11px] font-semibold leading-none text-white">
                          {unread > 99 ? "99+" : unread}
                        </span>
                      ) : null}
                    </>
                  )}
                </NavLink>
              </div>
            );
          })}
        </nav>

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
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const canMessage = user?.role === "student" || user?.role === "counselor";
  const unread = useUnreadMessages();
  const [q, setQ] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLFormElement>(null);

  const role = user?.role ?? "member";
  const navLinks = role === "counselor" ? counselorLinks : role === "admin" ? adminLinks : studentLinks;
  const messagesHref = role === "counselor" ? "/counselor/messages" : "/student/messages";
  const notificationsHref =
    role === "counselor" ? "/counselor/notifications" : role === "admin" ? "/admin/notifications" : "/student/notifications";
  const profileHref = role === "counselor" ? "/counselor/profile" : role === "admin" ? "/admin/settings" : "/student/profile";

  const results = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return [];
    return navLinks.filter((link) => link.label.toLowerCase().includes(query)).slice(0, 6);
  }, [q, navLinks]);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!searchRef.current?.contains(event.target as Node)) setSearchOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setSearchOpen(false);
    }
    function onOtherMenuOpen(event: Event) {
      const id = (event as CustomEvent<{ id: string }>).detail?.id;
      if (id && id !== SEARCH_MENU_ID) setSearchOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener(DROPDOWN_OPEN_EVENT, onOtherMenuOpen);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener(DROPDOWN_OPEN_EVENT, onOtherMenuOpen);
    };
  }, []);

  function openSearch() {
    setSearchOpen(true);
    announceDropdownOpen(SEARCH_MENU_ID);
  }

  function goTo(link: SidebarLink) {
    navigate(link.to);
    setQ("");
    setSearchOpen(false);
  }

  function onSearchSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (results[0]) goTo(results[0]);
  }

  async function handleLogout() {
    await logout();
    navigate("/signin");
  }

  return (
    <header className="relative z-30 mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:flex-nowrap sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        {onOpenMenu ? (
          <button
            type="button"
            onClick={onOpenMenu}
            aria-label="Open navigation menu"
            className="mt-0.5 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-white text-heading shadow-card transition-all hover:border-primary/30 hover:bg-light-mint active:scale-95 lg:hidden"
          >
            <Menu aria-hidden="true" strokeWidth={1.8} className="h-5 w-5" />
          </button>
        ) : null}
        <div className="min-w-0">
          <nav aria-label="Breadcrumb" className="hidden items-center gap-1.5 text-xs font-medium text-body sm:flex">
            <span>MindWell</span>
            <ChevronRight className="h-3.5 w-3.5 text-body" />
            <span className="capitalize">{role} portal</span>
            <ChevronRight className="h-3.5 w-3.5 text-body" />
            <span className="text-heading">{title}</span>
          </nav>
          <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-body sm:hidden">
            <ShieldCheck aria-hidden="true" strokeWidth={1.8} className="h-4 w-4 text-primary" />
            {role} portal
          </p>
          <h1 className="mt-1 text-xl font-semibold leading-snug tracking-tight text-heading sm:truncate sm:text-2xl lg:text-[1.75rem]">
            {title}
          </h1>
          {subtitle ? <p className="mt-1 max-w-3xl text-sm text-body">{subtitle}</p> : null}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <form ref={searchRef} onSubmit={onSearchSubmit} className="relative hidden md:block">
          <div className="flex items-center gap-2 rounded-full border border-border bg-white px-3 py-2 shadow-card transition-colors focus-within:border-primary">
            <Search aria-hidden="true" strokeWidth={1.8} className="h-4 w-4 text-body" />
            <input
              value={q}
              onChange={(event) => {
                setQ(event.target.value);
                openSearch();
              }}
              onFocus={openSearch}
              placeholder="Search pages..."
              aria-label="Search pages"
              className="w-36 bg-transparent text-xs text-heading outline-none placeholder:text-body lg:w-44"
            />
          </div>
          {searchOpen && results.length > 0 ? (
            <div
              id={SEARCH_MENU_ID}
              role="menu"
              aria-label="Page search results"
              className="mw-dropdown left-0 w-[min(18rem,calc(100vw-2rem))] p-1.5"
            >
              {results.map((link) => {
                const Icon = link.icon;
                return (
                  <button
                    key={link.to}
                    type="button"
                    onClick={() => goTo(link)}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-heading transition-colors hover:bg-light-mint"
                  >
                    <Icon className="h-4 w-4 text-primary" />
                    <span className="truncate">{link.label}</span>
                  </button>
                );
              })}
            </div>
          ) : null}
        </form>

        <NavLink
          to={notificationsHref}
          aria-label="Notifications"
          title="Notifications"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-white text-body shadow-card transition-all hover:border-primary/30 hover:bg-light-mint hover:text-heading active:scale-95"
        >
          <Bell aria-hidden="true" strokeWidth={1.8} className="h-[18px] w-[18px]" />
        </NavLink>

        {canMessage ? (
          <NavLink
            to={messagesHref}
            aria-label={unread > 0 ? `Messages, ${unread} unread messages` : "Messages"}
            title="Messages"
            className="relative hidden h-11 w-11 items-center justify-center rounded-full border border-border bg-white text-body shadow-card transition-all hover:border-primary/30 hover:bg-light-mint hover:text-heading active:scale-95 lg:flex"
          >
            <MessageSquare aria-hidden="true" strokeWidth={1.8} className="h-[18px] w-[18px]" />
            {unread > 0 ? (
              <span
                aria-hidden="true"
                className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-pill bg-primary-dark px-1 text-[10px] font-semibold leading-none text-white ring-2 ring-white"
              >
                {unread > 9 ? "9+" : unread}
              </span>
            ) : null}
          </NavLink>
        ) : null}

        <Dropdown
          align="right"
          width={280}
          ariaLabel="Account menu"
          trigger={({ open: menuOpen, toggle, menuId }) => (
            <button
              type="button"
              onClick={toggle}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              aria-controls={menuId}
              className="flex h-11 shrink-0 items-center justify-center gap-2 rounded-full border border-border bg-white pl-1 pr-2.5 text-heading shadow-card transition-all hover:border-primary/30 hover:bg-light-mint active:scale-95"
            >
              <UserAvatar
                user={{ fullName: user?.fullName ?? "User", avatarUrl: user?.avatarUrl ?? null }}
                size="sm"
                className="h-9 w-9 shrink-0"
              />
              <span className="hidden text-sm font-medium lg:block">
                {user?.fullName?.split(" ")[0] ?? "Account"}
              </span>
              <span className="sr-only">Open account menu</span>
              <ChevronDown
                aria-hidden="true"
                className={cn(
                  "h-4 w-4 shrink-0 text-body transition-transform duration-200",
                  menuOpen && "rotate-180",
                )}
              />
            </button>
          )}
        >
          {({ close }) => (
            <div className="w-full px-1 pb-1 pt-0.5">
              <div className="border-b border-border px-2.5 pb-3 pt-2">
                <p className="line-clamp-2 break-words text-sm font-semibold leading-snug text-heading">
                  {user?.fullName ?? "Signed in"}
                </p>
                <p className="mt-0.5 truncate text-xs capitalize text-body">{role}</p>
              </div>
              <div className="space-y-1 pt-1.5">
                <NavLink to={profileHref} onClick={close} className="mw-menu-item hidden lg:flex">
                  <Settings aria-hidden="true" className="h-4 w-4 shrink-0 text-primary" />
                  <span>Profile &amp; settings</span>
                </NavLink>
                <button
                  type="button"
                  onClick={() => {
                    close();
                    void handleLogout();
                  }}
                  className="mw-menu-item w-full text-danger-ink"
                >
                  <LogOut aria-hidden="true" className="h-4 w-4 shrink-0" />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          )}
        </Dropdown>
      </div>
    </header>
  );
}

export function MobileBottomNav() {
  const links = useBottomNavLinks();
  const unread = useUnreadMessages();

  return (
    <nav className="mw-bottom-nav" aria-label="Mobile primary">
      <div className="mw-bottom-nav-inner">
        {links.map((link) => {
          const Icon = link.icon;
          const showBadge = link.label === "Messages" && unread > 0;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                cn(
                  "relative flex min-h-[3.25rem] flex-col items-center justify-center gap-1 rounded-xl px-1 py-1.5 text-[11px] font-medium transition-colors active:scale-95",
                  isActive ? "bg-mint-soft text-teal-700" : "text-ink-400 hover:bg-navy-050 hover:text-ink-600",
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive ? (
                    <span aria-hidden="true" className="absolute inset-x-3 top-0 h-0.5 rounded-full bg-primary" />
                  ) : null}
                  <span className="relative">
                    <Icon aria-hidden="true" strokeWidth={isActive ? 2.2 : 1.8} className="h-5 w-5" />
                    {showBadge ? (
                      <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary-dark px-1 text-[9px] font-semibold leading-none text-white ring-2 ring-white">
                        {unread > 9 ? "9+" : unread}
                      </span>
                    ) : null}
                  </span>
                  <span className="w-full truncate text-center">{link.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
