export type Role = "student" | "counselor" | "admin";

export interface User {
  id: number;
  email: string;
  fullName: string;
  role: Role;
  status: "active" | "inactive" | "suspended";
  phone: string | null;
}

export interface StudentProfile {
  id?: number;
  userId?: number;
  studentNumber?: string | null;
  program?: string | null;
  yearLevel?: string | null;
  gender?: string | null;
  dateOfBirth?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
}

export interface Notification {
  id: number;
  userId: number;
  type: string;
  title: string;
  body: string;
  link: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface ApiSuccess<T = unknown> {
  status: "success";
  data: T;
}

export interface ApiErrorResponse {
  status: "error";
  message: string;
  errors?: Record<string, string[]>;
}

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiErrorResponse;
