import React from 'react';
import { useAuthStore } from '@/store/authStore';
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus';

export const SubscriptionStatusBanner: React.FC = () => {
  const user = useAuthStore(state => state.user);
  const userId = user?.id || 'mock-user';
  const { status, loading } = useSubscriptionStatus(userId);

  if (loading || !user) return null;

  let color = 'bg-gray-400';
  let text = 'No Subscription';
  if (status === 'ACTIVE') {
    color = 'bg-green-600';
    text = 'Subscription Active';
  } else if (status === 'CANCELLED') {
    color = 'bg-yellow-500';
    text = 'Subscription Cancelled';
  } else if (status === 'EXPIRED') {
    color = 'bg-red-600';
    text = 'Subscription Expired';
  }

  return (
    <div className={`w-full text-center py-2 text-white font-bold ${color}`}
      aria-live="polite" role="status">
      {text}
    </div>
  );
};
