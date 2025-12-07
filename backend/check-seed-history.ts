import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkSeedHistory() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'asc' },
    select: {
      email: true,
      role: true,
      createdAt: true,
      firstName: true,
      lastName: true
    }
  });
  
  console.log('\n=== Users in Order of Creation ===\n');
  users.forEach((u, i) => {
    console.log(`${i + 1}. ${u.email} (${u.role})`);
    console.log(`   Created: ${u.createdAt}`);
  });
  
  await prisma.$disconnect();
}

checkSeedHistory();
