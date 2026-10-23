import { NextFunction, Request, Response } from "express";
import type { AuthenticatedRequest } from "@/middlewares/auth-middleware";

export type Role = "student" | "counselor" | "admin";

/**
 * Role check executed on the server for every protected route. Hiding buttons
 * in the UI is never the authorization boundary.
 */
export function requireRole(...allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const { user } = req as AuthenticatedRequest;
    if (!user) {
      return res
        .status(401)
        .json({ status: "error", message: "Authentication required" });
    }
    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({
        status: "error",
        message: "You are not authorized to access this resource.",
      });
    }
    return next();
  };
}
