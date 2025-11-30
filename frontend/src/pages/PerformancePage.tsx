import React from 'react';
import { Award, Star } from 'lucide-react';
import { GlobalLayout } from '@/components/layout/GlobalLayout';
export const PerformancePage: React.FC = () => {
  return (
    <GlobalLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Performance & Reviews</h1>
          <p className="text-sm text-gray-600 mt-1">Track your ratings, reviews, and professional achievements</p>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl border-2 border-amber-200 p-12 text-center">
          <Award className="h-16 w-16 text-amber-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Performance Tracking Coming Soon</h2>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Monitor your professional performance, client reviews, ratings, and track your achievements on the platform.
          </p>
        </div>
      </div>
    </GlobalLayout>
  );
};
