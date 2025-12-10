# Schema Mismatch Fixes - Production Database

## Problem
Production database is missing several fields that exist in local `schema.prisma`. Code references these fields causing Prisma errors and 500 responses.

## Fields Missing in Production

### User Model
- ❌ `emailVerified: Boolean` - **FIXED** (authController.ts)
- ❌ `phoneVerified: Boolean` - **FIXED** (userController.ts)
- ❌ `hasUsedFirstConsultDiscount: Boolean` - **FIXED** (consultationBookingService.ts)

### LawyerProfile Model
- ❌ `allowsFirstConsultDiscount: Boolean` - **FIXING NOW**
  - Error: `The column LawyerProfile.allowsFirstConsultDiscount does not exist`
  - Affects: Lawyer search endpoint, consultation booking

### UserProfile Model (Previously Fixed)
- ❌ `avatarUrl: String`
- ❌ `bio: String`
- ❌ `county: String`
- ❌ `city: String`

## Root Cause
Local `schema.prisma` contains fields that were never migrated to production database. When Prisma tries to SELECT these fields, PostgreSQL throws P2022 errors.

## Solution Strategy

### Option 1: Use Explicit SELECT (Recommended for Production)
Comment out non-existent fields in queries:
```typescript
const lawyers = await prisma.lawyerProfile.findMany({
  select: {
    id: true,
    userId: true,
    licenseNumber: true,
    // allowsFirstConsultDiscount: true, // ❌ Doesn't exist in production
    user: { select: { firstName: true, lastName: true } }
  }
});
```

### Option 2: Database Migration (Long-term Fix)
```sql
ALTER TABLE "LawyerProfile" ADD COLUMN "allowsFirstConsultDiscount" BOOLEAN DEFAULT true;
ALTER TABLE "User" ADD COLUMN "emailVerified" BOOLEAN DEFAULT false;
ALTER TABLE "User" ADD COLUMN "hasUsedFirstConsultDiscount" BOOLEAN DEFAULT false;
```

## Fixes Applied

### 1. authController.ts (Commit 1e4e815)
**Issue**: Registration 500 error  
**Cause**: `User.emailVerified` doesn't exist  
**Fix**: Commented out all 7 references to emailVerified
```typescript
// emailVerified: false, // Field doesn't exist in production
```

### 2. consultationBookingService.ts (This Commit)
**Issue**: First consultation discount logic failing  
**Cause**: `User.hasUsedFirstConsultDiscount` and `LawyerProfile.allowsFirstConsultDiscount` don't exist  
**Fix**: Disabled entire first consultation discount feature
```typescript
// DISABLED: Fields don't exist in production database
// const clientUser = await prisma.user.findUnique({
//   select: { hasUsedFirstConsultDiscount: true }
// });
```

### 3. lawyerController.ts (This Commit)
**Issue**: Lawyer search 500 error  
**Cause**: `include` clause tries to SELECT all LawyerProfile fields including non-existent ones  
**Fix**: Changed `include` to explicit `select` with commented field
```typescript
select: {
  id: true,
  licenseNumber: true,
  // allowsFirstConsultDiscount: true, // Field doesn't exist
  user: { ... }
}
```

## Files Modified
- ✅ `backend/src/controllers/authController.ts` (emailVerified)
- ✅ `backend/src/services/consultationBookingService.ts` (discount feature)
- ✅ `backend/src/controllers/lawyerController.ts` (lawyer search)

## Testing Checklist

### After Deployment:
- [ ] POST /api/auth/register (should work - emailVerified fixed)
- [ ] POST /api/auth/login (should work)
- [ ] GET /api/lawyers (should work - allowsFirstConsultDiscount fixed)
- [ ] POST /api/consultations/book (should work - discount disabled)

### Expected Behavior:
- ✅ Registration creates users successfully
- ✅ Login returns JWT tokens
- ✅ Lawyer search returns profiles
- ✅ Consultation booking works (without discount)
- ❌ First consultation discount: DISABLED (fields missing)

## Future Work

### Short-term (Next Deployment):
1. Audit all LawyerProfile queries for `include` vs `select`
2. Add explicit `select` to prevent implicit field selection
3. Test all lawyer-related endpoints

### Long-term (Next Sprint):
1. Run Prisma migration to add missing fields
2. Re-enable first consultation discount feature
3. Add schema validation to CI/CD pipeline
4. Document schema change procedure

## Schema Audit Required

High-risk queries using `include` (implicit SELECT ALL):
```
❓ serviceRequestController.ts - line 135 (matchedLawyers)
❓ admin/lawyerAdminController.ts - line 62 (pendingLawyers)
❓ admin/lawyerAdminController.ts - line 106 (verifiedLawyers)
```

These queries may fail if they implicitly select `allowsFirstConsultDiscount`.

## Prevention Strategy

### For Developers:
1. **Always use explicit `select`** instead of `include` when possible
2. **Test against production database** before deploying
3. **Check schema.prisma** matches production before referencing new fields
4. **Add database migrations** for new fields before using them

### For CI/CD:
```bash
# Add to build pipeline
npx prisma validate
npx prisma migrate status
```

## Related Issues
- Similar to `emailVerified` issue (commit 1e4e815)
- Same root cause: Schema drift between local and production
- Pattern: Local features ahead of production migrations

## Deployment Timeline
- **Commit 1e4e815**: Fixed emailVerified (Dec 9, 2025 @ 19:00)
- **This Commit**: Fixed allowsFirstConsultDiscount (Dec 9, 2025 @ 19:30)
- **Next**: Full schema audit and remaining fixes
