-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "DocumentType" AS ENUM ('CONTRACT', 'AGREEMENT', 'CERTIFICATE', 'COURT_FILING', 'OTHER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "DocumentStatus" AS ENUM ('DRAFT', 'FILLED', 'PENDING_REVIEW', 'UNDER_REVIEW', 'CONSULTATION_REQUIRED', 'CONSULTATION_SCHEDULED', 'REVISION_NEEDED', 'CERTIFIED', 'REJECTED', 'REVIEWED', 'FINALIZED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

ALTER TYPE "DocumentStatus" ADD VALUE IF NOT EXISTS 'REVIEWED';
ALTER TYPE "DocumentStatus" ADD VALUE IF NOT EXISTS 'FINALIZED';

-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "DocumentSource" AS ENUM ('UPLOADED', 'PURCHASED', 'GENERATED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

ALTER TYPE "DocumentSource" ADD VALUE IF NOT EXISTS 'UPLOADED';
ALTER TYPE "DocumentSource" ADD VALUE IF NOT EXISTS 'PURCHASED';
ALTER TYPE "DocumentSource" ADD VALUE IF NOT EXISTS 'GENERATED';

-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "DocumentOrigin" AS ENUM ('MARKETPLACE', 'EXTERNAL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

ALTER TYPE "DocumentOrigin" ADD VALUE IF NOT EXISTS 'MARKETPLACE';
ALTER TYPE "DocumentOrigin" ADD VALUE IF NOT EXISTS 'EXTERNAL';

-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "DocumentCategory" AS ENUM ('EMPLOYMENT_CONTRACT', 'RENTAL_AGREEMENT', 'BUSINESS_CONTRACT', 'PARTNERSHIP_AGREEMENT', 'COURT_DOCUMENT', 'COMPANY_REGISTRATION', 'MEMORANDUM', 'POWER_OF_ATTORNEY', 'LEASE_AGREEMENT', 'SALES_AGREEMENT', 'OTHER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

ALTER TYPE "DocumentCategory" ADD VALUE IF NOT EXISTS 'EMPLOYMENT_CONTRACT';
ALTER TYPE "DocumentCategory" ADD VALUE IF NOT EXISTS 'RENTAL_AGREEMENT';
ALTER TYPE "DocumentCategory" ADD VALUE IF NOT EXISTS 'BUSINESS_CONTRACT';
ALTER TYPE "DocumentCategory" ADD VALUE IF NOT EXISTS 'PARTNERSHIP_AGREEMENT';
ALTER TYPE "DocumentCategory" ADD VALUE IF NOT EXISTS 'COURT_DOCUMENT';
ALTER TYPE "DocumentCategory" ADD VALUE IF NOT EXISTS 'COMPANY_REGISTRATION';
ALTER TYPE "DocumentCategory" ADD VALUE IF NOT EXISTS 'MEMORANDUM';
ALTER TYPE "DocumentCategory" ADD VALUE IF NOT EXISTS 'POWER_OF_ATTORNEY';
ALTER TYPE "DocumentCategory" ADD VALUE IF NOT EXISTS 'LEASE_AGREEMENT';
ALTER TYPE "DocumentCategory" ADD VALUE IF NOT EXISTS 'SALES_AGREEMENT';
ALTER TYPE "DocumentCategory" ADD VALUE IF NOT EXISTS 'OTHER';

-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "ReviewType" AS ENUM ('AI_ONLY', 'CERTIFICATION', 'AI_PLUS_CERTIFICATION');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

ALTER TYPE "ReviewType" ADD VALUE IF NOT EXISTS 'AI_ONLY';
ALTER TYPE "ReviewType" ADD VALUE IF NOT EXISTS 'CERTIFICATION';
ALTER TYPE "ReviewType" ADD VALUE IF NOT EXISTS 'AI_PLUS_CERTIFICATION';

-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "AIReviewStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

ALTER TYPE "AIReviewStatus" ADD VALUE IF NOT EXISTS 'PENDING';
ALTER TYPE "AIReviewStatus" ADD VALUE IF NOT EXISTS 'PROCESSING';
ALTER TYPE "AIReviewStatus" ADD VALUE IF NOT EXISTS 'COMPLETED';
ALTER TYPE "AIReviewStatus" ADD VALUE IF NOT EXISTS 'FAILED';

-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "CertificationStatus" AS ENUM ('PENDING_ASSIGNMENT', 'ASSIGNED', 'IN_REVIEW', 'PENDING_QC', 'QC_APPROVED', 'QC_REJECTED', 'COMPLETED', 'REVISION_REQUESTED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

ALTER TYPE "CertificationStatus" ADD VALUE IF NOT EXISTS 'PENDING_ASSIGNMENT';
ALTER TYPE "CertificationStatus" ADD VALUE IF NOT EXISTS 'ASSIGNED';
ALTER TYPE "CertificationStatus" ADD VALUE IF NOT EXISTS 'IN_REVIEW';
ALTER TYPE "CertificationStatus" ADD VALUE IF NOT EXISTS 'PENDING_QC';
ALTER TYPE "CertificationStatus" ADD VALUE IF NOT EXISTS 'QC_APPROVED';
ALTER TYPE "CertificationStatus" ADD VALUE IF NOT EXISTS 'QC_REJECTED';
ALTER TYPE "CertificationStatus" ADD VALUE IF NOT EXISTS 'COMPLETED';
ALTER TYPE "CertificationStatus" ADD VALUE IF NOT EXISTS 'REVISION_REQUESTED';

-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "QualityControlStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'REVISION_REQUIRED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

ALTER TYPE "QualityControlStatus" ADD VALUE IF NOT EXISTS 'PENDING';
ALTER TYPE "QualityControlStatus" ADD VALUE IF NOT EXISTS 'APPROVED';
ALTER TYPE "QualityControlStatus" ADD VALUE IF NOT EXISTS 'REJECTED';
ALTER TYPE "QualityControlStatus" ADD VALUE IF NOT EXISTS 'REVISION_REQUIRED';

-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "UrgencyLevel" AS ENUM ('EXPRESS', 'STANDARD', 'ECONOMY');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

ALTER TYPE "UrgencyLevel" ADD VALUE IF NOT EXISTS 'EXPRESS';
ALTER TYPE "UrgencyLevel" ADD VALUE IF NOT EXISTS 'STANDARD';
ALTER TYPE "UrgencyLevel" ADD VALUE IF NOT EXISTS 'ECONOMY';

-- CreateTable
CREATE TABLE IF NOT EXISTS "UserDocument" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "DocumentType" NOT NULL,
    "category" TEXT,
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "status" "DocumentStatus" NOT NULL,
    "source" "DocumentSource" NOT NULL,
    "templateId" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "UserDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "DocumentReview" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lawyerId" TEXT,
    "documentSource" "DocumentOrigin" NOT NULL,
    "marketplaceDocumentId" TEXT,
    "userDocumentId" TEXT,
    "uploadedDocumentUrl" TEXT,
    "originalFileName" TEXT,
    "documentType" TEXT NOT NULL,
    "documentCategory" "DocumentCategory",
    "reviewType" "ReviewType" NOT NULL,
    "aiReviewStatus" "AIReviewStatus" NOT NULL DEFAULT 'PENDING',
    "aiReviewResults" JSONB,
    "aiReviewCompletedAt" TIMESTAMP(3),
    "certificationStatus" "CertificationStatus",
    "certificationPrice" DOUBLE PRECISION,
    "certifiedDocumentUrl" TEXT,
    "certificationLetterUrl" TEXT,
    "lawyerNotes" TEXT,
    "certificateId" TEXT,
    "verificationQRCodeUrl" TEXT,
    "signedAt" TIMESTAMP(3),
    "signatureApplied" BOOLEAN NOT NULL DEFAULT false,
    "stampApplied" BOOLEAN NOT NULL DEFAULT false,
    "letterheadApplied" BOOLEAN NOT NULL DEFAULT false,
    "questionnaire" JSONB,
    "urgency" "UrgencyLevel" NOT NULL DEFAULT 'STANDARD',
    "deadline" TIMESTAMP(3) NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "paymentId" TEXT,
    "paidAt" TIMESTAMP(3),
    "qualityControlStatus" "QualityControlStatus",
    "qualityControlNotes" TEXT,
    "qualityCheckedBy" TEXT,
    "qualityCheckedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "clientRating" INTEGER,
    "clientFeedback" TEXT,
    "revisionCount" INTEGER NOT NULL DEFAULT 0,
    "revisionRequested" BOOLEAN NOT NULL DEFAULT false,
    "revisionNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentReview_pkey" PRIMARY KEY ("id")
);

-- Add missing column if DocumentReview table already exists
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'DocumentReview' AND column_name = 'userDocumentId') THEN
        ALTER TABLE "DocumentReview" ADD COLUMN "userDocumentId" TEXT;
    END IF;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "LawyerLetterhead" (
    "id" TEXT NOT NULL,
    "lawyerId" TEXT NOT NULL,
    "letterheadUrl" TEXT NOT NULL,
    "stampUrl" TEXT,
    "signatureUrl" TEXT,
    "certificatePrefix" TEXT NOT NULL DEFAULT 'WP',
    "firmName" TEXT NOT NULL,
    "firmAddress" TEXT,
    "firmPhone" TEXT,
    "firmEmail" TEXT,
    "licenseNumber" TEXT NOT NULL,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LawyerLetterhead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "UserDocument_userId_idx" ON "UserDocument"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "UserDocument_status_idx" ON "UserDocument"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "UserDocument_type_idx" ON "UserDocument"("type");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "DocumentReview_certificateId_key" ON "DocumentReview"("certificateId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "DocumentReview_userId_idx" ON "DocumentReview"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "DocumentReview_lawyerId_idx" ON "DocumentReview"("lawyerId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "DocumentReview_aiReviewStatus_idx" ON "DocumentReview"("aiReviewStatus");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "DocumentReview_certificationStatus_idx" ON "DocumentReview"("certificationStatus");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "DocumentReview_qualityControlStatus_idx" ON "DocumentReview"("qualityControlStatus");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "LawyerLetterhead_lawyerId_key" ON "LawyerLetterhead"("lawyerId");

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'UserDocument_userId_fkey') THEN
        ALTER TABLE "UserDocument" ADD CONSTRAINT "UserDocument_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'UserDocument_templateId_fkey') THEN
        ALTER TABLE "UserDocument" ADD CONSTRAINT "UserDocument_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "DocumentTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'DocumentReview_userId_fkey') THEN
        ALTER TABLE "DocumentReview" ADD CONSTRAINT "DocumentReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'DocumentReview_lawyerId_fkey') THEN
        ALTER TABLE "DocumentReview" ADD CONSTRAINT "DocumentReview_lawyerId_fkey" FOREIGN KEY ("lawyerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'DocumentReview_marketplaceDocumentId_fkey') THEN
        ALTER TABLE "DocumentReview" ADD CONSTRAINT "DocumentReview_marketplaceDocumentId_fkey" FOREIGN KEY ("marketplaceDocumentId") REFERENCES "DocumentTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'DocumentReview_qualityCheckedBy_fkey') THEN
        ALTER TABLE "DocumentReview" ADD CONSTRAINT "DocumentReview_qualityCheckedBy_fkey" FOREIGN KEY ("qualityCheckedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'DocumentReview_userDocumentId_fkey') THEN
        ALTER TABLE "DocumentReview" ADD CONSTRAINT "DocumentReview_userDocumentId_fkey" FOREIGN KEY ("userDocumentId") REFERENCES "UserDocument"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'LawyerLetterhead_lawyerId_fkey') THEN
        ALTER TABLE "LawyerLetterhead" ADD CONSTRAINT "LawyerLetterhead_lawyerId_fkey" FOREIGN KEY ("lawyerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'LawyerLetterhead_approvedBy_fkey') THEN
        ALTER TABLE "LawyerLetterhead" ADD CONSTRAINT "LawyerLetterhead_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;
