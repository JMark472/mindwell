import { Router, NextFunction, Request, Response } from "express";
import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import bcrypt from "bcrypt";
import { z } from "zod";
import { db } from "@/db";
import { auditLogs, studentProfiles, systemSettings, users } from "@/db/schema";
import { validate } from "@/middlewares/validation-middleware";
import { authMiddleware, type AuthenticatedRequest } from "@/middlewares/auth-middleware";
import { requireRole } from "@/middlewares/role-middleware";
import { writeAudit } from "@/lib/audit";
import { ApiError } from "@/services/auth-service";
import { createUser, findUserById, toSafeUser } from "@/services/user-service";

function toAdminUser(row: typeof users.$inferSelect, profile?: typeof studentProfiles.$inferSelect | null) {
  return {
    ...toSafeUser(row),
    createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : null,
    updatedAt: row.updatedAt ? new Date(row.updatedAt).toISOString() : null,
    studentProfile: profile
      ? {
          studentNumber: profile.studentNumber ?? null,
          program: profile.program ?? null,
          yearLevel: profile.yearLevel ?? null,
          dateOfBirth: profile.dateOfBirth ? new Date(profile.dateOfBirth as any).toISOString().slice(0, 10) : null,
          gender: profile.gender ?? null,
          emergencyContactName: profile.emergencyContactName ?? null,
          emergencyContactPhone: profile.emergencyContactPhone ?? null,
        }
      : null,
  };
}

const router = Router();

const asyncHandler =
  (fn: (req: Request, res: Response) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) =>
    fn(req, res).catch(next);

router.use(authMiddleware, requireRole("admin"));

