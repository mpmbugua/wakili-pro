import express from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getWalletBalance,
  createWithdrawalRequest,
  getMyWithdrawals,
  getWithdrawalById,
  cancelWithdrawal,
  getWithdrawalStats,
  getPendingWithdrawals,
  processWithdrawal,
  completeWithdrawal,
} from '../controllers/walletController';

const router = express.Router();

// =============================
// LAWYER ENDPOINTS (Protected)
// =============================

/**
 * @route   GET /api/wallet/balance
 * @desc    Get wallet balance and escrow summary
 * @access  Private (Lawyer)
 */
router.get('/balance', authenticateToken, getWalletBalance);

/**
 * @route   POST /api/wallet/withdraw
 * @desc    Create withdrawal request
 * @access  Private (Lawyer)
 */
router.post('/withdraw', authenticateToken, createWithdrawalRequest);

/**
 * @route   GET /api/wallet/withdrawals
 * @desc    Get all withdrawal requests for logged-in lawyer
 * @access  Private (Lawyer)
 */
router.get('/withdrawals', authenticateToken, getMyWithdrawals);

/**
 * @route   GET /api/wallet/withdrawals/:id
 * @desc    Get specific withdrawal request
 * @access  Private (Lawyer)
 */
router.get('/withdrawals/:id', authenticateToken, getWithdrawalById);

/**
 * @route   DELETE /api/wallet/withdrawals/:id
 * @desc    Cancel withdrawal request
 * @access  Private (Lawyer)
 */
router.delete('/withdrawals/:id', authenticateToken, cancelWithdrawal);

/**
 * @route   GET /api/wallet/stats
 * @desc    Get withdrawal statistics
 * @access  Private (Lawyer)
 */
router.get('/stats', authenticateToken, getWithdrawalStats);

// =============================
// ADMIN ENDPOINTS (Protected)
// =============================

/**
 * @route   GET /api/wallet/admin/pending
 * @desc    Get all pending withdrawal requests
 * @access  Private (Admin)
 */
router.get('/admin/pending', authenticateToken, getPendingWithdrawals);

/**
 * @route   POST /api/wallet/admin/process/:id
 * @desc    Approve or reject withdrawal request
 * @access  Private (Admin)
 */
router.post('/admin/process/:id', authenticateToken, processWithdrawal);

/**
 * @route   POST /api/wallet/admin/complete/:id
 * @desc    Manually complete withdrawal
 * @access  Private (Admin)
 */
router.post('/admin/complete/:id', authenticateToken, completeWithdrawal);

export default router;
