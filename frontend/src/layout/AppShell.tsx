import { NavLink } from "react-router";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/utils/cn";
import {
  BarChart3,
  Bell,
  BookOpen,
  CalendarClock,
  CalendarDays,
  CalendarPlus,
  CalendarRange,
  FileText,
  GraduationCap,
  HeartPulse,
  Inbox,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  NotebookPen,
  Settings,
  ShieldCheck,
  UserCog,
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
  { to: "/student/resources", label: "Resources", icon: BookOpen },
  { to: "/student/notifications", label: "Notifications", icon: Bell },
  { to: "/student/profile", label: "Profile & Settings", icon: Settings },
  { to: "/student/help", label: "Help & Crisis", icon: LifeBuoy },
];

const counselorLinks: SidebarLink[] = [
  { to: "/counselor/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/counselor/requests", label: "Appointment Requests", icon: Inbox },
  { to: "/counselor/schedule", label: "Schedule", icon: CalendarRange },
  { to: "/counselor/cases", label: "Student Cases", icon: Users },
  { to: "/counselor/notes", label: "Session Notes", icon: NotebookPen },
  { to: "/counselor/resources", label: "Resources", icon: BookOpen },
  { to: "/counselor/profile", label: "Profile & Settings", icon: Settings },
];

const adminLinks: SidebarLink[] = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/users", label: "User Management", icon: Users },
  { to: "/admin/counselors", label: "Counselors", icon: UserCog },
  { to: "/admin/students", label: "Students", icon: GraduationCap },
  { to: "/admin/appointments", label: "Appointments", icon: CalendarClock },
  { to: "/admin/content", label: "Content", icon: FileText },
  { to: "/admin/reports", label: "Reports & Analytics", icon: BarChart3 },
  { to: "/admin/settings", label: "Settings & Audit", icon: ShieldCheck },
];

export function AppSidebar() {
  const { user, logout } = useAuth();

  const links =
    user?.role === "admin" ? adminLinks : user?.role === "counselor" ? counselorLinks : studentLinks;

  return (
    <aside className="mw-scrollbar sticky top-0 z-20 flex h-screen w-[272px] flex-col border-r border-line bg-surface">
      <div className="flex items-center gap-2.5 px-6 py-5">
        <img src="/logo.png" alt="Mindwell" className="h-9 w-9 rounded-field object-cover" />
        <div>
          <p className="text-sm font-semibold">Mindwell</p>
          <p className="text-[11px] uppercase tracking-[0.18em] text-ink-300">
            {user?.role}
          </p>
        </div>
      </div>

      <nav className="flex-1 px-3" aria-label="Main navigation">
        <ul className="flex flex-col gap-1">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  className={({ isActive }) =>
                    cn(
                      "group flex items-center gap-2.5 rounded-field px-3 py-2 text-sm transition-colors",
                      isActive
                        ? "bg-mint-soft font-medium text-navy"
                        : "text-ink-600 hover:bg-navy-050 hover:text-ink",
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        aria-hidden="true"
                        strokeWidth={1.8}
                        className={cn(
                          "h-[18px] w-[18px] shrink-0 transition-colors",
                          isActive
                            ? "text-teal-600"
                            : "text-ink-300 group-hover:text-ink-600",
                        )}
                      />
                      <span className="truncate">{link.label}</span>
                    </>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-line px-6 py-4">
        <p className="truncate text-sm font-medium">{user?.fullName}</p>
        <p className="truncate text-xs text-ink-400">{user?.email}</p>
        <button
          onClick={() => void logout()}
          className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-ink-400 transition-colors hover:text-danger"
        >
          <LogOut aria-hidden="true" strokeWidth={1.8} className="h-3.5 w-3.5" />
          Sign out
        </button>
      </div>
    </aside>
  );
}

export function AppHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  const { user } = useAuth();

  return (
    <header className="mb-6 flex items-start justify-between gap-4">
      <div className="flex flex-col gap-1">
        <p className="text-[11px] uppercase tracking-[0.24em] text-ink-300">Mindwell</p>
        <h1 className="text-display font-semibold">{title}</h1>
        {subtitle ? <p className="text-sm text-ink-400">{subtitle}</p> : null}
      </div>
      {user?.role === "student" ? (
        <NavLink
          to="/student/notifications"
          aria-label="Notifications"
          className="mt-1 flex h-10 w-10 items-center justify-center rounded-field border border-line bg-surface/90 text-ink-600 shadow-card backdrop-blur transition-colors hover:bg-navy-050 hover:text-ink"
        >
          <Bell aria-hidden="true" strokeWidth={1.8} className="h-[18px] w-[18px]" />
        </NavLink>
      ) : null}
    </header>
  );
}
