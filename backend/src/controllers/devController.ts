/**
 * Development utilities - Only for testing/development
 * DO NOT USE IN PRODUCTION
 */

import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';
import Decimal from 'decimal.js';

const prisma = new PrismaClient();

/**
 * Seed current user's wallet with test funds
 * @route POST /api/dev/seed-wallet
 */
export const seedWallet = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    // Only allow in development
    if (process.env.NODE_ENV === 'production') {
      res.status(403).json({
        success: false,
        message: 'This endpoint is only available in development mode',
      });
      return;
    }

    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    // Get lawyer profile
    const lawyerProfile = await prisma.lawyerProfile.findUnique({
      where: { userId },
    });

    if (!lawyerProfile) {
      res.status(404).json({
        success: false,
        message: 'Lawyer profile not found. Only lawyers can have wallets.',
      });
      return;
    }

    // Get or create wallet
    let wallet = await prisma.lawyerWallet.findUnique({
      where: { lawyerId: lawyerProfile.id },
    });

    const seedAmount = req.body.amount || 5000; // Default 5000 KES
    const pending = req.body.pending || 2000; // Default 2000 KES pending
    const available = seedAmount - pending; // Available = total - pending

    if (!wallet) {
      wallet = await prisma.lawyerWallet.create({
        data: {
          lawyerId: lawyerProfile.id,
          balance: new Decimal(seedAmount),
          pendingBalance: new Decimal(pending),
          availableBalance: new Decimal(available),
          currency: 'KES',
          isActive: true,
        },
      });
    } else {
      wallet = await prisma.lawyerWallet.update({
        where: { id: wallet.id },
        data: {
          balance: new Decimal(seedAmount),
          pendingBalance: new Decimal(pending),
          availableBalance: new Decimal(available),
        },
      });
    }

    res.status(200).json({
      success: true,
      message: 'Wallet seeded successfully',
      data: {
        balance: parseFloat(wallet.balance.toString()),
        pendingBalance: parseFloat(wallet.pendingBalance.toString()),
        availableBalance: parseFloat(wallet.availableBalance.toString()),
      },
    });
  } catch (error: any) {
    console.error('Seed wallet error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to seed wallet',
    });
  }
};
