import React from 'react';
import { Users, UserPlus, Search, Filter } from 'lucide-react';
import { GlobalLayout } from '@/components/layout/GlobalLayout';
export const MyClientsPage: React.FC = () => {
  return (
    <GlobalLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Clients</h1>
            <p className="text-sm text-gray-600 mt-1">Manage your client relationships</p>
          </div>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Add Client
          </button>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border-2 border-blue-200 p-12 text-center">
          <Users className="h-16 w-16 text-blue-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Client Management Coming Soon</h2>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Track client details, case history, communications, and manage your client relationships all in one place.
          </p>
        </div>
      </div>
    </GlobalLayout>
  );
};
