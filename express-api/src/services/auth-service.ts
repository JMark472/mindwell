import { randomBytes } from "node:crypto";
import { eq, isNull } from "drizzle-orm";
import bcrypt from "bcrypt";
import { db } from "@/db";
import { passwordResetTokens, users } from "@/db/schema";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "@/lib/jwt";
import {
  createUser,
  findUserByEmail,
  findUserById,
  toSafeUser,
  verifyPassword,
  type SafeUser,
} from "@/services/user-service";
import { writeAudit } from "@/lib/audit";

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function issueTokens(user: SafeUser) {
  return {
    accessToken: signAccessToken(user.id, user.role),
    refreshToken: signRefreshToken(user.id, user.role),
  };
}

export async function login(input: {
  email: string;
  password: string;
  ip?: string;
  userAgent?: string;
}) {
  const user = await findUserByEmail(input.email);
  // Constant-shape failure: never reveal whether the email exists.
  if (!user) throw new ApiError(401, "Invalid email or password.");
  const ok = await verifyPassword(input.password, user.passwordHash);
  if (!ok) {
    await writeAudit({
      actorUserId: user.id,
      action: "auth.login.failed",
      ip: input.ip,
      userAgent: input.userAgent,
    });
    throw new ApiError(401, "Invalid email or password.");
  }
  if (user.status !== "active") {
    throw new ApiError(
      403,
      "This account is inactive or suspended. Contact your administrator.",
    );
  }
  await writeAudit({
    actorUserId: user.id,
    action: "auth.login.success",
    ip: input.ip,
    userAgent: input.userAgent,
  });
  return { user: toSafeUser(user), tokens: issueTokens(toSafeUser(user)) };
}

export async function register(input: {
  email: string;
  password: string;
  fullName: string;
  studentNumber?: string;
  program?: string;
  yearLevel?: string;
  ip?: string;
  userAgent?: string;
}) {
  const existing = await findUserByEmail(input.email);
  if (existing) throw new ApiError(409, "An account with that email already exists.");

  const user = await createUser({
    email: input.email,
    password: input.password,
    fullName: input.fullName,
    role: "student",
  });
  if (!user) throw new ApiError(500, "Account creation failed.");

  // Optional onboarding fields on the student profile.
  if (input.studentNumber || input.program || input.yearLevel) {
    const { studentProfiles } = await import("@/db/schema");
    await db
      .update(studentProfiles)
      .set({
        studentNumber: input.studentNumber ?? null,
        program: input.program ?? null,
        yearLevel: input.yearLevel ?? null,
      })
      .where(eq(studentProfiles.userId, user.id))
      .execute();
  }

  await writeAudit({
    actorUserId: user.id,
    action: "auth.register",
    ip: input.ip,
    userAgent: input.userAgent,
  });
  return { user: toSafeUser(user), tokens: issueTokens(toSafeUser(user)) };
}

export async function refresh(refreshToken: string | undefined) {
  if (!refreshToken) throw new ApiError(401, "Missing refresh token.");
  const payload = verifyRefreshToken(refreshToken);
  if (!payload) throw new ApiError(401, "Invalid or expired refresh token.");
  const user = await findUserById(Number(payload.sub));
  if (!user || user.status !== "active") {
    throw new ApiError(401, "Account is not active.");
  }
  // Rotation: a new pair is issued on every refresh. The old refresh token
  // cannot be reused because it expires; stolen-token replay is limited to
  // the token lifetime window.
  return issueTokens(toSafeUser(user));
}

export async function requestPasswordReset(email: string) {
  const user = await findUserByEmail(email);
  // Always report success so the endpoint cannot enumerate accounts.
  if (!user) return { token: null };

  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = await bcrypt.hash(rawToken, 8);
  await db
    .insert(passwordResetTokens)
    .values({
      userId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
    })
    .execute();
  return { token: rawToken };
}

export async function resetPassword(token: string, newPassword: string) {
  // Token is stored as a bcrypt hash, so we scan recent unused tokens for a
  // match. The row set is bounded (limit 50) to keep this cheap.
  const candidates = await db
    .select()
    .from(passwordResetTokens)
    .where(isNull(passwordResetTokens.usedAt))
    .orderBy(passwordResetTokens.id)
    .limit(50);
  let matched: (typeof passwordResetTokens.$inferSelect) | undefined;
  for (const candidate of candidates) {
    if (await bcrypt.compare(token, candidate.tokenHash)) {
      matched = candidate;
      break;
    }
  }
  if (!matched || matched.expiresAt.getTime() < Date.now()) {
    throw new ApiError(400, "This reset link is invalid or has expired.");
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await db
    .update(users)
    .set({ passwordHash, updatedAt: new Date() })
    .where(eq(users.id, matched.userId))
    .execute();
  await db
    .update(passwordResetTokens)
    .set({ usedAt: new Date() })
    .where(eq(passwordResetTokens.id, matched.id))
    .execute();
  await writeAudit({ actorUserId: matched.userId, action: "auth.password_reset" });
}

export async function changePassword(
  userId: number,
  currentPassword: string,
  newPassword: string,
) {
  const user = await findUserById(userId);
  if (!user) throw new ApiError(404, "User not found.");
  const ok = await verifyPassword(currentPassword, user.passwordHash);
  if (!ok) throw new ApiError(401, "Current password is incorrect.");
  const passwordHash = await bcrypt.hash(newPassword, 12);
  await db
    .update(users)
    .set({ passwordHash, updatedAt: new Date() })
    .where(eq(users.id, userId))
    .execute();
  await writeAudit({ actorUserId: userId, action: "auth.password_change" });
}
