import { prisma } from '../src/utils/prisma';

async function main() {
  const templates = [
    {
      type: 'WILL',
      name: 'Last Will and Testament',
      description: 'A legal document to specify how your assets will be distributed after death.',
      template: '',
      priceKES: 1500,
      isActive: true,
      isPublic: true,
      consultationId: 'demo',
      url: '',
    },
    {
      type: 'NDA',
      name: 'Non-Disclosure Agreement',
      description: 'Protect confidential information with this NDA template.',
      template: '',
      priceKES: 1000,
      isActive: true,
      isPublic: true,
      consultationId: 'demo',
      url: '',
    },
    {
      type: 'LEASE_AGREEMENT',
      name: 'Residential Lease Agreement',
      description: 'A contract for renting residential property.',
      template: '',
      priceKES: 2000,
      isActive: true,
      isPublic: true,
      consultationId: 'demo',
      url: '',
    },
    {
      type: 'EMPLOYMENT_CONTRACT',
      name: 'Employment Contract',
      description: 'A contract outlining terms of employment.',
      template: '',
      priceKES: 2500,
      isActive: true,
      isPublic: true,
      consultationId: 'demo',
      url: '',
    },
    {
      type: 'SERVICE_AGREEMENT',
      name: 'General Service Agreement',
      description: 'A template for a general service contract.',
      template: '',
      priceKES: 1800,
      isActive: true,
      isPublic: true,
      consultationId: 'demo',
      url: '',
    },
    {
      type: 'LOAN_AGREEMENT',
      name: 'Loan Agreement',
      description: 'A contract for lending money between two parties.',
      template: '',
      priceKES: 2200,
      isActive: true,
      isPublic: true,
      consultationId: 'demo',
      url: '',
    },
    {
      type: 'POWER_OF_ATTORNEY',
      name: 'Power of Attorney',
      description: 'A document granting authority to act on someone else’s behalf.',
      template: '',
      priceKES: 1700,
      isActive: true,
      isPublic: true,
      consultationId: 'demo',
      url: '',
    },
    {
      type: 'SHAREHOLDER_AGREEMENT',
      name: 'Shareholder Agreement',
      description: 'A contract among a company’s shareholders.',
      template: '',
      priceKES: 2600,
      isActive: true,
      isPublic: true,
      consultationId: 'demo',
      url: '',
    }
  ];

  for (const t of templates) {
    await prisma.documentTemplate.create({
      data: t
    });
  }

  console.log('Seeded document templates!');
}

main()
  .then(() => {
    console.log('✅ seedDocumentTemplates.ts completed successfully.');
  })
  .catch((e) => {
    console.error('❌ seedDocumentTemplates.ts failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
