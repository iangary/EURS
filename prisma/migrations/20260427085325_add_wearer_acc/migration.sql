-- AlterTable
ALTER TABLE "RequestItem" ADD COLUMN     "wearerAcc" TEXT NOT NULL DEFAULT '';

-- CreateIndex
CREATE INDEX "RequestItem_wearerAcc_idx" ON "RequestItem"("wearerAcc");
