# Database Seeding

This seed script creates admin users for testing and development purposes.

## What Gets Created

### 1. Admin User
- **Email**: `admin@wakilipro.com`
- **Password**: `Admin@123`
- **Role**: `ADMIN`
- **Access**: Admin dashboard at `/admin`

### 2. Super Admin User
- **Email**: `superadmin@wakilipro.com`
- **Password**: `SuperAdmin@123`
- **Role**: `SUPER_ADMIN`
- **Access**: Full system access including `/admin`

### 3. AI System User
- **Email**: `system@wakilipro.com`
- **Role**: `ADMIN`
- **Purpose**: Used as authorId for AI-scraped articles

## How to Run

### Option 1: Using npm script
```bash
cd backend
npm run seed
```

### Option 2: Using Prisma CLI
```bash
cd backend
npx prisma db seed
```

### Option 3: Direct execution
```bash
cd backend
npx ts-node prisma/seed.ts
```

## After Seeding

1. **Login to Admin Dashboard**:
   - Go to: `http://localhost:3000/login` (or your deployed URL)
   - Email: `admin@wakilipro.com`
   - Password: `Admin@123`

2. **Access Admin Pages**:
   - Main Dashboard: `/admin`
   - Article Management: `/admin/articles`

3. **⚠️ IMPORTANT**: 
   - Change the default passwords immediately after first login
   - These default credentials should NEVER be used in production
   - Add proper password change functionality in production

## Re-running the Script

The script is idempotent - it checks if users already exist before creating them. You can safely run it multiple times.

## Production Deployment

For production:
1. DO NOT use these default passwords
2. Create admin users manually with strong passwords
3. Or use environment variables for admin credentials:
   ```
   ADMIN_EMAIL=your-admin@email.com
   ADMIN_PASSWORD=your-strong-password
   ```

## Troubleshooting

If seeding fails:
1. Check database connection: `npx prisma db push`
2. Verify migrations are up to date: `npx prisma migrate deploy`
3. Check if bcrypt is installed: `npm list bcrypt`
