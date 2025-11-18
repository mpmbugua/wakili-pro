import React from 'react';
import { PriceManager } from '@/components/admin/PriceManager';
import { useAuthStore } from '@/store/authStore';

const AdminPriceSettings: React.FC = () => {
  const user = useAuthStore(state => state.user);
  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded shadow text-center">
          <h2 className="text-xl font-bold text-red-600 mb-2">Access Denied</h2>
          <p className="text-gray-700">You do not have permission to view this page.</p>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <h1 className="text-2xl font-bold text-center mb-8 text-blue-800">Admin Price Settings</h1>
      <PriceManager />
    </div>
  );
};

export default AdminPriceSettings;
