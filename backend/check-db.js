const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log('Checking database...\n');
    
    const userCount = await prisma.user.count();
    const articleCount = await prisma.article.count();
    const lawyerCount = await prisma.lawyerProfile.count();
    const consultationCount = await prisma.consultation.count();
    const documentCount = await prisma.documentTemplate.count();
    
    console.log('Database Record Counts:');
    console.log('======================');
    console.log('Users:', userCount);
    console.log('Articles:', articleCount);
    console.log('Lawyer Profiles:', lawyerCount);
    console.log('Consultations:', consultationCount);
    console.log('Document Templates:', documentCount);
    
    // Sample some data
    const sampleUsers = await prisma.user.findMany({ 
      take: 3,
      select: { 
        id: true, 
        email: true, 
        role: true, 
        firstName: true, 
        lastName: true 
      }
    });
    
    console.log('\nSample Users:');
    console.log(sampleUsers);
    
  } catch (error) {
    console.error('Database Error:', error.message);
    console.error('Full error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
