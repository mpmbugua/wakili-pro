import React from 'react';
import { WithdrawalStats } from '../../types/wallet';
import {
  CheckCircle,
  Clock,
  TrendingUp,
} from 'lucide-react';

interface WithdrawalStatsCardsProps {
  stats: WithdrawalStats;
}

export const WithdrawalStatsCards: React.FC<WithdrawalStatsCardsProps> = ({
  stats,
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      {/* Total Requested */}
      <div className="bg-white rounded-lg shadow-md p-5 border-l-4 border-blue-500">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-1">Total Requested</p>
            <p className="text-2xl font-bold text-gray-800">
              {formatCurrency(stats.totalRequested)}
            </p>
          </div>
          <TrendingUp className="h-8 w-8 text-blue-500 opacity-70" />
        </div>
      </div>

      {/* Completed */}
      <div className="bg-white rounded-lg shadow-md p-5 border-l-4 border-green-500">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-1">Completed</p>
            <p className="text-2xl font-bold text-gray-800">
              {formatCurrency(stats.totalCompleted)}
            </p>
          </div>
          <CheckCircle className="h-8 w-8 text-green-500 opacity-70" />
        </div>
      </div>

      {/* Pending */}
      <div className="bg-white rounded-lg shadow-md p-5 border-l-4 border-amber-500">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-1">Pending</p>
            <p className="text-2xl font-bold text-gray-800">
              {formatCurrency(stats.totalPending)}
            </p>
          </div>
          <Clock className="h-8 w-8 text-amber-500 opacity-70" />
        </div>
      </div>

      {/* Success Rate */}
      <div className="bg-white rounded-lg shadow-md p-5 border-l-4 border-purple-500">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-1">Success Rate</p>
            <p className="text-2xl font-bold text-gray-800">
              {stats.successRate ? stats.successRate.toFixed(1) : '0.0'}%
            </p>
          </div>
          <div className="relative">
            <div className="h-8 w-8 rounded-full border-4 border-purple-500 opacity-70"></div>
          </div>
        </div>
      </div>
    </div>
  );
};
