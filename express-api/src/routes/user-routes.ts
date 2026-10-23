import { Router, NextFunction, Request, Response } from "express";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { studentProfiles, users } from "@/db/schema";
import { validate } from "@/middlewares/validation-middleware";
import { authMiddleware, type AuthenticatedRequest } from "@/middlewares/auth-middleware";
import { requireRole } from "@/middlewares/role-middleware";
import { changePassword } from "@/services/auth-service";
import { findUserById, toSafeUser } from "@/services/user-service";
import { writeAudit } from "@/lib/audit";
import { ApiError } from "@/services/auth-service";

const router = Router();

const asyncHandler =
  (fn: (req: Request, res: Response) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) =>
    fn(req, res).catch(next);

router.use(authMiddleware);

const profileUpdateSchema = z.object({
  body: z.object({
    fullName: z.string().min(2).max(120).optional(),
    phone: z.string().max(40).nullable().optional(),
    studentNumber: z.string().max(40).nullable().optional(),
    program: z.string().max(120).nullable().optional(),
    yearLevel: z.string().max(40).nullable().optional(),
    gender: z.string().max(40).nullable().optional(),
    dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
    emergencyContactName: z.string().max(120).nullable().optional(),
    emergencyContactPhone: z.string().max(40).nullable().optional(),
  }),
});

const passwordChangeSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1).max(200),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters.")
      .max(200)
      .regex(/[a-zA-Z]/, "Password must contain a letter.")
      .regex(/[0-9]/, "Password must contain a number."),
  }),
});

router.get(
  "/me",
  asyncHandler(async (req, res) => {
    const { user } = req as AuthenticatedRequest;
    const row = await findUserById(Number(user!.sub));
    if (!row) throw new ApiError(404, "User not found.");
    let profile: Record<string, unknown> | null = null;
    if (row.role === "student") {
      const [p] = await db
        .select()
        .from(studentProfiles)
        .where(eq(studentProfiles.userId, row.id))
        .limit(1);
      profile = p ?? null;
    }
    res.json({ status: "success", data: { user: toSafeUser(row), profile } });
  }),
);

router.patch(
  "/me",
  validate(profileUpdateSchema),
  asyncHandler(async (req, res) => {
    const { user } = req as AuthenticatedRequest;
    const userId = Number(user!.sub);
    const body = req.body as Record<string, unknown>;

    const userFields: Record<string, unknown> = {};
    if (body.fullName !== undefined) userFields.fullName = body.fullName;
    if (body.phone !== undefined) userFields.phone = body.phone;

    if (Object.keys(userFields).length > 0) {
      await db
        .update(users)
        .set({ ...userFields, updatedAt: new Date() })
        .where(eq(users.id, userId))
        .execute();
    }

    if (user!.role === "student") {
      const profileFields: Record<string, unknown> = {};
      for (const key of [
        "studentNumber",
        "program",
        "yearLevel",
        "gender",
        "dateOfBirth",
        "emergencyContactName",
        "emergencyContactPhone",
      ]) {
        if (body[key] !== undefined) profileFields[key] = body[key];
      }
      if (Object.keys(profileFields).length > 0) {
        await db
          .update(studentProfiles)
          .set(profileFields)
          .where(eq(studentProfiles.userId, userId))
          .execute();
      }
    }

    await writeAudit({ actorUserId: userId, action: "user.profile_updated" });
    const row = await findUserById(userId);
    res.json({ status: "success", data: { user: row ? toSafeUser(row) : null } });
  }),
);

router.post(
  "/me/password",
  validate(passwordChangeSchema),
  asyncHandler(async (req, res) => {
    const { user } = req as AuthenticatedRequest;
    await changePassword(
      Number(user!.sub),
      req.body.currentPassword,
      req.body.newPassword,
    );
    res.json({ status: "success", data: { changed: true } });
  }),
);

// Counselor directory (students browse counselors before booking; the
// appointment workflow itself lives in the Laravel service).
router.get(
  "/counselors",
  requireRole("student", "admin"),
  asyncHandler(async (_req, res) => {
    const rows = await db
      .select({
        id: users.id,
        fullName: users.fullName,
        role: users.role,
        status: users.status,
      })
      .from(users)
      .where(eq(users.role, "counselor"))
      .limit(100);
    res.json({ status: "success", data: { counselors: rows.filter((r) => r.status === "active") } });
  }),
);

export default router;
