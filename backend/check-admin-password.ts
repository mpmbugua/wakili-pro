import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function checkAdminPassword() {
  try {
    console.log('\n=== Checking Admin User ===\n');
    
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@wakili.com' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        password: true,
        createdAt: true
      }
    });
    
    if (!admin) {
      console.log('❌ Admin user not found!');
      return;
    }
    
    console.log(`✅ Admin Found: ${admin.firstName} ${admin.lastName}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Role: ${admin.role}`);
    console.log(`   Created: ${admin.createdAt}`);
    console.log(`   Has Password: ${admin.password ? 'Yes' : 'No'}`);
    
    if (admin.password) {
      console.log(`   Password Hash: ${admin.password.substring(0, 30)}...`);
      
      // Test common passwords
      const testPasswords = [
        'Password123!',
        'Admin@123',
        'admin123',
        'Admin123',
        'password',
        'Password@123',
        'wakili123',
        'Wakili@123'
      ];
      
      console.log('\n=== Testing Common Passwords ===\n');
      
      for (const testPassword of testPasswords) {
        const isMatch = await bcrypt.compare(testPassword, admin.password);
        if (isMatch) {
          console.log(`✅ PASSWORD FOUND: "${testPassword}"`);
          console.log(`\n🔑 Login Credentials:`);
          console.log(`   Email: ${admin.email}`);
          console.log(`   Password: ${testPassword}`);
          return;
        } else {
          console.log(`❌ Not: "${testPassword}"`);
        }
      }
      
      console.log('\n⚠️  Password not in common list. Check seed scripts for the actual password.');
    } else {
      console.log('\n❌ Admin user has NO password set!');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdminPassword();
