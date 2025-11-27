-- Add OAuth columns if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='User' AND column_name='googleId') THEN
    ALTER TABLE "User" ADD COLUMN "googleId" TEXT;
    CREATE UNIQUE INDEX IF NOT EXISTS "User_googleId_key" ON "User"("googleId");
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='User' AND column_name='facebookId') THEN
    ALTER TABLE "User" ADD COLUMN "facebookId" TEXT;
    CREATE UNIQUE INDEX IF NOT EXISTS "User_facebookId_key" ON "User"("facebookId");
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='User' AND column_name='appleId') THEN
    ALTER TABLE "User" ADD COLUMN "appleId" TEXT;
    CREATE UNIQUE INDEX IF NOT EXISTS "User_appleId_key" ON "User"("appleId");
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='User' AND column_name='provider') THEN
    ALTER TABLE "User" ADD COLUMN "provider" TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='User' AND column_name='avatar') THEN
    ALTER TABLE "User" ADD COLUMN "avatar" TEXT;
  END IF;
END $$;
