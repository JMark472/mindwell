import { laravel } from "./client";

export interface CounselingRecord {
  id: number;
  student_user_id: number;
  counselor_user_id: number;
  appointment_id: number | null;
  session_date: string;
  summary: string;
  follow_up_plan: string | null;
  recommendations: string | null;
  referral_service: string | null;
  risk_level: string;
  created_at: string;
  updated_at: string;
}

export interface CaseloadEntry {
  student_user_id: number;
  name: string;
  total_sessions: number;
  last_session: string | null;
  next_session: string | null;
}

export async function getCaseload() {
  const { data } = await laravel.get("/counseling-records/caseload");
  return data.data.caseload as CaseloadEntry[];
}

export async function listCounselingRecords(student?: number) {
  const { data } = await laravel.get("/counseling-records", { params: student ? { student } : undefined });
  return data.data.records as CounselingRecord[];
}

export async function createCounselingRecord(payload: Record<string, unknown>) {
  const { data } = await laravel.post("/counseling-records", payload);
  return data.data.record as CounselingRecord;
}

export async function updateCounselingRecord(id: number, payload: Record<string, unknown>) {
  const { data } = await laravel.patch(`/counseling-records/${id}`, payload);
  return data.data.record as CounselingRecord;
}
