import { Route, Routes, Navigate } from "react-router";
import { ProtectedRoute, PublicRoute } from "@/components/guards/ProtectedRoute";
import AuthLayout from "@/layout/AuthLayout";
import AppShell from "@/layout/PortalLayout";
import SignInPage from "@/pages/auth/SignInPage";
import RegisterPage from "@/pages/auth/RegisterPage";
import ForgotPasswordPage from "@/pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/auth/ResetPasswordPage";
import StudentDashboardPage from "@/pages/student/StudentDashboardPage";
import MoodCheckInPage from "@/pages/student/MoodCheckInPage";
import ResourcesPage from "@/pages/student/ResourcesPage";
import ResourceDetailPage from "@/pages/student/ResourceDetailPage";
import AppointmentsPage from "@/pages/student/AppointmentsPage";
import BookAppointmentPage from "@/pages/student/BookAppointmentPage";
import BookingConfirmationPage from "@/pages/student/BookingConfirmationPage";
import StudentAppointmentDetailPage from "@/pages/student/StudentAppointmentDetailPage";
import MoodHistoryPage from "@/pages/student/MoodHistoryPage";
import NotificationsPage from "@/pages/student/NotificationsPage";
import MessagesPage from "@/pages/messages/MessagesPage";
import AIAssistantPage from "@/pages/assistant/AIAssistantPage";
import ProfileSettingsPage from "@/pages/student/ProfileSettingsPage";
import HelpCrisisPage from "@/pages/student/HelpCrisisPage";
import AssessmentPage from "@/pages/student/AssessmentPage";
import AssessmentResultsPage from "@/pages/student/AssessmentResultsPage";
import VerifyEmailPage from "@/pages/auth/VerifyEmailPage";
import SessionExpiredPage from "@/pages/auth/SessionExpiredPage";
import CounselorDashboardPage from "@/pages/counselor/CounselorDashboardPage";
import AppointmentRequestsPage from "@/pages/counselor/AppointmentRequestsPage";
import CounselorSchedulePage from "@/pages/counselor/CounselorSchedulePage";
import StudentManagementPage from "@/pages/counselor/StudentManagementPage";
import SessionNotesPage from "@/pages/counselor/SessionNotesPage";
import CaseDetailPage from "@/pages/counselor/CaseDetailPage";
import CounselorProfilePage from "@/pages/counselor/CounselorProfilePage";
import AdminDashboardPage from "@/pages/admin/AdminDashboardPage";
import UserManagementPage from "@/pages/admin/UserManagementPage";

import AdminAppointmentsPage from "@/pages/admin/AdminAppointmentsPage";
import AdminContentPage from "@/pages/admin/AdminContentPage";
import AdminReportsPage from "@/pages/admin/AdminReportsPage";
import AdminSettingsPage from "@/pages/admin/AdminSettingsPage";
import NotFoundPage from "@/pages/NotFoundPage";
import CallSessionsPage from "@/pages/student/CallSessionsPage";
import CounselorCallSessionsPage from "@/pages/counselor/CallSessionsPage";
import AdminCallSessionsPage from "@/pages/admin/CallSessionsPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/signin" replace />} />

      <Route element={<PublicRoute />}>
        <Route element={<AuthLayout />}>
          <Route path="/signin" element={<SignInPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/session-expired" element={<SessionExpiredPage />} />
        </Route>
      </Route>

      <Route path="/help" element={<HelpCrisisPage />} />

      <Route element={<ProtectedRoute roles={["student"]}><AppShell title="Student Portal" subtitle="Wellbeing tools and counseling support" /></ProtectedRoute>}>
        <Route path="/student/dashboard" element={<StudentDashboardPage />} />
        <Route path="/student/check-in" element={<MoodCheckInPage />} />
        <Route path="/student/appointments/book" element={<BookAppointmentPage />} />
        <Route path="/student/appointments" element={<AppointmentsPage />} />
        <Route path="/student/appointments/confirmation" element={<BookingConfirmationPage />} />
        <Route path="/student/appointments/:id" element={<StudentAppointmentDetailPage />} />
        <Route path="/student/callsessions" element={<CallSessionsPage />} />
        <Route path="/student/call-sessions" element={<CallSessionsPage />} />
        <Route path="/student/messages" element={<MessagesPage />} />
        <Route path="/student/assistant" element={<AIAssistantPage />} />
        <Route path="/student/resources" element={<ResourcesPage />} />
        <Route path="/student/resources/:slug" element={<ResourceDetailPage />} />
        <Route path="/student/mood-history" element={<MoodHistoryPage />} />
        <Route path="/student/notifications" element={<NotificationsPage />} />
        <Route path="/student/profile" element={<ProfileSettingsPage />} />
        <Route path="/student/help" element={<HelpCrisisPage />} />
        <Route path="/student/assessment" element={<AssessmentPage />} />
        <Route path="/student/assessment-results" element={<AssessmentResultsPage />} />
      </Route>

      <Route element={<ProtectedRoute roles={["counselor"]}><AppShell title="Counselor Portal" subtitle="Manage appointments and student cases" /></ProtectedRoute>}>
        <Route path="/counselor/dashboard" element={<CounselorDashboardPage />} />
        <Route path="/counselor/requests" element={<AppointmentRequestsPage />} />
        <Route path="/counselor/schedule" element={<CounselorSchedulePage />} />
        <Route path="/counselor/cases" element={<StudentManagementPage />} />
        <Route path="/counselor/cases/:id" element={<CaseDetailPage />} />
        <Route path="/counselor/callsessions" element={<CounselorCallSessionsPage />} />
        <Route path="/counselor/call-sessions" element={<CounselorCallSessionsPage />} />
        <Route path="/counselor/messages" element={<MessagesPage />} />
        <Route path="/counselor/assistant" element={<AIAssistantPage />} />
        <Route path="/counselor/notes" element={<SessionNotesPage />} />
        <Route path="/counselor/resources" element={<ResourcesPage />} />
        <Route path="/counselor/resources/:slug" element={<ResourceDetailPage />} />
        <Route path="/counselor/profile" element={<CounselorProfilePage />} />
      </Route>

      <Route element={<ProtectedRoute roles={["admin"]}><AppShell title="Admin Portal" subtitle="System oversight and governance" /></ProtectedRoute>}>
        <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
        <Route path="/admin/users" element={<UserManagementPage />} />
        <Route path="/admin/appointments" element={<AdminAppointmentsPage />} />
        <Route path="/admin/callsessions" element={<AdminCallSessionsPage />} />
        <Route path="/admin/call-sessions" element={<AdminCallSessionsPage />} />
        <Route path="/admin/content" element={<AdminContentPage />} />
        <Route path="/admin/reports" element={<AdminReportsPage />} />
        <Route path="/admin/settings" element={<AdminSettingsPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
