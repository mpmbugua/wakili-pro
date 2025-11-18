import React from 'react';

import type { PaymentInfo } from './SubscriptionPlans';
export interface SubscriptionHistoryItem {
  plan: string;
  status: string;
  priceKES: number;
  startDate: string;
  endDate: string;
  paymentInfo: PaymentInfo;
  cancelledAt?: string;
  renewed?: boolean;
}

interface Props {
  history: SubscriptionHistoryItem[];
  loading: boolean;
}

export const SubscriptionHistory: React.FC<Props> = ({ history, loading }) => {
  if (loading) {
    return (
      <div className="mt-8 animate-pulse">
        <div className="h-6 w-40 bg-gray-200 rounded mb-4" />
        <div className="h-4 w-full bg-gray-100 rounded mb-2" />
        <div className="h-4 w-full bg-gray-100 rounded mb-2" />
        <div className="h-4 w-2/3 bg-gray-100 rounded mb-2" />
      </div>
    );
  }
  if (!history.length) {
    return <div className="mt-8 text-gray-500">No previous subscriptions found.</div>;
  }
  return (
    <div className="mt-8">
      <h3 className="text-lg font-bold mb-2" id="history-heading">Subscription History</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm border rounded-xl bg-white" aria-labelledby="history-heading" role="table">
          <thead>
            <tr className="bg-gray-50" role="row">
              <th className="px-4 py-2 text-left" scope="col">Plan</th>
              <th className="px-4 py-2 text-left" scope="col">Status</th>
              <th className="px-4 py-2 text-left" scope="col">Start</th>
              <th className="px-4 py-2 text-left" scope="col">End</th>
              <th className="px-4 py-2 text-left" scope="col">Price (KES)</th>
            </tr>
          </thead>
          <tbody>
            {history.map((item, i) => (
              <tr key={i} className="border-t" role="row">
                <td className="px-4 py-2" role="cell">{item.plan}</td>
                <td className="px-4 py-2" role="cell">{item.status}</td>
                <td className="px-4 py-2" role="cell">{new Date(item.startDate).toLocaleDateString()}</td>
                <td className="px-4 py-2" role="cell">{new Date(item.endDate).toLocaleDateString()}</td>
                <td className="px-4 py-2" role="cell">{item.priceKES.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
