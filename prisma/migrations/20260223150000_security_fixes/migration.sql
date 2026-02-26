-- CreateEnum
CREATE TYPE "PaymentMethodType" AS ENUM ('UPI', 'CARD', 'NET_BANKING', 'WALLET');

-- CreateTable
CREATE TABLE "auth_refresh_sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "jti" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "user_agent" TEXT,
    "ip" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "rotated_to_jti" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auth_refresh_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "auth_refresh_sessions_jti_key" ON "auth_refresh_sessions"("jti");

-- CreateIndex
CREATE INDEX "auth_refresh_sessions_user_id_idx" ON "auth_refresh_sessions"("user_id");

-- CreateIndex
CREATE INDEX "auth_refresh_sessions_expires_at_idx" ON "auth_refresh_sessions"("expires_at");

-- Add column to users table
ALTER TABLE "users" ADD COLUMN "tokenVersion" INTEGER NOT NULL DEFAULT 0;

-- Create unique index for payment methods
CREATE UNIQUE INDEX "user_payment_methods_one_default_uq" ON "user_payment_methods"("userId") WHERE "isDefault" = true AND "isActive" = true;

-- Add foreign key constraint for refresh sessions
ALTER TABLE "auth_refresh_sessions" ADD CONSTRAINT "auth_refresh_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
