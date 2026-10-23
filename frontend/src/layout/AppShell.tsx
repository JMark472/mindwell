import { NavLink } from "react-router";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/utils/cn";

const studentLinks = [
  { to: "/student/dashboard", label: "Dashboard" },
  { to: "/student/check-in", label: "Mood Check-In" },
  { to: "/student/appointments/book", label: "Book Counseling" },
  { to: "/student/appointments", label: "My Appointments" },
  { to: "/student/resources", label: "Resources" },
  { to: "/student/notifications", label: "Notifications" },
  { to: "/student/profile", label: "Profile & Settings" },
  { to: "/student/help", label: "Help & Crisis" },
];

const counselorLinks = [
  { to: "/counselor/dashboard", label: "Dashboard" },
  { to: "/counselor/requests", label: "Appointment Requests" },
  { to: "/counselor/schedule", label: "Schedule" },
  { to: "/counselor/cases", label: "Student Cases" },
  { to: "/counselor/notes", label: "Session Notes" },
  { to: "/counselor/resources", label: "Resources" },
  { to: "/counselor/profile", label: "Profile & Settings" },
];

const adminLinks = [
  { to: "/admin/dashboard", label: "Dashboard" },
  { to: "/admin/users", label: "User Management" },
  { to: "/admin/counselors", label: "Counselors" },
  { to: "/admin/students", label: "Students" },
  { to: "/admin/appointments", label: "Appointments" },
  { to: "/admin/content", label: "Content" },
  { to: "/admin/reports", label: "Reports & Analytics" },
  { to: "/admin/settings", label: "Settings & Audit" },
];

export function AppSidebar() {
  const { user, logout } = useAuth();

  const links =
    user?.role === "admin" ? adminLinks : user?.role === "counselor" ? counselorLinks : studentLinks;

  return (
    <aside className="mw-scrollbar sticky top-0 flex h-screen w-[272px] flex-col border-r border-line bg-surface">
      <div className="flex items-center gap-2 px-6 py-5">
        <img src="/logo.png" alt="Mindwell" className="h-9 w-9 rounded-field object-cover" />
        <div>
          <p className="text-sm font-semibold">Mindwell</p>
          <p className="text-[11px] uppercase tracking-[0.18em] text-ink-300">
            {user?.role}
          </p>
        </div>
      </div>

      <nav className="flex-1 px-3">
        <ul className="flex flex-col gap-1">
          {links.map((link) => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                className={({ isActive }) =>
                  cn(
                    "flex items-center rounded-field px-3 py-2 text-sm transition-colors",
                    isActive
                      ? "bg-mint-soft font-medium text-navy"
                      : "text-ink-600 hover:bg-navy-050 hover:text-ink",
                  )
                }
              >
                {link.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-t border-line px-6 py-4">
        <p className="truncate text-sm font-medium">{user?.fullName}</p>
        <p className="truncate text-xs text-ink-400">{user?.email}</p>
        <button
          onClick={() => void logout()}
          className="mt-2 text-xs font-medium text-ink-400 hover:text-danger"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}

export function AppHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="mb-6 flex flex-col gap-1">
      <p className="text-[11px] uppercase tracking-[0.24em] text-ink-300">Mindwell</p>
      <h1 className="text-display font-semibold">{title}</h1>
      {subtitle ? <p className="text-sm text-ink-400">{subtitle}</p> : null}
    </header>
  );
}
