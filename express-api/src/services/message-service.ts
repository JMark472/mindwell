import { and, asc, desc, eq, gt, isNull, like, ne, or, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/mysql-core";
import { db } from "@/db";
import {
  conversationParticipants,
  conversations,
  messages,
  notifications,
  users,
} from "@/db/schema";
import { ApiError } from "@/services/auth-service";
import { findUserById } from "@/services/user-service";

type DbUser = typeof users.$inferSelect;
type MessageRole = "student" | "counselor";

function assertMessagingRole(role: string): MessageRole {
  if (role !== "student" && role !== "counselor") {
    throw new ApiError(403, "Messaging is only available to students and counselors.");
  }
  return role;
}

function pairKeyFor(a: number, b: number) {
  const [low, high] = a < b ? [a, b] : [b, a];
  return `${low}:${high}`;
}

/** The counterpart must be active and hold the opposite role. */
function assertCounterpart(actor: DbUser, other: DbUser | undefined) {
  if (!other || other.deletedAt) throw new ApiError(404, "That person could not be found.");
  if (other.id === actor.id) throw new ApiError(400, "You cannot message yourself.");
  if (other.status !== "active") {
    throw new ApiError(400, "That account is not available for messaging.");
  }
  const actorRole = assertMessagingRole(actor.role);
  assertMessagingRole(other.role);
  if (actorRole === other.role) {
    throw new ApiError(400, "Conversations must be between a student and a counselor.");
  }
}

export async function assertParticipant(conversationId: number, userId: number) {
  const [row] = await db
    .select({ conversationId: conversationParticipants.conversationId })
    .from(conversationParticipants)
    .where(
      and(
        eq(conversationParticipants.conversationId, conversationId),
        eq(conversationParticipants.userId, userId),
      ),
    )
    .limit(1);

  // 404 rather than 403 so a caller cannot probe which conversation IDs exist.
  if (!row) throw new ApiError(404, "Conversation not found.");
}

export type ConversationSummary = {
  id: number;
  lastMessageAt: Date;
  lastReadAt: Date | null;
  otherUserId: number;
  otherName: string;
  otherRole: "student" | "counselor" | "admin";
  lastMessageBody: string | null;
  lastMessageSenderId: number | null;
  unreadCount: number;
};

export async function listConversations(userId: number): Promise<ConversationSummary[]> {
  const other = alias(conversationParticipants, "other_participant");

  const rows = await db
    .select({
      id: conversations.id,
      lastMessageAt: conversations.lastMessageAt,
      lastReadAt: conversationParticipants.lastReadAt,
      otherUserId: users.id,
      otherName: users.fullName,
      otherRole: users.role,
      lastMessageBody: sql<string | null>`(
        select m.body from messages m
        where m.conversation_id = ${conversations.id}
        order by m.id desc limit 1
      )`,
      lastMessageSenderId: sql<number | null>`(
        select m.sender_user_id from messages m
        where m.conversation_id = ${conversations.id}
        order by m.id desc limit 1
      )`,
      unreadCount: sql<number>`(
        select count(*) from messages m
        where m.conversation_id = ${conversations.id}
          and m.sender_user_id <> ${userId}
          and (${conversationParticipants.lastReadAt} is null
               or m.created_at > ${conversationParticipants.lastReadAt})
      )`,
    })
    .from(conversationParticipants)
    .innerJoin(conversations, eq(conversations.id, conversationParticipants.conversationId))
    .innerJoin(other, and(eq(other.conversationId, conversations.id), ne(other.userId, userId)))
    .innerJoin(users, eq(users.id, other.userId))
    .where(and(eq(conversationParticipants.userId, userId), isNull(users.deletedAt)))
    .orderBy(desc(conversations.lastMessageAt))
    .limit(50);

  return rows.map((row) => ({
    ...row,
    lastMessageSenderId:
      row.lastMessageSenderId === null ? null : Number(row.lastMessageSenderId),
    unreadCount: Number(row.unreadCount),
  }));
}

export async function getConversation(
  conversationId: number,
  userId: number,
): Promise<ConversationSummary> {
  const rows = await listConversations(userId);
  const found = rows.find((row) => row.id === conversationId);
  if (!found) throw new ApiError(404, "Conversation not found.");
  return found;
}

export type ChatMessage = {
  id: number;
  conversationId: number;
  senderUserId: number;
  senderName: string;
  senderRole: "student" | "counselor" | "admin";
  body: string;
  createdAt: Date;
};

export async function listMessages(
  conversationId: number,
  userId: number,
  limit = 200,
): Promise<ChatMessage[]> {
  await assertParticipant(conversationId, userId);

  const rows = await db
    .select({
      id: messages.id,
      conversationId: messages.conversationId,
      senderUserId: messages.senderUserId,
      senderName: users.fullName,
      senderRole: users.role,
      body: messages.body,
      createdAt: messages.createdAt,
    })
    .from(messages)
    .innerJoin(users, eq(users.id, messages.senderUserId))
    .where(eq(messages.conversationId, conversationId))
    .orderBy(desc(messages.id))
    .limit(Math.min(Math.max(limit, 1), 200));

  // Query newest-first for an efficient LIMIT, then present oldest-first.
  return rows.reverse();
}

export type CreateConversationResult = {
  conversation: ConversationSummary;
  created: boolean;
};

export async function createConversation(
  actor: DbUser,
  participantId: number,
): Promise<CreateConversationResult> {
  assertMessagingRole(actor.role);
  const other = await findUserById(participantId);
  assertCounterpart(actor, other);

  const pairKey = pairKeyFor(actor.id, participantId);

  const [existing] = await db
    .select({ id: conversations.id })
    .from(conversations)
    .where(eq(conversations.pairKey, pairKey))
    .limit(1);

  if (existing) {
    return {
      conversation: await getConversation(existing.id, actor.id),
      created: false,
    };
  }

  let created = false;
  try {
    await db.transaction(async (tx) => {
      const [inserted] = await tx
        .insert(conversations)
        .values({ pairKey })
        .execute();
      const conversationId = Number(inserted.insertId);
      await tx
        .insert(conversationParticipants)
        .values([
          { conversationId, userId: actor.id },
          { conversationId, userId: participantId },
        ])
        .execute();
      created = true;
    });
  } catch (error) {
    // A concurrent request may have created the same pair. If so, use it.
    const code = (error as { code?: string }).code;
    if (code !== "ER_DUP_ENTRY") throw error;
  }

  const [row] = await db
    .select({ id: conversations.id })
    .from(conversations)
    .where(eq(conversations.pairKey, pairKey))
    .limit(1);

  if (!row) throw new ApiError(500, "Could not start that conversation.");
  return {
    conversation: await getConversation(row.id, actor.id),
    created,
  };
}

export async function sendMessage(
  conversationId: number,
  sender: DbUser,
  rawBody: string,
): Promise<ChatMessage> {
  await assertParticipant(conversationId, sender.id);

  const body = rawBody.trim();
  if (!body) throw new ApiError(400, "Write a message before sending.");
  if (body.length > 4000) {
    throw new ApiError(400, "Messages cannot be longer than 4,000 characters.");
  }

  const [recipient] = await db
    .select({
      userId: users.id,
      role: users.role,
      status: users.status,
      deletedAt: users.deletedAt,
    })
    .from(conversationParticipants)
    .innerJoin(users, eq(users.id, conversationParticipants.userId))
    .where(
      and(
        eq(conversationParticipants.conversationId, conversationId),
        ne(conversationParticipants.userId, sender.id),
      ),
    )
    .limit(1);

  if (!recipient) throw new ApiError(404, "Conversation not found.");

  const [inserted] = await db
    .insert(messages)
    .values({
      conversationId,
      senderUserId: sender.id,
      body,
      createdAt: new Date(),
    })
    .execute();

  await db
    .update(conversations)
    .set({ lastMessageAt: new Date() })
    .where(eq(conversations.id, conversationId))
    .execute();

  if (recipient.status === "active" && !recipient.deletedAt) {
    const link =
      recipient.role === "counselor"
        ? `/counselor/messages?c=${conversationId}`
        : `/student/messages?c=${conversationId}`;
    await db
      .insert(notifications)
      .values({
        userId: recipient.userId,
        type: "message.received",
        title: `New message from ${sender.fullName}`,
        body: body.length > 180 ? `${body.slice(0, 177)}…` : body,
        link,
      })
      .execute();
  }

  return {
    id: Number(inserted.insertId),
    conversationId,
    senderUserId: sender.id,
    senderName: sender.fullName,
    senderRole: sender.role,
    body,
    createdAt: new Date(),
  };
}

export async function markConversationRead(conversationId: number, userId: number) {
  await assertParticipant(conversationId, userId);
  await db
    .update(conversationParticipants)
    .set({ lastReadAt: new Date() })
    .where(
      and(
        eq(conversationParticipants.conversationId, conversationId),
        eq(conversationParticipants.userId, userId),
      ),
    )
    .execute();
}

export async function unreadMessageCount(userId: number) {
  const [row] = await db
    .select({ count: sql<number>`count(*)` })
    .from(messages)
    .innerJoin(
      conversationParticipants,
      and(
        eq(conversationParticipants.conversationId, messages.conversationId),
        eq(conversationParticipants.userId, userId),
      ),
    )
    .where(
      and(
        ne(messages.senderUserId, userId),
        or(
          isNull(conversationParticipants.lastReadAt),
          gt(messages.createdAt, conversationParticipants.lastReadAt),
        ),
      ),
    );

  return Number(row?.count ?? 0);
}

export async function listContacts(
  actor: DbUser,
  search?: string,
): Promise<
  Array<{
    id: number;
    fullName: string;
    role: "student" | "counselor" | "admin";
    status: "active" | "inactive" | "suspended";
  }>
> {
  const role = assertMessagingRole(actor.role);
  const targetRole = role === "student" ? "counselor" : "student";

  const conditions = [
    eq(users.role, targetRole),
    eq(users.status, "active"),
    isNull(users.deletedAt),
  ];
  if (search?.trim()) {
    conditions.push(like(users.fullName, `%${search.trim()}%`));
  }

  return db
    .select({
      id: users.id,
      fullName: users.fullName,
      role: users.role,
      status: users.status,
    })
    .from(users)
    .where(and(...conditions))
    .orderBy(asc(users.fullName))
    .limit(100);
}
