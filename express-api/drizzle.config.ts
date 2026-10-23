import "dotenv/config";
import { defineConfig } from "drizzle-kit";

const url = process.env.DATABASE_HOST
  ? `mysql://${process.env.DATABASE_USER}:${process.env.DATABASE_PASSWORD}@${process.env.DATABASE_HOST}:${process.env.DATABASE_PORT || 3306}/${process.env.DATABASE_NAME}`
  : undefined;

export default defineConfig({
  dialect: "mysql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: url ? { url } : undefined,
  strict: true,
  verbose: true,
});
