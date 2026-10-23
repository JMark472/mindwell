# Mindwell

Mindwell is a full-stack mental wellness & student support system for universities. It consists of a React (Vite + TypeScript + Tailwind) frontend, an Express.js API, a Laravel API, and a shared MySQL/MariaDB database.

## Architecture

See [docs/architecture.md](docs/architecture.md) for system architecture, service boundaries, and security model.

## API Documentation

See [docs/api.md](docs/api.md) for endpoint ownership, authentication, and usage details.

## Prerequisites

- Node.js 18+ and npm
- PHP 8.2+ and Composer
- MySQL/MariaDB
- (Optional) Git

## Setup

### 1. Database

Create a MariaDB/MySQL database and user:

```sql
CREATE DATABASE mindwell_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'mindwell'@'localhost' IDENTIFIED BY 'mindwell';
GRANT ALL PRIVILEGES ON mindwell_db.* TO 'mindwell'@'localhost';
FLUSH PRIVILEGES;
```

### 2. Environment

Copy and configure environment files:

- `express-api/.env` - Express configuration (DB, JWT, cookies, CORS, service keys)
- `laravel-api/.env` - Laravel configuration (DB, JWT verification, cookies, CORS, service keys)
- `frontend/.env` (optional) - Vite API URLs (`VITE_EXPRESS_API_URL`, `VITE_LARAVEL_API_URL`)

Shared values must use the same `JWT_SECRET`, cookie domain/path settings, and `X_SERVICE_KEY`.

### 3. Install dependencies

```bash
# Frontend
cd frontend && npm install

# Express API
cd ../express-api && npm install

# Laravel API
cd ../laravel-api && composer install
```

### 4. Run migrations and seeders

```bash
# Express (Drizzle)
cd express-api
npm run db:migrate
npm run db:seed

# Laravel
cd ../laravel-api
php artisan migrate
php artisan db:seed
```

### 5. Start services

| Service | Port | Command |
|---------|------|---------|
| Frontend (Vite) | 5173 | `cd frontend && npm run dev` |
| Express API | 3000 | `cd express-api && npm run dev` |
| Laravel API | 8000 | `cd laravel-api && php artisan serve --host=127.0.0.1 --port=8000` |

## Default test accounts

After seeding:

| Role | Email | Password | Notes |
|------|-------|----------|-------|
| Admin | admin@mindwell.edu | Password123! | System administration |
| Counselor | counselor@mindwell.edu | Password123! | Counseling services |
| Student | student@mindwell.edu | Password123! | Student access |
| Student 2 | maria.santos@mindwell.edu | Password123! | Additional student |
| Counselor 2 | dr.reyes@mindwell.edu | Password123! | Additional counselor |

*(Exact accounts may vary by seed data; see seeder files for current values.)*

## Testing

### Express API
```bash
cd express-api
npm test
# or run smoke: npx tsx test/smoke.ts
```

### Laravel API
```bash
cd laravel-api
php artisan test
# or E2E: node test/e2e.mjs
```

### Frontend
```bash
cd frontend
npm run test
npm run build
```

## Security notes

- **Not a substitute for care**: Mindwell is not a replacement for professional mental health care and is not an emergency response service. Use the Help & Crisis page for urgent resources.
- **Authorization**: Server-side RBAC enforced. Counseling records are only visible to assigned counselors; never visible to students or general admins.
- **Privacy**: Wellness check-ins are private by default; sharing requires explicit consent.
- **Appointments**: Double-booking is prevented at the database level via transactions/locks and a generated-column guard.
- **Auth**: HttpOnly cookies for tokens, double-submit CSRF protection for cookie-auth writes, CORS restricted to frontend origins.

## Troubleshooting

- **MariaDB zero dates**: Use `DATETIME` (not `TIMESTAMP`) as configured.
- **CORS/cookies**: Ensure all three services run on expected origins/ports and cookie settings match.
- **Migrations fail**: Check DB credentials and that the database exists.
- **CSRF errors**: Ensure `mw_csrf` cookie is present and `x-csrf-token` header sent for cookie-auth mutations.

## License

This project is for educational/demonstration purposes.
