import jwt, { SignOptions } from "jsonwebtoken";
import { randomUUID } from "node:crypto";
import { ENV } from "@/config/env";

export type JwtPayload = {
  sub: string; // user id
  role: "student" | "counselor" | "admin";
  type: "access" | "refresh";
  jti?: string;
};

export enum TokenExpiry {
  ACCESS = "15m",
  REFRESH = "7d",
}

export function signAccessToken(
  userId: string | number,
  role: JwtPayload["role"],
  ttl: string = ENV.ACCESS_TOKEN_TTL,
) {
  const payload: JwtPayload = { sub: String(userId), role, type: "access" };
  return jwt.sign(payload, ENV.JWT_SECRET, {
    expiresIn: ttl as SignOptions["expiresIn"],
    jwtid: randomUUID(),
  });
}

export function signRefreshToken(
  userId: string | number,
  role: JwtPayload["role"],
  ttl: string = ENV.REFRESH_TOKEN_TTL,
) {
  const payload: JwtPayload = { sub: String(userId), role, type: "refresh" };
  return jwt.sign(payload, ENV.JWT_SECRET, {
    expiresIn: ttl as SignOptions["expiresIn"],
    jwtid: randomUUID(),
  });
}

export function verifyAccessToken(token: string): JwtPayload | null {
  try {
    const payload = jwt.verify(token, ENV.JWT_SECRET) as JwtPayload;
    return payload.type === "access" ? payload : null;
  } catch {
    return null;
  }
}

export function verifyRefreshToken(token: string): JwtPayload | null {
  try {
    const payload = jwt.verify(token, ENV.JWT_SECRET) as JwtPayload;
    return payload.type === "refresh" ? payload : null;
  } catch {
    return null;
  }
}

export function toMilliseconds(duration: string | number): number {
  if (typeof duration === "number") return duration * 1000;
  const match = /^(\d+)([smhd])$/.exec(duration);
  if (!match) return 15 * 60 * 1000;
  const value = Number(match[1]);
  const unit = match[2];
  const factors: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };
  return value * (factors[unit] ?? 60 * 1000);
}
