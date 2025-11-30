import React from 'react';
import { TrendingUp, BarChart3 } from 'lucide-react';
import { GlobalLayout } from '@/components/layout/GlobalLayout';
export const AnalyticsPage: React.FC = () => {
  return (
    <GlobalLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics & Insights</h1>
          <p className="text-sm text-gray-600 mt-1">Track your practice performance and growth</p>
        </div>
        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl border-2 border-indigo-200 p-12 text-center">
          <BarChart3 className="h-16 w-16 text-indigo-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Analytics Dashboard Coming Soon</h2>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Comprehensive analytics to track revenue, client acquisition, case success rates, and practice growth trends.
          </p>
        </div>
      </div>
    </GlobalLayout>
  );
};
