import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";

const EXPRESS_ORIGIN =
  (import.meta as any).env?.VITE_EXPRESS_API_URL?.replace(/\/$/, "") ?? "http://localhost:3000";
const LARAVEL_ORIGIN =
  (import.meta as any).env?.VITE_LARAVEL_API_URL?.replace(/\/$/, "") ?? "http://localhost:8000";

export const API_ORIGINS = {
  express: EXPRESS_ORIGIN,
  laravel: LARAVEL_ORIGIN,
};

/** Read a cookie that the API deliberately exposes to JavaScript (CSRF only). */
export function readCookie(name: string): string | null {
  const prefix = `${name}=`;
  for (const part of document.cookie.split(";")) {
    const trimmed = part.trim();
    if (trimmed.startsWith(prefix)) {
      return decodeURIComponent(trimmed.slice(prefix.length));
    }
  }
  return null;
}

export const UNAUTHORIZED_EVENT = "mindwell:unauthorized";

interface RetriableConfig extends InternalAxiosRequestConfig {
  _mwRetried?: boolean;
  _mwSkipAuthRetry?: boolean;
}

function attachCsrfHeader(config: InternalAxiosRequestConfig) {
  const method = (config.method ?? "get").toLowerCase();
  if (["get", "head", "options"].includes(method)) return config;

  const csrf = readCookie("mw_csrf");
  if (csrf) {
    config.headers.set("x-csrf-token", csrf);
  }
  return config;
}

/** Single-flight refresh so parallel 401s produce only one refresh request. */
let refreshPromise: Promise<boolean> | null = null;

export async function refreshSession(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      await express.post("/auth/refresh");
      return true;
    } catch {
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

function createClient(baseURL: string): AxiosInstance {
  const client = axios.create({
    baseURL,
    withCredentials: true,
    timeout: 20_000,
    headers: { Accept: "application/json" },
  });

  client.interceptors.request.use(attachCsrfHeader);

  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const config = error.config as RetriableConfig | undefined;
      const status = error.response?.status;
      const url = config?.url ?? "";

      const isAuthEndpoint =
        url.includes("/auth/login") ||
        url.includes("/auth/register") ||
        url.includes("/auth/refresh") ||
        url.includes("/auth/logout");

      if (status === 401 && config && !config._mwRetried && !config._mwSkipAuthRetry && !isAuthEndpoint) {
        config._mwRetried = true;
        const refreshed = await refreshSession();
        if (refreshed) {
          return client.request(config);
        }
        window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
      }

      return Promise.reject(error);
    },
  );

  return client;
}

/** Identity, accounts, notifications, admin, aggregated reports. */
export const express = createClient(`${EXPRESS_ORIGIN}/api`);

/** Appointments, counselors, resources, check-ins, consent, records. */
export const laravel = createClient(`${LARAVEL_ORIGIN}/api`);

/**
 * Ensures the CSRF cookie pair exists. Called once at boot and lazily before
 * a write when the cookie has expired.
 */
export async function ensureCsrf(): Promise<void> {
  if (readCookie("mw_csrf")) return;
  await express.get("/auth/csrf-token", { _mwSkipAuthRetry: true } as AxiosRequestConfig);
}

/** Extracts the human-readable message from an API error. */
export function errorMessage(error: unknown, fallback = "Something went wrong."): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string } | undefined;
    if (data?.message) return data.message;
    if (error.code === "ECONNABORTED") return "The request timed out. Please try again.";
    if (!error.response) return "Cannot reach the server. Check your connection and try again.";
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

/** Field-level validation errors, if the API returned them. */
export function fieldErrors(error: unknown): Record<string, string> {
  if (!axios.isAxiosError(error)) return {};
  const data = error.response?.data as
    | { errors?: Record<string, string[] | string> }
    | undefined;
  if (!data?.errors) return {};

  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(data.errors)) {
    result[key] = Array.isArray(value) ? value[0] : value;
  }
  return result;
}
