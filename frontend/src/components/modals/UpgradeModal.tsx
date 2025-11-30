import React, { useState } from 'react';
import { X, Crown, Shield, Check, Zap, TrendingUp, Loader2, Phone } from 'lucide-react';
import axiosInstance from '../../lib/axios';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTier: 'FREE' | 'LITE' | 'PRO';
}

type BillingCycle = 'monthly' | '3months' | '6months' | 'yearly';

export const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose, currentTier }) => {
  const [selectedCycle, setSelectedCycle] = useState<BillingCycle>('monthly');
  const [selectedTier, setSelectedTier] = useState<'LITE' | 'PRO' | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [showPaymentPrompt, setShowPaymentPrompt] = useState(false);

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

  const handleUpgradeClick = (tier: 'LITE' | 'PRO') => {
    setSelectedTier(tier);
    setError('');
  };

  const handleProcessPayment = async () => {
    if (!selectedTier) return;
    
    if (!phoneNumber) {
      setError('Please enter your M-Pesa phone number');
      return;
    }

    // Validate phone number format (254...)
    const phoneRegex = /^254[17]\d{8}$/;
    if (!phoneRegex.test(phoneNumber)) {
      setError('Please enter a valid Kenyan phone number (e.g., 254712345678)');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      const response = await axiosInstance.post('/subscriptions/upgrade', {
        targetTier: selectedTier,
        phoneNumber,
        billingCycle: selectedCycle
      });

      if (response.data.success && response.data.paymentRequired) {
        setShowPaymentPrompt(true);
        // Poll for payment status
        pollPaymentStatus(response.data.subscriptionId);
      } else if (response.data.success) {
        alert('Upgrade successful!');
        window.location.reload();
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to initiate upgrade. Please try again.');
      setIsProcessing(false);
    }
  };

  const pollPaymentStatus = async (subscriptionId: string) => {
    let attempts = 0;
    const maxAttempts = 60; // Poll for 1 minute
    
    const poll = setInterval(async () => {
      attempts++;
      
      try {
        const response = await axiosInstance.get(`/subscriptions/payment-status/${subscriptionId}`);
        
        if (response.data.success && response.data.data.status === 'ACTIVE') {
          clearInterval(poll);
          setIsProcessing(false);
          setShowPaymentPrompt(false);
          alert('🎉 Upgrade successful! Your tier has been updated.');
          window.location.reload();
        } else if (attempts >= maxAttempts) {
          clearInterval(poll);
          setIsProcessing(false);
          setShowPaymentPrompt(false);
          setError('Payment verification timeout. Please check your transaction status.');
        }
      } catch (err) {
        console.error('Error polling payment status:', err);
      }
    }, 1000);
  };

  const resetPaymentForm = () => {
    setSelectedTier(null);
    setPhoneNumber('');
    setError('');
    setShowPaymentPrompt(false);
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
              onClick={() => handleUpgradeClick('LITE')}
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
              onClick={() => handleUpgradeClick('PRO')}
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

      {/* M-Pesa Payment Form Overlay */}
      {selectedTier && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                Complete M-Pesa Payment
              </h3>
              <button
                onClick={resetPaymentForm}
                disabled={isProcessing}
                className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-6">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Upgrading to</p>
                    <p className="text-xl font-bold text-gray-900">{selectedTier} Tier</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">{getCycleDuration(selectedCycle)}</p>
                    <p className="text-xl font-bold text-gray-900">
                      KES {getTotalPrice(selectedTier, selectedCycle).toLocaleString()}
                    </p>
                  </div>
                </div>
                {selectedCycle !== 'monthly' && (
                  <p className="text-xs text-green-700 mt-2 font-semibold">
                    💰 You're saving KES {getSavings(selectedTier, selectedCycle).toLocaleString()}!
                  </p>
                )}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone className="h-4 w-4 inline mr-1" />
                  M-Pesa Phone Number
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="254712345678"
                  disabled={isProcessing}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter your Safaricom number (format: 254712345678)
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {showPaymentPrompt && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-5 w-5 text-green-600 animate-spin" />
                    <div>
                      <p className="text-sm font-semibold text-green-900">
                        M-Pesa prompt sent!
                      </p>
                      <p className="text-xs text-green-700 mt-1">
                        Check your phone and enter your M-Pesa PIN to complete payment
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handleProcessPayment}
              disabled={isProcessing || !phoneNumber}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  {showPaymentPrompt ? 'Verifying Payment...' : 'Processing...'}
                </>
              ) : (
                <>
                  Pay KES {getTotalPrice(selectedTier, selectedCycle).toLocaleString()}
                </>
              )}
            </button>

            <p className="text-xs text-gray-500 text-center mt-4">
              You will receive an M-Pesa prompt on your phone. Enter your PIN to complete the payment.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
