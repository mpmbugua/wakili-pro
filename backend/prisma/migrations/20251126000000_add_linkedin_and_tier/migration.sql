-- AlterTable
ALTER TABLE "LawyerProfile" 
ADD COLUMN IF NOT EXISTS "linkedInProfile" TEXT,
ALTER COLUMN "tier" SET DEFAULT 'FREE';
