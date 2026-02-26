# Servoley Production Readiness

## Updated backend structure
```
config/
  database.js
database/
  production-hardening.sql
middleware/
  auth.js
  errorHandler.js
  rateLimits.js
routes/
  auth_final.js
  refresh.js
  dashboard.js
scripts/
  backup-database.ps1
  schedule-daily-backup.ps1
utils/
  appError.js
  jwt.js
  logger.js
server.js
```

## Security hardening delivered
- BCrypt hashing with per-password salt (`bcrypt.hash`, configurable rounds).
- JWT access + refresh with hard cap of 7 days (`utils/jwt.js`).
- JWT middleware (`middleware/auth.js`) used on dashboard routes.
- RBAC for `CUSTOMER`, `PROVIDER`, `ADMIN` (`requireRole`).
- Login rate limit `5/min` (`middleware/rateLimits.js` on `/api/auth/login`).
- SQL-injection-safe query path via Prisma ORM and no string-built SQL in auth flow.
- Helmet security headers and strict CORS whitelist in `server.js`.
- Secrets externalized into `.env.example` templates.
- Production-safe centralized error responses (`middleware/errorHandler.js`).

## Database improvements delivered
- `database/production-hardening.sql` adds:
  - indexes on `users.email`, `users.phone`,
  - indexes on major foreign keys,
  - createdAt columns (if missing),
  - optional soft-delete columns (`deletedAt`) for users/providers.
- Daily backup script: `scripts/backup-database.ps1`.
- Task scheduler helper: `scripts/schedule-daily-backup.ps1`.

## Performance changes delivered
- Compression middleware enabled when package installed.
- Global request limiter and strict payload size limits.
- Auth login query refactored into single include query (removes N+1 lookups).
- Booking creation now uses serializable transaction + conflict check to avoid race overbooking.
- Debug-heavy auth logs removed from active path.

## Admin panel endpoints checklist
- Approve provider: `PUT /api/admin/providers/:id/approve`
- Reject provider: `PUT /api/admin/providers/:id/reject`
- Block user: `POST /api/admin/users/:userId/block`
- View all users: `GET /api/admin/users`
- View bookings: `GET /api/admin/orders`
- Basic stats: `GET /api/admin/stats`

## Production build and deployment steps
1. Install dependencies:
   - `npm install`
   - `cd unified-pwa && npm install`
2. Configure environment:
   - copy `.env.example` to `.env`
   - set real secrets and production origins
3. Apply DB hardening SQL:
   - `psql "$env:DATABASE_URL" -f database/production-hardening.sql`
4. Build frontend:
   - `cd unified-pwa && npm run build`
5. Start backend with PM2:
   - `npm run start:persistent`
   - `pm2 save`
6. Configure daily DB backup:
   - `powershell -ExecutionPolicy Bypass -File scripts/schedule-daily-backup.ps1`

## Deployment checklist
- `NODE_ENV=production` configured.
- `JWT_SECRET` and `JWT_REFRESH_SECRET` are strong and different.
- `CORS_ORIGIN` contains only trusted domains.
- `JWT_EXPIRES_IN` and `JWT_REFRESH_EXPIRES_IN` are <= `7d`.
- `LOGIN_RATE_LIMIT_MAX_REQUESTS=5`.
- `DATABASE_URL` uses production PostgreSQL and pooling params.
- TLS/HTTPS terminated at load balancer or reverse proxy.
- Backup task exists and restores tested.
- Health endpoint `/api/health` monitored.
