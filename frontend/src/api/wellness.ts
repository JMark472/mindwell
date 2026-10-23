import { laravel, express } from "./client";

export interface WellnessCategory {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  accent_color: string;
  sort_order: number;
}

export interface WellnessResource {
  id: number;
  wellness_category_id: number;
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  tags: string[] | null;
  reading_minutes: number;
  status: "draft" | "published" | "archived";
  is_featured: boolean;
  published_at: string | null;
  category?: WellnessCategory;
}

export interface Checkin {
  id: number;
  student_user_id: number;
  mood_score: number;
  energy_score: number | null;
  stress_score: number | null;
  sleep_hours: number | null;
  influences: string[] | null;
  note: string | null;
  is_shared_with_counselor: boolean;
  created_at: string;
}

export interface CheckinTrendPoint {
  id: number;
  mood: number;
  energy: number | null;
  stress: number | null;
  date: string;
}

export interface ConsentsState {
  consents: Record<
    string,
    {
      granted: boolean;
      updated_at: string | null;
    }
  >;
  history: Array<{
    id: number;
    consent_type: string;
    is_granted: boolean;
    created_at: string;
  }>;
}

export async function listResources(params?: {
  category?: string;
  search?: string;
  featured?: boolean;
  status?: string;
}) {
  const { data } = await laravel.get("/wellness-resources", { params });
  return data.data as {
    resources: WellnessResource[];
    categories: WellnessCategory[];
  };
}

export async function getResource(slug: string) {
  const { data } = await laravel.get(`/wellness-resources/${slug}`);
  return data.data.resource as WellnessResource;
}

export async function createResource(payload: Record<string, unknown>) {
  const { data } = await laravel.post("/wellness-resources", payload);
  return data.data.resource as WellnessResource;
}

export async function updateResource(id: number, payload: Record<string, unknown>) {
  const { data } = await laravel.patch(`/wellness-resources/${id}`, payload);
  return data.data.resource as WellnessResource;
}

export async function archiveResource(id: number) {
  const { data } = await laravel.delete(`/wellness-resources/${id}`);
  return data.data;
}

export async function listCheckins(params?: { student?: number }) {
  const { data } = await laravel.get("/wellness-checkins", { params });
  return data.data as { checkins: Checkin[]; aggregate?: { total: number; avg_mood: number } };
}

export async function getCheckinTrend() {
  const { data } = await laravel.get("/wellness-checkins/trend");
  return data.data.trend as CheckinTrendPoint[];
}

export async function getCheckin(id: number) {
  const { data } = await laravel.get(`/wellness-checkins/${id}`);
  return data.data.checkin as Checkin;
}

export async function createCheckin(payload: Record<string, unknown>) {
  const { data } = await laravel.post("/wellness-checkins", payload);
  return data.data.checkin as Checkin;
}

export async function getConsents() {
  const { data } = await laravel.get("/consents");
  return data.data as ConsentsState;
}

export async function updateConsent(type: string, granted: boolean, policyVersion?: string) {
  const { data } = await laravel.put(`/consents/${type}`, { granted, policy_version: policyVersion });
  return data.data.consent;
}

export async function listNotifications() {
  const { data } = await express.get("/notifications");
  return data.data as { notifications: import("@/types").Notification[]; unread: number };
}

export async function markNotificationRead(id: number) {
  const { data } = await express.post(`/notifications/${id}/read`);
  return data.data;
}

export async function markAllNotificationsRead() {
  const { data } = await express.post("/notifications/read-all");
  return data.data;
}

export async function adminListUsers(params?: Record<string, string>) {
  const { data } = await express.get("/admin/users", { params });
  return data.data;
}

export async function adminCreateUser(payload: Record<string, unknown>) {
  const { data } = await express.post("/admin/users", payload);
  return data.data.user;
}

export async function adminSetUserStatus(id: number, status: string) {
  const { data } = await express.patch(`/admin/users/${id}/status`, { status });
  return data.data;
}

export async function adminSetUserRole(id: number, role: string) {
  const { data } = await express.patch(`/admin/users/${id}/role`, { role });
  return data.data;
}

export async function adminResetPassword(id: number) {
  const { data } = await express.post(`/admin/users/${id}/password-reset`);
  return data.data as { temporaryPassword: string };
}

export async function adminListAuditLogs(page = 1, pageSize = 30) {
  const { data } = await express.get("/admin/audit-logs", { params: { page, pageSize } });
  return data.data;
}

export async function adminGetSettings() {
  const { data } = await express.get("/admin/settings");
  return data.data.settings as Array<{ key: string; value: unknown }>;
}

export async function adminUpdateSettings(settings: Array<{ key: string; value: unknown }>) {
  const { data } = await express.put("/admin/settings", { settings });
  return data.data.settings;
}

export async function getReportSummary() {
  const { data } = await express.get("/reports/summary");
  return data.data;
}

export async function getRegistrationTrend(months = 6) {
  const { data } = await express.get("/reports/registration-trend", { params: { months } });
  return data.data;
}

export type { Notification } from "@/types";
export { appointmentAnalytics } from "./appointments";

