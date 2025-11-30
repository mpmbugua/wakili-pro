-- AlterTable
ALTER TABLE "LawyerLetterhead" ADD COLUMN IF NOT EXISTS "useCustomLetterhead" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "LawyerLetterhead" ADD COLUMN IF NOT EXISTS "customLetterheadUrl" TEXT;
