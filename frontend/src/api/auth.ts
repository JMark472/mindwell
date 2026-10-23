import { express, ensureCsrf } from "./client";
import type { StudentProfile, User } from "@/types";

export interface LoginResult {
  user: User;
}

export async function login(email: string, password: string) {
  await ensureCsrf();
  const { data } = await express.post("/auth/login", { email, password });
  return data.data as LoginResult;
}

export async function register(payload: {
  fullName: string;
  email: string;
  password: string;
  studentNumber?: string;
  program?: string;
  yearLevel?: string;
}) {
  await ensureCsrf();
  const { data } = await express.post("/auth/register", payload);
  return data.data as LoginResult;
}

export async function logout() {
  await express.post("/auth/logout");
}

export async function fetchSession() {
  const { data } = await express.get("/auth/me");
  return data.data.user as User;
}

export async function forgotPassword(email: string) {
  await ensureCsrf();
  const { data } = await express.post("/auth/forgot-password", { email });
  return data.data as { message: string; devToken?: string };
}

export async function resetPassword(token: string, newPassword: string) {
  await ensureCsrf();
  const { data } = await express.post("/auth/reset-password", { token, newPassword });
  return data.data as { reset: boolean };
}

export async function fetchMyProfile() {
  const { data } = await express.get("/users/me");
  return data.data as { user: User; profile: StudentProfile | null };
}

export async function updateMyProfile(payload: Record<string, unknown>) {
  await ensureCsrf();
  const { data } = await express.patch("/users/me", payload);
  return data.data as { user: User; profile: StudentProfile | null };
}

export async function changePassword(currentPassword: string, newPassword: string) {
  await ensureCsrf();
  const { data } = await express.post("/users/me/password", { currentPassword, newPassword });
  return data.data as { changed: boolean };
}
