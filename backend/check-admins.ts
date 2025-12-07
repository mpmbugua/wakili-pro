import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAdmins() {
  try {
    console.log('\n=== Checking for Admin Users ===\n');
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });
    
    console.log(`Total users in database: ${users.length}\n`);
    
    const adminUsers = users.filter(u => u.role === 'ADMIN' || u.role === 'SUPER_ADMIN');
    const lawyerUsers = users.filter(u => u.role === 'LAWYER');
    const publicUsers = users.filter(u => u.role === 'PUBLIC' || u.role === 'CLIENT');
    const otherUsers = users.filter(u => !['ADMIN', 'SUPER_ADMIN', 'LAWYER', 'PUBLIC', 'CLIENT'].includes(u.role));
    
    console.log('=== Users by Role ===\n');
    console.log(`ADMIN/SUPER_ADMIN: ${adminUsers.length}`);
    console.log(`LAWYER: ${lawyerUsers.length}`);
    console.log(`PUBLIC/CLIENT: ${publicUsers.length}`);
    console.log(`OTHER: ${otherUsers.length}\n`);
    
    if (adminUsers.length > 0) {
      console.log('=== Admin Users ===\n');
      adminUsers.forEach(u => {
        console.log(`✅ ${u.role}: ${u.firstName} ${u.lastName} (${u.email})`);
        console.log(`   ID: ${u.id}`);
        console.log(`   Created: ${u.createdAt}\n`);
      });
    } else {
      console.log('❌ No ADMIN or SUPER_ADMIN users found!\n');
    }
    
    console.log('=== All Users ===\n');
    users.forEach(u => {
      console.log(`${u.role}: ${u.firstName} ${u.lastName} (${u.email})`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdmins();
