import { createHmac, timingSafeEqual } from "node:crypto";
import { NextFunction, Request, Response } from "express";
import { ENV } from "@/config/env";

/**
 * Service-to-service guard. Internal endpoints (used by the Laravel service
 * to fetch user info or create notifications) must send
 * `X-Service-Key: SERVICE_KEY`. The key is only ever compared server-side.
 */
export function serviceKeyMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const provided = req.get("x-service-key");
  if (!provided) {
    return res
      .status(401)
      .json({ status: "error", message: "Missing service key" });
  }
  const expected = createHmac("sha256", "service")
    .update(ENV.SERVICE_KEY)
    .digest();
  const received = createHmac("sha256", "service").update(provided).digest();
  if (
    expected.length !== received.length ||
    !timingSafeEqual(expected, received)
  ) {
    return res
      .status(403)
      .json({ status: "error", message: "Invalid service key" });
  }
  return next();
}
