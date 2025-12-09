  import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    console.log('\n=== Checking Seed Lawyer Users ===\n');
    
    const lawyers = await prisma.user.findMany({
      where: {
        email: {
          in: ['lucy@wakilipro.com', 'james@wakilipro.com', 'grace@wakilipro.com']
        }
      },
      select: {
        id: true,
        email: true,
        phoneNumber: true,
        role: true
      }
    });
    
    console.log('Found users:', JSON.stringify(lawyers, null, 2));
    
    console.log('\n=== Checking Existing LawyerProfiles ===\n');
    
    const profiles = await prisma.lawyerProfile.findMany({
      where: {
        userId: {
          in: lawyers.map(l => l.id)
        }
      },
      select: {
        id: true,
        userId: true,
        providerId: true,
        phoneNumber: true
      }
    });
    
    console.log('Found profiles:', JSON.stringify(profiles, null, 2));
    
    // Try to create one profile manually
    const lucy = lawyers.find(l => l.email === 'lucy@wakilipro.com');
    if (lucy) {
      console.log('\n=== Attempting to create LawyerProfile for Lucy ===\n');
      try {
        const newProfile = await prisma.lawyerProfile.create({
          data: {
            providerId: lucy.id,
            userId: lucy.id,
            licenseNumber: 'LSK-2015-001',
            yearOfAdmission: 2015,
            specializations: ['Corporate Law', 'Commercial Law', 'Data Protection'],
            location: JSON.stringify({ city: 'Nairobi', county: 'Nairobi' }),
            bio: 'Experienced corporate lawyer specializing in data protection.',
            yearsOfExperience: 8,
            isVerified: true,
            tier: 'PRO',
            rating: 4.9,
            reviewCount: 147,
            status: 'ACTIVE',
            linkedInProfile: 'https://linkedin.com/in/lucy-wanjiku',
            phoneNumber: lucy.phoneNumber
          }
        });
        console.log('SUCCESS! Created profile:', newProfile.id);
      } catch (error: any) {
        console.error('FAILED to create profile:', error.message);
        console.error('Error details:', JSON.stringify(error, null, 2));
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
