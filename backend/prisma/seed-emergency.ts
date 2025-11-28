import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('📞 Creating emergency contacts...');
  
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

  console.log('\n✅ Emergency contacts seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding emergency contacts:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
