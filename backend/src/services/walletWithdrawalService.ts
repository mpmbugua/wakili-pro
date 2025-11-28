import { PrismaClient, WithdrawalMethod, WithdrawalStatus } from '@prisma/client';
import Decimal from 'decimal.js';
import { mpesaService } from './mpesaDarajaService';

const prisma = new PrismaClient();

interface CreateWithdrawalRequestData {
  lawyerId: string;
  amount: Decimal;
  withdrawalMethod: WithdrawalMethod;
  mpesaPhoneNumber?: string;
  mpesaName?: string;
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  branchCode?: string;
}

interface ProcessWithdrawalData {
  requestId: string;
  processedBy: string;
  approved: boolean;
  rejectionReason?: string;
}

/**
 * Wallet Withdrawal Service
 * Manages lawyer wallet withdrawals via M-Pesa or Bank Transfer
 */
export class WalletWithdrawalService {
  /**
   * Minimum withdrawal amount (KES)
   */
  static MIN_WITHDRAWAL_AMOUNT = new Decimal(100);

  /**
   * Maximum withdrawal amount (KES) - M-Pesa limit
   */
  static MAX_MPESA_WITHDRAWAL = new Decimal(150000);

  /**
   * Withdrawal processing fee (KES)
   */
  static WITHDRAWAL_FEE = new Decimal(0); // Currently free, can be configured

