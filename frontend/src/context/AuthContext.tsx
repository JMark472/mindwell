import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { fetchSession, login as apiLogin, logout as apiLogout } from "@/api/auth";
import type { User } from "@/types";
import { UNAUTHORIZED_EVENT } from "@/api/client";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSession = useCallback(async () => {
    // Never let a slow or blocked session probe trap the UI on "Loading…".
    // The hard cap is longer than the HTTP client timeout on purpose.
    let timer: number | undefined;
    const failSafe = new Promise<never>((_, reject) => {
      timer = window.setTimeout(
        () => reject(new Error("Session check timed out")),
        8_000,
      );
    });

    try {
      setError(null);
      const sessionUser = await Promise.race([fetchSession(), failSafe]);
      setUser(sessionUser);
    } catch {
      setUser(null);
    } finally {
      if (timer !== undefined) window.clearTimeout(timer);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
    };
    window.addEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setError(null);
    try {
      const { user: loggedInUser } = await apiLogin(email, password);
      setUser(loggedInUser);
      return loggedInUser;
    } catch (err) {
      const { errorMessage } = await import("@/api/client");
      const message = errorMessage(err, "Sign in failed.");
      setError(message);
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } finally {
      setUser(null);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      error,
      login,
      logout,
      refreshSession: loadSession,
      setUser,
    }),
    [user, loading, error, login, logout, loadSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
