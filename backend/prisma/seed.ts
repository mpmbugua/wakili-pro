import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';

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

  if (!existingAdmin) {
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
  } else {
    console.log('✅ Admin user already exists:', adminEmail);
  }

  // Create sample lawyers for testing
  console.log('\n🧑‍⚖️ Creating sample lawyers...');
  
  const lawyersData = [
    {
      email: 'jane.wanjiru@lawyer.com',
      firstName: 'Jane',
      lastName: 'Wanjiru',
      phoneNumber: '+254712345001',
      specialty: 'EMPLOYMENT',
      licenseNumber: 'LSK-2010-001',
      yearOfAdmission: 2010,
      location: 'Nairobi',
    },
    {
      email: 'david.kamau@lawyer.com',
      firstName: 'David',
      lastName: 'Kamau',
      phoneNumber: '+254712345002',
      specialty: 'PROPERTY',
      licenseNumber: 'LSK-2007-002',
      yearOfAdmission: 2007,
      location: 'Nairobi',
    },
    {
      email: 'sarah.ochieng@lawyer.com',
      firstName: 'Sarah',
      lastName: 'Ochieng',
      phoneNumber: '+254712345003',
      specialty: 'FAMILY',
      licenseNumber: 'LSK-2012-003',
      yearOfAdmission: 2012,
      location: 'Mombasa',
    }
  ];

  for (const lawyerData of lawyersData) {
    const existingLawyer = await prisma.user.findUnique({
      where: { email: lawyerData.email }
    });

    if (!existingLawyer) {
      const hashedPassword = await bcrypt.hash('Lawyer@123', 10);
      
      const lawyer = await prisma.user.create({
        data: {
          email: lawyerData.email,
          password: hashedPassword,
          firstName: lawyerData.firstName,
          lastName: lawyerData.lastName,
          phoneNumber: lawyerData.phoneNumber,
          role: 'LAWYER',
          emailVerified: true,
          verificationStatus: 'APPROVED',
          lawyerProfile: {
            create: {
              providerId: '', // Will be set to the user's ID after creation
              licenseNumber: lawyerData.licenseNumber,
              yearOfAdmission: lawyerData.yearOfAdmission,
              specializations: [lawyerData.specialty],
              location: lawyerData.location,
              isVerified: true,
              rating: 4.8,
              reviewCount: 0,
            }
          }
        }
      });

      // Update providerId to match userId
      await prisma.lawyerProfile.update({
        where: { userId: lawyer.id },
        data: { providerId: lawyer.id }
      });

      console.log(`✅ Created lawyer: ${lawyer.firstName} ${lawyer.lastName} (${lawyer.id})`);
    } else {
      console.log(`✅ Lawyer already exists: ${lawyerData.email}`);
    }
  }

  console.log('\n✅ Database seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
