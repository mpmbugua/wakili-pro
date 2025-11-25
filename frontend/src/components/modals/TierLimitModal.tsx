import React, { useState } from 'react';
import { X, AlertCircle, Check, Crown, Zap } from 'lucide-react';
import { Button } from '../ui/Button';

interface TierLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  limitType: 'bookings' | 'certifications' | 'services';
  currentTier: 'FREE' | 'LITE' | 'PRO';
  currentUsage: number;
  limit: number;
  onUpgrade?: () => void;
}

export const TierLimitModal: React.FC<TierLimitModalProps> = ({
  isOpen,
  onClose,
  limitType,
  currentTier,
  currentUsage,
  limit,
  onUpgrade,
}) => {
  if (!isOpen) return null;

  const getLimitText = () => {
    switch (limitType) {
      case 'bookings':
        return {
          title: 'Monthly Booking Limit Reached',
          description: `You've used ${currentUsage} of ${limit} bookings this month.`,
          nextTier: currentTier === 'FREE' ? 'LITE' : 'PRO',
          nextLimit: currentTier === 'FREE' ? '10 bookings/month' : 'Unlimited bookings',
        };
      case 'certifications':
        return {
          title: 'Monthly Certification Limit Reached',
          description: `You've used ${currentUsage} of ${limit} certifications this month.`,
          nextTier: 'PRO',
          nextLimit: 'Unlimited certifications',
        };
      case 'services':
        return {
          title: 'Monthly Service Limit Reached',
          description: `You've used ${currentUsage} of ${limit} marketplace services this month.`,
          nextTier: currentTier === 'FREE' ? 'LITE' : 'PRO',
          nextLimit: currentTier === 'FREE' ? '5 services/month' : 'Unlimited services',
        };
    }
  };

  const content = getLimitText();

  const tierFeatures = {
    LITE: [
      '10 bookings per month',
      '5 certifications per month',
      '5 marketplace services',
      '2 specializations',
      '30% commission (vs 50% on FREE)',
    ],
    PRO: [
      'Unlimited bookings',
      'Unlimited certifications',
      'Unlimited services',
      'Unlimited specializations',
      '15-30% commission',
      '5-min certification early access',
      'Firm letterhead integration',
      'Priority support',
    ],
  };

  const nextTierPrice = content.nextTier === 'LITE' ? 'KES 1,999/month' : 'KES 4,999/month';
  const features = tierFeatures[content.nextTier as 'LITE' | 'PRO'];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-lg w-full shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{content.title}</h2>
                <p className="text-sm text-gray-500">{content.description}</p>
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
        <div className="p-6">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mb-6 border border-blue-200">
            <div className="flex items-center space-x-2 mb-2">
              <Crown className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900">
                Upgrade to {content.nextTier}
              </h3>
              <span className="ml-auto text-sm font-medium text-blue-600">
                {nextTierPrice}
              </span>
            </div>
            <p className="text-sm text-gray-600">
              Get {content.nextLimit} and unlock more features
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900 text-sm">
              What you'll get with {content.nextTier}:
            </h4>
            {features.map((feature, index) => (
              <div key={index} className="flex items-start space-x-2">
                <Check className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-700">{feature}</span>
              </div>
            ))}
          </div>

          {currentTier === 'FREE' && (
            <div className="mt-4 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
              <div className="flex items-start space-x-2">
                <Zap className="h-4 w-4 text-emerald-600 mt-0.5" />
                <p className="text-sm text-emerald-800">
                  <span className="font-semibold">Break-even at just 2 bookings!</span>
                  <br />
                  Save 20% on commissions vs FREE tier
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 rounded-b-xl border-t border-gray-200 flex justify-between">
          <Button variant="outline" onClick={onClose}>
            Maybe Later
          </Button>
          <Button 
            variant="primary" 
            onClick={() => {
              onUpgrade?.();
              onClose();
            }}
          >
            Upgrade to {content.nextTier}
          </Button>
        </div>
      </div>
    </div>
  );
};
