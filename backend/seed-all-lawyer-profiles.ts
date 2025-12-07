import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedLawyerProfiles() {
  try {
    console.log('\n=== Seeding LawyerProfiles for All Lawyers ===\n');
    
    const lawyers = [
      {
        email: 'lucy@wakilipro.com',
        license: 'LSK-2015-001',
        year: 2015,
        specializations: ['Corporate Law', 'Commercial Law', 'Data Protection'],
        location: { city: 'Nairobi', county: 'Nairobi' },
        bio: 'Experienced corporate lawyer specializing in data protection and commercial law with over 8 years of practice.',
        experience: 8,
        tier: 'PRO' as const,
        rating: 4.9,
        reviewCount: 147,
        linkedin: 'https://linkedin.com/in/lucy-wanjiku'
      },
      {
        email: 'james@wakilipro.com',
        license: 'LSK-2017-002',
        year: 2017,
        specializations: ['Employment Law', 'Labor Law', 'HR Compliance'],
        location: { city: 'Mombasa', county: 'Mombasa' },
        bio: 'Employment law specialist helping businesses navigate labor regulations and workplace disputes.',
        experience: 6,
        tier: 'LITE' as const,
        rating: 4.8,
        reviewCount: 112,
        linkedin: 'https://linkedin.com/in/james-mwangi'
      },
      {
        email: 'grace@wakilipro.com',
        license: 'LSK-2016-003',
        year: 2016,
        specializations: ['Property Law', 'Real Estate', 'Land Law'],
        location: { city: 'Nairobi', county: 'Nairobi' },
        bio: 'Property law expert with extensive experience in real estate transactions and land disputes.',
        experience: 7,
        tier: 'PRO' as const,
        rating: 4.7,
        reviewCount: 128,
        linkedin: 'https://linkedin.com/in/grace-njeri'
      }
    ];
    
    for (const lawyerData of lawyers) {
      const user = await prisma.user.findUnique({
        where: { email: lawyerData.email }
      });
      
      if (!user) {
        console.log(`❌ User not found: ${lawyerData.email}`);
        continue;
      }
      
      // Check if profile already exists
      const existing = await prisma.lawyerProfile.findUnique({
        where: { userId: user.id }
      });
      
      if (existing) {
        console.log(`ℹ️  Profile already exists for ${lawyerData.email}`);
        continue;
      }
      
      // Create profile
      try {
        const profile = await prisma.lawyerProfile.create({
          data: {
            providerId: user.id,
            userId: user.id,
            licenseNumber: lawyerData.license,
            yearOfAdmission: lawyerData.year,
            specializations: lawyerData.specializations,
            location: JSON.stringify(lawyerData.location),
            bio: lawyerData.bio,
            yearsOfExperience: lawyerData.experience,
            isVerified: true,
            tier: lawyerData.tier,
            rating: lawyerData.rating,
            reviewCount: lawyerData.reviewCount,
            status: 'ACTIVE',
            linkedInProfile: lawyerData.linkedin,
            phoneNumber: user.phoneNumber
          }
        });
        console.log(`✅ Created LawyerProfile for ${lawyerData.email} (ID: ${profile.id})`);
      } catch (error: any) {
        console.error(`❌ Failed to create profile for ${lawyerData.email}:`, error.message);
      }
    }
    
    console.log('\n=== Verifying Final Count ===\n');
    const count = await prisma.lawyerProfile.count({
      where: { isVerified: true }
    });
    console.log(`Total verified LawyerProfiles: ${count}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedLawyerProfiles();
