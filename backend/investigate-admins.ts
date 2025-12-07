import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function investigateAdmins() {
  try {
    console.log('\n=== Investigating Admin Users ===\n');
    
    // Check for admin@wakilipro.com
    const wakilipro = await prisma.user.findUnique({
      where: { email: 'admin@wakilipro.com' }
    });
    
    console.log('admin@wakilipro.com:', wakilipro ? '✅ EXISTS' : '❌ NOT FOUND');
    if (wakilipro) {
      console.log('   Name:', wakilipro.firstName, wakilipro.lastName);
      console.log('   Role:', wakilipro.role);
      console.log('   Created:', wakilipro.createdAt);
    }
    
    // Check for admin@wakili.com
    const wakili = await prisma.user.findUnique({
      where: { email: 'admin@wakili.com' }
    });
    
    console.log('\nadmin@wakili.com:', wakili ? '✅ EXISTS' : '❌ NOT FOUND');
    if (wakili) {
      console.log('   Name:', wakili.firstName, wakili.lastName);
      console.log('   Role:', wakili.role);
      console.log('   Created:', wakili.createdAt);
    }
    
    // Get all users with ADMIN role
    console.log('\n=== All ADMIN/SUPER_ADMIN Users ===\n');
    const admins = await prisma.user.findMany({
      where: {
        OR: [
          { role: 'ADMIN' },
          { role: 'SUPER_ADMIN' }
        ]
      },
      orderBy: {
        createdAt: 'asc'
      }
    });
    
    admins.forEach(admin => {
      console.log(`${admin.role}: ${admin.firstName} ${admin.lastName}`);
      console.log(`   Email: ${admin.email}`);
      console.log(`   Created: ${admin.createdAt}`);
      console.log('');
    });
    
    console.log(`Total ADMIN users: ${admins.length}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

investigateAdmins();
