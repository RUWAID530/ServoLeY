-- Add service image URL support for provider listing uploads.
ALTER TABLE "services"
  ADD COLUMN IF NOT EXISTS "image" TEXT;
