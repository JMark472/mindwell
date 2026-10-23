import { NextFunction, Request, Response } from "express";
import { verifyAccessToken, JwtPayload } from "@/lib/jwt";
import { ACCESS_COOKIE } from "@/lib/auth-cookies";

export type AuthenticatedRequest = Request & {
  user?: JwtPayload;
  authMethod?: "bearer" | "cookie";
};

export function extractBearerToken(header?: string) {
  if (!header) return undefined;
  const [scheme, token] = header.split(" ");
  if (!scheme || scheme.toLowerCase() !== "bearer" || !token) return undefined;
  return token.trim();
}

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const authReq = req as AuthenticatedRequest;

  let token = extractBearerToken(req.headers.authorization);
  const authMethod = token ? "bearer" : "cookie";
  if (!token && req.cookies) token = req.cookies[ACCESS_COOKIE];

  if (!token) {
    return res
      .status(401)
      .json({ status: "error", message: "Authentication required" });
  }

  const payload = verifyAccessToken(token);
  if (!payload) {
    return res
      .status(401)
      .json({ status: "error", message: "Invalid or expired token" });
  }

  authReq.user = payload;
  authReq.authMethod = authMethod;
  return next();
}
