-- Financial integrity lockdown (PostgreSQL)
-- Run once before launch. Safe to re-run where IF NOT EXISTS is used.

BEGIN;

-- Core money safety constraints
ALTER TABLE "wallets"
  DROP CONSTRAINT IF EXISTS wallets_balance_non_negative,
  ADD CONSTRAINT wallets_balance_non_negative CHECK ("balance" >= 0);

ALTER TABLE "orders"
  DROP CONSTRAINT IF EXISTS orders_total_amount_non_negative,
  ADD CONSTRAINT orders_total_amount_non_negative CHECK ("totalAmount" >= 0),
  DROP CONSTRAINT IF EXISTS orders_commission_bounds,
  ADD CONSTRAINT orders_commission_bounds CHECK ("commission" >= 0 AND "commission" <= "totalAmount");

ALTER TABLE "payment_orders"
  DROP CONSTRAINT IF EXISTS payment_orders_amount_positive,
  ADD CONSTRAINT payment_orders_amount_positive CHECK ("amount" > 0);

ALTER TABLE "transactions"
  DROP CONSTRAINT IF EXISTS transactions_amount_positive,
  ADD CONSTRAINT transactions_amount_positive CHECK ("amount" > 0);

-- Replay/dedupe guards
CREATE UNIQUE INDEX IF NOT EXISTS payment_orders_paymentid_uq
ON "payment_orders" ("paymentId")
WHERE "paymentId" IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS orders_provider_slot_active_uq
ON "orders" ("providerId", "serviceDate")
WHERE "status" IN ('PENDING', 'ACCEPTED', 'IN_PROGRESS');

CREATE UNIQUE INDEX IF NOT EXISTS transactions_commission_once_per_order_uq
ON "transactions" ("orderId", "type")
WHERE "type" = 'COMMISSION';

CREATE UNIQUE INDEX IF NOT EXISTS transactions_refund_once_per_order_uq
ON "transactions" ("orderId", "type")
WHERE "type" = 'REFUND';

-- Idempotency key store
CREATE TABLE IF NOT EXISTS "idempotency_keys" (
  "id" TEXT PRIMARY KEY,
  "scope" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "requestHash" TEXT NOT NULL,
  "status" TEXT NOT NULL CHECK ("status" IN ('IN_PROGRESS', 'COMPLETED', 'FAILED')),
  "responseCode" INTEGER,
  "responseBody" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  "expiresAt" TIMESTAMP(3) NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idempotency_scope_user_key_uq
ON "idempotency_keys" ("scope", "userId", "key");

CREATE INDEX IF NOT EXISTS idempotency_expires_at_idx
ON "idempotency_keys" ("expiresAt");

-- Webhook event dedupe store
CREATE TABLE IF NOT EXISTS "webhook_events" (
  "id" TEXT PRIMARY KEY,
  "provider" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "payloadHash" TEXT NOT NULL,
  "processedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS webhook_provider_event_uq
ON "webhook_events" ("provider", "eventId");

-- Minimal double-entry ledger tables (recommended rollout target)
CREATE TABLE IF NOT EXISTS "ledger_accounts" (
  "id" TEXT PRIMARY KEY,
  "ownerUserId" TEXT,
  "type" TEXT NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'INR',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "ledger_transactions" (
  "id" TEXT PRIMARY KEY,
  "referenceType" TEXT NOT NULL,
  "referenceId" TEXT NOT NULL,
  "idempotencyKey" TEXT,
  "status" TEXT NOT NULL DEFAULT 'POSTED',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS ledger_reference_uq
ON "ledger_transactions" ("referenceType", "referenceId");

CREATE TABLE IF NOT EXISTS "ledger_entries" (
  "id" TEXT PRIMARY KEY,
  "transactionId" TEXT NOT NULL REFERENCES "ledger_transactions"("id") ON DELETE CASCADE,
  "accountId" TEXT NOT NULL REFERENCES "ledger_accounts"("id") ON DELETE RESTRICT,
  "direction" TEXT NOT NULL CHECK ("direction" IN ('DEBIT', 'CREDIT')),
  "amountMinor" BIGINT NOT NULL CHECK ("amountMinor" > 0),
  "currency" TEXT NOT NULL DEFAULT 'INR',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ledger_entries_transaction_idx
ON "ledger_entries" ("transactionId");

COMMIT;
