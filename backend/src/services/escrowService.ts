import { PrismaClient, PayoutStatus, TransactionStatus, WalletTransactionType } from '@prisma/client';
import Decimal from 'decimal.js';

const prisma = new PrismaClient();

interface HoldPaymentData {
  bookingId: string;
  amount: Decimal;
  clientId: string;
  lawyerId: string;
  platformCommission: Decimal;
  lawyerPayout: Decimal;
}

interface ReleasePaymentData {
  bookingId: string;
  reason?: string;
}

interface RefundPaymentData {
  bookingId: string;
  amount: Decimal;
  reason: string;
  cancelledBy: 'CLIENT' | 'LAWYER' | 'SYSTEM';
}

/**
 * Escrow Service - Manages payment holds, releases, and refunds for consultation bookings
 */
export class EscrowService {
  /**
   * Hold payment in escrow when client pays
   * This is called automatically after successful M-Pesa payment
   */
  static async holdPayment(data: HoldPaymentData): Promise<void> {
    const { bookingId, amount, lawyerId, platformCommission, lawyerPayout } = data;

    // Get or create lawyer wallet
    let wallet = await prisma.lawyerWallet.findUnique({
      where: { lawyerId },
    });

    if (!wallet) {
      wallet = await prisma.lawyerWallet.create({
        data: {
          lawyerId,
          balance: new Decimal(0),
          pendingBalance: new Decimal(0),
          availableBalance: new Decimal(0),
          currency: 'KES',
          isActive: true,
        },
      });
    }

    // Add to pending balance (held in escrow)
    await prisma.lawyerWallet.update({
      where: { id: wallet.id },
      data: {
        pendingBalance: {
          increment: lawyerPayout,
        },
      },
    });

    // Create pending wallet transaction
    await prisma.lawyerWalletTransaction.create({
      data: {
        walletId: wallet.id,
        consultationBookingId: bookingId,
        type: WalletTransactionType.PAYOUT,
        amount: lawyerPayout,
        balanceBefore: wallet.balance,
        balanceAfter: wallet.balance, // Balance unchanged, only pending increases
        status: TransactionStatus.PENDING,
        description: `Escrow hold for consultation booking`,
        metadata: {
          platformCommission: platformCommission.toString(),
          totalAmount: amount.toString(),
          status: 'HELD_IN_ESCROW',
        },
      },
    });

    console.log(`💰 Escrow: Held KES ${lawyerPayout} for booking ${bookingId}`);
  }

