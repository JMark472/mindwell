import { useAuth } from "@/context/AuthContext";
import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router";
import type { Role } from "@/types";

interface GuardProps {
  children: ReactNode;
  roles?: Role[];
}

export function ProtectedRoute({ children, roles }: GuardProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <p className="text-sm text-ink-400">Loading your session…</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/signin" replace state={{ from: location }} />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to={getHomeForRole(user.role)} replace />;
  }

  return <>{children}</>;
}

export function PublicRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <p className="text-sm text-ink-400">Loading…</p>
      </div>
    );
  }

  if (user) {
    const state = location.state as { from?: Location } | null;
    const from = state?.from?.pathname ?? getHomeForRole(user.role);
    return <Navigate to={from} replace />;
  }

  return <>{children}</>;
}

function getHomeForRole(role: Role) {
  if (role === "admin") return "/admin/dashboard";
  if (role === "counselor") return "/counselor/dashboard";
  return "/student/dashboard";
}
