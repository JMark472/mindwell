import { Router, NextFunction, Request, Response } from "express";
import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { authMiddleware, type AuthenticatedRequest } from "@/middlewares/auth-middleware";

const router = Router();

const asyncHandler =
  (fn: (req: Request, res: Response) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) =>
    fn(req, res).catch(next);

router.use(authMiddleware);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { user } = req as AuthenticatedRequest;
    const limit = Math.min(Number(req.query.limit) || 30, 100);
    const rows = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, Number(user!.sub)))
      .orderBy(desc(notifications.createdAt))
      .limit(limit);
    const unread = rows.filter((r) => !r.readAt).length;
    res.json({ status: "success", data: { notifications: rows, unread } });
  }),
);

router.post(
  "/:id/read",
  asyncHandler(async (req, res) => {
    const { user } = req as AuthenticatedRequest;
    await db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(
        and(
          eq(notifications.id, Number(req.params.id)),
          eq(notifications.userId, Number(user!.sub)),
          isNull(notifications.readAt),
        ),
      )
      .execute();
    res.json({ status: "success", data: { read: true } });
  }),
);

router.post(
  "/read-all",
  asyncHandler(async (req, res) => {
    const { user } = req as AuthenticatedRequest;
    await db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(
        and(
          eq(notifications.userId, Number(user!.sub)),
          isNull(notifications.readAt),
        ),
      )
      .execute();
    res.json({ status: "success", data: { read: true } });
  }),
);

export default router;
