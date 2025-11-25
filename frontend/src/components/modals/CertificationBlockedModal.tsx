import React from 'react';
import { X, Lock, Crown, Check } from 'lucide-react';
import { Button } from '../ui/Button';

interface CertificationBlockedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade?: () => void;
}

export const CertificationBlockedModal: React.FC<CertificationBlockedModalProps> = ({
  isOpen,
  onClose,
  onUpgrade,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-lg w-full shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <Lock className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Certifications Locked</h2>
                <p className="text-sm text-gray-500">Upgrade to access document certifications</p>
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
          <p className="text-gray-700 mb-6">
            Document certification is a premium feature available to LITE and PRO tier lawyers.
            Earn additional income by certifying client documents.
          </p>

          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mb-6 border border-blue-200">
            <div className="flex items-center space-x-2 mb-3">
              <Crown className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900">Upgrade to LITE</h3>
              <span className="ml-auto text-sm font-medium text-blue-600">
                KES 1,999/month
              </span>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-start space-x-2">
                <Check className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-700">
                  <span className="font-semibold">5 certifications per month</span> - Earn KES 2,000-3,000 per certification
                </span>
              </div>
              <div className="flex items-start space-x-2">
                <Check className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-700">
                  <span className="font-semibold">20% platform commission</span> (vs 50% on consultations)
                </span>
              </div>
              <div className="flex items-start space-x-2">
                <Check className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-700">10 monthly bookings</span>
              </div>
              <div className="flex items-start space-x-2">
                <Check className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-700">30% commission rate (vs 50% FREE)</span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
            <p className="text-sm text-emerald-800">
              <span className="font-semibold">ROI Example:</span> Just 1 certification pays for your monthly subscription!
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 rounded-b-xl border-t border-gray-200 flex justify-between">
          <Button variant="outline" onClick={onClose}>
            Not Now
          </Button>
          <Button 
            variant="primary" 
            onClick={() => {
              onUpgrade?.();
              onClose();
            }}
          >
            Upgrade to LITE
          </Button>
        </div>
      </div>
    </div>
  );
};