  /**
   * Release payment to lawyer after session confirmation
   * Triggered when:
   * - Both parties confirm completion, OR
   * - Auto-release after 24 hours if no dispute
   */
  static async releasePayment(data: ReleasePaymentData): Promise<void> {
    const { bookingId, reason = 'Session completed successfully' } = data;

    // Get booking with wallet info
    const booking = await prisma.consultationBooking.findUnique({
      where: { id: bookingId },
      include: {
        lawyer: {
          include: {
            lawyerProfile: {
              include: {
                wallet: true,
              },
            },
          },
        },
      },
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    if (booking.payoutStatus === PayoutStatus.COMPLETED) {
      console.log(`⚠️ Escrow: Payout already completed for booking ${bookingId}`);
      return;
    }

    if (booking.clientPaymentStatus !== 'COMPLETED') {
      throw new Error('Client payment not completed');
    }

    const wallet = booking.lawyer.lawyerProfile?.wallet;
    if (!wallet) {
      throw new Error('Lawyer wallet not found');
    }

    const lawyerPayout = new Decimal(booking.lawyerPayout.toString());

    // Start transaction
    await prisma.$transaction(async (tx) => {
      // 1. Update wallet balances
      await tx.lawyerWallet.update({
        where: { id: wallet.id },
        data: {
          pendingBalance: {
            decrement: lawyerPayout,
          },
          balance: {
            increment: lawyerPayout,
          },
          availableBalance: {
            increment: lawyerPayout,
          },
        },
      });

      // 2. Create completed wallet transaction
      const transaction = await tx.lawyerWalletTransaction.create({
        data: {
          walletId: wallet.id,
          consultationBookingId: bookingId,
          type: WalletTransactionType.PAYOUT,
          amount: lawyerPayout,
          balanceBefore: wallet.balance,
          balanceAfter: new Decimal(wallet.balance.toString()).plus(lawyerPayout),
          status: TransactionStatus.COMPLETED,
          description: reason,
          metadata: {
            platformCommission: booking.platformCommission.toString(),
            totalClientPayment: booking.clientPaymentAmount.toString(),
            releaseType: 'MANUAL_CONFIRMATION',
          },
        },
      });

      // 3. Update booking payout status
      await tx.consultationBooking.update({
        where: { id: bookingId },
        data: {
          payoutStatus: PayoutStatus.COMPLETED,
          payoutTransactionId: transaction.id,
          paidToLawyerAt: new Date(),
        },
      });
    });

    console.log(`✅ Escrow: Released KES ${lawyerPayout} to lawyer for booking ${bookingId}`);
  }

  /**
   * Auto-release payment after 24 hours from session end
   * Called by a scheduled job/cron
   */
  static async autoReleaseExpiredBookings(): Promise<number> {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Find completed bookings older than 24 hours with pending payout
    const bookings = await prisma.consultationBooking.findMany({
      where: {
        status: 'COMPLETED',
        payoutStatus: PayoutStatus.PENDING,
        clientPaymentStatus: 'COMPLETED',
        scheduledEndTime: {
          lte: twentyFourHoursAgo,
        },
      },
      select: {
        id: true,
        scheduledEndTime: true,
      },
    });

    console.log(`🕐 Escrow: Found ${bookings.length} bookings eligible for auto-release`);

    let releasedCount = 0;
    for (const booking of bookings) {
      try {
        await this.releasePayment({
          bookingId: booking.id,
          reason: 'Auto-released after 24 hours (no dispute)',
        });
        releasedCount++;
      } catch (error) {
        console.error(`❌ Escrow: Failed to auto-release booking ${booking.id}:`, error);
      }
    }

    console.log(`✅ Escrow: Auto-released ${releasedCount}/${bookings.length} bookings`);
    return releasedCount;
  }

  /**
   * Refund payment to client (with commission deduction policy)
   * Refund policies:
   * - >24 hours before: Full refund (100%)
   * - 12-24 hours before: 50% refund
   * - <12 hours before: No refund (0%)
   */
  static async refundPayment(data: RefundPaymentData): Promise<void> {
    const { bookingId, reason, cancelledBy } = data;

    const booking = await prisma.consultationBooking.findUnique({
      where: { id: bookingId },
      include: {
        lawyer: {
          include: {
            lawyerProfile: {
              include: {
                wallet: true,
              },
            },
          },
        },
      },
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    if (booking.clientPaymentStatus !== 'COMPLETED') {
      throw new Error('No payment to refund');
    }

    // Calculate refund amount based on cancellation policy
    const now = new Date();
    const hoursUntilSession = (booking.scheduledStartTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    let refundPercentage = 0;
    let policyApplied = '';

    if (hoursUntilSession >= 24) {
      refundPercentage = 1.0; // 100% refund
      policyApplied = 'Full refund (>24 hours notice)';
    } else if (hoursUntilSession >= 12) {
      refundPercentage = 0.5; // 50% refund
      policyApplied = '50% refund (12-24 hours notice)';
    } else {
      refundPercentage = 0.0; // No refund
      policyApplied = 'No refund (<12 hours notice)';
    }

    const totalPaid = new Decimal(booking.clientPaymentAmount.toString());
    const refundAmount = totalPaid.times(refundPercentage);
    const platformRetention = totalPaid.minus(refundAmount);

    console.log(`💸 Escrow: Refund calculation for booking ${bookingId}:`);
    console.log(`   - Hours until session: ${hoursUntilSession.toFixed(1)}`);
    console.log(`   - Policy: ${policyApplied}`);
    console.log(`   - Total paid: KES ${totalPaid}`);
    console.log(`   - Refund amount: KES ${refundAmount} (${refundPercentage * 100}%)`);
    console.log(`   - Platform retention: KES ${platformRetention}`);

    await prisma.$transaction(async (tx) => {
      // 1. Reduce lawyer's pending balance if payment was held
      const wallet = booking.lawyer.lawyerProfile?.wallet;
      if (wallet && booking.payoutStatus === PayoutStatus.PENDING) {
        const lawyerPayout = new Decimal(booking.lawyerPayout.toString());
        
        await tx.lawyerWallet.update({
          where: { id: wallet.id },
          data: {
            pendingBalance: {
              decrement: lawyerPayout,
            },
          },
        });

        // Create reversal transaction
        await tx.lawyerWalletTransaction.create({
          data: {
            walletId: wallet.id,
            consultationBookingId: bookingId,
            type: WalletTransactionType.REFUND,
            amount: lawyerPayout.negated(),
            balanceBefore: wallet.balance,
            balanceAfter: wallet.balance,
            status: TransactionStatus.COMPLETED,
            description: `Escrow reversal due to cancellation: ${reason}`,
            metadata: {
              refundPercentage,
              policyApplied,
              cancelledBy,
            },
          },
        });
      }

      // 2. Update booking status
      await tx.consultationBooking.update({
        where: { id: bookingId },
        data: {
          status: 'REFUNDED',
          payoutStatus: PayoutStatus.FAILED, // Won't be paid out
        },
      });

      // 3. TODO: Create actual refund transaction to client's M-Pesa
      // This would integrate with M-Pesa B2C API
      // For now, we just log it
      console.log(`📲 TODO: Initiate M-Pesa refund of KES ${refundAmount} to client`);
    });

    console.log(`✅ Escrow: Refund processed for booking ${bookingId}`);
  }

  /**
   * Get escrow summary for a lawyer
   */
  static async getLawyerEscrowSummary(lawyerId: string) {
    const wallet = await prisma.lawyerWallet.findUnique({
      where: { lawyerId },
      include: {
        transactions: {
          where: {
            status: TransactionStatus.PENDING,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!wallet) {
      return {
        pendingBalance: '0.00',
        availableBalance: '0.00',
        totalBalance: '0.00',
        pendingTransactions: [],
      };
    }

    return {
      pendingBalance: wallet.pendingBalance.toString(),
      availableBalance: wallet.availableBalance.toString(),
      totalBalance: wallet.balance.toString(),
      pendingTransactions: wallet.transactions,
    };
  }

  /**
   * Get platform revenue summary
   */
  static async getPlatformRevenueSummary(startDate?: Date, endDate?: Date) {
    const where: any = {
      clientPaymentStatus: 'COMPLETED',
    };

    if (startDate) {
      where.clientPaidAt = { gte: startDate };
    }
    if (endDate) {
      where.clientPaidAt = { ...where.clientPaidAt, lte: endDate };
    }

    const bookings = await prisma.consultationBooking.findMany({
      where,
      select: {
        clientPaymentAmount: true,
        platformCommission: true,
        status: true,
        payoutStatus: true,
      },
    });

    let totalRevenue = new Decimal(0);
    let totalCommission = new Decimal(0);
    let totalPaidOut = new Decimal(0);
    let totalPending = new Decimal(0);

    bookings.forEach((booking) => {
      const revenue = new Decimal(booking.clientPaymentAmount.toString());
      const commission = new Decimal(booking.platformCommission.toString());

      totalRevenue = totalRevenue.plus(revenue);
      totalCommission = totalCommission.plus(commission);

      if (booking.payoutStatus === PayoutStatus.COMPLETED) {
        totalPaidOut = totalPaidOut.plus(revenue.minus(commission));
      } else if (booking.status !== 'REFUNDED' && booking.status !== 'CANCELLED') {
        totalPending = totalPending.plus(revenue.minus(commission));
      }
    });

    return {
      totalRevenue: totalRevenue.toString(),
      totalCommission: totalCommission.toString(),
      totalPaidOut: totalPaidOut.toString(),
      totalPending: totalPending.toString(),
      bookingsCount: bookings.length,
    };
  }
}

export default EscrowService;
