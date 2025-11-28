// Wallet and Withdrawal Types

export enum WithdrawalMethod {
  MPESA = 'MPESA',
  BANK_TRANSFER = 'BANK_TRANSFER',
}

export enum WithdrawalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  REJECTED = 'REJECTED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export interface LawyerWallet {
  id: string;
  lawyerId: string;
  balance: number;
  pendingBalance: number;
  availableBalance: number;
  createdAt: string;
  updatedAt: string;
}

export interface WithdrawalRequest {
  id: string;
  lawyerId: string;
  amount: number;
  withdrawalMethod: WithdrawalMethod;
  mpesaPhoneNumber?: string;
  mpesaName?: string;
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  branchCode?: string;
  status: WithdrawalStatus;
  requestedAt: string;
  processedAt?: string;
  completedAt?: string;
  rejectionReason?: string;
  processedBy?: string;
  transactionId?: string;
  mpesaTransactionId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WithdrawalStats {
  totalRequested: number;
  totalCompleted: number;
  totalPending: number;
  totalFailed: number;
  totalRejected: number;
  successRate: number;
}

export interface CreateWithdrawalRequestData {
  amount: number;
  withdrawalMethod: WithdrawalMethod;
  mpesaPhoneNumber?: string;
  mpesaName?: string;
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  branchCode?: string;
}

export interface ProcessWithdrawalData {
  action: 'APPROVE' | 'REJECT';
  rejectionReason?: string;
}

export interface WalletTransaction {
  id: string;
  walletId: string;
  type: 'CREDIT' | 'DEBIT';
  amount: number;
  description: string;
  referenceType?: string;
  referenceId?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}
