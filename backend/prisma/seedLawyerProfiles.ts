import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seedLawyerProfiles() {
  console.log('Seeding lawyer profiles...\n');

  const password = await bcrypt.hash('Password123!', 10);

  const lawyersData = [
    {
      email: 'lucy@wakilipro.com',
      firstName: 'Lucy',
      lastName: 'Wanjiku',
      phoneNumber: '+254712345001',
      profile: {
        licenseNumber: 'LSK-2015-001',
        yearOfAdmission: 2015,
        specializations: ['Corporate Law', 'Commercial Law', 'Data Protection'],
        location: JSON.stringify({ city: 'Nairobi', county: 'Nairobi' }),
        bio: 'Experienced corporate lawyer specializing in data protection and commercial law with over 8 years of practice.',
        yearsOfExperience: 8,
        isVerified: true,
        tier: 'PRO' as const,
        rating: 4.9
      }
    },
    {
      email: 'james@wakilipro.com',
      firstName: 'James',
      lastName: 'Mwangi',
      phoneNumber: '+254712345002',
      profile: {
        licenseNumber: 'LSK-2017-002',
        yearOfAdmission: 2017,
        specializations: ['Employment Law', 'Labor Law', 'HR Compliance'],
        location: JSON.stringify({ city: 'Mombasa', county: 'Mombasa' }),
        bio: 'Employment law specialist helping businesses navigate labor regulations and workplace disputes.',
        yearsOfExperience: 6,
        isVerified: true,
        tier: 'LITE' as const,
        rating: 4.8
      }
    },
    {
      email: 'grace@wakilipro.com',
      firstName: 'Grace',
      lastName: 'Njeri',
      phoneNumber: '+254712345003',
      profile: {
        licenseNumber: 'LSK-2016-003',
        yearOfAdmission: 2016,
        specializations: ['Property Law', 'Real Estate', 'Land Law'],
        location: JSON.stringify({ city: 'Nairobi', county: 'Nairobi' }),
        bio: 'Property law expert with extensive experience in real estate transactions and land disputes.',
        yearsOfExperience: 7,
        isVerified: true,
        tier: 'PRO' as const,
        rating: 4.7
      }
    }
  ];

  for (const lawyerData of lawyersData) {
    try {
      // Create or update user
      const user = await prisma.user.upsert({
        where: { email: lawyerData.email },
        update: {
          firstName: lawyerData.firstName,
          lastName: lawyerData.lastName,
          phoneNumber: lawyerData.phoneNumber
        },
        create: {
          email: lawyerData.email,
          password,
          firstName: lawyerData.firstName,
          lastName: lawyerData.lastName,
          role: 'LAWYER',
          phoneNumber: lawyerData.phoneNumber
        }
      });

      // Create or update lawyer profile
      const existing = await prisma.lawyerProfile.findUnique({
        where: { providerId: user.id }
      });

      if (existing) {
        await prisma.lawyerProfile.update({
          where: { providerId: user.id },
          data: lawyerData.profile
        });
      } else {
        await prisma.lawyerProfile.create({
          data: {
            providerId: user.id,
            ...lawyerData.profile
          }
        });
      }

      console.log(`✅ ${lawyerData.firstName} ${lawyerData.lastName} - Profile created`);
    } catch (error) {
      console.error(`❌ Error creating profile for ${lawyerData.email}:`, error);
    }
  }

  console.log('\n✨ Lawyer profiles seeding completed!');
}

seedLawyerProfiles()
  .then(() => prisma.$disconnect())
  .catch((error) => {
    console.error('Seeding error:', error);
    prisma.$disconnect();
    process.exit(1);
  });
