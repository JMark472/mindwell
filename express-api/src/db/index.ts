import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { ENV } from "@/config/env";
import * as schema from "./schema";

// Single pooled connection pool for the Express-owned tables.
export const pool = mysql.createPool({
  host: ENV.DATABASE_HOST,
  port: ENV.DATABASE_PORT,
  user: ENV.DATABASE_USER,
  password: ENV.DATABASE_PASSWORD,
  database: ENV.DATABASE_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  namedPlaceholders: false,
  timezone: "Z", // all timestamps stored in UTC
});

// `timezone: "Z"` tells mysql2 how to parse DATETIME values, but it does not
// change the session time zone. Without this, `CURRENT_TIMESTAMP` defaults
// written by MySQL use the server's local time while explicit JS dates are
// UTC, so rows can appear hours apart. Pin every pooled connection to UTC.
pool.on("connection", (connection) => {
  connection.query("SET time_zone = '+00:00'");
});

export const db = drizzle(pool, { schema, mode: "default" });

export async function withTransaction<T>(
  fn: (tx: typeof db) => Promise<T>,
): Promise<T> {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const tx = drizzle(conn, { schema, mode: "default" });
    const result = await fn(tx);
    await conn.commit();
    return result;
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}
