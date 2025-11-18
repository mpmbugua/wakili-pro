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
    setLoading(true);
    setError(null);
    try {
      await axios.post('/api/lawyer-subscriptions/subscriptions/subscribe', { userId, plan });
      toast.success('Subscription activated!');
      await fetchStatus();
    } catch (e: unknown) {
      const msg = getAxiosErrorMessage(e);
      setError(msg || 'Subscription failed');
    } finally {
      setLoading(false);
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
    </div>
  );
};
