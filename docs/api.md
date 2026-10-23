# Mindwell API Documentation

## Base URLs

- Express API: `http://localhost:3000/api`
- Laravel API: `http://localhost:8000/api`

## Authentication

### Token & Cookies (cookie-based)
- `POST /api/auth/login` - Issues `mw_access`, `mw_refresh` (HttpOnly), and `mw_csrf` (JS-readable)
- `POST /api/auth/register` - Registers student and issues cookies
- `POST /api/auth/logout` - Clears auth cookies
- `GET /api/auth/me` - Returns current user session
- `POST /api/auth/refresh` - Refreshes access token using refresh cookie

### CSRF (double-submit)
For cookie-authenticated **write** requests (POST/PUT/PATCH/DELETE), include header:
```
x-csrf-token: <value from mw_csrf cookie>
```
Bearer-authenticated requests are exempt where applicable.

### Service-to-service
Internal endpoints require:
```
X-Service-Key: <shared service key>
```

## Service Ownership Map

| Resource | Owner | Base Path | Notes |
|----------|-------|-----------|-------|
| Auth, Users, Profiles | Express | `/api/auth`, `/api/users` | User accounts, student profiles |
| Notifications | Express | `/api/notifications` | In-app notifications |
| Admin (users/roles/status) | Express | `/api/admin` | User management, audit logs, settings |
| Reports/Analytics (aggregates) | Express | `/api/reports` | System reports, no clinical details |
| Appointments | Laravel | `/api/appointments` | Booking, status updates, conflicts prevented |
| Counselors | Laravel | `/api/counselors` | Counselor profiles, availability |
| Wellness Resources | Laravel | `/api/wellness-resources` | Categories and articles (public read for published) |
| Wellness Check-ins | Laravel | `/api/wellness-checkins` | Private by default, sharing via consent |
| Consents | Laravel | `/api/consents` | Consent records and history |
| Counseling Records | Laravel | `/api/counseling-records` | **Confidential** - counselor-only for assigned cases |

## Key Endpoints

### Express

**Auth**
- `POST /api/auth/register` - Create student account
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Session
- `POST /api/auth/forgot-password` - Request reset (dev token in non-prod)
- `POST /api/auth/reset-password` - Reset with token
- `PUT /api/users/me` - Update own profile

**Notifications**
- `GET /api/notifications` - List notifications
- `POST /api/notifications/:id/read` - Mark read
- `POST /api/notifications/read-all` - Mark all read

**Admin**
- `GET /api/admin/users` - List users (filter by role/status)
- `POST /api/admin/users` - Create user
- `PATCH /api/admin/users/:id/status` - Update status
- `PATCH /api/admin/users/:id/role` - Update role
- `POST /api/admin/users/:id/password-reset` - Generate temp password
- `GET /api/admin/audit-logs` - Audit trail
- `GET /api/admin/settings` - System settings
- `PUT /api/admin/settings` - Update settings

**Reports**
- `GET /api/reports/summary` - User/appointment summaries
- `GET /api/reports/registration-trend` - Registrations over time
- `GET /api/reports/appointments` - Appointment analytics

### Laravel

**Appointments**
- `GET /api/appointments` - List appointments (scoped by role)
- `GET /api/appointments/counselors` - List available counselors
- `GET /api/appointments/slots` - Get available slots for counselor/date
- `POST /api/appointments` - Book appointment (prevents conflicts)
- `GET /api/appointments/:id` - Get appointment details
- `PATCH /api/appointments/:id/status` - Update status (counselor/admin)
- `POST /api/appointments/:id/cancel` - Cancel appointment

**Counselors**
- `GET /api/counselors/me` - My counselor profile
- `PUT /api/counselors/me` - Update profile
- `PUT /api/counselors/me/availability` - Update availability

**Wellness Resources**
- `GET /api/wellness-resources` - List published resources (with filters)
- `GET /api/wellness-resources/:slug` - Get resource by slug
- `POST /api/wellness-resources` - Create (counselor/admin)
- `PATCH /api/wellness-resources/:id` - Update
- `DELETE /api/wellness-resources/:id` - Archive

**Wellness Check-ins**
- `GET /api/wellness-checkins` - List check-ins (scoped)
- `GET /api/wellness-checkins/trend` - 7-day trend
- `GET /api/wellness-checkins/:id` - Get check-in
- `POST /api/wellness-checkins` - Create check-in

**Consents**
- `GET /api/consents` - Get consent state and history
- `PUT /api/consents/:type` - Update consent

**Counseling Records (confidential)**
- `GET /api/counseling-records` - List records (counselor only, scoped to assigned cases)
- `GET /api/counseling-records/caseload` - Counselor caseload
- `POST /api/counseling-records` - Create record
- `PATCH /api/counseling-records/:id` - Update record

## Error responses

Standard JSON error format:
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": { ... }
  }
}
```

Validation errors return field-level details when applicable.

## Authorization notes

- **Students**: Can manage own profile, book appointments, create/view own check-ins, manage own consents, view published resources.
- **Counselors**: Can manage own profile/availability, manage appointments assigned to them, access only assigned students' counseling records, create/update resources.
- **Admins**: Can manage users/settings/audit logs/reports. **Cannot** access individual counseling records or individual check-in responses - only aggregates.
- **Privacy**: Counseling records never exposed to students. Check-in sharing requires explicit consent.
