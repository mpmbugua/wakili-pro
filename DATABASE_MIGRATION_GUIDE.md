# Database Migration Guide - Three-Tier Monetization System

## ⚠️ IMPORTANT: Schema Changes Overview

The monetization system adds **significant schema changes** that need careful handling in production:

### New Enums (7)
- `LawyerTier`: FREE, LITE, PRO
- `PricingTier`: ENTRY, STANDARD, PREMIUM, ELITE  
- `DocumentTier`: BASIC, FILLED, CERTIFIED
- `DocumentStatus`: 9 states (DRAFT → CERTIFIED)
- `ApprovalStatus`: PENDING, APPROVED, REJECTED, FLAGGED
- `ServiceTypeEnum`: VIDEO_CONSULTATION, MARKETPLACE_SERVICE, DOCUMENT_CERTIFICATION
- `SubscriptionStatus`: ACTIVE, CANCELLED, EXPIRED, SUSPENDED, PENDING

### Extended Enums
- `NotificationType`: Added CERTIFICATION_AVAILABLE, CERTIFICATION_COMPLETED, CERTIFICATION_REJECTED, REVISION_REQUESTED, CONSULTATION_SCHEDULED, CONSULTATION_COMPLETED

### New Tables (2)
- `Subscription` - Lawyer subscription billing
- `MonthlyWHTReport` - Tax remittance tracking

### Extended Tables (4)
- **LawyerProfile**: +24 fields
- **DocumentTemplate**: +6 fields
- **DocumentPurchase**: +14 fields  
- **Payment**: +10 fields
- **MarketplaceService**: +7 fields

---

## Development Environment (Local/Test Database)

### Option 1: Clean Database Reset (Recommended for Dev)

```bash
cd backend

# DANGER: This will delete all data
npx prisma migrate reset --force

# Apply all migrations
npx prisma migrate deploy

# Generate client
npx prisma generate

# Seed with test data
npm run seed
```

### Option 2: Database Push (Quick Dev Iteration)

```bash
cd backend

# Push schema changes without formal migration
npx prisma db push --accept-data-loss

# Generate client
npx prisma generate
```

**Note:** `db push` is faster but doesn't create migration files. Use for rapid development only.

---

## Production Environment (Render/Railway/Vercel)

### Pre-Deployment Checklist

- [ ] Backup production database
- [ ] Test migration on staging environment
- [ ] Review all data transformation scripts
- [ ] Communicate downtime window to users
- [ ] Prepare rollback plan

### Recommended Migration Strategy

**Step 1: Create Migration File**
```bash
# On local machine
cd backend
npx prisma migrate dev --name three-tier-monetization --create-only
```

**Step 2: Review and Edit Migration**

The auto-generated migration will be in:
```
backend/prisma/migrations/YYYYMMDDHHMMSS_three-tier-monetization/migration.sql
```

**CRITICAL EDITS NEEDED:**

1. **Remove destructive operations** (check for):
   - `DROP COLUMN` statements for existing fields
   - `ALTER COLUMN ... DROP DEFAULT` that might break existing data
   - Enum value removals that are still in use

2. **Add data preservation logic**:
   ```sql
   -- Example: Preserve existing data when adding new required field
   ALTER TABLE "LawyerProfile" ADD COLUMN "tier" "LawyerTier" NOT NULL DEFAULT 'LITE';
   
   -- Update existing lawyers to FREE tier initially
   UPDATE "LawyerProfile" SET "tier" = 'FREE' WHERE "createdAt" < NOW();
   ```

3. **Handle enum migrations carefully**:
   ```sql
   -- Safely add new notification types
   ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'CERTIFICATION_AVAILABLE';
   ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'CERTIFICATION_COMPLETED';
   -- ... repeat for all new values
   ```

**Step 3: Deploy with Pre-Deploy Command**

**For Render:**
1. Go to Service → Settings → Build & Deploy
2. Add **Pre-Deploy Command**:
   ```bash
   cd backend && npx prisma migrate deploy
   ```
3. Save and trigger deployment

**For Railway:**
1. Add to `railway.json`:
   ```json
   {
     "build": {
       "builder": "nixpacks",
       "buildCommand": "npm install && npm run build"
     },
     "deploy": {
       "startCommand": "npx prisma migrate deploy && npm start"
     }
   }
   ```

**For Vercel (Serverless):**
1. Add to `package.json` scripts:
   ```json
   {
     "scripts": {
       "vercel-build": "prisma generate && prisma migrate deploy && npm run build"
     }
   }
   ```

---

## Migration Execution Steps

### Step-by-Step Production Migration

**1. Backup Database**
```bash
# PostgreSQL backup
pg_dump -h <host> -U <user> -d <database> -F c -b -v -f backup_$(date +%Y%m%d_%H%M%S).dump
```

**2. Enable Maintenance Mode**
```bash
# Set environment variable
MAINTENANCE_MODE=true
```

**3. Apply Migration**
```bash
cd backend
npx prisma migrate deploy
```

**4. Verify Migration**
```bash
# Check all new tables exist
npx prisma db execute --stdin <<< "SELECT table_name FROM information_schema.tables WHERE table_schema='public';"

# Verify enum values
npx prisma db execute --stdin <<< "SELECT enumlabel FROM pg_enum WHERE enumtypid = 'LawyerTier'::regtype;"
```

**5. Generate Client**
```bash
npx prisma generate
```

**6. Disable Maintenance Mode**
```bash
unset MAINTENANCE_MODE
```

---

## Data Migration Scripts

### Initialize Existing Lawyers with Default Tier

