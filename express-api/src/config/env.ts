import dotenv from "dotenv";
dotenv.config();

const required = (name: string): string => {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
};

export const ENV = {
  APP_NAME: process.env.APP_NAME || "Mindwell Express API",
  PORT: parseInt(process.env.PORT || "3000", 10),
  NODE_ENV: process.env.NODE_ENV || "development",
  BACKEND_URL: process.env.BACKEND_URL || "http://localhost:3000",
  LARAVEL_URL: process.env.LARAVEL_URL || "http://localhost:8000",
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:5173",
  JWT_SECRET: required("JWT_SECRET"),
  CSRF_SECRET: required("CSRF_SECRET"),
  SERVICE_KEY: required("SERVICE_KEY"),
  ACCESS_TOKEN_TTL: process.env.ACCESS_TOKEN_TTL || "15m",
  REFRESH_TOKEN_TTL: process.env.REFRESH_TOKEN_TTL || "7d",
  DATABASE_HOST: process.env.DATABASE_HOST || "127.0.0.1",
  DATABASE_PORT: parseInt(process.env.DATABASE_PORT || "3306", 10),
  DATABASE_USER: process.env.DATABASE_USER || "mindwell",
  DATABASE_PASSWORD: process.env.DATABASE_PASSWORD || "",
  DATABASE_NAME: process.env.DATABASE_NAME || "mindwell_db",
  APP_TIMEZONE: process.env.APP_TIMEZONE || "UTC",
  isProduction: (process.env.NODE_ENV || "development") === "production",
};
