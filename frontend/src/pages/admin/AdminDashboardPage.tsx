import React from 'react';
import UserManagementPanel from '../../components/admin/UserManagementPanel';
import AuditLogPanel from '../../components/admin/AuditLogPanel';

export const AdminDashboardPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <UserManagementPanel />
        <AuditLogPanel />
      </div>
    </div>
  );
};

export default AdminDashboardPage;
