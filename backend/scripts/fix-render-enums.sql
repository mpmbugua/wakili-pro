-- =====================================================
-- Render Database Enum Migration Fix
-- =====================================================
-- This script fixes PaymentStatus enum conflicts before
-- applying Prisma migrations to the Render production DB
-- =====================================================

BEGIN;

-- Step 1: Add new enum values if they don't exist
DO $$ 
BEGIN
    -- Add PAID if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'PAID' 
        AND enumtypid = 'PaymentStatus'::regtype
    ) THEN
        ALTER TYPE "PaymentStatus" ADD VALUE 'PAID';
        RAISE NOTICE 'Added PAID to PaymentStatus enum';
    ELSE
        RAISE NOTICE 'PAID already exists in PaymentStatus enum';
    END IF;
    
    -- Add REFUNDED if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'REFUNDED' 
        AND enumtypid = 'PaymentStatus'::regtype
    ) THEN
        ALTER TYPE "PaymentStatus" ADD VALUE 'REFUNDED';
        RAISE NOTICE 'Added REFUNDED to PaymentStatus enum';
    ELSE
        RAISE NOTICE 'REFUNDED already exists in PaymentStatus enum';
    END IF;
END $$;

-- Step 2: Check current enum values
SELECT enumlabel as "Current PaymentStatus Values"
FROM pg_enum 
WHERE enumtypid = 'PaymentStatus'::regtype
ORDER BY enumlabel;

-- Step 3: Update ServiceBooking table data
-- Change COMPLETED -> PAID
UPDATE "ServiceBooking" 
SET "paymentStatus" = 'PAID' 
WHERE "paymentStatus" = 'COMPLETED';

-- Get count of updated records
SELECT COUNT(*) as "Records changed from COMPLETED to PAID"
FROM "ServiceBooking" 
WHERE "paymentStatus" = 'PAID';

-- Change CANCELLED -> REFUNDED
UPDATE "ServiceBooking" 
SET "paymentStatus" = 'REFUNDED' 
WHERE "paymentStatus" = 'CANCELLED';

-- Get count of updated records
SELECT COUNT(*) as "Records changed from CANCELLED to REFUNDED"
FROM "ServiceBooking" 
WHERE "paymentStatus" = 'REFUNDED';

-- Step 4: Update Payment table data (if it exists and has old values)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Payment' 
        AND column_name = 'status'
    ) THEN
        UPDATE "Payment" 
        SET "status" = 'PAID' 
        WHERE "status" = 'COMPLETED';
        
        UPDATE "Payment" 
        SET "status" = 'REFUNDED' 
        WHERE "status" = 'CANCELLED';
        
        RAISE NOTICE 'Updated Payment table status values';
    ELSE
        RAISE NOTICE 'Payment table status column not found (may not exist yet)';
    END IF;
END $$;

-- Step 5: Verify no old values remain
SELECT "paymentStatus", COUNT(*) as "Count"
FROM "ServiceBooking" 
GROUP BY "paymentStatus"
ORDER BY "paymentStatus";

-- Step 6: Check if COMPLETED and CANCELLED still exist in data
DO $$
DECLARE
    completed_count INTEGER;
    cancelled_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO completed_count
    FROM "ServiceBooking" 
    WHERE "paymentStatus" = 'COMPLETED';
    
    SELECT COUNT(*) INTO cancelled_count
    FROM "ServiceBooking" 
    WHERE "paymentStatus" = 'CANCELLED';
    
    IF completed_count > 0 THEN
        RAISE WARNING 'Still have % records with COMPLETED status!', completed_count;
    ELSE
        RAISE NOTICE 'No COMPLETED records remain ✓';
    END IF;
    
    IF cancelled_count > 0 THEN
        RAISE WARNING 'Still have % records with CANCELLED status!', cancelled_count;
    ELSE
        RAISE NOTICE 'No CANCELLED records remain ✓';
    END IF;
END $$;

-- Step 7: Final enum values check
SELECT 
    'PaymentStatus enum is ready for migration' as "Status",
    array_agg(enumlabel ORDER BY enumlabel) as "Available Values"
FROM pg_enum 
WHERE enumtypid = 'PaymentStatus'::regtype;

COMMIT;

-- =====================================================
-- Migration is now safe to run!
-- Next steps:
--   1. Run: npx prisma migrate deploy
--   2. Run: npx prisma generate
--   3. Rebuild backend: npm run build
-- =====================================================
