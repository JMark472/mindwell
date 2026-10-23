import { Router, Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { ENV } from "@/config/env";
import { validate } from "@/middlewares/validation-middleware";
import { authMiddleware, type AuthenticatedRequest } from "@/middlewares/auth-middleware";
import { setAuthCookies, clearAuthCookies } from "@/lib/auth-cookies";
import { setCsrfCookies } from "@/lib/csrf";
import * as authService from "@/services/auth-service";
import { toSafeUser } from "@/services/user-service";
import { findUserById } from "@/services/user-service";

const router = Router();

// Brute-force protection on credential endpoints.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { status: "error", message: "Too many attempts. Try again later." },
});

const asyncHandler =
  (fn: (req: Request, res: Response) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) =>
    fn(req, res).catch(next);

const credentialsSchema = z.object({
  body: z.object({
    email: z.string().email().max(190),
    password: z.string().min(1).max(200),
  }),
});

const registerSchema = z.object({
  body: z.object({
    email: z.string().email().max(190),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters.")
      .max(200)
      .regex(/[a-zA-Z]/, "Password must contain a letter.")
      .regex(/[0-9]/, "Password must contain a number."),
    fullName: z.string().min(2).max(120),
    studentNumber: z.string().max(40).optional(),
    program: z.string().max(120).optional(),
    yearLevel: z.string().max(40).optional(),
  }),
});

const resetRequestSchema = z.object({
  body: z.object({ email: z.string().email().max(190) }),
});

const resetSchema = z.object({
  body: z.object({
    token: z.string().min(10).max(200),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters.")
      .max(200)
      .regex(/[a-zA-Z]/, "Password must contain a letter.")
      .regex(/[0-9]/, "Password must contain a number."),
  }),
});

router.post(
  "/login",
  authLimiter,
  validate(credentialsSchema),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const result = await authService.login({
      email,
      password,
      ip: req.ip,
      userAgent: req.get("user-agent"),
    });
    setAuthCookies(res, result.tokens);
    res.status(200).json({ status: "success", data: { user: result.user } });
  }),
);

router.post(
  "/register",
  authLimiter,
  validate(registerSchema),
  asyncHandler(async (req, res) => {
    const result = await authService.register(req.body);
    setAuthCookies(res, result.tokens);
    res.status(201).json({ status: "success", data: { user: result.user } });
  }),
);

router.post(
  "/refresh",
  asyncHandler(async (req, res) => {
    const tokens = await authService.refresh(req.cookies?.mw_refresh);
    setAuthCookies(res, tokens);
    res.status(200).json({ status: "success", data: { refreshed: true } });
  }),
);

router.post(
  "/logout",
  asyncHandler(async (req, res) => {
    clearAuthCookies(res);
    res.status(200).json({ status: "success", data: { loggedOut: true } });
  }),
);

// Issues the double-submit CSRF cookie pair for the SPA.
router.get("/csrf-token", (_req, res) => {
  setCsrfCookies(res);
  res.status(200).json({ status: "success", data: { ok: true } });
});

router.get(
  "/me",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const { user } = req as AuthenticatedRequest;
    const row = await findUserById(Number(user!.sub));
    if (!row) {
      res.status(401).json({ status: "error", message: "Account no longer exists." });
      return;
    }
    if (row.status !== "active") {
      res.status(403).json({ status: "error", message: "Account is not active." });
      return;
    }
    res.json({ status: "success", data: { user: toSafeUser(row) } });
  }),
);

router.post(
  "/forgot-password",
  authLimiter,
  validate(resetRequestSchema),
  asyncHandler(async (req, res) => {
    const { token } = await authService.requestPasswordReset(req.body.email);
    // In development the token is returned directly so the flow is testable
    // without SMTP. In production, email it instead (nodemailer + SMTP env).
    res.json({
      status: "success",
      data: {
        message: "If that email is registered, a reset link was sent.",
        ...(ENV.NODE_ENV !== "production" && token ? { devToken: token } : {}),
      },
    });
  }),
);

router.post(
  "/reset-password",
  authLimiter,
  validate(resetSchema),
  asyncHandler(async (req, res) => {
    await authService.resetPassword(req.body.token, req.body.newPassword);
    res.json({ status: "success", data: { reset: true } });
  }),
);

export default router;