Create `backend/scripts/migrateLawyerTiers.ts`:

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateLawyerTiers() {
  console.log('Migrating existing lawyers to FREE tier...');
  
  // Set all existing lawyers to FREE tier
  const updated = await prisma.lawyerProfile.updateMany({
    where: {
      tier: null, // Or use { NOT: { tier: { in: ['FREE', 'LITE', 'PRO'] } } }
    },
    data: {
      tier: 'FREE',
      pricingTier: 'ENTRY',
      maxSpecializations: 1,
      maxServicesPerMonth: 1,
      maxBookingsPerMonth: 2,
      maxCertificationsPerMonth: 0,
      monthlyBookings: 0,
      monthlyCertifications: 0,
      monthlyServices: 0,
      usageResetAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    },
  });
  
  console.log(`✅ Migrated ${updated.count} lawyers to FREE tier`);
  
  // Create FREE subscription for all
  const lawyers = await prisma.lawyerProfile.findMany();
  
  for (const lawyer of lawyers) {
    await prisma.subscription.create({
      data: {
        lawyerId: lawyer.userId,
        tier: 'FREE',
        status: 'ACTIVE',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        monthlyFee: 0,
        paymentMethod: 'MPESA',
      },
    });
  }
  
  console.log(`✅ Created FREE subscriptions for ${lawyers.length} lawyers`);
}

migrateLawyerTiers()
  .then(() => {
    console.log('✅ Migration complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  });
```

Run after migration:
```bash
ts-node backend/scripts/migrateLawyerTiers.ts
```

---

## Rollback Plan

### If Migration Fails

**1. Restore from Backup**
```bash
# PostgreSQL restore
pg_restore -h <host> -U <user> -d <database> -v backup_YYYYMMDD_HHMMSS.dump
```

**2. Mark Migration as Rolled Back**
```bash
cd backend
npx prisma migrate resolve --rolled-back "YYYYMMDDHHMMSS_three-tier-monetization"
```

**3. Revert Code**
```bash
git revert <commit-hash>
git push origin main
```

---

## Testing Migration

### Local Testing Workflow

```bash
# 1. Backup current local database
pg_dump -h localhost -U postgres -d wakili_pro_dev > local_backup.sql

# 2. Create test database
createdb wakili_pro_test

# 3. Update .env.test
DATABASE_URL="postgresql://postgres:password@localhost:5432/wakili_pro_test"

# 4. Run migration
DATABASE_URL="postgresql://postgres:password@localhost:5432/wakili_pro_test" npx prisma migrate deploy

# 5. Test with sample data
npm run test:integration

# 6. If successful, apply to dev database
npx prisma migrate deploy
```

---

## Environment Variables

Add to production environment:

```bash
# Migration Settings
PRISMA_CLIENT_ENGINE_TYPE=binary
PRISMA_GENERATE_SKIP_AUTOINSTALL=false

# Deployment
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...  # For migrations (Render/Supabase)
```

---

## Troubleshooting

### Issue: "Migration already applied"
```bash
npx prisma migrate resolve --applied "YYYYMMDDHHMMSS_migration_name"
```

### Issue: "Transaction aborted"
- Check for existing data that violates new constraints
- Review migration file for conflicting operations
- Split migration into smaller chunks

### Issue: "Enum value already exists"
```sql
-- Use IF NOT EXISTS
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'NEW_VALUE';
```

### Issue: "Column already exists"
```sql
-- Use conditional ADD COLUMN
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='LawyerProfile' AND column_name='tier') THEN
        ALTER TABLE "LawyerProfile" ADD COLUMN "tier" "LawyerTier" DEFAULT 'FREE';
    END IF;
END $$;
```

---

## Post-Migration Verification

### Check All New Features

```sql
-- Verify LawyerTier enum
SELECT enumlabel FROM pg_enum WHERE enumtypid = 'LawyerTier'::regtype;

-- Check subscription table
SELECT COUNT(*) FROM "Subscription";

-- Verify new LawyerProfile fields
SELECT tier, pricingTier, monthlyBookings, maxBookingsPerMonth 
FROM "LawyerProfile" LIMIT 5;

-- Check payment breakdown fields
SELECT serviceType, platformCommission, whtAmount 
FROM "Payment" 
WHERE serviceType IS NOT NULL 
LIMIT 5;
```

### Run Integration Tests

```bash
npm run test:integration
npm run test:e2e
```

---

## Current Status

**Schema:** ✅ Defined and ready
**Migration File:** ⏳ Needs manual creation with data preservation logic
**Testing:** ⏳ Requires staging environment testing
**Production:** 🚫 DO NOT deploy without testing

---

## Recommended Next Steps

1. **Create staging database** - Clone production data
2. **Test migration on staging** - Run full migration workflow
3. **Run data migration scripts** - Initialize existing lawyers
4. **Integration testing** - Test all monetization features
5. **Schedule maintenance window** - Communicate with users
6. **Execute production migration** - Follow step-by-step guide above
7. **Monitor for 24 hours** - Watch for errors, performance issues

---

## Support

If migration fails:
1. **Immediately restore from backup**
2. **Check logs**: `npx prisma migrate status`
3. **Review migration file**: `backend/prisma/migrations/.../migration.sql`
4. **Contact team** with error logs

**Estimated Migration Time:**
- Small DB (<1000 records): 2-5 minutes
- Medium DB (1000-10000 records): 5-15 minutes  
- Large DB (>10000 records): 15-30 minutes

**Maintenance Window:** Plan for 1 hour to allow for rollback if needed.
