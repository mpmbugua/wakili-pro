import React, { useState } from 'react';
import { X, TrendingUp, DollarSign, Crown } from 'lucide-react';
import { Button } from '../ui/Button';

interface CommissionSavingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTier: 'FREE' | 'LITE' | 'PRO';
  monthlyRevenue: number;
  onUpgrade?: () => void;
}

export const CommissionSavingsModal: React.FC<CommissionSavingsModalProps> = ({
  isOpen,
  onClose,
  currentTier,
  monthlyRevenue,
  onUpgrade,
}) => {
  if (!isOpen) return null;

  const [estimatedBookings, setEstimatedBookings] = useState(10);
  const [estimatedCerts, setEstimatedCerts] = useState(3);
  const avgBookingValue = 10000;
  const avgCertValue = 2500;

  const calculateEarnings = (tier: 'FREE' | 'LITE' | 'PRO') => {
    const bookingCommission = tier === 'FREE' ? 0.50 : 0.30;
    const certCommission = tier === 'PRO' ? 0.15 : tier === 'LITE' ? 0.20 : 0.50;
    
    const bookingEarnings = estimatedBookings * avgBookingValue * (1 - bookingCommission) * 0.95; // After WHT
    const certEarnings = estimatedCerts * avgCertValue * (1 - certCommission) * 0.95;
    
    const subscriptionCost = tier === 'FREE' ? 0 : tier === 'LITE' ? 1999 : 4999;
    
    return {
      gross: bookingEarnings + certEarnings,
      subscription: subscriptionCost,
      net: bookingEarnings + certEarnings - subscriptionCost,
    };
  };

  const freeEarnings = calculateEarnings('FREE');
  const liteEarnings = calculateEarnings('LITE');
  const proEarnings = calculateEarnings('PRO');

  const liteSavings = liteEarnings.net - freeEarnings.net;
  const proSavings = proEarnings.net - freeEarnings.net;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 sticky top-0 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Commission Savings Calculator</h2>
                <p className="text-sm text-gray-500">See how much you could save with an upgrade</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Input Sliders */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Monthly Bookings: {estimatedBookings}
              </label>
              <input
                type="range"
                min="1"
                max="30"
                value={estimatedBookings}
                onChange={(e) => setEstimatedBookings(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>1</span>
                <span>30</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Monthly Certifications: {estimatedCerts}
              </label>
              <input
                type="range"
                min="0"
                max="20"
                value={estimatedCerts}
                onChange={(e) => setEstimatedCerts(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0</span>
                <span>20</span>
              </div>
            </div>
          </div>

          {/* Comparison Table */}
          <div className="grid grid-cols-3 gap-4">
            {/* FREE Tier */}
            <div className={`p-4 rounded-lg border-2 ${currentTier === 'FREE' ? 'border-gray-400 bg-gray-50' : 'border-gray-200'}`}>
              <div className="text-center mb-3">
                <h3 className="font-bold text-gray-900">FREE</h3>
                <p className="text-xs text-gray-500">Current Plan</p>
              </div>
              <div className="space-y-2 text-sm">
                <div>
                  <p className="text-gray-600">Gross Income</p>
                  <p className="font-semibold text-gray-900">KES {freeEarnings.gross.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-600">Subscription</p>
                  <p className="font-semibold text-gray-900">KES 0</p>
                </div>
                <div className="pt-2 border-t border-gray-300">
                  <p className="text-gray-600">Net Income</p>
                  <p className="font-bold text-lg text-gray-900">KES {freeEarnings.net.toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* LITE Tier */}
            <div className={`p-4 rounded-lg border-2 ${currentTier === 'LITE' ? 'border-blue-400 bg-blue-50' : 'border-blue-200 hover:border-blue-400 transition-colors'}`}>
              <div className="text-center mb-3">
                <h3 className="font-bold text-blue-900">LITE</h3>
                <p className="text-xs text-blue-600">Recommended</p>
              </div>
              <div className="space-y-2 text-sm">
                <div>
                  <p className="text-gray-600">Gross Income</p>
                  <p className="font-semibold text-gray-900">KES {liteEarnings.gross.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-600">Subscription</p>
                  <p className="font-semibold text-red-600">-KES 1,999</p>
                </div>
                <div className="pt-2 border-t border-blue-300">
                  <p className="text-gray-600">Net Income</p>
                  <p className="font-bold text-lg text-blue-900">KES {liteEarnings.net.toLocaleString()}</p>
                </div>
                {liteSavings > 0 && (
                  <div className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-2 py-1 rounded text-center">
                    +KES {liteSavings.toLocaleString()}/mo
                  </div>
                )}
              </div>
            </div>

            {/* PRO Tier */}
            <div className={`p-4 rounded-lg border-2 ${currentTier === 'PRO' ? 'border-purple-400 bg-purple-50' : 'border-purple-200 hover:border-purple-400 transition-colors'}`}>
              <div className="text-center mb-3">
                <div className="flex items-center justify-center space-x-1">
                  <Crown className="h-4 w-4 text-purple-600" />
                  <h3 className="font-bold text-purple-900">PRO</h3>
                </div>
                <p className="text-xs text-purple-600">Maximum Earnings</p>
              </div>
              <div className="space-y-2 text-sm">
                <div>
                  <p className="text-gray-600">Gross Income</p>
                  <p className="font-semibold text-gray-900">KES {proEarnings.gross.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-600">Subscription</p>
                  <p className="font-semibold text-red-600">-KES 4,999</p>
                </div>
                <div className="pt-2 border-t border-purple-300">
                  <p className="text-gray-600">Net Income</p>
                  <p className="font-bold text-lg text-purple-900">KES {proEarnings.net.toLocaleString()}</p>
                </div>
                {proSavings > 0 && (
                  <div className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-2 py-1 rounded text-center">
                    +KES {proSavings.toLocaleString()}/mo
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Commission Breakdown */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-3 text-sm">Commission Rates</h4>
            <div className="grid grid-cols-3 gap-4 text-xs">
              <div>
                <p className="text-gray-600 mb-1">FREE Tier</p>
                <p className="font-semibold text-red-600">50% on all services</p>
              </div>
              <div>
                <p className="text-gray-600 mb-1">LITE Tier</p>
                <p className="font-semibold text-blue-600">30% bookings, 20% certs</p>
              </div>
              <div>
                <p className="text-gray-600 mb-1">PRO Tier</p>
                <p className="font-semibold text-purple-600">30% bookings, 15% certs</p>
              </div>
            </div>
          </div>

          {currentTier !== 'PRO' && (
            <div className="flex items-start space-x-2 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
              <TrendingUp className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-semibold text-emerald-900">
                  {currentTier === 'FREE' && liteSavings > 0
                    ? `You could earn KES ${liteSavings.toLocaleString()} more per month with LITE!`
                    : currentTier === 'LITE' && proSavings > liteSavings
                    ? `Unlock KES ${(proSavings - liteSavings).toLocaleString()} extra with PRO!`
                    : 'Maximize your earnings with an upgrade!'}
                </p>
                <p className="text-emerald-700 mt-1">
                  Lower commissions mean more money in your pocket.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 rounded-b-xl border-t border-gray-200 flex justify-between">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {currentTier !== 'PRO' && (
            <Button 
              variant="primary" 
              onClick={() => {
                onUpgrade?.();
                onClose();
              }}
            >
              {currentTier === 'FREE' ? 'Upgrade to LITE' : 'Upgrade to PRO'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
