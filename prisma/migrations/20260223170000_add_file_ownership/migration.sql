CREATE TABLE IF NOT EXISTS "file_ownership" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "file_ownership_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "file_ownership_filename_key" ON "file_ownership"("filename");
CREATE INDEX IF NOT EXISTS "file_ownership_userId_idx" ON "file_ownership"("userId");
CREATE INDEX IF NOT EXISTS "file_ownership_uploadedAt_idx" ON "file_ownership"("uploadedAt");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'file_ownership_userId_fkey'
  ) THEN
    ALTER TABLE "file_ownership"
      ADD CONSTRAINT "file_ownership_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "users"("id")
      ON DELETE CASCADE
      ON UPDATE CASCADE;
  END IF;
END $$;
