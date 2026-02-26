-- AlterTable
ALTER TABLE "profiles" ADD COLUMN     "googleId" TEXT,
ADD COLUMN     "googleVerified" BOOLEAN NOT NULL DEFAULT false;
