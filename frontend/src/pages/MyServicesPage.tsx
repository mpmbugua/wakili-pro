import React from 'react';
import { Briefcase, Plus, Package } from 'lucide-react';
import { GlobalLayout } from '@/components/layout/GlobalLayout';
export const MyServicesPage: React.FC = () => {
  return (
    <GlobalLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Services</h1>
            <p className="text-sm text-gray-600 mt-1">Manage your service offerings and packages</p>
          </div>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Service
          </button>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl border-2 border-green-200 p-12 text-center">
          <Package className="h-16 w-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Service Management Coming Soon</h2>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Create and manage your service packages, set pricing, define deliverables, and track service delivery.
          </p>
        </div>
      </div>
    </GlobalLayout>
  );
};
