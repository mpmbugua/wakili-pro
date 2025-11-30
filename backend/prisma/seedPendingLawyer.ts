import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Creating pending lawyer for testing...');

  const pendingLawyerEmail = 'pending.lawyer@test.com';
  
  // Check if already exists
  const existing = await prisma.user.findUnique({
    where: { email: pendingLawyerEmail }
  });

  if (existing) {
    console.log('✅ Pending lawyer already exists:', pendingLawyerEmail);
    return;
  }

  const hashedPassword = await bcrypt.hash('Lawyer@123', 10);
  
  // Create user
  const lawyer = await prisma.user.create({
    data: {
      email: pendingLawyerEmail,
      password: hashedPassword,
      firstName: 'Pending',
      lastName: 'Lawyer',
      phoneNumber: '+254712345999',
      role: 'LAWYER',
      emailVerified: true,
      verificationStatus: 'PENDING', // Important: This is PENDING
    }
  });

  // Create lawyer profile (NOT verified)
  await prisma.lawyerProfile.create({
    data: {
      userId: lawyer.id,
      providerId: lawyer.id,
      licenseNumber: 'LSK-2024-999',
      yearOfAdmission: 2024,
      specializations: ['CORPORATE', 'PROPERTY'],
      location: JSON.stringify({
        latitude: -1.286389,
        longitude: 36.817223,
        address: '123 Test Street, Westlands',
        city: 'Nairobi',
        county: 'Nairobi'
      }),
      bio: 'Experienced corporate and property lawyer with expertise in commercial transactions, real estate law, and business advisory services. Dedicated to providing top-tier legal solutions.',
      yearsOfExperience: 5,
      hourlyRate: 5000,
      offPeakHourlyRate: 3500,
      isVerified: false, // NOT VERIFIED - This is the key!
      rating: 0,
      reviewCount: 0,
      tier: 'FREE'
    }
  });

  console.log('✅ Pending lawyer created successfully!');
  console.log('');
  console.log('📧 Email:', pendingLawyerEmail);
  console.log('🔑 Password: Lawyer@123');
  console.log('👤 Status: PENDING (not verified)');
  console.log('');
  console.log('🎯 This lawyer will appear in the Admin Pending Lawyers list');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding pending lawyer:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
