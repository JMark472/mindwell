import type { Response } from "express";
import { ENV } from "@/config/env";
import { toMilliseconds } from "@/lib/jwt";
import {
  csrfCookieName,
  csrfSessionCookieName,
  setCsrfCookies,
} from "@/lib/csrf";

export const ACCESS_COOKIE = "mw_access";
export const REFRESH_COOKIE = "mw_refresh";

function authCookieOptions(maxAge?: number) {
  return {
    httpOnly: true,
    secure: ENV.isProduction,
    sameSite: (ENV.isProduction ? "none" : "lax") as "none" | "lax",
    path: "/",
    maxAge,
  };
}

export function setAuthCookies(
  res: Response,
  tokens: { accessToken: string; refreshToken: string },
) {
  res.cookie(
    ACCESS_COOKIE,
    tokens.accessToken,
    authCookieOptions(toMilliseconds(ENV.ACCESS_TOKEN_TTL)),
  );
  res.cookie(
    REFRESH_COOKIE,
    tokens.refreshToken,
    authCookieOptions(toMilliseconds(ENV.REFRESH_TOKEN_TTL)),
  );
  setCsrfCookies(res);
}

export function clearAuthCookies(res: Response) {
  const options = { ...authCookieOptions(), expires: new Date(0) };
  res.clearCookie(ACCESS_COOKIE, options);
  res.clearCookie(REFRESH_COOKIE, options);
  res.clearCookie(csrfCookieName, options);
  res.clearCookie(csrfSessionCookieName, { ...options, httpOnly: true });
}
