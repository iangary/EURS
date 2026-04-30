-- Rename RequestStatus enum value SUBMITTED -> APPLYING
ALTER TYPE "RequestStatus" RENAME VALUE 'SUBMITTED' TO 'APPLYING';

-- Update default for Request.status
ALTER TABLE "Request" ALTER COLUMN "status" SET DEFAULT 'APPLYING';
