import React, { useEffect } from 'react';
import { X, Crown, Shield, Zap, CheckCircle, TrendingUp } from 'lucide-react';
import { Button } from './ui/Button';
import { trackUpgradePromptShown, trackUpgradePromptDismissed } from '../services/analyticsService';

interface UpgradePromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTier: 'FREE' | 'LITE' | 'PRO';
  quotaType?: 'ai_review' | 'pdf_download';
  onUpgrade: (tier: 'LITE' | 'PRO') => void;
}

interface TierFeature {
  name: string;
  free: boolean | string;
  lite: boolean | string;
  pro: boolean | string;
}

export const UpgradePromptModal: React.FC<UpgradePromptModalProps> = ({
  isOpen,
  onClose,
  currentTier,
  quotaType,
  onUpgrade
}) => {
  useEffect(() => {
    if (isOpen) {
      // Track modal shown
      trackUpgradePromptShown(currentTier, quotaType).catch(err => 
        console.warn('[Analytics] Failed to track upgrade prompt shown:', err)
      );
      
      const dismissalKey = `upgrade_prompt_dismissed_${currentTier}`;
      const lastDismissed = localStorage.getItem(dismissalKey);
      
      // If dismissed less than 7 days ago, auto-close
      if (lastDismissed) {
        const daysSinceDismissal = (Date.now() - parseInt(lastDismissed)) / (1000 * 60 * 60 * 24);
        if (daysSinceDismissal < 7) {
          onClose();
        }
      }
    }
  }, [isOpen, currentTier, quotaType, onClose]);

  const handleDismiss = () => {
    // Track dismissal
    trackUpgradePromptDismissed(currentTier, quotaType).catch(err =>
      console.warn('[Analytics] Failed to track upgrade prompt dismissed:', err)
    );
    
    const dismissalKey = `upgrade_prompt_dismissed_${currentTier}`;
    localStorage.setItem(dismissalKey, Date.now().toString());
    onClose();
  };

  const handleUpgrade = (tier: 'LITE' | 'PRO') => {
    onUpgrade(tier);
  };

  if (!isOpen) return null;

  const features: TierFeature[] = [
    {
      name: 'AI Reviews per Month',
      free: '5',
      lite: '15',
      pro: 'Unlimited'
    },
    {
      name: 'PDF Downloads per Month',
      free: '3',
      lite: '10',
      pro: 'Unlimited'
    },
    {
      name: 'Platform Commission',
      free: '50%',
      lite: '35%',
      pro: '20%'
    },
    {
      name: 'Consultation Bookings',
      free: '2 total',
      lite: 'Unlimited',
      pro: 'Unlimited'
    },
    {
      name: 'Document Certifications',
      free: 'Blocked',
      lite: 'Unlimited',
      pro: 'Unlimited'
    },
    {
      name: 'Service Request Quotes',
      free: true,
      lite: true,
      pro: true
    },
    {
      name: 'Priority Support',
      free: false,
      lite: true,
      pro: true
    },
    {
      name: 'Analytics Dashboard',
      free: false,
      lite: false,
      pro: true
    }
  ];

  const quotaExhaustedMessage = quotaType === 'ai_review' 
    ? "You've used all your AI reviews for this month"
    : quotaType === 'pdf_download'
    ? "You've used all your PDF downloads for this month"
    : "Upgrade to unlock more features";

  const calculateROI = (tier: 'LITE' | 'PRO') => {
    if (tier === 'LITE') {
      const aiReviewValue = 15 * 500; // 15 AI reviews × KES 500
      const pdfDownloadValue = 10 * 1000; // 10 PDFs × avg KES 1,000
      const totalValue = aiReviewValue + pdfDownloadValue;
      const monthlyCost = 2999;
      const savings = totalValue - monthlyCost;
      return {
        totalValue,
        monthlyCost,
        savings,
        roi: ((savings / monthlyCost) * 100).toFixed(0)
      };
    } else {
      // PRO tier - Unlimited usage + 30% commission savings
      const avgMonthlyRevenue = 50000; // Assume avg lawyer makes KES 50k/month
      const freeCommission = avgMonthlyRevenue * 0.50; // KES 25,000
      const proCommission = avgMonthlyRevenue * 0.20; // KES 10,000
      const commissionSavings = freeCommission - proCommission; // KES 15,000
      const monthlyCost = 4999;
      const netSavings = commissionSavings - monthlyCost; // KES 10,001
      return {
        totalValue: commissionSavings,
        monthlyCost,
        savings: netSavings,
        roi: ((netSavings / monthlyCost) * 100).toFixed(0)
      };
    }
  };

  const liteROI = calculateROI('LITE');
  const proROI = calculateROI('PRO');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-1">Upgrade Your Account</h2>
              <p className="text-blue-100">{quotaExhaustedMessage}</p>
            </div>
            <button
              onClick={handleDismiss}
              className="text-white hover:bg-white/20 rounded-full p-2 transition"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Current Tier Badge */}
        <div className="px-6 pt-4">
          <div className="inline-flex items-center space-x-2 px-4 py-2 bg-gray-100 rounded-full">
            <Zap className="h-4 w-4 text-gray-600" />
            <span className="text-sm font-semibold text-gray-700">Current: {currentTier} Tier</span>
          </div>
        </div>

        {/* Tier Comparison Table */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* FREE Tier Column */}
            <div className="border-2 border-gray-200 rounded-xl p-6 bg-gray-50">
              <div className="flex items-center justify-center mb-4">
                <Zap className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-center mb-2">FREE</h3>
              <p className="text-3xl font-bold text-center mb-4">KES 0<span className="text-sm text-gray-500">/mo</span></p>
              <p className="text-sm text-gray-600 text-center mb-4">Explore the platform</p>
              {currentTier === 'FREE' && (
                <div className="bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full text-center">
                  Current Plan
                </div>
              )}
            </div>

            {/* LITE Tier Column */}
            <div className="border-2 border-emerald-500 rounded-xl p-6 bg-emerald-50 relative">
              {currentTier === 'FREE' && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <span className="bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    RECOMMENDED
                  </span>
                </div>
              )}
              <div className="flex items-center justify-center mb-4">
                <Shield className="h-8 w-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-center mb-2">LITE</h3>
              <p className="text-3xl font-bold text-center mb-1">KES 2,999<span className="text-sm text-gray-500">/mo</span></p>
              
              {/* ROI Calculator */}
              <div className="bg-emerald-100 border border-emerald-300 rounded-lg p-3 my-4">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-emerald-800">Value:</span>
                  <span className="font-semibold text-emerald-900">KES {liteROI.totalValue.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-emerald-800">Cost:</span>
                  <span className="font-semibold text-emerald-900">KES {liteROI.monthlyCost.toLocaleString()}</span>
                </div>
                <div className="border-t border-emerald-300 my-2"></div>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold text-emerald-900">Savings:</span>
                  <span className="font-bold text-emerald-600">KES {liteROI.savings.toLocaleString()}</span>
                </div>
                <p className="text-xs text-emerald-700 text-center mt-2">
                  <TrendingUp className="h-3 w-3 inline mr-1" />
                  {liteROI.roi}% ROI
                </p>
              </div>

              <Button
                variant="primary"
                className="w-full bg-emerald-600 hover:bg-emerald-700 mb-2"
                onClick={() => handleUpgrade('LITE')}
              >
                <Crown className="h-4 w-4 mr-2" />
                Upgrade to LITE
              </Button>
              {currentTier === 'LITE' && (
                <div className="bg-emerald-200 text-emerald-800 text-xs font-semibold px-3 py-1 rounded-full text-center">
                  Current Plan
                </div>
              )}
            </div>

            {/* PRO Tier Column */}
            <div className="border-2 border-purple-500 rounded-xl p-6 bg-purple-50">
              <div className="flex items-center justify-center mb-4">
                <Crown className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-center mb-2">PRO</h3>
              <p className="text-3xl font-bold text-center mb-1">KES 4,999<span className="text-sm text-gray-500">/mo</span></p>
              
              {/* ROI Calculator */}
              <div className="bg-purple-100 border border-purple-300 rounded-lg p-3 my-4">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-purple-800">Commission Savings:</span>
                  <span className="font-semibold text-purple-900">KES {proROI.totalValue.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-purple-800">Cost:</span>
                  <span className="font-semibold text-purple-900">KES {proROI.monthlyCost.toLocaleString()}</span>
                </div>
                <div className="border-t border-purple-300 my-2"></div>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold text-purple-900">Net Savings:</span>
                  <span className="font-bold text-purple-600">KES {proROI.savings.toLocaleString()}</span>
                </div>
                <p className="text-xs text-purple-700 text-center mt-2">
                  <TrendingUp className="h-3 w-3 inline mr-1" />
                  {proROI.roi}% ROI (on KES 50k revenue)
                </p>
              </div>

              <Button
                variant="primary"
                className="w-full bg-purple-600 hover:bg-purple-700 mb-2"
                onClick={() => handleUpgrade('PRO')}
              >
                <Crown className="h-4 w-4 mr-2" />
                Upgrade to PRO
              </Button>
              {currentTier === 'PRO' && (
                <div className="bg-purple-200 text-purple-800 text-xs font-semibold px-3 py-1 rounded-full text-center">
                  Current Plan
                </div>
              )}
            </div>
          </div>

          {/* Features Comparison */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-300">
                  <th className="text-left p-3 font-semibold text-gray-700">Feature</th>
                  <th className="text-center p-3 font-semibold text-gray-700">FREE</th>
                  <th className="text-center p-3 font-semibold text-emerald-700">LITE</th>
                  <th className="text-center p-3 font-semibold text-purple-700">PRO</th>
                </tr>
              </thead>
              <tbody>
                {features.map((feature, index) => (
                  <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="p-3 text-sm text-gray-800">{feature.name}</td>
                    <td className="p-3 text-center text-sm">
                      {typeof feature.free === 'boolean' ? (
                        feature.free ? (
                          <CheckCircle className="h-5 w-5 text-green-600 mx-auto" />
                        ) : (
                          <X className="h-5 w-5 text-red-400 mx-auto" />
                        )
                      ) : (
                        <span className="text-gray-700">{feature.free}</span>
                      )}
                    </td>
                    <td className="p-3 text-center text-sm">
                      {typeof feature.lite === 'boolean' ? (
                        feature.lite ? (
                          <CheckCircle className="h-5 w-5 text-emerald-600 mx-auto" />
                        ) : (
                          <X className="h-5 w-5 text-red-400 mx-auto" />
                        )
                      ) : (
                        <span className="text-emerald-700 font-semibold">{feature.lite}</span>
                      )}
                    </td>
                    <td className="p-3 text-center text-sm">
                      {typeof feature.pro === 'boolean' ? (
                        feature.pro ? (
                          <CheckCircle className="h-5 w-5 text-purple-600 mx-auto" />
                        ) : (
                          <X className="h-5 w-5 text-red-400 mx-auto" />
                        )
                      ) : (
                        <span className="text-purple-700 font-semibold">{feature.pro}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Quota Reset Info */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>ℹ️ Monthly Quotas:</strong> AI reviews and PDF download quotas reset automatically on the 1st of each month at 12:01 AM. You'll receive an email notification when your quotas refresh.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-2xl border-t border-gray-200">
          <div className="flex items-center justify-between">
            <button
              onClick={handleDismiss}
              className="text-gray-600 hover:text-gray-800 text-sm font-medium"
            >
              Remind me in 7 days
            </button>
            <p className="text-xs text-gray-500">
              Questions? Contact support@wakilipro.com
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