// GET /api/admin/users — paginated user list with filters.
router.get(
  "/users",
  asyncHandler(async (req, res) => {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const pageSize = Math.min(Math.max(Number(req.query.pageSize) || 20, 1), 100);
    const role = req.query.role as string | undefined;
    const status = req.query.status as string | undefined;
    const search = (req.query.search as string | undefined)?.trim();

    const conditions = [isNull(users.deletedAt)];
    if (role === "student" || role === "counselor" || role === "admin") {
      conditions.push(eq(users.role, role));
    }
    if (status === "active" || status === "inactive" || status === "suspended") {
      conditions.push(eq(users.status, status));
    }
    const where = and(...conditions);

    const rows = await db
      .select()
      .from(users)
      .where(where)
      .orderBy(desc(users.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    const filtered = search
      ? rows.filter((r) =>
          `${r.fullName} ${r.email}`.toLowerCase().includes(search.toLowerCase()),
        )
      : rows;

    const ids = filtered.map((r) => r.id);
    const profiles = ids.length
      ? await db.select().from(studentProfiles).where(inArray(studentProfiles.userId, ids))
      : [];
    const profileByUserId = new Map(profiles.map((p) => [Number(p.userId), p]));

    res.json({
      status: "success",
      data: {
        users: filtered.map((u) => toAdminUser(u, profileByUserId.get(u.id) ?? null)),
        page,
        pageSize,
      },
    });
  }),
);

const userCreateSchema = z.object({
  body: z.object({
    email: z.string().email().max(190),
    password: z.string().min(8).max(200),
    fullName: z.string().min(2).max(120),
    role: z.enum(["student", "counselor", "admin"]),
    phone: z.string().max(40).optional(),
  }),
});

router.post(
  "/users",
  validate(userCreateSchema),
  asyncHandler(async (req, res) => {
    const { user: actor } = req as AuthenticatedRequest;
    const created = await createUser(req.body);
    if (!created) throw new ApiError(500, "User creation failed.");
    await writeAudit({
      actorUserId: actor!.sub,
      action: "admin.user_created",
      entityType: "user",
      entityId: created.id,
      ip: req.ip,
      metadata: { role: req.body.role },
    });
    res.status(201).json({ status: "success", data: { user: toSafeUser(created) } });
  }),
);

const userStatusSchema = z.object({
  body: z.object({ status: z.enum(["active", "inactive", "suspended"]) }),
});

router.patch(
  "/users/:id/status",
  validate(userStatusSchema),
  asyncHandler(async (req, res) => {
    const { user: actor } = req as AuthenticatedRequest;
    const targetId = Number(req.params.id);
    if (targetId === Number(actor!.sub)) {
      throw new ApiError(400, "You cannot change the status of your own account.");
    }
    const target = await findUserById(targetId);
    if (!target) throw new ApiError(404, "User not found.");
    await db
      .update(users)
      .set({ status: req.body.status, updatedAt: new Date() })
      .where(eq(users.id, targetId))
      .execute();
    await writeAudit({
      actorUserId: actor!.sub,
      action: `admin.user_status.${req.body.status}`,
      entityType: "user",
      entityId: targetId,
      ip: req.ip,
    });
    res.json({ status: "success", data: { id: targetId, status: req.body.status } });
  }),
);

const roleChangeSchema = z.object({
  body: z.object({ role: z.enum(["student", "counselor", "admin"]) }),
});

router.patch(
  "/users/:id/role",
  validate(roleChangeSchema),
  asyncHandler(async (req, res) => {
    const { user: actor } = req as AuthenticatedRequest;
    const targetId = Number(req.params.id);
    if (targetId === Number(actor!.sub)) {
      throw new ApiError(400, "You cannot change your own role.");
    }
    const target = await findUserById(targetId);
    if (!target) throw new ApiError(404, "User not found.");
    await db
      .update(users)
      .set({ role: req.body.role, updatedAt: new Date() })
      .where(eq(users.id, targetId))
      .execute();
    // Students get a profile row if they are demoted to student.
    if (req.body.role === "student") {
      await db
        .insert(studentProfiles)
        .values({ userId: targetId })
        .onDuplicateKeyUpdate({ set: { userId: targetId } })
        .execute();
    }
    await writeAudit({
      actorUserId: actor!.sub,
      action: "admin.user_role_changed",
      entityType: "user",
      entityId: targetId,
      ip: req.ip,
      metadata: { from: target.role, to: req.body.role },
    });
    res.json({ status: "success", data: { id: targetId, role: req.body.role } });
  }),
);

// Set or generate a password for a user (admin). Returns the password once.
const setPasswordSchema = z.object({
  body: z.object({
    password: z.string().min(8).max(128).optional(),
    generate: z.boolean().optional(),
  }).refine((v) => v.generate || !!v.password, { message: "Provide a password or set generate=true." }),
});

router.post(
  "/users/:id/password",
  validate(setPasswordSchema),
  asyncHandler(async (req, res) => {
    const { user: actor } = req as AuthenticatedRequest;
    const targetId = Number(req.params.id);
    const target = await findUserById(targetId);
    if (!target) throw new ApiError(404, "User not found.");

    const plain: string =
      req.body.generate || !req.body.password
        ? Math.random().toString(36).slice(2, 10) + "A1!"
        : req.body.password;
    const passwordHash = await bcrypt.hash(plain, 12);
    await db
      .update(users)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(users.id, targetId))
      .execute();
    await writeAudit({
      actorUserId: actor!.sub,
      action: "admin.user_password_set",
      entityType: "user",
      entityId: targetId,
      ip: req.ip,
      metadata: { generated: req.body.generate || !req.body.password },
    });
    res.json({ status: "success", data: { temporaryPassword: plain } });
  }),
);

// Backwards-compatible reset endpoint.
router.post(
  "/users/:id/password-reset",
  asyncHandler(async (req, res) => {
    const { user: actor } = req as AuthenticatedRequest;
    const targetId = Number(req.params.id);
    const target = await findUserById(targetId);
    if (!target) throw new ApiError(404, "User not found.");
    const tempPassword = Math.random().toString(36).slice(2, 10) + "A1!";
    const passwordHash = await bcrypt.hash(tempPassword, 12);
    await db
      .update(users)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(users.id, targetId))
      .execute();
    await writeAudit({
      actorUserId: actor!.sub,
      action: "admin.user_password_reset",
      entityType: "user",
      entityId: targetId,
      ip: req.ip,
    });
    res.json({ status: "success", data: { temporaryPassword: tempPassword } });
  }),
);

