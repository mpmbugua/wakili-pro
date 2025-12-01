/**
 * Seed wallet with test funds
 * Run with: npx ts-node src/scripts/seedWallet.ts <lawyer-email>
 */

import { PrismaClient } from '@prisma/client';
import Decimal from 'decimal.js';

const prisma = new PrismaClient();

async function seedWallet(lawyerEmail: string) {
  try {
    console.log(`🔍 Finding lawyer with email: ${lawyerEmail}`);
    
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: lawyerEmail },
      include: {
        lawyerProfile: true,
      },
    });

    if (!user) {
      console.error('❌ User not found');
      return;
    }

    if (!user.lawyerProfile) {
      console.error('❌ User is not a lawyer');
      return;
    }

    const lawyerId = user.lawyerProfile.id;
    console.log(`✅ Found lawyer profile: ${lawyerId}`);

    // Get or create wallet
    let wallet = await prisma.lawyerWallet.findUnique({
      where: { lawyerId },
    });

    if (!wallet) {
      console.log('📝 Creating new wallet...');
      wallet = await prisma.lawyerWallet.create({
        data: {
          lawyerId,
          balance: new Decimal(5000), // 5000 KES total balance
          pendingBalance: new Decimal(2000), // 2000 KES in escrow
          availableBalance: new Decimal(3000), // 3000 KES available for withdrawal
          currency: 'KES',
          isActive: true,
        },
      });
    } else {
      console.log('📝 Updating existing wallet...');
      wallet = await prisma.lawyerWallet.update({
        where: { id: wallet.id },
        data: {
          balance: new Decimal(5000),
          pendingBalance: new Decimal(2000),
          availableBalance: new Decimal(3000),
        },
      });
    }

    console.log('\n✅ Wallet seeded successfully!');
    console.log('💰 Balance:', wallet.balance.toString(), 'KES');
    console.log('⏳ Pending (Escrow):', wallet.pendingBalance.toString(), 'KES');
    console.log('✅ Available:', wallet.availableBalance.toString(), 'KES');
    
  } catch (error) {
    console.error('❌ Error seeding wallet:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Get email from command line
const lawyerEmail = process.argv[2];

if (!lawyerEmail) {
  console.error('❌ Usage: npx ts-node src/scripts/seedWallet.ts <lawyer-email>');
  process.exit(1);
}

seedWallet(lawyerEmail);
