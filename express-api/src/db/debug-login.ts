import "dotenv/config";
import bcrypt from "bcrypt";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

async function main() {
  const rows = await db
    .select()
    .from(users)
    .where(eq(users.email, "student@mindwell.test"))
    .limit(1);
  console.log("found rows:", rows.length);
  if (rows.length) {
    const ok = await bcrypt.compare("Password123", rows[0].passwordHash);
    console.log("bcrypt compare:", ok);
    console.log("status:", rows[0].status, "deletedAt:", rows[0].deletedAt);
  }
}
main().finally(() => process.exit(0));
