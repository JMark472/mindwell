# Mindwell Architecture

## Overview

Mindwell uses a split-service architecture with shared authentication and a shared MySQL/MariaDB database.

- **Frontend** (React + Vite + TypeScript + Tailwind): Port 5173
- **Express API** (Node.js + Express + Drizzle ORM): Port 3000
- **Laravel API** (PHP 8.2 + Laravel): Port 8000
- **Database**: MariaDB/MySQL `mindwell_db` (shared)

## Service ownership

### Express API owns
- `users`
- `student_profiles`
- `password_reset_tokens`
- `notifications`
- `audit_logs`
- `system_settings`
- Routes: `/api/auth/*`, `/api/users/*`, `/api/notifications/*`, `/api/admin/*`, `/api/reports/*`, `/api/health/*`, `/api/internal/*`

### Laravel API owns
- `counselor_profiles`
- `counselor_availability`
- `appointments`
- `wellness_categories`
- `wellness_resources`
- `wellness_checkins`
- `wellness_checkin_answers`
- `consent_records`
- `counseling_records`
- Routes: `/api/appointments/*`, `/api/counselors/*`, `/api/wellness-resources/*`, `/api/wellness-checkins/*`, `/api/counseling-records/*`, `/api/consents/*`, etc.

**Rule:** No duplicate independently managed tables. Services read/write only their owned tables.

## Authentication & Authorization

- **Shared secret**: Both services use the same `JWT_SECRET` (HS256) to sign/verify tokens.
- **Token issuance**: Express issues HttpOnly cookies `mw_access` and `mw_refresh` on login/register.
- **Token verification**: Laravel verifies the same JWTs using the shared secret.
- **CSRF**: Double-submit cookie pattern. `mw_csrf` is JS-readable; `mw_csrf_session` is HttpOnly. For cookie-authenticated write requests, clients must send `x-csrf-token` header matching `mw_csrf`. Bearer-auth writes are exempt in test/logic where applicable.
- **Service-to-service**: Internal endpoints require header `X-Service-Key`.
- **RBAC**: Role-based access control enforced server-side (`student`, `counselor`, `admin`). Single `role` enum on `users`.
- **Data isolation**: Students can only access their own data. Counseling notes are strictly counselor-only for assigned cases and never visible to students or unauthorized admins.

## Appointments & Concurrency

- **Booking flow**: Students book via Laravel; conflicts prevented with DB transactions and row locking.
- **Active slot guard**: `appointments.active_slot_start` is a generated column. A unique index on `(counselor_profile_id, active_slot_start)` prevents double-booking of active slots (Pending/Confirmed). Cancelled/Declined slots are freed for rebooking.
- **Statuses**: `Pending`, `Confirmed`, `Completed`, `Cancelled`, `Declined`
- **Data types**: Use `DATETIME` (not `TIMESTAMP`) for MariaDB compatibility (zero-date behavior).

## Security model

- **Cookies**: HttpOnly, Secure in production, SameSite configured for cross-origin frontend-backend communication as designed.
- **CORS**: Restricted to known frontend origins.
- **Rate limiting**: Applied to auth and sensitive endpoints.
- **IDOR protection**: Resource access checks enforce ownership/assignment.
- **Audit logging**: Admin actions logged to `audit_logs` (Express).
- **Privacy**: Check-ins private by default; sharing requires consent. Admins see aggregates only, never individual clinical details.
- **Safety**: UI includes persistent notices that Mindwell is not a replacement for professional care and not an emergency service. Help & Crisis resources provided.

## Data flow (frontend)

The React frontend calls **both** services directly with `credentials: 'include'`:
- Express client: auth, users, notifications, admin, reports
- Laravel client: appointments, counselors, wellness resources/check-ins, consents, counseling records

CSRF token is automatically attached to cookie-auth mutations.

## Timezone

All times are stored in MySQL `DATETIME`. Frontend displays in local timezone (Philippines context per UX).
