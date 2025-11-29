-- Fix DocumentReview.documentSource column type
-- The column was created with the wrong enum type (DocumentSource instead of DocumentOrigin)

-- Strategy: Since DocumentSource and DocumentOrigin are different enums,
-- we need to drop and recreate the column

-- Step 1: Add a temporary column with the correct type
ALTER TABLE "DocumentReview" ADD COLUMN "documentSource_new" "DocumentOrigin";

-- Step 2: Set default value for new column (EXTERNAL for user-uploaded docs)
UPDATE "DocumentReview" SET "documentSource_new" = 'EXTERNAL';

-- Step 3: Make the new column NOT NULL
ALTER TABLE "DocumentReview" ALTER COLUMN "documentSource_new" SET NOT NULL;

-- Step 4: Drop the old column
ALTER TABLE "DocumentReview" DROP COLUMN "documentSource";

-- Step 5: Rename the new column to the original name
ALTER TABLE "DocumentReview" RENAME COLUMN "documentSource_new" TO "documentSource";
