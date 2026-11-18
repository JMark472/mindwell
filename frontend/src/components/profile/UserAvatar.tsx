import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";

function getInitials(name?: string | null) {
  if (!name) return "MW";
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function resolveAvatarUrl(avatarUrl?: string | null) {
  if (!avatarUrl) return null;
  if (avatarUrl.startsWith("http") || avatarUrl.startsWith("data:") || avatarUrl.startsWith("blob:")) {
    return avatarUrl;
  }
  let base = ((import.meta as any).env?.VITE_EXPRESS_API_URL || "http://localhost:3000").replace(/\/$/, "");
  if (typeof window !== "undefined") {
    const hostIsLocalPage = /^(localhost|127\.0\.0\.1)$/i.test(window.location.hostname);
    const baseIsLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(base);
    if (!hostIsLocalPage && baseIsLocalhost) {
      base = base.replace(/localhost|127\.0\.0\.1/i, window.location.hostname);
    }
  }
  return `${base}${avatarUrl.startsWith("/") ? avatarUrl : `/${avatarUrl}`}`;
}

interface UserAvatarProps {
  user?: { fullName?: string | null; avatarUrl?: string | null } | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeMap = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-xs",
  md: "h-9 w-9 text-xs",
  lg: "h-12 w-12 text-sm",
  xl: "h-24 w-24 text-xl",
};

export default function UserAvatar({ user: propUser, size = "md", className = "" }: UserAvatarProps) {
  const { user: authUser } = useAuth();
  const user = propUser !== undefined ? propUser : authUser;
  const resolved = resolveAvatarUrl(user?.avatarUrl);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [resolved]);

  if (resolved && !failed) {
    return (
      <img
        src={resolved}
        alt={user?.fullName || "User"}
        className={`${sizeMap[size]} shrink-0 rounded-full object-cover ring-1 ring-white/20 ${className}`}
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <div
      className={`${sizeMap[size]} flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-mint to-teal font-semibold text-navy ring-1 ring-white/20 ${className}`}
    >
      {getInitials(user?.fullName)}
    </div>
  );
}
