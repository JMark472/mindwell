import { Router, NextFunction, Request, Response } from "express";
import { and, desc, eq, isNull } from "drizzle-orm";
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

    res.json({
      status: "success",
      data: {
        users: filtered.map(toSafeUser),
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

// Password reset performed by an administrator (forced reset).
router.post(
  "/users/:id/password-reset",
  asyncHandler(async (req, res) => {
    const { user: actor } = req as AuthenticatedRequest;
    const targetId = Number(req.params.id);
    const target = await findUserById(targetId);
    if (!target) throw new ApiError(404, "User not found.");
    const tempPassword = Math.random().toString(36).slice(2, 10) + "A1";
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
