# Database Migration Execution Guide - Render Production

## 🎯 You're about to migrate the Render production database

**Database**: `wakiliprodb` on Render PostgreSQL  
**Connection**: dpg-d4bi7bqli9vc73dgc4j0-a.oregon-postgres.render.com

---

## ✅ **Step-by-Step Migration Process**

### **Step 1: Execute Enum Fix SQL (REQUIRED FIRST)**

You have **3 options** to run the SQL script:

#### **Option A: Using psql Command Line (Fastest)**

```powershell
# From your local machine
$env:PGPASSWORD="eLJ8egjayfc1DswG7ubTVRpWpkIT3shU"
psql -h dpg-d4bi7bqli9vc73dgc4j0-a.oregon-postgres.render.com -U wakiliprodb_user -d wakiliprodb -f "d:\wakili-pro-dev\backend\scripts\fix-render-enums.sql"
```

#### **Option B: Using Render Dashboard Web Shell**

1. Go to: https://dashboard.render.com/
2. Navigate to your PostgreSQL database
3. Click "Connect" → "Web Shell"
4. Copy and paste the contents of `backend/scripts/fix-render-enums.sql`
5. Execute

#### **Option C: Using pgAdmin or DBeaver**

1. Connect to Render database:
   - **Host**: dpg-d4bi7bqli9vc73dgc4j0-a.oregon-postgres.render.com
   - **Port**: 5432
   - **Database**: wakiliprodb
   - **User**: wakiliprodb_user
   - **Password**: eLJ8egjayfc1DswG7ubTVRpWpkIT3shU

2. Open `backend/scripts/fix-render-enums.sql`
3. Execute the script

---

### **Step 2: Apply Prisma Migrations**

After SQL script succeeds:

```powershell
cd d:\wakili-pro-dev\backend
npx prisma migrate deploy
```

**Expected Output:**
```
Applying migration `20251123XXXXXX_add_oauth_fields`
✓ Applied 1 migration in XXXms
```

---

### **Step 3: Generate Prisma Client**

```powershell
npx prisma generate
```

**Expected Output:**
```
✔ Generated Prisma Client
```

---

### **Step 4: Rebuild Backend**

```powershell
npm run build
```

**Expected Output:**
```
Build complete. Dist folder: EXISTS
index.js found!
```

---

### **Step 5: Verify Migration**

```powershell
# Check migration status
npx prisma migrate status
```

**Expected Output:**
```
Database schema is up to date!
```

---

## 🔍 **Post-Migration Verification**

Run these queries to verify everything worked:

```sql
-- 1. Check PaymentStatus enum values
SELECT enumlabel FROM pg_enum 
WHERE enumtypid = 'PaymentStatus'::regtype
ORDER BY enumlabel;
-- Should show: FAILED, PAID, PENDING, REFUNDED

-- 2. Check User table has OAuth fields
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'User' 
AND column_name IN ('googleId', 'facebookId', 'appleId', 'provider', 'avatar');
-- Should return: 5 rows

-- 3. Check if password is nullable
SELECT is_nullable FROM information_schema.columns 
WHERE table_name = 'User' AND column_name = 'password';
-- Should return: YES

-- 4. Count records by payment status
SELECT "paymentStatus", COUNT(*) 
FROM "ServiceBooking" 
GROUP BY "paymentStatus";
-- Should NOT show COMPLETED or CANCELLED
```

---

## ⚠️ **Troubleshooting**

### **Issue: "Enum value already exists"**
✅ Safe to ignore - Script handles this

### **Issue: "Migration already applied"**
```powershell
npx prisma migrate resolve --applied "migration_name"
```

### **Issue: "Transaction aborted"**
- Check if SQL script completed successfully
- Verify no COMPLETED/CANCELLED values remain
- Try running SQL script again

### **Issue: Connection refused**
- Check Render database is running
- Verify credentials in `.env` match Render dashboard
- Check if IP is whitelisted (Render allows all by default)

---

## 📊 **What This Migration Does**

### **Enum Fixes:**
- Adds `PAID` and `REFUNDED` to PaymentStatus enum
- Migrates old data: `COMPLETED` → `PAID`, `CANCELLED` → `REFUNDED`

### **OAuth Fields Added to User Table:**
```sql
ALTER TABLE "User" 
  ADD COLUMN "googleId" TEXT UNIQUE,
  ADD COLUMN "facebookId" TEXT UNIQUE,
  ADD COLUMN "appleId" TEXT UNIQUE,
  ADD COLUMN "provider" TEXT,
  ADD COLUMN "avatar" TEXT,
  ALTER COLUMN "password" DROP NOT NULL;
```

### **Schema Already Has (From Previous Migrations):**
- ✅ LawyerTier enum (FREE, LITE, PRO)
- ✅ DocumentTier enum (BASIC, FILLED, CERTIFIED)
- ✅ Subscription table
- ✅ MonthlyWHTReport table
- ✅ Extended LawyerProfile fields
- ✅ Extended DocumentPurchase fields

---

## ✅ **Success Checklist**

After migration completes:

- [ ] SQL script executed without errors
- [ ] `npx prisma migrate deploy` succeeded
- [ ] `npx prisma generate` succeeded
- [ ] Backend builds successfully
- [ ] PaymentStatus enum has PAID/REFUNDED (not COMPLETED/CANCELLED)
- [ ] User table has googleId, facebookId, appleId columns
- [ ] User.password is nullable
- [ ] Google OAuth login works
- [ ] Facebook OAuth login works
- [ ] Existing email/password login still works

---

## 🚀 **After Migration**

Your application will have:
- ✅ Google OAuth fully functional
- ✅ Facebook OAuth fully functional
- ✅ Monetization schema ready
- ✅ M-Pesa payments configured
- ✅ All features ready for E2E testing

**Ready to execute? Start with Step 1 above!**
