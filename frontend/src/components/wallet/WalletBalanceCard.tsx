import React from 'react';
import { LawyerWallet } from '../../types/wallet';
import { Lock, TrendingUp, DollarSign } from 'lucide-react';

interface WalletBalanceCardProps {
  wallet: LawyerWallet;
}

export const WalletBalanceCard: React.FC<WalletBalanceCardProps> = ({
  wallet,
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {/* Total Balance */}
      <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            <h3 className="text-sm font-medium opacity-90">Total Balance</h3>
          </div>
        </div>
        <p className="text-3xl font-bold mb-2">
          {formatCurrency(wallet.balance)}
        </p>
        <p className="text-sm opacity-80">Total earnings to date</p>
      </div>

      {/* Pending Balance (In Escrow) */}
      <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            <h3 className="text-sm font-medium opacity-90">
              Pending (Escrow)
            </h3>
          </div>
        </div>
        <p className="text-3xl font-bold mb-2">
          {formatCurrency(wallet.pendingBalance)}
        </p>
        <p className="text-sm opacity-80">
          Held until consultation confirmed
        </p>
      </div>

      {/* Available Balance */}
      <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            <h3 className="text-sm font-medium opacity-90">
              Available to Withdraw
            </h3>
          </div>
        </div>
        <p className="text-3xl font-bold mb-2">
          {formatCurrency(wallet.availableBalance)}
        </p>
        <p className="text-sm opacity-80">Ready for withdrawal</p>
      </div>
    </div>
  );
};
