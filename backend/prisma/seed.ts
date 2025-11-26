import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
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

  // Seed sample document templates
  console.log('📄 Seeding document templates...');
  
  const documentTemplates = [
    {
      name: 'Employment Contract',
      type: 'CONTRACT',
      description: 'Standard employment contract template for Kenyan businesses',
      template: 'Employment contract template content',
      priceKES: 2500,
      isActive: true,
      isPublic: true,
      url: '/templates/employment-contract',
      consultationId: nanoid()
    },
    {
      name: 'Non-Disclosure Agreement (NDA)',
      type: 'AGREEMENT',
      description: 'Confidentiality agreement to protect sensitive business information',
      template: 'NDA template content',
      priceKES: 1500,
      isActive: true,
      isPublic: true,
      url: '/templates/nda',
      consultationId: nanoid()
    },
    {
      name: 'Lease Agreement',
      type: 'AGREEMENT',
      description: 'Residential or commercial property lease agreement',
      template: 'Lease agreement template content',
      priceKES: 3000,
      isActive: true,
      isPublic: true,
      url: '/templates/lease-agreement',
      consultationId: nanoid()
    },
    {
      name: 'Power of Attorney',
      type: 'LEGAL_DOCUMENT',
      description: 'General or special power of attorney document',
      template: 'Power of attorney template content',
      priceKES: 2000,
      isActive: true,
      isPublic: true,
      url: '/templates/power-of-attorney',
      consultationId: nanoid()
    },
    {
      name: 'Business Partnership Agreement',
      type: 'AGREEMENT',
      description: 'Partnership agreement for business ventures',
      template: 'Partnership agreement template content',
      priceKES: 4000,
      isActive: true,
      isPublic: true,
      url: '/templates/partnership-agreement',
      consultationId: nanoid()
    },
    {
      name: 'Will and Testament',
      type: 'LEGAL_DOCUMENT',
      description: 'Last will and testament document',
      template: 'Will template content',
      priceKES: 3500,
      isActive: true,
      isPublic: true,
      url: '/templates/will',
      consultationId: nanoid()
    }
  ];

  for (const template of documentTemplates) {
    const existing = await prisma.documentTemplate.findFirst({
      where: { name: template.name }
    });

    if (!existing) {
      await prisma.documentTemplate.create({
        data: {
          id: nanoid(),
          ...template
        }
      });
      console.log(`   ✅ Created template: ${template.name}`);
    }
  }

  console.log('');
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
