import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create Super Admin user
  const superAdminEmail = 'superadmin@wakilipro.com';
  const superAdminPassword = 'SuperAdmin@123'; // Change this in production!

  const existingSuperAdmin = await prisma.user.findUnique({
    where: { email: superAdminEmail }
  });

  if (!existingSuperAdmin) {
    const hashedPassword = await bcrypt.hash(superAdminPassword, 10);

    const superAdmin = await prisma.user.create({
      data: {
        email: superAdminEmail,
        password: hashedPassword,
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
  } else {
    console.log('✅ Super Admin user already exists:', superAdminEmail);
  }

  // Create Admin user
  const adminEmail = 'admin@wakilipro.com';
  const adminPassword = 'Admin@123'; // Change this in production!

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail }
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

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
    console.log('⚠️  IMPORTANT: Change the passwords after first login!');
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
        }
      });

      // Create lawyer profile separately with correct providerId
      await prisma.lawyerProfile.create({
        data: {
          userId: lawyer.id,
          providerId: lawyer.id,
          licenseNumber: lawyerData.licenseNumber,
          yearOfAdmission: lawyerData.yearOfAdmission,
          specializations: [lawyerData.specialty],
          location: lawyerData.location,
          isVerified: true,
          rating: 4.8,
          reviewCount: 0,
        }
      });

      console.log(`✅ Created lawyer: ${lawyer.firstName} ${lawyer.lastName} (${lawyer.id})`);
    } else {
      console.log(`✅ Lawyer already exists: ${lawyerData.email}`);
    }
  }

  // Create emergency contacts
  console.log('\n📞 Creating emergency contacts...');
  
  const emergencyContacts = [
    { phoneNumber: '0727114573', label: 'PRIMARY', displayOrder: 1 },
    { phoneNumber: '0787679378', label: 'SECONDARY', displayOrder: 2 }
  ];

  for (const contact of emergencyContacts) {
    const existing = await prisma.emergencyContact.findFirst({
      where: { phoneNumber: contact.phoneNumber }
    });
    
    if (!existing) {
      await prisma.emergencyContact.create({
        data: contact
      });
      console.log(`✅ Created emergency contact: ${contact.phoneNumber} (${contact.label})`);
    } else {
      console.log(`✅ Emergency contact exists: ${contact.phoneNumber}`);
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
