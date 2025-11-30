import React from 'react';
import { CreditCard, Receipt } from 'lucide-react';
import { GlobalLayout } from '@/components/layout/GlobalLayout';
export const BillingPage: React.FC = () => {
  return (
    <GlobalLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Billing & Invoices</h1>
          <p className="text-sm text-gray-600 mt-1">Manage invoices, payments, and financial records</p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200 p-12 text-center">
          <Receipt className="h-16 w-16 text-purple-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Billing Management Coming Soon</h2>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Create invoices, track payments, manage billing cycles, and generate financial reports for your practice.
          </p>
        </div>
      </div>
    </GlobalLayout>
  );
};
