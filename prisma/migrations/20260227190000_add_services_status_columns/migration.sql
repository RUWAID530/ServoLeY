-- Add missing service moderation columns for databases created before status support.
ALTER TABLE "services"
  ADD COLUMN IF NOT EXISTS "status" TEXT,
  ADD COLUMN IF NOT EXISTS "rejectionReason" TEXT;

-- Backfill status for existing rows.
UPDATE "services"
SET "status" = CASE
  WHEN "isActive" = true THEN 'ACTIVE'
  ELSE 'PENDING_VERIFICATION'
END
WHERE "status" IS NULL;

ALTER TABLE "services"
  ALTER COLUMN "status" SET DEFAULT 'ACTIVE',
  ALTER COLUMN "status" SET NOT NULL;
