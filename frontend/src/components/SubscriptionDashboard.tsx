import React, { useEffect, useState } from 'react';

// Helper to extract error message from axios error
function getAxiosErrorMessage(e: unknown): string | undefined {
  if (
    e &&
    typeof e === 'object' &&
    'response' in e &&
    typeof (e as { response?: { data?: { error?: string } } }).response?.data?.error === 'string'
  ) {
    return (e as { response: { data: { error: string } } }).response.data.error;
  }
  return undefined;
}
import { Toaster, toast } from 'react-hot-toast';
import { SubscriptionPlans, SubscriptionPlan, SubscriptionStatus } from './SubscriptionPlans';
import { SubscriptionHistory, SubscriptionHistoryItem } from './SubscriptionHistory';
import axios from 'axios';

export const SubscriptionDashboard: React.FC = () => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [history, setHistory] = useState<SubscriptionHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null);

  // Simulate userId for mock API
  const userId = 'mock-user';

  const fetchPlans = async () => {
    setLoadingPlans(true);
    setError(null);
    try {
      const res = await axios.get('/api/lawyer-subscriptions/subscriptions/plans');
      setPlans(res.data.plans || []);
    } catch (e) {
      setError('Failed to load plans');
    } finally {
      setLoadingPlans(false);
    }
  };

  const fetchStatus = async () => {
    setLoadingStatus(true);
    setError(null);
    try {
      const res = await axios.get('/api/lawyer-subscriptions/subscriptions/status', { params: { userId } });
      setStatus(res.data.subscription || null);
    } catch (e) {
      setError('Failed to load subscription status');
    } finally {
      setLoadingStatus(false);
    }
  };

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await axios.get('/api/lawyer-subscriptions/subscriptions/history', { params: { userId } });
      setHistory(res.data.history || []);
    } catch {
      setHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchPlans();
    fetchStatus();
    fetchHistory();
    // fetchPlans, fetchStatus, fetchHistory are stable (no deps)
  }, []);

  const handleSubscribe = async (plan: string) => {
    // For FREE plan, subscribe directly
    if (plan === 'FREE') {
      setLoading(true);
      setError(null);
      try {
        await axios.post('/api/subscriptions/upgrade', { userId, targetTier: plan });
        toast.success('Subscription activated!');
        await fetchStatus();
      } catch (e: unknown) {
        const msg = getAxiosErrorMessage(e);
        setError(msg || 'Subscription failed');
      } finally {
        setLoading(false);
      }
      return;
    }

    // For paid plans, show payment modal
    setSelectedPlan(plan);
    setShowPaymentModal(true);
  };

  const processSubscriptionPayment = async () => {
    if (!selectedPlan || !phoneNumber) {
      toast.error('Please enter your M-Pesa phone number');
      return;
    }

    setPaymentProcessing(true);
    setError(null);

    try {
      // Initiate subscription upgrade with M-Pesa
      const response = await axios.post('/api/subscriptions/upgrade', {
        userId,
        targetTier: selectedPlan,
        phoneNumber,
      });

      if (response.data.success) {
        const { subscriptionId: subId, checkoutRequestID } = response.data;
        setSubscriptionId(subId);

        toast.success(response.data.message || 'Check your phone for M-Pesa prompt');

        // Poll for payment status
        let attempts = 0;
        const maxAttempts = 20;
        const pollInterval = setInterval(async () => {
          attempts++;

          try {
            const statusResponse = await axios.get(`/api/subscriptions/payment-status/${subId}`);
            
            if (statusResponse.data.success) {
              const { status: subStatus } = statusResponse.data.data;
              
              if (subStatus === 'ACTIVE') {
                clearInterval(pollInterval);
                setPaymentProcessing(false);
                setShowPaymentModal(false);
                setPhoneNumber('');
                setSelectedPlan(null);
                toast.success('Subscription activated successfully!');
                await fetchStatus();
              } else if (subStatus === 'FAILED') {
                clearInterval(pollInterval);
                setPaymentProcessing(false);
                toast.error('Payment failed. Please try again.');
              }
            }

            if (attempts >= maxAttempts) {
              clearInterval(pollInterval);
              setPaymentProcessing(false);
              toast.error('Payment verification timeout. Please check your subscription status.');
            }
          } catch (err) {
            console.error('Status check error:', err);
          }
        }, 3000);
      }
    } catch (e: unknown) {
      const msg = getAxiosErrorMessage(e);
      setError(msg || 'Subscription failed');
      setPaymentProcessing(false);
      toast.error(msg || 'Failed to initiate payment');
    }
  };

  const handleCancel = async () => {
    setLoading(true);
    setError(null);
    try {
      await axios.post('/api/lawyer-subscriptions/subscriptions/cancel', { userId });
      toast.success('Subscription cancelled.');
      await fetchStatus();
    } catch (e: unknown) {
      const msg = getAxiosErrorMessage(e);
      setError(msg || 'Cancel failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRenew = async (plan: string) => {
    setLoading(true);
    setError(null);
    try {
      await axios.post('/api/lawyer-subscriptions/subscriptions/renew', { userId, plan });
      toast.success('Subscription renewed!');
      await fetchStatus();
    } catch (e: unknown) {
      const msg = getAxiosErrorMessage(e);
      setError(msg || 'Renewal failed');
    } finally {
      setLoading(false);
    }
  };

  const premiumDisabled = !!error;
  return (
    <div>
      <Toaster position="top-right" />
      {error && (
        <div className="mb-4 text-red-600 flex flex-col items-center gap-2" role="alert">
          <span className="font-bold">Service temporarily unavailable.</span>
          <span className="text-sm">We are unable to load your subscription details at this time. Please try again later.</span>
          <button className="px-3 py-1 bg-blue-600 text-white rounded" onClick={() => { fetchPlans(); fetchStatus(); }} aria-label="Retry loading subscription details">Retry</button>
        </div>
      )}
      <section aria-label="Subscription Plans">
        <SubscriptionPlans
          plans={plans}
          status={status}
          isLoading={loading || loadingPlans || loadingStatus}
          loadingPlans={loadingPlans}
          loadingStatus={loadingStatus}
          onSubscribe={premiumDisabled ? () => {} : handleSubscribe}
          onCancel={premiumDisabled ? () => {} : handleCancel}
          onRenew={premiumDisabled ? () => {} : handleRenew}
          premiumDisabled={premiumDisabled}
        />
      </section>
      <section aria-label="Subscription History">
        <SubscriptionHistory history={history} loading={loadingHistory} />
      </section>

      {/* M-Pesa Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Complete Payment</h3>
            
            <div className="mb-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-800">
                  <strong>Plan:</strong> {selectedPlan}
                </p>
                <p className="text-sm text-blue-800">
                  <strong>Amount:</strong> KES {selectedPlan === 'LITE' ? '1,999' : '4,999'}/month
                </p>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4 flex items-start">
                <svg className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <div className="text-sm text-green-800">
                  <p className="font-medium mb-1">M-Pesa STK Push</p>
                  <p>You'll receive a prompt on your phone to complete payment</p>
                </div>
              </div>

              <label className="block text-sm font-semibold text-gray-900 mb-2">
                M-Pesa Phone Number
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, '');
                  if (value.length <= 10) {
                    setPhoneNumber(value);
                  }
                }}
                placeholder="0712345678"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                disabled={paymentProcessing}
              />
              <p className="text-xs text-gray-500 mt-2">
                Enter your Safaricom M-Pesa number
              </p>
            </div>

            {paymentProcessing && (
              <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <svg className="animate-spin h-5 w-5 text-yellow-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                  </svg>
                  <p className="text-sm text-yellow-800">
                    Waiting for payment confirmation... Check your phone.
                  </p>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setPhoneNumber('');
                  setSelectedPlan(null);
                  setPaymentProcessing(false);
                }}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold"
                disabled={paymentProcessing}
              >
                Cancel
              </button>
              <button
                onClick={processSubscriptionPayment}
                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
                disabled={paymentProcessing || !phoneNumber || phoneNumber.length < 10}
              >
                {paymentProcessing ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  'Pay with M-Pesa'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
