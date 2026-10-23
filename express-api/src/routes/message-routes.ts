import { Router, NextFunction, Request, Response } from "express";
import { z } from "zod";
import { validate } from "@/middlewares/validation-middleware";
import { authMiddleware, type AuthenticatedRequest } from "@/middlewares/auth-middleware";
import { requireRole } from "@/middlewares/role-middleware";
import { ApiError } from "@/services/auth-service";
import { findUserById } from "@/services/user-service";
import {
  createConversation,
  getConversation,
  listContacts,
  listConversations,
  listMessages,
  markConversationRead,
  sendMessage,
  unreadMessageCount,
} from "@/services/message-service";

const router = Router();

const asyncHandler =
  (fn: (req: Request, res: Response) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) =>
    fn(req, res).catch(next);

router.use(authMiddleware, requireRole("student", "counselor"));

function conversationId(req: Request) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    throw new ApiError(400, "Invalid conversation.");
  }
  return id;
}

async function currentUser(req: Request) {
  const { user } = req as AuthenticatedRequest;
  const row = await findUserById(Number(user!.sub));
  if (!row) throw new ApiError(401, "Account no longer exists.");
  if (row.status !== "active") throw new ApiError(403, "Account is not active.");
  return row;
}

// GET /api/messages/conversations — inbox ordered by most recent activity.
router.get(
  "/conversations",
  asyncHandler(async (req, res) => {
    const { user } = req as AuthenticatedRequest;
    const conversations = await listConversations(Number(user!.sub));
    const unread = conversations.reduce((total, item) => total + item.unreadCount, 0);
    res.json({ status: "success", data: { conversations, unread } });
  }),
);

// POST /api/messages/conversations — start (or reopen) a student↔counselor thread.
const createConversationSchema = z.object({
  body: z.object({
    participantId: z.number().int().positive(),
  }),
});

router.post(
  "/conversations",
  validate(createConversationSchema),
  asyncHandler(async (req, res) => {
    const actor = await currentUser(req);
    const result = await createConversation(actor, Number(req.body.participantId));
    res
      .status(result.created ? 201 : 200)
      .json({ status: "success", data: { conversation: result.conversation } });
  }),
);

// GET /api/messages/conversations/:id — conversation summary + recent messages.
router.get(
  "/conversations/:id",
  asyncHandler(async (req, res) => {
    const { user } = req as AuthenticatedRequest;
    const id = conversationId(req);
    const conversation = await getConversation(id, Number(user!.sub));
    const messages = await listMessages(id, Number(user!.sub));
    res.json({ status: "success", data: { conversation, messages } });
  }),
);

// GET /api/messages/conversations/:id/messages — message history only.
router.get(
  "/conversations/:id/messages",
  asyncHandler(async (req, res) => {
    const { user } = req as AuthenticatedRequest;
    const messages = await listMessages(conversationId(req), Number(user!.sub));
    res.json({ status: "success", data: { messages } });
  }),
);

// POST /api/messages/conversations/:id/messages — send a message.
const sendMessageSchema = z.object({
  body: z.object({
    body: z
      .string()
      .trim()
      .min(1, "Write a message before sending.")
      .max(4000, "Messages cannot be longer than 4,000 characters."),
  }),
});

router.post(
  "/conversations/:id/messages",
  validate(sendMessageSchema),
  asyncHandler(async (req, res) => {
    const actor = await currentUser(req);
    const message = await sendMessage(conversationId(req), actor, req.body.body);
    res.status(201).json({ status: "success", data: { message } });
  }),
);

// POST /api/messages/conversations/:id/read — clear the unread badge.
router.post(
  "/conversations/:id/read",
  asyncHandler(async (req, res) => {
    const { user } = req as AuthenticatedRequest;
    await markConversationRead(conversationId(req), Number(user!.sub));
    res.json({ status: "success", data: { read: true } });
  }),
);

// GET /api/messages/contacts — people the current user may start a thread with.
router.get(
  "/contacts",
  asyncHandler(async (req, res) => {
    const actor = await currentUser(req);
    const search = typeof req.query.search === "string" ? req.query.search : undefined;
    const contacts = await listContacts(actor, search);
    res.json({ status: "success", data: { contacts } });
  }),
);

// GET /api/messages/unread — total unread messages across all threads.
router.get(
  "/unread",
  asyncHandler(async (req, res) => {
    const { user } = req as AuthenticatedRequest;
    const unread = await unreadMessageCount(Number(user!.sub));
    res.json({ status: "success", data: { unread } });
  }),
);

export default router;
