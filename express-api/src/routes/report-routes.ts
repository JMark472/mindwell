import { Router, NextFunction, Request, Response } from "express";
import { asc, eq, gte, sql } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { authMiddleware, type AuthenticatedRequest } from "@/middlewares/auth-middleware";
import { requireRole } from "@/middlewares/role-middleware";
import { ENV } from "@/config/env";

const router = Router();

const asyncHandler =
  (fn: (req: Request, res: Response) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) =>
    fn(req, res).catch(next);

router.use(authMiddleware, requireRole("admin", "counselor"));

/**
 * Aggregated user statistics. Appointment/clinical aggregates come from the
 * Laravel service through the internal API — this service never reads
 * Laravel-owned tables directly.
 */
router.get(
  "/summary",
  asyncHandler(async (_req, res) => {
    const [counts] = await db
      .select({
        total: sql<number>`count(*)`,
        students: sql<number>`sum(case when ${users.role} = 'student' then 1 else 0 end)`,
        counselors: sql<number>`sum(case when ${users.role} = 'counselor' then 1 else 0 end)`,
        admins: sql<number>`sum(case when ${users.role} = 'admin' then 1 else 0 end)`,
        active: sql<number>`sum(case when ${users.status} = 'active' then 1 else 0 end)`,
      })
      .from(users)
      .where(sql`${users.deletedAt} is null`);

    res.json({
      status: "success",
      data: {
        users: {
          total: Number(counts.total),
          students: Number(counts.students),
          counselors: Number(counts.counselors),
          admins: Number(counts.admins),
          active: Number(counts.active),
        },
      },
    });
  }),
);

// Monthly registration trend for the last N months.
router.get(
  "/registration-trend",
  asyncHandler(async (req, res) => {
    const months = Math.min(Math.max(Number(req.query.months) || 6, 1), 24);
    const rows = await db
      .select({
        month: sql<string>`date_format(${users.createdAt}, '%Y-%m')`,
        count: sql<number>`count(*)`,
      })
      .from(users)
      .where(
        gte(
          users.createdAt,
          new Date(Date.now() - months * 30 * 24 * 60 * 60 * 1000),
        ),
      )
      .groupBy(sql`date_format(${users.createdAt}, '%Y-%m')`)
      .orderBy(asc(sql`date_format(${users.createdAt}, '%Y-%m')`));

    res.json({
      status: "success",
      data: {
        trend: rows.map((r) => ({ month: r.month, count: Number(r.count) })),
      },
    });
  }),
);

/**
 * Proxies appointment analytics from the Laravel service using the
 * service-to-service key. Keeps ownership clean: appointments live in Laravel.
 */
router.get(
  "/appointments",
  asyncHandler(async (_req, res) => {
    try {
      const response = await fetch(
        `${ENV.LARAVEL_URL}/api/internal/reports/appointment-summary`,
        {
          headers: { "X-Service-Key": ENV.SERVICE_KEY, Accept: "application/json" },
        },
      );
      if (!response.ok) {
        res.status(502).json({
          status: "error",
          message: "Appointment service is unavailable.",
        });
        return;
      }
      const payload = (await response.json()) as { data?: unknown };
      res.json({ status: "success", data: payload.data ?? {} });
    } catch {
      res
        .status(502)
        .json({ status: "error", message: "Appointment service is unavailable." });
    }
  }),
);

export default router;
