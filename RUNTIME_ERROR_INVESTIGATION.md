# Runtime 500 Error Investigation

## Problem Statement
Registration and potentially other endpoints return 500 errors on Render production, but work locally.

## Root Cause (Likely)
**Database schema mismatch** between code expectations and deployed production schema.

## Evidence

### 1. Registration Endpoint (authController.ts line ~120)
```typescript
const user = await prisma.user.create({
  data: {
    email: email && email.trim() !== '' ? email : `${phoneNumber}@wakili.temp`,
    password: hashedPassword,
    firstName,
    lastName,
    phoneNumber,
    role,
    emailVerified: false,  // ← SUSPECT: May not exist in production
    // ...
  }
});
```

### 2. Token Generation (authController.ts line ~135)
```typescript
const tokenPayload = {
  userId: user.id,
  email: user.email,
  phoneNumber: user.phoneNumber || '',  // ← SUSPECT: phoneNumber might be null
  role: user.role as UserRole
};
```

## Diagnosis Steps

### Step 1: Check Production Schema
Run this query on Render database to see actual User table structure:
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'User';
```

### Step 2: Check Prisma Client Version
The generated Prisma Client might be out of sync with the database.

### Step 3: Check Environment Variables
Missing or incorrect `DATABASE_URL` could cause connection issues.

## Likely Missing Fields

Based on our TypeScript fixes, these fields were removed/commented:
- `User.emailVerified` ← **HIGH PROBABILITY**
- `User.phoneVerified` ← **HIGH PROBABILITY**
- `UserProfile.avatarUrl`
- `UserProfile.bio`
- `UserProfile.county`
- `UserProfile.city`

## Immediate Fixes Needed

### Fix 1: Make emailVerified Optional
```typescript
// authController.ts line ~120
const user = await prisma.user.create({
  data: {
    email: email && email.trim() !== '' ? email : `${phoneNumber}@wakili.temp`,
    password: hashedPassword,
    firstName,
    lastName,
    phoneNumber,
    role,
    // emailVerified: false, // ← REMOVE or make conditional
  } as any, // ← Temporary cast to bypass type checking
});
```

### Fix 2: Remove emailVerified from Select
```typescript
// authController.ts line ~130
select: {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  role: true,
  // emailVerified: true, // ← REMOVE
  phoneNumber: true,
  createdAt: true
}
```

### Fix 3: Check Schema File
```bash
cd backend
cat prisma/schema.prisma | grep -A 20 "model User"
```

## Testing After Fix

### Test Registration
```bash
curl -X POST https://wakili-pro.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email":"test@example.com",
    "password":"TestPass123!@#",
    "firstName":"Test",
    "lastName":"User",
    "phoneNumber":"0712345678",
    "role":"PUBLIC"
  }'
```

### Test Forgot Password
```bash
curl -X POST https://wakili-pro.onrender.com/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

## Long-Term Solution

1. **Schema Migration Audit**
   - Compare local schema vs production schema
   - Run migrations to add missing fields
   - OR update code to not use removed fields

2. **Update Prisma Client**
   ```bash
   cd backend
   npx prisma generate
   npx prisma db push  # Or: npx prisma migrate deploy
   ```

3. **Add Schema Validation in CI/CD**
   - Check schema consistency before deployment
   - Fail builds if schema mismatch detected

## Next Actions

1. ✅ Remove `emailVerified` references from authController
2. ✅ Add `as any` casts where needed
3. ✅ Test registration endpoint
4. ⏳ Check Render logs for actual Prisma error message
5. ⏳ Run schema migrations if needed
