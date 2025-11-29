-- Fix DocumentReview.documentSource column type
-- The column was created with the wrong enum type (DocumentSource instead of DocumentOrigin)

-- First, add 'EXTERNAL' to DocumentSource enum if needed
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum e
        JOIN pg_type t ON e.enumtypid = t.oid
        WHERE t.typname = 'DocumentSource' AND e.enumlabel = 'EXTERNAL'
    ) THEN
        -- Add EXTERNAL to DocumentSource temporarily
        ALTER TYPE "DocumentSource" ADD VALUE IF NOT EXISTS 'EXTERNAL';
    END IF;
END $$;

-- Update any existing rows to use a valid DocumentSource value temporarily
UPDATE "DocumentReview" SET "documentSource" = 'UPLOADED' WHERE "documentSource" IS NOT NULL;

-- Now we can safely change the column type
ALTER TABLE "DocumentReview" 
    ALTER COLUMN "documentSource" TYPE "DocumentOrigin" 
    USING "documentSource"::text::"DocumentOrigin";

-- Update rows back to EXTERNAL
UPDATE "DocumentReview" SET "documentSource" = 'EXTERNAL';
