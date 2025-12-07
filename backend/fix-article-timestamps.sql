-- Add timestamp columns to Article table
ALTER TABLE "Article" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP DEFAULT NOW();
ALTER TABLE "Article" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP DEFAULT NOW();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "Article_authorId_idx" ON "Article"("authorId");
CREATE INDEX IF NOT EXISTS "Article_isPublished_idx" ON "Article"("isPublished");
CREATE INDEX IF NOT EXISTS "Article_createdAt_idx" ON "Article"("createdAt");

-- Update existing articles to have proper timestamps
UPDATE "Article" SET "createdAt" = NOW() WHERE "createdAt" IS NULL;
UPDATE "Article" SET "updatedAt" = NOW() WHERE "updatedAt" IS NULL;

-- Verify the changes
SELECT id, title, "createdAt", "updatedAt", "isPublished" FROM "Article" LIMIT 5;
