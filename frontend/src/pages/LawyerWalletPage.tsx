import React, { useEffect, useState } from 'react';
import { walletService } from '../services/walletService';
import {
  LawyerWallet,
  WithdrawalRequest,
  WithdrawalStats,
} from '../types/wallet';
import { WalletBalanceCard } from '../components/wallet/WalletBalanceCard';
import { WithdrawalRequestModal } from '../components/wallet/WithdrawalRequestModal';
import { WithdrawalHistoryTable } from '../components/wallet/WithdrawalHistoryTable';
import { WithdrawalStatsCards } from '../components/wallet/WithdrawalStatsCards';
import {
  Wallet,
  ArrowDownCircle,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';

const LawyerWalletPage: React.FC = () => {
  const [wallet, setWallet] = useState<LawyerWallet | null>(null);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [stats, setStats] = useState<WithdrawalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isWithdrawalModalOpen, setIsWithdrawalModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');

  useEffect(() => {
    loadWalletData();
  }, [statusFilter]);

  const loadWalletData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [walletData, withdrawalsData, statsData] = await Promise.all([
        walletService.getBalance(),
        walletService.getWithdrawals(statusFilter || undefined),
        walletService.getStats(),
      ]);
      setWallet(walletData);
      setWithdrawals(withdrawalsData);
      setStats(statsData);
    } catch (err: any) {
      console.error('Error loading wallet data:', err);
      setError(
        err.response?.data?.message || 'Failed to load wallet data'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawalCreated = () => {
    setIsWithdrawalModalOpen(false);
    loadWalletData();
  };

  const handleCancelWithdrawal = async (id: string) => {
    try {
      await walletService.cancelWithdrawal(id);
      loadWalletData();
    } catch (err: any) {
      console.error('Error canceling withdrawal:', err);
      alert(err.response?.data?.message || 'Failed to cancel withdrawal');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading wallet...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
          <div className="flex items-center justify-center mb-4">
            <AlertCircle className="h-12 w-12 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 text-center mb-2">
            Error Loading Wallet
          </h2>
          <p className="text-gray-600 text-center mb-4">{error}</p>
          <button
            onClick={loadWalletData}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Wallet className="h-8 w-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-800">
                My Wallet
              </h1>
            </div>
            <button
              onClick={() => setIsWithdrawalModalOpen(true)}
              disabled={!wallet || wallet.availableBalance <= 0}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              <ArrowDownCircle className="h-5 w-5" />
              Request Withdrawal
            </button>
          </div>
        </div>

        {/* Balance Card */}
        {wallet && <WalletBalanceCard wallet={wallet} />}

        {/* Stats Cards */}
        {stats && <WithdrawalStatsCards stats={stats} />}

        {/* Withdrawal History */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-800">
                Withdrawal History
              </h2>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="PROCESSING">Processing</option>
              <option value="COMPLETED">Completed</option>
              <option value="REJECTED">Rejected</option>
              <option value="FAILED">Failed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
          <WithdrawalHistoryTable
            withdrawals={withdrawals}
            onCancelWithdrawal={handleCancelWithdrawal}
            onRefresh={loadWalletData}
          />
        </div>

        {/* Help Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            Withdrawal Information
          </h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start gap-2">
              <span className="font-semibold">•</span>
              <span>
                <strong>Minimum withdrawal:</strong> KES 100
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-semibold">•</span>
              <span>
                <strong>M-Pesa maximum:</strong> KES 150,000 per transaction
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-semibold">•</span>
              <span>
                <strong>Processing time:</strong> M-Pesa withdrawals are
                processed within 24 hours. Bank transfers may take 1-3
                business days.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-semibold">•</span>
              <span>
                <strong>One at a time:</strong> You can only have one pending
                withdrawal request at a time.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-semibold">•</span>
              <span>
                <strong>Cancellation:</strong> You can cancel pending
                withdrawal requests before they are approved.
              </span>
            </li>
          </ul>
        </div>
      </div>

      {/* Withdrawal Request Modal */}
      {wallet && (
        <WithdrawalRequestModal
          isOpen={isWithdrawalModalOpen}
          onClose={() => setIsWithdrawalModalOpen(false)}
          wallet={wallet}
          onSuccess={handleWithdrawalCreated}
        />
      )}
    </div>
  );
};

export default LawyerWalletPage;
