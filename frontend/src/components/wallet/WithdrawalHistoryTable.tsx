import React from 'react';
import { WithdrawalRequest, WithdrawalStatus } from '../../types/wallet';
import {
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Loader2,
  Smartphone,
  Building2,
  X,
} from 'lucide-react';
import { format } from 'date-fns';

interface WithdrawalHistoryTableProps {
  withdrawals: WithdrawalRequest[];
  onCancelWithdrawal: (id: string) => void;
  onRefresh: () => void;
}

export const WithdrawalHistoryTable: React.FC<
  WithdrawalHistoryTableProps
> = ({ withdrawals, onCancelWithdrawal }) => {
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
        icon: X,
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

  const canCancel = (withdrawal: WithdrawalRequest) => {
    return withdrawal.status === WithdrawalStatus.PENDING;
  };

  if (withdrawals.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto h-16 w-16 text-gray-300 mb-4">
          <svg
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            className="h-full w-full"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <p className="text-gray-500 text-lg mb-2">No withdrawal requests</p>
        <p className="text-gray-400 text-sm">
          Your withdrawal history will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Date
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Amount
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Method
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Details
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Status
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {withdrawals.map((withdrawal) => (
            <tr key={withdrawal.id} className="hover:bg-gray-50 transition">
              <td className="px-4 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">
                  {format(new Date(withdrawal.requestedAt), 'MMM dd, yyyy')}
                </div>
                <div className="text-xs text-gray-500">
                  {format(new Date(withdrawal.requestedAt), 'HH:mm')}
                </div>
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                <div className="text-sm font-semibold text-gray-900">
                  {formatCurrency(Number(withdrawal.amount))}
                </div>
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                <div className="flex items-center gap-2">
                  {withdrawal.withdrawalMethod === 'MPESA' ? (
                    <>
                      <Smartphone className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-gray-700">M-Pesa</span>
                    </>
                  ) : (
                    <>
                      <Building2 className="h-4 w-4 text-blue-600" />
                      <span className="text-sm text-gray-700">Bank</span>
                    </>
                  )}
                </div>
              </td>
              <td className="px-4 py-4">
                {withdrawal.withdrawalMethod === 'MPESA' ? (
                  <div className="text-sm">
                    <div className="text-gray-900">
                      {withdrawal.mpesaPhoneNumber}
                    </div>
                    <div className="text-gray-500 text-xs">
                      {withdrawal.mpesaName}
                    </div>
                  </div>
                ) : (
                  <div className="text-sm">
                    <div className="text-gray-900">{withdrawal.bankName}</div>
                    <div className="text-gray-500 text-xs">
                      A/C: {withdrawal.accountNumber}
                    </div>
                  </div>
                )}
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                {getStatusBadge(withdrawal.status)}
                {withdrawal.rejectionReason && (
                  <div className="text-xs text-red-600 mt-1 max-w-xs">
                    {withdrawal.rejectionReason}
                  </div>
                )}
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                {canCancel(withdrawal) && (
                  <button
                    onClick={() => {
                      if (
                        window.confirm(
                          'Are you sure you want to cancel this withdrawal request?'
                        )
                      ) {
                        onCancelWithdrawal(withdrawal.id);
                      }
                    }}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    Cancel
                  </button>
                )}
                {withdrawal.status === WithdrawalStatus.COMPLETED && (
                  <div className="text-sm text-gray-500">
                    {withdrawal.completedAt &&
                      format(new Date(withdrawal.completedAt), 'MMM dd, yyyy')}
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
