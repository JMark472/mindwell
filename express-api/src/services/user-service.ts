import { and, eq, isNull } from "drizzle-orm";
import bcrypt from "bcrypt";
import { db } from "@/db";
import { users, studentProfiles } from "@/db/schema";

export type SafeUser = {
  id: number;
  email: string;
  fullName: string;
  role: "student" | "counselor" | "admin";
  status: "active" | "inactive" | "suspended";
  phone: string | null;
};

export function toSafeUser(row: typeof users.$inferSelect): SafeUser {
  return {
    id: row.id,
    email: row.email,
    fullName: row.fullName,
    role: row.role,
    status: row.status,
    phone: row.phone,
  };
}

export async function findUserByEmail(email: string) {
  const [row] = await db
    .select()
    .from(users)
    .where(and(eq(users.email, email.toLowerCase()), isNull(users.deletedAt)))
    .limit(1);
  return row;
}

export async function findUserById(id: number) {
  const [row] = await db
    .select()
    .from(users)
    .where(and(eq(users.id, id), isNull(users.deletedAt)))
    .limit(1);
  return row;
}

export async function createUser(input: {
  email: string;
  password: string;
  fullName: string;
  role: "student" | "counselor" | "admin";
  phone?: string;
}) {
  const passwordHash = await bcrypt.hash(input.password, 12);
  const [row] = await db
    .insert(users)
    .values({
      email: input.email.toLowerCase(),
      passwordHash,
      fullName: input.fullName,
      role: input.role,
      phone: input.phone ?? null,
    })
    .execute();
  const userId = Number(row.insertId);

  if (input.role === "student") {
    await db.insert(studentProfiles).values({ userId }).execute();
  }
  return findUserById(userId);
}

export async function verifyPassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash);
}
