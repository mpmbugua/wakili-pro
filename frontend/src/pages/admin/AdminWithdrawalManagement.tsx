import React, { useEffect, useState } from 'react';
import { walletService } from '../../services/walletService';
import { WithdrawalRequest, WithdrawalStatus } from '../../types/wallet';
import {
  Wallet,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Smartphone,
  Building2,
  Clock,
} from 'lucide-react';
import { format } from 'date-fns';

const AdminWithdrawalManagement: React.FC = () => {
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedWithdrawal, setSelectedWithdrawal] =
    useState<WithdrawalRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [transactionId, setTransactionId] = useState('');

  useEffect(() => {
    loadWithdrawals();
  }, []);

  const loadWithdrawals = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await walletService.getPendingWithdrawals();
      setWithdrawals(data);
    } catch (err: any) {
      console.error('Error loading withdrawals:', err);
      setError(
        err.response?.data?.message || 'Failed to load withdrawal requests'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    if (!window.confirm('Are you sure you want to approve this withdrawal?')) {
      return;
    }

    try {
      setProcessing(id);
      await walletService.processWithdrawal(id, { action: 'APPROVE' });
      await loadWithdrawals();
      alert('Withdrawal approved successfully');
    } catch (err: any) {
      console.error('Error approving withdrawal:', err);
      alert(err.response?.data?.message || 'Failed to approve withdrawal');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (id: string, reason: string) => {
    if (!reason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    try {
      setProcessing(id);
      await walletService.processWithdrawal(id, {
        action: 'REJECT',
        rejectionReason: reason,
      });
      await loadWithdrawals();
      setSelectedWithdrawal(null);
      setRejectionReason('');
      alert('Withdrawal rejected');
    } catch (err: any) {
      console.error('Error rejecting withdrawal:', err);
      alert(err.response?.data?.message || 'Failed to reject withdrawal');
    } finally {
      setProcessing(null);
    }
  };

  const handleComplete = async (id: string, txId: string) => {
    if (!txId.trim()) {
      alert('Please provide a transaction ID');
      return;
    }

    try {
      setProcessing(id);
      await walletService.completeWithdrawal(id, txId);
      await loadWithdrawals();
      setSelectedWithdrawal(null);
      setTransactionId('');
      alert('Withdrawal marked as completed');
    } catch (err: any) {
      console.error('Error completing withdrawal:', err);
      alert(err.response?.data?.message || 'Failed to complete withdrawal');
    } finally {
      setProcessing(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getStatusBadge = (status: WithdrawalStatus) => {
    const badges = {
      PENDING: {
        icon: Clock,
        text: 'Pending',
        classes: 'bg-amber-100 text-amber-800 border-amber-300',
      },
      APPROVED: {
        icon: CheckCircle,
        text: 'Approved',
        classes: 'bg-blue-100 text-blue-800 border-blue-300',
      },
      PROCESSING: {
        icon: Loader2,
        text: 'Processing',
        classes: 'bg-purple-100 text-purple-800 border-purple-300',
      },
      COMPLETED: {
        icon: CheckCircle,
        text: 'Completed',
        classes: 'bg-green-100 text-green-800 border-green-300',
      },
      REJECTED: {
        icon: XCircle,
        text: 'Rejected',
        classes: 'bg-red-100 text-red-800 border-red-300',
      },
      FAILED: {
        icon: AlertCircle,
        text: 'Failed',
        classes: 'bg-red-100 text-red-800 border-red-300',
      },
      CANCELLED: {
        icon: XCircle,
        text: 'Cancelled',
        classes: 'bg-gray-100 text-gray-800 border-gray-300',
      },
    };

    const badge = badges[status];
    const Icon = badge.icon;

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${badge.classes}`}
      >
        <Icon
          className={`h-3.5 w-3.5 ${
            status === 'PROCESSING' ? 'animate-spin' : ''
          }`}
        />
        {badge.text}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto" />
          <p className="mt-4 text-gray-600">Loading withdrawals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Wallet className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-800">
              Withdrawal Management
            </h1>
          </div>
          <p className="text-gray-600">
            Approve, reject, or mark withdrawal requests as completed
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-700">Error</p>
                <p className="text-sm text-red-600">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Withdrawals Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {withdrawals.length === 0 ? (
            <div className="text-center py-12">
              <Wallet className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg mb-2">
                No pending withdrawals
              </p>
              <p className="text-gray-400 text-sm">
                All withdrawal requests have been processed
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Lawyer
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Method
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Details
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {withdrawals.map((withdrawal) => (
                    <tr key={withdrawal.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {format(
                            new Date(withdrawal.requestedAt),
                            'MMM dd, yyyy'
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          {format(new Date(withdrawal.requestedAt), 'HH:mm')}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {withdrawal.lawyerId}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">
                          {formatCurrency(Number(withdrawal.amount))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {withdrawal.withdrawalMethod === 'MPESA' ? (
                            <>
                              <Smartphone className="h-4 w-4 text-green-600" />
                              <span className="text-sm text-gray-700">
                                M-Pesa
                              </span>
                            </>
                          ) : (
                            <>
                              <Building2 className="h-4 w-4 text-blue-600" />
                              <span className="text-sm text-gray-700">
                                Bank
                              </span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {withdrawal.withdrawalMethod === 'MPESA' ? (
                          <div className="text-sm">
                            <div className="text-gray-900 font-medium">
                              {withdrawal.mpesaPhoneNumber}
                            </div>
                            <div className="text-gray-500 text-xs">
                              {withdrawal.mpesaName}
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm">
                            <div className="text-gray-900 font-medium">
                              {withdrawal.bankName}
                            </div>
                            <div className="text-gray-500 text-xs">
                              A/C: {withdrawal.accountNumber}
                            </div>
                            <div className="text-gray-500 text-xs">
                              {withdrawal.accountName}
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(withdrawal.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-2">
                          {withdrawal.status === WithdrawalStatus.PENDING && (
                            <>
                              <button
                                onClick={() => handleApprove(withdrawal.id)}
                                disabled={processing === withdrawal.id}
                                className="text-green-600 hover:text-green-800 text-sm font-medium disabled:opacity-50"
                              >
                                {processing === withdrawal.id
                                  ? 'Processing...'
                                  : 'Approve'}
                              </button>
                              <button
                                onClick={() =>
                                  setSelectedWithdrawal(withdrawal)
                                }
                                disabled={processing === withdrawal.id}
                                className="text-red-600 hover:text-red-800 text-sm font-medium disabled:opacity-50"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {withdrawal.status === WithdrawalStatus.APPROVED && (
                            <button
                              onClick={() => setSelectedWithdrawal(withdrawal)}
                              disabled={processing === withdrawal.id}
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium disabled:opacity-50"
                            >
                              Mark Complete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Reject Modal */}
      {selectedWithdrawal &&
        selectedWithdrawal.status === WithdrawalStatus.PENDING && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                Reject Withdrawal
              </h3>
              <p className="text-gray-600 mb-4">
                Provide a reason for rejecting this withdrawal request:
              </p>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g., Insufficient documentation"
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 mb-4"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setSelectedWithdrawal(null);
                    setRejectionReason('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() =>
                    handleReject(selectedWithdrawal.id, rejectionReason)
                  }
                  disabled={!rejectionReason.trim() || processing !== null}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {processing === selectedWithdrawal.id
                    ? 'Processing...'
                    : 'Confirm Rejection'}
                </button>
              </div>
            </div>
          </div>
        )}

      {/* Complete Modal */}
      {selectedWithdrawal &&
        selectedWithdrawal.status === WithdrawalStatus.APPROVED && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                Mark Withdrawal as Complete
              </h3>
              <p className="text-gray-600 mb-4">
                Enter the transaction ID for this withdrawal:
              </p>
              <input
                type="text"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                placeholder="e.g., MPESA123456 or BANK789"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setSelectedWithdrawal(null);
                    setTransactionId('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() =>
                    handleComplete(selectedWithdrawal.id, transactionId)
                  }
                  disabled={!transactionId.trim() || processing !== null}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {processing === selectedWithdrawal.id
                    ? 'Processing...'
                    : 'Mark Complete'}
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
};

export default AdminWithdrawalManagement;
