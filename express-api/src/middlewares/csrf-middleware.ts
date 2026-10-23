import { NextFunction, Request, Response } from "express";
import { verifyCsrf } from "@/lib/csrf";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * CSRF guard for cookie-authenticated write requests. Bearer-token requests
 * (service-to-server or native clients) are exempt because they cannot be
 * sent automatically by a browser.
 */
export function csrfMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (SAFE_METHODS.has(req.method)) return next();
  if (req.headers.authorization) return next();
  if (!verifyCsrf(req)) {
    return res
      .status(403)
      .json({ status: "error", message: "CSRF validation failed" });
  }
  return next();
}
