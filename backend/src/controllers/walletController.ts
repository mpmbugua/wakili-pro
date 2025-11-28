import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { ApiResponse } from '@wakili-pro/shared';
import { z } from 'zod';
import WalletWithdrawalService from '../services/walletWithdrawalService';
import EscrowService from '../services/escrowService';
import Decimal from 'decimal.js';
import { WithdrawalMethod } from '@prisma/client';

// Validation schemas
const CreateWithdrawalSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  withdrawalMethod: z.enum(['MPESA', 'BANK_TRANSFER']),
  mpesaPhoneNumber: z.string().optional(),
  mpesaName: z.string().optional(),
  bankName: z.string().optional(),
  accountNumber: z.string().optional(),
  accountName: z.string().optional(),
  branchCode: z.string().optional(),
});

const ProcessWithdrawalSchema = z.object({
  approved: z.boolean(),
  rejectionReason: z.string().optional(),
});

/**
 * Get wallet balance and summary
 * @route GET /api/wallet/balance
 */
export const getWalletBalance = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    // Get lawyer profile ID
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    const lawyerProfile = await prisma.lawyerProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!lawyerProfile) {
      res.status(404).json({
        success: false,
        message: 'Lawyer profile not found',
      });
      return;
    }

    // Get escrow summary
    const escrowSummary = await EscrowService.getLawyerEscrowSummary(lawyerProfile.id);

    const response: ApiResponse<any> = {
      success: true,
      message: 'Wallet balance retrieved successfully',
      data: escrowSummary,
    };

    res.status(200).json(response);
  } catch (error: any) {
    console.error('Get wallet balance error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve wallet balance',
    });
  }
};

/**
 * Create withdrawal request
 * @route POST /api/wallet/withdraw
 */
export const createWithdrawalRequest = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    // Validate request body
    const validation = CreateWithdrawalSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.error.issues,
      });
      return;
    }

    const { amount, withdrawalMethod, ...details } = validation.data;

    // Get lawyer profile ID
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    const lawyerProfile = await prisma.lawyerProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!lawyerProfile) {
      res.status(404).json({
        success: false,
        message: 'Lawyer profile not found. Only lawyers can withdraw funds.',
      });
      return;
    }

    // Create withdrawal request
    const withdrawalRequest = await WalletWithdrawalService.createWithdrawalRequest({
      lawyerId: lawyerProfile.id,
      amount: new Decimal(amount),
      withdrawalMethod: withdrawalMethod as WithdrawalMethod,
      ...details,
    });

    const response: ApiResponse<any> = {
      success: true,
      message: 'Withdrawal request created successfully. It will be processed within 24 hours.',
      data: withdrawalRequest,
    };

    res.status(201).json(response);
  } catch (error: any) {
    console.error('Create withdrawal error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create withdrawal request',
    });
  }
};

/**
 * Get withdrawal requests for logged-in lawyer
 * @route GET /api/wallet/withdrawals
 */
export const getMyWithdrawals = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    // Get lawyer profile ID
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    const lawyerProfile = await prisma.lawyerProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!lawyerProfile) {
      res.status(404).json({
        success: false,
        message: 'Lawyer profile not found',
      });
      return;
    }

    const withdrawals = await WalletWithdrawalService.getLawyerWithdrawalRequests(
      lawyerProfile.id
    );

    const response: ApiResponse<any> = {
      success: true,
      message: 'Withdrawal requests retrieved successfully',
      data: withdrawals,
    };

    res.status(200).json(response);
  } catch (error: any) {
    console.error('Get withdrawals error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve withdrawal requests',
    });
  }
};

/**
 * Get withdrawal request by ID
 * @route GET /api/wallet/withdrawals/:id
 */
export const getWithdrawalById = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    const withdrawal = await WalletWithdrawalService.getWithdrawalRequest(id);

    // Verify ownership
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    const lawyerProfile = await prisma.lawyerProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!lawyerProfile || withdrawal.lawyerId !== lawyerProfile.id) {
      res.status(403).json({
        success: false,
        message: 'Unauthorized access',
      });
      return;
    }

    const response: ApiResponse<any> = {
      success: true,
      message: 'Withdrawal request retrieved successfully',
      data: withdrawal,
    };

    res.status(200).json(response);
  } catch (error: any) {
    console.error('Get withdrawal error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve withdrawal request',
    });
  }
};

