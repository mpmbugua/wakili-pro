import React, { useState } from 'react';
import {
  LawyerWallet,
  CreateWithdrawalRequestData,
  WithdrawalMethod,
} from '../../types/wallet';
import { walletService } from '../../services/walletService';
import { X, Smartphone, Building2, AlertCircle, Loader2 } from 'lucide-react';

interface WithdrawalRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallet: LawyerWallet;
  onSuccess: () => void;
}

export const WithdrawalRequestModal: React.FC<
  WithdrawalRequestModalProps
> = ({ isOpen, onClose, wallet, onSuccess }) => {
  const [withdrawalMethod, setWithdrawalMethod] = useState<WithdrawalMethod>(
    WithdrawalMethod.MPESA
  );
  const [amount, setAmount] = useState('');
  const [mpesaPhoneNumber, setMpesaPhoneNumber] = useState('');
  const [mpesaName, setMpesaName] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [branchCode, setBranchCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const MIN_WITHDRAWAL = 100;
  const MAX_MPESA = 150000;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const withdrawalAmount = parseFloat(amount);

    // Validation
    if (!withdrawalAmount || withdrawalAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (withdrawalAmount < MIN_WITHDRAWAL) {
      setError(`Minimum withdrawal amount is KES ${MIN_WITHDRAWAL}`);
      return;
    }

    if (withdrawalAmount > wallet.availableBalance) {
      setError('Insufficient available balance');
      return;
    }

    if (
      withdrawalMethod === WithdrawalMethod.MPESA &&
      withdrawalAmount > MAX_MPESA
    ) {
      setError(`M-Pesa maximum is KES ${MAX_MPESA.toLocaleString()}`);
      return;
    }

    if (withdrawalMethod === WithdrawalMethod.MPESA) {
      if (!mpesaPhoneNumber || !mpesaName) {
        setError('Please fill in all M-Pesa details');
        return;
      }
      // Validate phone number format (Kenyan format)
      const phoneRegex = /^(254|0)[17]\d{8}$/;
      if (!phoneRegex.test(mpesaPhoneNumber.replace(/\s/g, ''))) {
        setError('Invalid M-Pesa phone number format (e.g., 254712345678)');
        return;
      }
    }

    if (withdrawalMethod === WithdrawalMethod.BANK_TRANSFER) {
      if (!bankName || !accountNumber || !accountName) {
        setError('Please fill in all bank details');
        return;
      }
    }

    try {
      setLoading(true);

      const data: CreateWithdrawalRequestData = {
        amount: withdrawalAmount,
        withdrawalMethod,
      };

      if (withdrawalMethod === WithdrawalMethod.MPESA) {
        data.mpesaPhoneNumber = mpesaPhoneNumber.replace(/\s/g, '');
        data.mpesaName = mpesaName;
      } else {
        data.bankName = bankName;
        data.accountNumber = accountNumber;
        data.accountName = accountName;
        data.branchCode = branchCode;
      }

      await walletService.createWithdrawalRequest(data);
      onSuccess();
    } catch (err: any) {
      console.error('Error creating withdrawal request:', err);
      setError(
        err.response?.data?.message || 'Failed to create withdrawal request'
      );
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">
            Request Withdrawal
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Available Balance */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mx-6 mt-4">
          <p className="text-sm text-blue-800 font-medium mb-1">
            Available Balance
          </p>
          <p className="text-2xl font-bold text-blue-900">
            {formatCurrency(wallet.availableBalance)}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Withdrawal Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Withdrawal Method
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setWithdrawalMethod(WithdrawalMethod.MPESA)}
                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-lg border-2 transition ${
                  withdrawalMethod === WithdrawalMethod.MPESA
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                }`}
              >
                <Smartphone className="h-5 w-5" />
                <span className="font-medium">M-Pesa</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  setWithdrawalMethod(WithdrawalMethod.BANK_TRANSFER)
                }
                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-lg border-2 transition ${
                  withdrawalMethod === WithdrawalMethod.BANK_TRANSFER
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                }`}
              >
                <Building2 className="h-5 w-5" />
                <span className="font-medium">Bank</span>
              </button>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount (KES)
            </label>
            <input
              type="number"
              step="0.01"
              min={MIN_WITHDRAWAL}
              max={wallet.availableBalance}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g., 5000"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Min: KES {MIN_WITHDRAWAL}
              {withdrawalMethod === WithdrawalMethod.MPESA &&
                ` | Max: KES ${MAX_MPESA.toLocaleString()}`}
            </p>
          </div>

          {/* M-Pesa Details */}
          {withdrawalMethod === WithdrawalMethod.MPESA && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  M-Pesa Phone Number
                </label>
                <input
                  type="tel"
                  value={mpesaPhoneNumber}
                  onChange={(e) => setMpesaPhoneNumber(e.target.value)}
                  placeholder="254712345678"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Format: 254XXXXXXXXX
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  M-Pesa Account Name
                </label>
                <input
                  type="text"
                  value={mpesaName}
                  onChange={(e) => setMpesaName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </>
          )}

          {/* Bank Details */}
          {withdrawalMethod === WithdrawalMethod.BANK_TRANSFER && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bank Name
                </label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="e.g., Equity Bank"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Number
                </label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="0123456789"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Name
                </label>
                <input
                  type="text"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Branch Code (Optional)
                </label>
                <input
                  type="text"
                  value={branchCode}
                  onChange={(e) => setBranchCode(e.target.value)}
                  placeholder="001"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : (
                'Submit Request'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
