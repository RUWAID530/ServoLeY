-- AlterEnum
ALTER TYPE "OrderStatus" ADD VALUE 'EXPIRED';

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "expiresAt" TIMESTAMP(3);

-- DropEnum
DROP TYPE "PaymentMethodType";

-- CreateIndex
CREATE INDEX "orders_status_expiresAt_idx" ON "orders"("status", "expiresAt");
