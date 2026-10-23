import { db, } from "@/db";
import { auditLogs } from "@/db/schema";

export type AuditEntry = {
  actorUserId?: number | string | null;
  action: string;
  entityType?: string;
  entityId?: string | number;
  ip?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown>;
};

/**
 * Writes an audit trail row. Audit logging must never throw into the request
 * path — a logging failure should not break the user's operation.
 */
export async function writeAudit(entry: AuditEntry): Promise<void> {
  try {
    await db.insert(auditLogs).values({
      actorUserId: entry.actorUserId ? Number(entry.actorUserId) : null,
      action: entry.action,
      entityType: entry.entityType ?? null,
      entityId: entry.entityId ? String(entry.entityId) : null,
      ipAddress: entry.ip ?? null,
      userAgent: entry.userAgent ? entry.userAgent.slice(0, 255) : null,
      metadata: entry.metadata ?? null,
    });
  } catch (error) {
    console.error("[mindwell-api] Failed to write audit log:", error);
  }
}
