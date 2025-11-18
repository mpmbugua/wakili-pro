import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Passwords for demo/testing
  const password = await bcrypt.hash('Password123!', 10);

  try {
    console.log('Seeding admin user...');
    await prisma.user.upsert({
      where: { email: 'admin@wakili.com' },
      update: {},
      create: {
        email: 'admin@wakili.com',
        password,
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN',
      },
    });
    console.log('Admin user seeded.');
  } catch (err) {
    console.error('Error seeding admin user:', err);
  }

  try {
    console.log('Seeding lawyer user...');
    await prisma.user.upsert({
      where: { email: 'lawyer@wakili.com' },
      update: {},
      create: {
        email: 'lawyer@wakili.com',
        password,
        firstName: 'Lawyer',
        lastName: 'User',
        role: 'LAWYER',
      },
    });
    console.log('Lawyer user seeded.');
  } catch (err) {
    console.error('Error seeding lawyer user:', err);
  }

  try {
    console.log('Seeding regular user...');
    await prisma.user.upsert({
      where: { email: 'user@wakili.com' },
      update: {},
      create: {
        email: 'user@wakili.com',
        password,
        firstName: 'Regular',
        lastName: 'User',
        role: 'PUBLIC',
      },
    });
    console.log('Regular user seeded.');
  } catch (err) {
    console.error('Error seeding regular user:', err);
  }

  console.log('Seeding complete.');
}

main()
  .then(() => {
    console.log('✅ seedUsers.ts completed successfully.');
  })
  .catch((e) => {
    console.error('❌ seedUsers.ts failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
