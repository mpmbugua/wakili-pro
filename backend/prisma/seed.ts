import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create admin user
  const adminEmail = 'admin@wakilipro.com';
  const adminPassword = 'Admin@123'; // Change this in production!

  // Check if admin already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail }
  });

  if (existingAdmin) {
    console.log('✅ Admin user already exists:', adminEmail);
    console.log('   Role:', existingAdmin.role);
    return;
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  // Create admin user
  const admin = await prisma.user.create({
    data: {
      email: adminEmail,
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      emailVerified: true,
      phoneNumber: '+254700000000',
      verificationStatus: 'APPROVED'
    }
  });

  console.log('✅ Admin user created successfully!');
  console.log('');
  console.log('📧 Email:', adminEmail);
  console.log('🔑 Password:', adminPassword);
  console.log('👤 Role:', admin.role);
  console.log('');
  console.log('⚠️  IMPORTANT: Change the password after first login!');

  // Optionally create a super admin
  const superAdminEmail = 'superadmin@wakilipro.com';
  const superAdminPassword = 'SuperAdmin@123';

  const existingSuperAdmin = await prisma.user.findUnique({
    where: { email: superAdminEmail }
  });

  if (!existingSuperAdmin) {
    const hashedSuperAdminPassword = await bcrypt.hash(superAdminPassword, 10);

    const superAdmin = await prisma.user.create({
      data: {
        email: superAdminEmail,
        password: hashedSuperAdminPassword,
        firstName: 'Super',
        lastName: 'Admin',
        role: 'SUPER_ADMIN',
        emailVerified: true,
        phoneNumber: '+254700000001',
        verificationStatus: 'APPROVED'
      }
    });

    console.log('✅ Super Admin user created successfully!');
    console.log('');
    console.log('📧 Email:', superAdminEmail);
    console.log('🔑 Password:', superAdminPassword);
    console.log('👤 Role:', superAdmin.role);
    console.log('');
  }

  // Create AI system user for scraped articles
  const systemEmail = 'system@wakilipro.com';
  const existingSystem = await prisma.user.findUnique({
    where: { email: systemEmail }
  });

  if (!existingSystem) {
    const systemUser = await prisma.user.create({
      data: {
        email: systemEmail,
        password: await bcrypt.hash('SystemUser@123', 10),
        firstName: 'AI',
        lastName: 'System',
        role: 'ADMIN',
        emailVerified: true,
        phoneNumber: '+254700000002',
        verificationStatus: 'APPROVED'
      }
    });

    console.log('✅ AI System user created for article scraping!');
    console.log('   ID:', systemUser.id);
    console.log('');
  }

  console.log('🎉 Database seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
