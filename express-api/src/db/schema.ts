import {
  bigint,
  datetime,
  json,
  mysqlEnum,
  mysqlTable,
  index,
  uniqueIndex,
  varchar,
  timestamp,
  text,
  date,
  primaryKey,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

/*
 * TABLE OWNERSHIP — Mindwell Express API (service 1)
 * -------------------------------------------------
 * This schema file owns ONLY the tables below. The Laravel service owns the
 * counseling / wellness module tables (appointments, check-ins, resources,
 * counseling records, consent, availability) and migrates them itself.
 * Both services connect to the same `mindwell_db` database but never write
 * to each other's tables. Cross-service access happens through documented
 * HTTP APIs only.
 *
 * Owned tables:
 *   users, student_profiles, password_reset_tokens, notifications,
 *   audit_logs, system_settings
 *
 * Timezone: all timestamps are stored in UTC. Display timezone is
 * Asia/Manila (APP_TIMEZONE in .env, documented in docs/architecture.md).
 */

export const ROLES = ["student", "counselor", "admin"] as const;
export const USER_STATUSES = ["active", "inactive", "suspended"] as const;

export const users = mysqlTable(
  "users",
  {
    id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
    email: varchar("email", { length: 190 }).notNull(),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    fullName: varchar("full_name", { length: 120 }).notNull(),
    role: mysqlEnum("role", ROLES).notNull().default("student"),
    status: mysqlEnum("status", USER_STATUSES).notNull().default("active"),
    phone: varchar("phone", { length: 40 }),
    createdAt: datetime("created_at", { mode: "date" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: datetime("updated_at", { mode: "date" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
    deletedAt: datetime("deleted_at", { mode: "date" }),
  },
  (table) => [
    uniqueIndex("users_email_unique").on(table.email),
    index("users_role_status_idx").on(table.role, table.status),
  ],
);

export const studentProfiles = mysqlTable(
  "student_profiles",
  {
    userId: bigint("user_id", { mode: "number" })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    studentNumber: varchar("student_number", { length: 40 }),
    program: varchar("program", { length: 120 }),
    yearLevel: varchar("year_level", { length: 40 }),
    dateOfBirth: date("date_of_birth"),
    gender: varchar("gender", { length: 40 }),
    emergencyContactName: varchar("emergency_contact_name", { length: 120 }),
    emergencyContactPhone: varchar("emergency_contact_phone", { length: 40 }),
    updatedAt: datetime("updated_at", { mode: "date" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
  },
  (table) => [primaryKey({ columns: [table.userId] })],
);

export const passwordResetTokens = mysqlTable(
  "password_reset_tokens",
  {
    id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
    userId: bigint("user_id", { mode: "number" })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: varchar("token_hash", { length: 128 }).notNull(),
    expiresAt: datetime("expires_at", { mode: "date" }).notNull(),
    usedAt: datetime("used_at", { mode: "date" }),
    createdAt: datetime("created_at", { mode: "date" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("password_reset_tokens_hash_unique").on(table.tokenHash),
    index("password_reset_tokens_user_idx").on(table.userId),
  ],
);

export const notifications = mysqlTable(
  "notifications",
  {
    id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
    userId: bigint("user_id", { mode: "number" })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 60 }).notNull(),
    title: varchar("title", { length: 190 }).notNull(),
    body: text("body").notNull(),
    link: varchar("link", { length: 255 }),
    readAt: datetime("read_at", { mode: "date" }),
    createdAt: datetime("created_at", { mode: "date" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("notifications_user_created_idx").on(table.userId, table.createdAt),
  ],
);

/*
 * Direct messaging between a student and a counselor.
 *
 * A conversation is always 1:1 (enforced by `pairKey` = "smallerId:largerId")
 * and messaging is only available across roles: students cannot message other
 * students, counselors cannot message other counselors, and admins do not take
 * part in conversations. Access is checked against `conversation_participants`
 * on every request, never against an ID supplied by the client.
 */
export const conversations = mysqlTable(
  "conversations",
  {
    id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
    pairKey: varchar("pair_key", { length: 64 }).notNull(),
    lastMessageAt: datetime("last_message_at", { mode: "date" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    createdAt: datetime("created_at", { mode: "date" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("conversations_pair_key_unique").on(table.pairKey),
    index("conversations_last_message_idx").on(table.lastMessageAt),
  ],
);

export const conversationParticipants = mysqlTable(
  "conversation_participants",
  {
    conversationId: bigint("conversation_id", { mode: "number" })
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    userId: bigint("user_id", { mode: "number" })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    lastReadAt: datetime("last_read_at", { mode: "date" }),
    createdAt: datetime("created_at", { mode: "date" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    primaryKey({ columns: [table.conversationId, table.userId] }),
    index("conversation_participants_user_idx").on(table.userId),
  ],
);

export const messages = mysqlTable(
  "messages",
  {
    id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
    conversationId: bigint("conversation_id", { mode: "number" })
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    senderUserId: bigint("sender_user_id", { mode: "number" })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    createdAt: datetime("created_at", { mode: "date" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("messages_conversation_created_idx").on(
      table.conversationId,
      table.createdAt,
    ),
  ],
);

export const auditLogs = mysqlTable(
  "audit_logs",
  {
    id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
    actorUserId: bigint("actor_user_id", { mode: "number" }),
    action: varchar("action", { length: 120 }).notNull(),
    entityType: varchar("entity_type", { length: 80 }),
    entityId: varchar("entity_id", { length: 80 }),
    ipAddress: varchar("ip_address", { length: 45 }),
    userAgent: varchar("user_agent", { length: 255 }),
    metadata: json("metadata").$type<Record<string, unknown>>(),
    createdAt: datetime("created_at", { mode: "date" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("audit_logs_entity_idx").on(table.entityType, table.entityId),
    index("audit_logs_created_idx").on(table.createdAt),
  ],
);

export const systemSettings = mysqlTable("system_settings", {
  key: varchar("key", { length: 128 }).primaryKey(),
  value: json("value").$type<unknown>().notNull(),
  updatedBy: bigint("updated_by", { mode: "number" }),
  updatedAt: datetime("updated_at", { mode: "date" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type StudentProfile = typeof studentProfiles.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
export type Conversation = typeof conversations.$inferSelect;
export type ConversationParticipant = typeof conversationParticipants.$inferSelect;
export type Message = typeof messages.$inferSelect;
