import React from 'react';
import { SubscriptionDashboard } from '@/components/SubscriptionDashboard';

const LawyerSubscriptionPage: React.FC = () => {
  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="flex items-center gap-2 mb-2">
        <h1 className="text-2xl font-bold">Lawyer Subscription</h1>
        <span className="relative group">
          <svg className="w-5 h-5 text-blue-500 cursor-pointer" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 16v-4m0-4h.01" /></svg>
          <span className="absolute left-1/2 -translate-x-1/2 mt-2 w-64 bg-white text-gray-700 text-xs rounded shadow-lg p-3 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
            <b>Why subscribe?</b><br />
            Unlock premium legal services, document marketplace, and video consultations. Manage your plan, renew, or cancel anytime. All payments are secure and plans are flexible for your needs.
          </span>
        </span>
      </div>
      <SubscriptionDashboard />
    </div>
  );
};

export default LawyerSubscriptionPage;