/**
 * Cancel withdrawal request
 * @route DELETE /api/wallet/withdrawals/:id
 */
export const cancelWithdrawal = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    // Get lawyer profile ID
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    const lawyerProfile = await prisma.lawyerProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!lawyerProfile) {
      res.status(404).json({
        success: false,
        message: 'Lawyer profile not found',
      });
      return;
    }

    await WalletWithdrawalService.cancelWithdrawalRequest(id, lawyerProfile.id);

    const response: ApiResponse<null> = {
      success: true,
      message: 'Withdrawal request cancelled successfully',
      data: null,
    };

    res.status(200).json(response);
  } catch (error: any) {
    console.error('Cancel withdrawal error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to cancel withdrawal request',
    });
  }
};

/**
 * Get withdrawal statistics
 * @route GET /api/wallet/stats
 */
export const getWithdrawalStats = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    // Get lawyer profile ID
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    const lawyerProfile = await prisma.lawyerProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!lawyerProfile) {
      res.status(404).json({
        success: false,
        message: 'Lawyer profile not found',
      });
      return;
    }

    const stats = await WalletWithdrawalService.getWithdrawalStats(lawyerProfile.id);

    const response: ApiResponse<any> = {
      success: true,
      message: 'Withdrawal statistics retrieved successfully',
      data: stats,
    };

    res.status(200).json(response);
  } catch (error: any) {
    console.error('Get withdrawal stats error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve withdrawal statistics',
    });
  }
};

// =============================
// ADMIN ENDPOINTS
// =============================

/**
 * Get all pending withdrawal requests (Admin only)
 * @route GET /api/wallet/admin/pending
 */
export const getPendingWithdrawals = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId || userRole !== 'ADMIN') {
      res.status(403).json({
        success: false,
        message: 'Admin access required',
      });
      return;
    }

    const withdrawals = await WalletWithdrawalService.getPendingWithdrawals();

    const response: ApiResponse<any> = {
      success: true,
      message: 'Pending withdrawals retrieved successfully',
      data: withdrawals,
    };

    res.status(200).json(response);
  } catch (error: any) {
    console.error('Get pending withdrawals error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve pending withdrawals',
    });
  }
};

/**
 * Process withdrawal request (Admin only)
 * @route POST /api/wallet/admin/process/:id
 */
export const processWithdrawal = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const { id } = req.params;

    if (!userId || userRole !== 'ADMIN') {
      res.status(403).json({
        success: false,
        message: 'Admin access required',
      });
      return;
    }

    // Validate request body
    const validation = ProcessWithdrawalSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.error.issues,
      });
      return;
    }

    const { approved, rejectionReason } = validation.data;

    await WalletWithdrawalService.processWithdrawalRequest({
      requestId: id,
      processedBy: userId,
      approved,
      rejectionReason,
    });

    const response: ApiResponse<null> = {
      success: true,
      message: approved
        ? 'Withdrawal approved and processing initiated'
        : 'Withdrawal rejected',
      data: null,
    };

    res.status(200).json(response);
  } catch (error: any) {
    console.error('Process withdrawal error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to process withdrawal request',
    });
  }
};

/**
 * Complete withdrawal manually (Admin only)
 * @route POST /api/wallet/admin/complete/:id
 */
export const completeWithdrawal = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const { id } = req.params;
    const { transactionId } = req.body;

    if (!userId || userRole !== 'ADMIN') {
      res.status(403).json({
        success: false,
        message: 'Admin access required',
      });
      return;
    }

    if (!transactionId) {
      res.status(400).json({
        success: false,
        message: 'Transaction ID is required',
      });
      return;
    }

    await WalletWithdrawalService.completeWithdrawal(id, transactionId);

    const response: ApiResponse<null> = {
      success: true,
      message: 'Withdrawal completed successfully',
      data: null,
    };

    res.status(200).json(response);
  } catch (error: any) {
    console.error('Complete withdrawal error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to complete withdrawal',
    });
  }
};
