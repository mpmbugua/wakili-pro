import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log('Checking database...\n');
    
    // Check record counts
    const [users, articles, lawyers, consultations, documents] = await Promise.all([
      prisma.user.count(),
      prisma.article.count(),
      prisma.lawyerProfile.count(),
      prisma.consultationBooking.count(),
      prisma.documentTemplate.count(),
    ]);
    
    console.log('Database Record Counts:');
    console.log('======================');
    console.log('Users:', users);
    console.log('Articles:', articles);
    console.log('Lawyer Profiles:', lawyers);
    console.log('Consultations:', consultations);
    console.log('Document Templates:', documents);
    
    // Sample data
    const sampleUsers = await prisma.user.findMany({ 
      take: 5,
      select: { 
        id: true, 
        email: true, 
        role: true, 
        firstName: true, 
        lastName: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log('\nRecent Users:');
    sampleUsers.forEach(u => {
      console.log(`- ${u.firstName} ${u.lastName} (${u.email}) - ${u.role}`);
    });
    
  } catch (error: any) {
    console.error('Database Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
