import { Router, NextFunction, Request, Response } from "express";
import { inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { notifications, users } from "@/db/schema";
import { serviceKeyMiddleware } from "@/middlewares/service-key-middleware";
import { validate } from "@/middlewares/validation-middleware";

const router = Router();
router.use(serviceKeyMiddleware);

const asyncHandler =
  (fn: (req: Request, res: Response) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) =>
    fn(req, res).catch(next);

/**
 * Service-to-service endpoints. Only reachable with the shared X-Service-Key.
 * These let the Laravel service read minimal user data and create
 * notifications without owning those tables.
 */

// POST /api/internal/users/lookup — minimal projection for the Laravel service.
const lookupSchema = z.object({
  body: z.object({ ids: z.array(z.number().int().positive()).min(1).max(200) }),
});

router.post(
  "/users/lookup",
  validate(lookupSchema),
  asyncHandler(async (req, res) => {
    const rows = await db
      .select({
        id: users.id,
        fullName: users.fullName,
        role: users.role,
        status: users.status,
      })
      .from(users)
      .where(inArray(users.id, req.body.ids));
    res.json({ status: "success", data: { users: rows } });
  }),
);

// POST /api/internal/notifications — Laravel triggers user-facing notifications.
const notifySchema = z.object({
  body: z.object({
    notifications: z
      .array(
        z.object({
          userId: z.number().int().positive(),
          type: z.string().min(1).max(60),
          title: z.string().min(1).max(190),
          body: z.string().min(1).max(4000),
          link: z.string().max(255).optional(),
        }),
      )
      .min(1)
      .max(50),
  }),
});

router.post(
  "/notifications",
  validate(notifySchema),
  asyncHandler(async (req, res) => {
    const values = req.body.notifications.map((n: {
      userId: number;
      type: string;
      title: string;
      body: string;
      link?: string;
    }) => ({
      userId: n.userId,
      type: n.type,
      title: n.title,
      body: n.body,
      link: n.link ?? null,
    }));
    await db.insert(notifications).values(values).execute();
    res
      .status(201)
      .json({ status: "success", data: { created: values.length } });
  }),
);

export default router;
