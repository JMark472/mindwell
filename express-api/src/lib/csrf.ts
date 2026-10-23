import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import type { Request, Response } from "express";
import { ENV } from "@/config/env";

export const csrfCookieName = "mw_csrf";
export const csrfSessionCookieName = "mw_csrf_session";
export const CSRF_HEADER = "x-csrf-token";

export function signCsrfToken(rawToken: string): string {
  return createHmac("sha256", ENV.CSRF_SECRET).update(rawToken).digest("hex");
}

/**
 * Double-submit CSRF: a random token is stored in a JS-readable cookie. The
 * browser must echo it in the x-csrf-token header on every state-changing
 * request. The server signs the token so it cannot be forged from other
 * attacker-controlled cookies.
 */
export function setCsrfCookies(res: Response) {
  const raw = randomBytes(32).toString("hex");
  const signed = signCsrfToken(raw);
  const base = {
    httpOnly: false, // must be readable by the SPA
    secure: ENV.isProduction,
    sameSite: (ENV.isProduction ? "none" : "lax") as "none" | "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
  res.cookie(csrfCookieName, signed, base);
  // HttpOnly twin used to detect cookie tossing / session fixation.
  res.cookie(csrfSessionCookieName, signed, {
    ...base,
    httpOnly: true,
    sameSite: (ENV.isProduction ? "none" : "lax") as "none" | "lax",
  });
}

export function verifyCsrf(req: Request): boolean {
  const header = req.get(CSRF_HEADER);
  const cookie = req.cookies?.[csrfCookieName];
  const session = req.cookies?.[csrfSessionCookieName];
  if (!header || !cookie || !session) return false;
  const a = Buffer.from(header);
  const b = Buffer.from(cookie);
  const c = Buffer.from(session);
  return (
    a.length === b.length &&
    a.length === c.length &&
    timingSafeEqual(a, b) &&
    timingSafeEqual(a, c)
  );
}
