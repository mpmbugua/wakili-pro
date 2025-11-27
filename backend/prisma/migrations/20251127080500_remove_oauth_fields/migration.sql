-- Drop OAuth columns that are no longer needed
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='User' AND column_name='googleId') THEN
    DROP INDEX IF EXISTS "User_googleId_key";
    ALTER TABLE "User" DROP COLUMN "googleId";
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='User' AND column_name='facebookId') THEN
    DROP INDEX IF EXISTS "User_facebookId_key";
    ALTER TABLE "User" DROP COLUMN "facebookId";
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='User' AND column_name='appleId') THEN
    DROP INDEX IF EXISTS "User_appleId_key";
    ALTER TABLE "User" DROP COLUMN "appleId";
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='User' AND column_name='provider') THEN
    ALTER TABLE "User" DROP COLUMN "provider";
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='User' AND column_name='avatar') THEN
    ALTER TABLE "User" DROP COLUMN "avatar";
  END IF;
END $$;
