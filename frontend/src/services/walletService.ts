import { api } from './api';
import {
  LawyerWallet,
  WithdrawalRequest,
  WithdrawalStats,
  CreateWithdrawalRequestData,
  ProcessWithdrawalData,
} from '../types/wallet';

export const walletService = {
  // Get wallet balance
  async getBalance(): Promise<LawyerWallet> {
    const response = await api.get('/wallet/balance');
    // API returns { success, data, message }, extract the data
    return response.data.data || response.data;
  },

  // Create withdrawal request
  async createWithdrawalRequest(
    data: CreateWithdrawalRequestData
  ): Promise<WithdrawalRequest> {
    const response = await api.post('/wallet/withdraw', data);
    return response.data.data || response.data;
  },

  // Get all withdrawal requests for the logged-in lawyer
  async getWithdrawals(status?: string): Promise<WithdrawalRequest[]> {
    const params = status ? { status } : {};
    const response = await api.get('/wallet/withdrawals', { params });
    return response.data.data || response.data;
  },

  // Get specific withdrawal request
  async getWithdrawalById(id: string): Promise<WithdrawalRequest> {
    const response = await api.get(`/wallet/withdrawals/${id}`);
    return response.data.data || response.data;
  },

  // Cancel withdrawal request
  async cancelWithdrawal(id: string): Promise<WithdrawalRequest> {
    const response = await api.delete(`/wallet/withdrawals/${id}`);
    return response.data.data || response.data;
  },

  // Get withdrawal statistics
  async getStats(): Promise<WithdrawalStats> {
    const response = await api.get('/wallet/stats');
    return response.data.data || response.data;
  },

  // Admin: Get pending withdrawals
  async getPendingWithdrawals(): Promise<WithdrawalRequest[]> {
    const response = await api.get('/wallet/admin/pending');
    return response.data.data || response.data;
  },

  // Admin: Process withdrawal (approve/reject)
  async processWithdrawal(
    id: string,
    data: ProcessWithdrawalData
  ): Promise<WithdrawalRequest> {
    const response = await api.post(`/wallet/admin/process/${id}`, data);
    return response.data.data || response.data;
  },

  // Admin: Complete withdrawal
  async completeWithdrawal(
    id: string,
    transactionId: string
  ): Promise<WithdrawalRequest> {
    const response = await api.post(`/wallet/admin/complete/${id}`, {
      transactionId,
    });
    return response.data.data || response.data;
  },
};
