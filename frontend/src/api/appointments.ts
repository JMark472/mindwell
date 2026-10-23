import { laravel, express } from "./client";

export type AppointmentStatus = "pending" | "confirmed" | "completed" | "cancelled" | "declined";
export type AppointmentMode = "online" | "in_person";

export interface Appointment {
  id: number;
  student_user_id: number;
  counselor_profile_id: number;
  slot_start: string;
  slot_end: string;
  status: AppointmentStatus;
  mode: AppointmentMode;
  concern_category: string | null;
  student_note?: string | null;
  counselor_note?: string | null;
  cancellation_reason?: string | null;
  student_name?: string | null;
  counselor_name?: string | null;
  created_at: string;
}

export interface Slot {
  start: string;
  end: string;
  label: string;
  available: boolean;
}

export interface CounselorSummary {
  id: number;
  user_id?: number;
  name: string;
  specialization: string | null;
  credentials: string | null;
  bio: string | null;
}

export interface AvailabilityWindow {
  id?: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_minutes?: number;
}

export interface CounselorProfile {
  id: number;
  user_id: number;
  specialization: string | null;
  bio: string | null;
  credentials: string | null;
  max_weekly_appointments: number;
  accepting_students: boolean;
}

export async function listAppointments(params?: { status?: string }) {
  const { data } = await laravel.get("/appointments", { params });
  return data.data.appointments as Appointment[];
}

export async function getAppointment(id: number) {
  const { data } = await laravel.get(`/appointments/${id}`);
  return data.data.appointment as Appointment;
}

export async function listCounselors() {
  const { data } = await laravel.get("/appointments/counselors");
  return data.data.counselors as CounselorSummary[];
}

export async function listSlots(counselorProfileId: number, date: string) {
  const { data } = await laravel.get(`/appointments/${counselorProfileId}/slots`, {
    params: { date },
  });
  return data.data.slots as Slot[];
}

export async function bookAppointment(payload: {
  counselor_profile_id: number;
  slot_start: string;
  mode: AppointmentMode;
  concern_category?: string;
  student_note?: string;
}) {
  const { data } = await laravel.post("/appointments", payload);
  return data.data.appointment as Appointment;
}

export async function updateAppointmentStatus(
  id: number,
  status: "confirmed" | "declined" | "completed",
  note?: string,
) {
  const { data } = await laravel.patch(`/appointments/${id}/status`, { status, note });
  return data.data.appointment as Appointment;
}

export async function cancelAppointment(id: number, reason?: string) {
  const { data } = await laravel.post(`/appointments/${id}/cancel`, { reason });
  return data.data.appointment as Appointment;
}

export async function getMyCounselorProfile() {
  const { data } = await laravel.get("/counselors/profile");
  return data.data as {
    profile: CounselorProfile;
    availability: AvailabilityWindow[];
  };
}

export async function updateCounselorProfile(payload: Partial<CounselorProfile>) {
  const { data } = await laravel.patch("/counselors/profile", payload);
  return data.data.profile as CounselorProfile;
}

export async function updateAvailability(availability: AvailabilityWindow[]) {
  const { data } = await laravel.put("/counselors/availability", { availability });
  return data.data.availability as AvailabilityWindow[];
}

/** Aggregated appointment analytics (admin only, owned by the Laravel API). */
export async function appointmentAnalytics() {
  const { data } = await express.get("/reports/appointments");
  return data.data as {
    total: number;
    by_status: Record<string, number>;
    completion_rate: number;
    cancellation_rate: number;
    monthly: { month: string; total: number }[];
    counselor_workload: { counselor_profile_id: number; total: number; name: string | null }[];
  };
}
