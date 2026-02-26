-- Servoley production hardening SQL
-- Safe to run multiple times (uses IF NOT EXISTS guards where possible)

BEGIN;

-- Ensure createdAt timestamps exist on key tables
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW();
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW();
ALTER TABLE "providers" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW();
ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW();
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW();

-- Optional soft delete support
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
ALTER TABLE "providers" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

-- Users lookup indexes
CREATE INDEX IF NOT EXISTS "users_email_idx" ON "users" ("email");
CREATE INDEX IF NOT EXISTS "users_phone_idx" ON "users" ("phone");
CREATE INDEX IF NOT EXISTS "users_createdAt_idx" ON "users" ("createdAt");

-- Foreign key indexes
CREATE INDEX IF NOT EXISTS "profiles_userId_idx" ON "profiles" ("userId");
CREATE INDEX IF NOT EXISTS "providers_userId_idx" ON "providers" ("userId");
CREATE INDEX IF NOT EXISTS "wallets_userId_idx" ON "wallets" ("userId");
CREATE INDEX IF NOT EXISTS "services_providerId_idx" ON "services" ("providerId");
CREATE INDEX IF NOT EXISTS "orders_customerId_idx" ON "orders" ("customerId");
CREATE INDEX IF NOT EXISTS "orders_providerId_idx" ON "orders" ("providerId");
CREATE INDEX IF NOT EXISTS "orders_serviceId_idx" ON "orders" ("serviceId");
CREATE INDEX IF NOT EXISTS "transactions_walletId_idx" ON "transactions" ("walletId");
CREATE INDEX IF NOT EXISTS "reviews_orderId_idx" ON "reviews" ("orderId");
CREATE INDEX IF NOT EXISTS "reviews_reviewerId_idx" ON "reviews" ("reviewerId");
CREATE INDEX IF NOT EXISTS "reviews_revieweeId_idx" ON "reviews" ("revieweeId");
CREATE INDEX IF NOT EXISTS "reviews_providerId_idx" ON "reviews" ("providerId");
CREATE INDEX IF NOT EXISTS "messages_senderId_idx" ON "messages" ("senderId");
CREATE INDEX IF NOT EXISTS "messages_receiverId_idx" ON "messages" ("receiverId");
CREATE INDEX IF NOT EXISTS "tickets_userId_idx" ON "tickets" ("userId");
CREATE INDEX IF NOT EXISTS "notification_tokens_userId_idx" ON "notification_tokens" ("userId");
CREATE INDEX IF NOT EXISTS "notification_preferences_userId_idx" ON "notification_preferences" ("userId");
CREATE INDEX IF NOT EXISTS "notifications_userId_idx" ON "notifications" ("userId");
CREATE INDEX IF NOT EXISTS "payment_orders_userId_idx" ON "payment_orders" ("userId");
CREATE INDEX IF NOT EXISTS "otps_userId_idx" ON "otps" ("userId");
CREATE INDEX IF NOT EXISTS "user_payment_methods_userId_idx" ON "user_payment_methods" ("userId");
CREATE INDEX IF NOT EXISTS "admin_actions_adminId_idx" ON "admin_actions" ("adminId");

-- Soft-delete filter indexes
CREATE INDEX IF NOT EXISTS "users_deletedAt_idx" ON "users" ("deletedAt");
CREATE INDEX IF NOT EXISTS "providers_deletedAt_idx" ON "providers" ("deletedAt");

COMMIT;
