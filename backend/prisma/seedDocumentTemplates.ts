import { prisma } from '../src/utils/prisma';

async function main() {
  const templates = [
    {
      name: 'Last Will and Testament',
      description: 'A legal document to specify how your assets will be distributed after death.',
      content: 'Sample content for Last Will and Testament.',
      isActive: true
    },
    {
      name: 'Non-Disclosure Agreement',
      description: 'Protect confidential information with this NDA template.',
      content: 'Sample content for NDA.',
      isActive: true
    },
    {
      name: 'Residential Lease Agreement',
      description: 'A contract for renting residential property.',
      content: 'Sample content for Lease Agreement.',
      isActive: true
    },
    {
      name: 'Employment Contract',
      description: 'A contract outlining terms of employment.',
      content: 'Sample content for Employment Contract.',
      isActive: true
    },
    {
      name: 'General Service Agreement',
      description: 'A template for a general service contract.',
      content: 'Sample content for Service Agreement.',
      isActive: true
    },
    {
      name: 'Loan Agreement',
      description: 'A contract for lending money between two parties.',
      content: 'Sample content for Loan Agreement.',
      isActive: true
    },
  ];
      name: 'Power of Attorney',
      description: 'A document granting authority to act on someone else’s behalf.',
      content: '',
      isActive: true
    },
    {
      name: 'Shareholder Agreement',
      description: 'A contract among a company’s shareholders.',
      content: '',
      isActive: true
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
