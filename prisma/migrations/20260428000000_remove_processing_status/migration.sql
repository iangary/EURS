-- 將既有 PROCESSING 資料先回退為 SUBMITTED
UPDATE "Request" SET "status" = 'SUBMITTED' WHERE "status" = 'PROCESSING';
UPDATE "StatusLog" SET "fromStatus" = 'SUBMITTED' WHERE "fromStatus" = 'PROCESSING';
UPDATE "StatusLog" SET "toStatus" = 'SUBMITTED' WHERE "toStatus" = 'PROCESSING';

-- 拿掉 default 才能改 type
ALTER TABLE "Request" ALTER COLUMN "status" DROP DEFAULT;

-- 重建 enum 移除 PROCESSING
ALTER TYPE "RequestStatus" RENAME TO "RequestStatus_old";
CREATE TYPE "RequestStatus" AS ENUM ('SUBMITTED', 'SHIPPED', 'REJECTED');
ALTER TABLE "Request" ALTER COLUMN "status" TYPE "RequestStatus" USING ("status"::text::"RequestStatus");
ALTER TABLE "StatusLog" ALTER COLUMN "fromStatus" TYPE "RequestStatus" USING ("fromStatus"::text::"RequestStatus");
ALTER TABLE "StatusLog" ALTER COLUMN "toStatus" TYPE "RequestStatus" USING ("toStatus"::text::"RequestStatus");
DROP TYPE "RequestStatus_old";

-- 還原 default
ALTER TABLE "Request" ALTER COLUMN "status" SET DEFAULT 'SUBMITTED';