const adminUpdateUserSchema = z.object({
  body: z.object({
    fullName: z.string().min(2).max(120).optional(),
    email: z.string().email().max(190).optional(),
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

router.patch(
  "/users/:id",
  validate(adminUpdateUserSchema),
  asyncHandler(async (req, res) => {
    const { user: actor } = req as AuthenticatedRequest;
    const targetId = Number(req.params.id);
    const target = await findUserById(targetId);
    if (!target) throw new ApiError(404, "User not found.");

    const body = req.body as Record<string, unknown>;

    if (body.email !== undefined && typeof body.email === "string") {
      const email = body.email.toLowerCase().trim();
      const [existing] = await db
        .select({ id: users.id })
        .from(users)
        .where(and(eq(users.email, email), isNull(users.deletedAt)))
        .limit(1);
      if (existing && Number(existing.id) !== targetId) {
        throw new ApiError(409, "Email is already in use.");
      }
      body.email = email;
    }

    const userFields: Record<string, unknown> = {};
    for (const key of ["fullName", "email", "phone"] as const) {
      if (body[key] !== undefined) userFields[key] = body[key];
    }
    if (Object.keys(userFields).length > 0) {
      await db
        .update(users)
        .set({ ...userFields, updatedAt: new Date() })
        .where(eq(users.id, targetId))
        .execute();
    }

    if (target.role === "student") {
      const profileFields: Record<string, unknown> = {};
      for (const key of [
        "studentNumber",
        "program",
        "yearLevel",
        "gender",
        "dateOfBirth",
        "emergencyContactName",
        "emergencyContactPhone",
      ] as const) {
        if (body[key] !== undefined) profileFields[key] = body[key];
      }
      if (Object.keys(profileFields).length > 0) {
        const [existingProfile] = await db
          .select({ userId: studentProfiles.userId })
          .from(studentProfiles)
          .where(eq(studentProfiles.userId, targetId))
          .limit(1);
        if (existingProfile) {
          await db
            .update(studentProfiles)
            .set(profileFields as any)
            .where(eq(studentProfiles.userId, targetId))
            .execute();
        } else {
          await db.insert(studentProfiles).values({ userId: targetId, ...(profileFields as any) }).execute();
        }
      }
    }

    await writeAudit({
      actorUserId: actor!.sub,
      action: "admin.user_profile_updated",
      entityType: "user",
      entityId: targetId,
      ip: req.ip,
    });

    const updated = await findUserById(targetId);
    let profile: typeof studentProfiles.$inferSelect | null = null;
    if (updated?.role === "student") {
      const [p] = await db.select().from(studentProfiles).where(eq(studentProfiles.userId, targetId)).limit(1);
      profile = p ?? null;
    }
    res.json({ status: "success", data: { user: updated ? toAdminUser(updated, profile) : null } });
  }),
);

// GET /api/admin/audit-logs
router.get(
  "/audit-logs",
  asyncHandler(async (req, res) => {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const pageSize = Math.min(Math.max(Number(req.query.pageSize) || 30, 1), 100);
    const rows = await db
      .select()
      .from(auditLogs)
      .orderBy(desc(auditLogs.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize);
    res.json({ status: "success", data: { logs: rows, page, pageSize } });
  }),
);

// GET /api/admin/settings  /  PUT /api/admin/settings
router.get(
  "/settings",
  asyncHandler(async (_req, res) => {
    const rows = await db.select().from(systemSettings);
    res.json({ status: "success", data: { settings: rows } });
  }),
);

const settingsSchema = z.object({
  body: z.object({
    settings: z.array(
      z.object({
        key: z.string().min(1).max(128),
        value: z.unknown(),
      }),
    ),
  }),
});

router.put(
  "/settings",
  validate(settingsSchema),
  asyncHandler(async (req, res) => {
    const { user: actor } = req as AuthenticatedRequest;
    for (const setting of req.body.settings) {
      await db
        .insert(systemSettings)
        .values({ key: setting.key, value: setting.value, updatedBy: Number(actor!.sub) })
        .onDuplicateKeyUpdate({ set: { value: setting.value, updatedBy: Number(actor!.sub) } })
        .execute();
    }
    await writeAudit({
      actorUserId: actor!.sub,
      action: "admin.settings_updated",
      entityType: "system_settings",
      ip: req.ip,
      metadata: { keys: req.body.settings.map((s: { key: string }) => s.key) },
    });
    const rows = await db.select().from(systemSettings);
    res.json({ status: "success", data: { settings: rows } });
  }),
);

export default router;