  /**
   * Create a new withdrawal request
   */
  static async createWithdrawalRequest(data: CreateWithdrawalRequestData) {
    const { lawyerId, amount, withdrawalMethod } = data;

    // 1. Validate minimum amount
    if (amount.lessThan(this.MIN_WITHDRAWAL_AMOUNT)) {
      throw new Error(`Minimum withdrawal amount is KES ${this.MIN_WITHDRAWAL_AMOUNT}`);
    }

    // 2. Validate M-Pesa limit
    if (withdrawalMethod === 'MPESA' && amount.greaterThan(this.MAX_MPESA_WITHDRAWAL)) {
      throw new Error(`Maximum M-Pesa withdrawal is KES ${this.MAX_MPESA_WITHDRAWAL}. Please use bank transfer for larger amounts.`);
    }

    // 3. Get lawyer wallet
    const wallet = await prisma.lawyerWallet.findUnique({
      where: { lawyerId },
      include: {
        lawyer: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                phoneNumber: true,
              },
            },
          },
        },
      },
    });

    if (!wallet) {
      throw new Error('Wallet not found');
    }

    if (!wallet.isActive) {
      throw new Error('Wallet is not active');
    }

    // 4. Check available balance
    const availableBalance = new Decimal(wallet.availableBalance.toString());
    if (amount.greaterThan(availableBalance)) {
      throw new Error(`Insufficient funds. Available balance: KES ${availableBalance}`);
    }

    // 5. Validate withdrawal method details
    if (withdrawalMethod === 'MPESA') {
      if (!data.mpesaPhoneNumber) {
        throw new Error('M-Pesa phone number is required');
      }
      // Validate Kenyan phone format
      const phoneRegex = /^(\+254|254|0)[17]\d{8}$/;
      if (!phoneRegex.test(data.mpesaPhoneNumber)) {
        throw new Error('Invalid Kenyan phone number format');
      }
    } else if (withdrawalMethod === 'BANK_TRANSFER') {
      if (!data.bankName || !data.accountNumber || !data.accountName) {
        throw new Error('Bank details are required (bank name, account number, account name)');
      }
    }

    // 6. Check for pending withdrawal requests
    const pendingWithdrawals = await prisma.withdrawalRequest.count({
      where: {
        lawyerId,
        status: {
          in: ['PENDING', 'APPROVED', 'PROCESSING'],
        },
      },
    });

    if (pendingWithdrawals > 0) {
      throw new Error('You have a pending withdrawal request. Please wait for it to complete.');
    }

    // 7. Create withdrawal request
    const withdrawalRequest = await prisma.withdrawalRequest.create({
      data: {
        lawyerId,
        amount,
        withdrawalMethod,
        mpesaPhoneNumber: data.mpesaPhoneNumber,
        mpesaName: data.mpesaName,
        bankName: data.bankName,
        accountNumber: data.accountNumber,
        accountName: data.accountName,
        branchCode: data.branchCode,
        status: 'PENDING',
        requestedAt: new Date(),
      },
      include: {
        lawyer: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    // 8. Reserve funds (reduce available balance)
    await prisma.lawyerWallet.update({
      where: { id: wallet.id },
      data: {
        availableBalance: {
          decrement: amount,
        },
      },
    });

    console.log(`💸 Withdrawal request created: ${withdrawalRequest.id} for KES ${amount}`);

    return withdrawalRequest;
  }

  /**
   * Get withdrawal request by ID
   */
  static async getWithdrawalRequest(requestId: string) {
    const request = await prisma.withdrawalRequest.findUnique({
      where: { id: requestId },
      include: {
        lawyer: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                phoneNumber: true,
              },
            },
          },
        },
      },
    });

    if (!request) {
      throw new Error('Withdrawal request not found');
    }

    return request;
  }

  /**
   * Get all withdrawal requests for a lawyer
   */
  static async getLawyerWithdrawalRequests(lawyerId: string, status?: WithdrawalStatus) {
    const where: any = { lawyerId };
    if (status) {
      where.status = status;
    }

    return await prisma.withdrawalRequest.findMany({
      where,
      orderBy: {
        requestedAt: 'desc',
      },
      include: {
        lawyer: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Process withdrawal request (Admin approval)
   */
  static async processWithdrawalRequest(data: ProcessWithdrawalData) {
    const { requestId, processedBy, approved, rejectionReason } = data;

    const request = await this.getWithdrawalRequest(requestId);

    if (request.status !== 'PENDING') {
      throw new Error(`Cannot process withdrawal with status: ${request.status}`);
    }

    if (approved) {
      // Approve and initiate payout
      await prisma.withdrawalRequest.update({
        where: { id: requestId },
        data: {
          status: 'APPROVED',
          processedBy,
          processedAt: new Date(),
        },
      });

      // Initiate actual payout
      await this.initiateWithdrawalPayout(requestId);
    } else {
      // Reject and restore funds
      await prisma.$transaction(async (tx) => {
        // Update request status
        await tx.withdrawalRequest.update({
          where: { id: requestId },
          data: {
            status: 'REJECTED',
            processedBy,
            processedAt: new Date(),
            rejectionReason: rejectionReason || 'Rejected by admin',
          },
        });

        // Restore available balance
        const wallet = await tx.lawyerWallet.findUnique({
          where: { lawyerId: request.lawyerId },
        });

        if (wallet) {
          await tx.lawyerWallet.update({
            where: { id: wallet.id },
            data: {
              availableBalance: {
                increment: request.amount,
              },
            },
          });
        }
      });

      console.log(`❌ Withdrawal request ${requestId} rejected: ${rejectionReason}`);
    }
  }

  /**
   * Initiate actual withdrawal payout
   */
  static async initiateWithdrawalPayout(requestId: string) {
    const request = await this.getWithdrawalRequest(requestId);

    if (request.status !== 'APPROVED') {
      throw new Error('Withdrawal must be approved before payout');
    }

    // Update status to PROCESSING
    await prisma.withdrawalRequest.update({
      where: { id: requestId },
      data: {
        status: 'PROCESSING',
      },
    });

    try {
      if (request.withdrawalMethod === 'MPESA') {
        await this.processMpesaWithdrawal(request);
      } else if (request.withdrawalMethod === 'BANK_TRANSFER') {
        await this.processBankWithdrawal(request);
      }
    } catch (error) {
      // Mark as failed and restore funds
      await this.handleWithdrawalFailure(requestId, error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  /**
   * Process M-Pesa B2C withdrawal
   */
  private static async processMpesaWithdrawal(request: any) {
    if (!request.mpesaPhoneNumber) {
      throw new Error('M-Pesa phone number is required');
    }

    // Format phone number for M-Pesa
    let phoneNumber = request.mpesaPhoneNumber;
    if (phoneNumber.startsWith('0')) {
      phoneNumber = '254' + phoneNumber.substring(1);
    } else if (phoneNumber.startsWith('+254')) {
      phoneNumber = phoneNumber.substring(1);
    }

    console.log(`📱 Initiating M-Pesa B2C withdrawal: KES ${request.amount} to ${phoneNumber}`);

    // TODO: Integrate M-Pesa B2C API
    // For now, we'll simulate success in sandbox
    // In production, this would call mpesaService.initiateB2C()
    
    const simulatedResponse = {
      success: true,
      transactionId: `MPESA_${Date.now()}`,
      message: 'Withdrawal initiated successfully',
    };

    if (simulatedResponse.success) {
      await this.completeWithdrawal(request.id, simulatedResponse.transactionId);
    } else {
      throw new Error('M-Pesa withdrawal failed');
    }
  }

  /**
   * Process bank transfer withdrawal
   */
  private static async processBankWithdrawal(request: any) {
    console.log(`🏦 Initiating bank transfer: KES ${request.amount} to ${request.accountNumber}`);

    // TODO: Integrate with bank API or manual processing workflow
    // For now, mark as processing - admin will complete manually
    
    await prisma.withdrawalRequest.update({
      where: { id: request.id },
      data: {
        status: 'PROCESSING',
      },
    });

    console.log(`⏳ Bank transfer marked for manual processing: ${request.id}`);
  }

  /**
   * Complete withdrawal (called after successful payout)
   */
  static async completeWithdrawal(requestId: string, transactionId: string) {
    const request = await this.getWithdrawalRequest(requestId);

    await prisma.$transaction(async (tx) => {
      // 1. Update withdrawal request
      await tx.withdrawalRequest.update({
        where: { id: requestId },
        data: {
          status: 'COMPLETED',
          transactionId,
          completedAt: new Date(),
        },
      });

      // 2. Update wallet balance
      const wallet = await tx.lawyerWallet.findUnique({
        where: { lawyerId: request.lawyerId },
      });

      if (!wallet) {
        throw new Error('Wallet not found');
      }

      await tx.lawyerWallet.update({
        where: { id: wallet.id },
        data: {
          balance: {
            decrement: request.amount,
          },
        },
      });

      // 3. Create wallet transaction record
      await tx.lawyerWalletTransaction.create({
        data: {
          walletId: wallet.id,
          type: 'WITHDRAWAL',
          amount: new Decimal(request.amount.toString()).negated(),
          balanceBefore: wallet.balance,
          balanceAfter: new Decimal(wallet.balance.toString()).minus(request.amount.toString()),
          status: 'COMPLETED',
          paymentMethod: request.withdrawalMethod,
          mpesaTransactionId: transactionId,
          description: `Withdrawal to ${request.withdrawalMethod === 'MPESA' ? request.mpesaPhoneNumber : request.accountNumber}`,
          metadata: {
            withdrawalRequestId: requestId,
            method: request.withdrawalMethod,
          },
        },
      });
    });

    console.log(`✅ Withdrawal completed: ${requestId} - KES ${request.amount}`);
  }

  /**
   * Handle withdrawal failure
   */
  private static async handleWithdrawalFailure(requestId: string, errorMessage: string) {
    const request = await this.getWithdrawalRequest(requestId);

    await prisma.$transaction(async (tx) => {
      // Update request status
      await tx.withdrawalRequest.update({
        where: { id: requestId },
        data: {
          status: 'FAILED',
          rejectionReason: errorMessage,
        },
      });

      // Restore available balance
      const wallet = await tx.lawyerWallet.findUnique({
        where: { lawyerId: request.lawyerId },
      });

      if (wallet) {
        await tx.lawyerWallet.update({
          where: { id: wallet.id },
          data: {
            availableBalance: {
              increment: request.amount,
            },
          },
        });
      }
    });

    console.log(`❌ Withdrawal failed: ${requestId} - ${errorMessage}`);
  }

  /**
   * Cancel withdrawal request (before processing)
   */
  static async cancelWithdrawalRequest(requestId: string, lawyerId: string) {
    const request = await this.getWithdrawalRequest(requestId);

    // Verify ownership
    if (request.lawyerId !== lawyerId) {
      throw new Error('Unauthorized to cancel this withdrawal request');
    }

    // Can only cancel pending requests
    if (request.status !== 'PENDING') {
      throw new Error(`Cannot cancel withdrawal with status: ${request.status}`);
    }

    await prisma.$transaction(async (tx) => {
      // Update request status
      await tx.withdrawalRequest.update({
        where: { id: requestId },
        data: {
          status: 'CANCELLED' as any, // Using string until Prisma regenerates
        },
      });

      // Restore available balance
      const wallet = await tx.lawyerWallet.findUnique({
        where: { lawyerId },
      });

      if (wallet) {
        await tx.lawyerWallet.update({
          where: { id: wallet.id },
          data: {
            availableBalance: {
              increment: request.amount,
            },
          },
        });
      }
    });

    console.log(`🚫 Withdrawal cancelled: ${requestId}`);
  }

  /**
   * Get withdrawal statistics for a lawyer
   */
  static async getWithdrawalStats(lawyerId: string) {
    const withdrawals = await prisma.withdrawalRequest.findMany({
      where: { lawyerId },
    });

    let totalRequested = new Decimal(0);
    let totalCompleted = new Decimal(0);
    let totalPending = new Decimal(0);
    let totalFailed = new Decimal(0);

    withdrawals.forEach((w) => {
      const amount = new Decimal(w.amount.toString());
      totalRequested = totalRequested.plus(amount);

      if (w.status === 'COMPLETED') {
        totalCompleted = totalCompleted.plus(amount);
      } else if (w.status === 'PENDING' || w.status === 'APPROVED' || w.status === 'PROCESSING') {
        totalPending = totalPending.plus(amount);
      } else if (w.status === 'FAILED' || w.status === 'REJECTED') {
        totalFailed = totalFailed.plus(amount);
      }
    });

    return {
      totalRequested: totalRequested.toString(),
      totalCompleted: totalCompleted.toString(),
      totalPending: totalPending.toString(),
      totalFailed: totalFailed.toString(),
      count: {
        total: withdrawals.length,
        completed: withdrawals.filter((w) => w.status === 'COMPLETED').length,
        pending: withdrawals.filter((w) => ['PENDING', 'APPROVED', 'PROCESSING'].includes(w.status)).length,
        failed: withdrawals.filter((w) => ['FAILED', 'REJECTED', 'CANCELLED'].includes(w.status)).length,
      },
    };
  }

  /**
   * Get pending withdrawal requests (Admin)
   */
  static async getPendingWithdrawals() {
    return await prisma.withdrawalRequest.findMany({
      where: {
        status: 'PENDING',
      },
      orderBy: {
        requestedAt: 'asc',
      },
      include: {
        lawyer: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                phoneNumber: true,
              },
            },
          },
        },
      },
    });
  }
}

export default WalletWithdrawalService;
