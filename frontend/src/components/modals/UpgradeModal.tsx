import React, { useState } from 'react';
import { X, Crown, Shield, Check, Zap, TrendingUp } from 'lucide-react';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTier: 'FREE' | 'LITE' | 'PRO';
}

type BillingCycle = 'monthly' | '3months' | '6months' | 'yearly';

export const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose, currentTier }) => {
  const [selectedCycle, setSelectedCycle] = useState<BillingCycle>('monthly');

  if (!isOpen) return null;

  const pricing = {
    LITE: {
      monthly: 2999,
      '3months': 2699, // 10% discount
      '6months': 2549, // 15% discount
      yearly: 2399 // 20% discount
    },
    PRO: {
      monthly: 6999,
      '3months': 6299, // 10% discount
      '6months': 5949, // 15% discount
      yearly: 5599 // 20% discount
    }
  };

  const getDiscount = (cycle: BillingCycle) => {
    switch (cycle) {
      case '3months': return '10% OFF';
      case '6months': return '15% OFF';
      case 'yearly': return '20% OFF';
      default: return null;
    }
  };

  const getCycleDuration = (cycle: BillingCycle) => {
    switch (cycle) {
      case 'monthly': return '1 Month';
      case '3months': return '3 Months';
      case '6months': return '6 Months';
      case 'yearly': return '12 Months';
    }
  };

  const getTotalPrice = (tier: 'LITE' | 'PRO', cycle: BillingCycle) => {
    const monthlyPrice = pricing[tier][cycle];
    const months = cycle === 'monthly' ? 1 : cycle === '3months' ? 3 : cycle === '6months' ? 6 : 12;
    return monthlyPrice * months;
  };

  const getSavings = (tier: 'LITE' | 'PRO', cycle: BillingCycle) => {
    if (cycle === 'monthly') return 0;
    const monthlyPrice = pricing[tier].monthly;
    const discountedPrice = pricing[tier][cycle];
    const months = cycle === '3months' ? 3 : cycle === '6months' ? 6 : 12;
    return (monthlyPrice - discountedPrice) * months;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-2xl relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-2">🎉 You've Explored the Platform!</h2>
            <p className="text-blue-100">Upgrade to unlock unlimited access to all features</p>
          </div>
        </div>

        {/* Billing Cycle Selector */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-wrap justify-center gap-3">
            {(['monthly', '3months', '6months', 'yearly'] as BillingCycle[]).map((cycle) => (
              <button
                key={cycle}
                onClick={() => setSelectedCycle(cycle)}
                className={`px-6 py-3 rounded-lg font-semibold transition-all relative ${
                  selectedCycle === cycle
                    ? 'bg-blue-600 text-white shadow-lg scale-105'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {getCycleDuration(cycle)}
                {getDiscount(cycle) && (
                  <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                    {getDiscount(cycle)}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* LITE Plan */}
          <div className="border-2 border-blue-300 rounded-2xl p-6 bg-gradient-to-b from-blue-50 to-white hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-blue-100 p-3 rounded-full">
                <Shield className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">LITE</h3>
                <p className="text-sm text-gray-600">Perfect for growing practices</p>
              </div>
            </div>

            {/* Price */}
            <div className="mb-6">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-gray-900">
                  KES {pricing.LITE[selectedCycle].toLocaleString()}
                </span>
                <span className="text-gray-600">/month</span>
              </div>
              {selectedCycle !== 'monthly' && (
                <div className="mt-2">
                  <p className="text-sm text-gray-600">
                    Total: KES {getTotalPrice('LITE', selectedCycle).toLocaleString()} for {getCycleDuration(selectedCycle)}
                  </p>
                  <p className="text-sm font-semibold text-green-600">
                    Save KES {getSavings('LITE', selectedCycle).toLocaleString()}!
                  </p>
                </div>
              )}
            </div>

            {/* Features */}
            <div className="space-y-3 mb-6">
              <div className="flex items-start gap-2">
                <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700"><strong>10 consultations</strong> per month</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700"><strong>5 certifications</strong> per month</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700"><strong>5 service types</strong></span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700"><strong>3 specializations</strong></span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700"><strong>30% commission</strong> (down from 50%)</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700">Priority support</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700">Analytics dashboard</span>
              </div>
            </div>

            <button
              onClick={() => {
                // TODO: Implement Stripe checkout
                alert(`Upgrade to LITE (${getCycleDuration(selectedCycle)}) - KES ${getTotalPrice('LITE', selectedCycle).toLocaleString()}`);
              }}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Upgrade to LITE
            </button>
          </div>

          {/* PRO Plan */}
          <div className="border-2 border-purple-300 rounded-2xl p-6 bg-gradient-to-b from-purple-50 to-white hover:shadow-xl transition-shadow relative">
            {/* Most Popular Badge */}
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-1 rounded-full text-xs font-semibold">
              MOST POPULAR
            </div>

            <div className="flex items-center gap-3 mb-4 mt-2">
              <div className="bg-purple-100 p-3 rounded-full">
                <Crown className="h-8 w-8 text-purple-600" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">PRO</h3>
                <p className="text-sm text-gray-600">For serious professionals</p>
              </div>
            </div>

            {/* Price */}
            <div className="mb-6">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-gray-900">
                  KES {pricing.PRO[selectedCycle].toLocaleString()}
                </span>
                <span className="text-gray-600">/month</span>
              </div>
              {selectedCycle !== 'monthly' && (
                <div className="mt-2">
                  <p className="text-sm text-gray-600">
                    Total: KES {getTotalPrice('PRO', selectedCycle).toLocaleString()} for {getCycleDuration(selectedCycle)}
                  </p>
                  <p className="text-sm font-semibold text-green-600">
                    Save KES {getSavings('PRO', selectedCycle).toLocaleString()}!
                  </p>
                </div>
              )}
            </div>

            {/* Features */}
            <div className="space-y-3 mb-6">
              <div className="flex items-start gap-2">
                <Zap className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700"><strong>Unlimited consultations</strong></span>
              </div>
              <div className="flex items-start gap-2">
                <Zap className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700"><strong>Unlimited certifications</strong></span>
              </div>
              <div className="flex items-start gap-2">
                <Zap className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700"><strong>Unlimited services</strong></span>
              </div>
              <div className="flex items-start gap-2">
                <Zap className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700"><strong>10 specializations</strong></span>
              </div>
              <div className="flex items-start gap-2">
                <TrendingUp className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700"><strong>15% commission</strong> (lowest rate!)</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700">Priority assignment</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700">Advanced analytics</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700">Premium support (24/7)</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700">Featured profile listing</span>
              </div>
            </div>

            <button
              onClick={() => {
                // TODO: Implement Stripe checkout
                alert(`Upgrade to PRO (${getCycleDuration(selectedCycle)}) - KES ${getTotalPrice('PRO', selectedCycle).toLocaleString()}`);
              }}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all"
            >
              Upgrade to PRO
            </button>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="p-6 bg-gray-50 rounded-b-2xl">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 text-center">Feature Comparison</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-300">
                  <th className="text-left py-3 px-4">Feature</th>
                  <th className="text-center py-3 px-4 text-gray-500">FREE</th>
                  <th className="text-center py-3 px-4 text-blue-600">LITE</th>
                  <th className="text-center py-3 px-4 text-purple-600">PRO</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-200">
                  <td className="py-3 px-4">Monthly Consultations</td>
                  <td className="text-center py-3 px-4 text-gray-500">2</td>
                  <td className="text-center py-3 px-4 text-blue-600 font-semibold">10</td>
                  <td className="text-center py-3 px-4 text-purple-600 font-semibold">Unlimited</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-3 px-4">Monthly Certifications</td>
                  <td className="text-center py-3 px-4 text-gray-500">2</td>
                  <td className="text-center py-3 px-4 text-blue-600 font-semibold">5</td>
                  <td className="text-center py-3 px-4 text-purple-600 font-semibold">Unlimited</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-3 px-4">Service Types</td>
                  <td className="text-center py-3 px-4 text-gray-500">2</td>
                  <td className="text-center py-3 px-4 text-blue-600 font-semibold">5</td>
                  <td className="text-center py-3 px-4 text-purple-600 font-semibold">Unlimited</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-3 px-4">Specializations</td>
                  <td className="text-center py-3 px-4 text-gray-500">2</td>
                  <td className="text-center py-3 px-4 text-blue-600 font-semibold">3</td>
                  <td className="text-center py-3 px-4 text-purple-600 font-semibold">10</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-3 px-4">Platform Commission</td>
                  <td className="text-center py-3 px-4 text-gray-500">50%</td>
                  <td className="text-center py-3 px-4 text-blue-600 font-semibold">30%</td>
                  <td className="text-center py-3 px-4 text-purple-600 font-semibold">15%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
