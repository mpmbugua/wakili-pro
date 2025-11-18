import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminService } from '../../services/adminService';


const UserManagementPanel: React.FC = () => {
  const { data, isLoading, error } = useQuery(['admin-users'], () => adminService.getUsers({ limit: 20, page: 1 }));

  return (
    <section className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">User Management</h2>
      {isLoading && <div className="text-gray-400">Loading users...</div>}
      {error && <div className="text-red-500">Failed to load users.</div>}
      {data && (
        <table className="min-w-full text-sm mt-4">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2 px-3">Name</th>
              <th className="py-2 px-3">Email</th>
              <th className="py-2 px-3">Role</th>
              <th className="py-2 px-3">Status</th>
              <th className="py-2 px-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.users.map((user: {
              id: string;
              name: string;
              email: string;
              role: string;
              isActive: boolean;
            }) => (
              <tr key={user.id} className="border-b hover:bg-gray-50">
                <td className="py-2 px-3">{user.name}</td>
                <td className="py-2 px-3">{user.email}</td>
                <td className="py-2 px-3">{user.role}</td>
                <td className="py-2 px-3">{user.isActive ? 'Active' : 'Inactive'}</td>
                <td className="py-2 px-3">
                  <button
                    className="text-blue-600 hover:underline mr-2"
                    onClick={() => alert(`Edit user ${user.name}`)}
                  >
                    Edit
                  </button>
                  <button
                    className="text-yellow-600 hover:underline mr-2"
                    onClick={() => alert(`Promote/Demote user ${user.name}`)}
                  >
                    Promote/Demote
                  </button>
                  <button
                    className="text-red-600 hover:underline"
                    onClick={() => alert(`Deactivate user ${user.name}`)}
                  >
                    Deactivate
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
};

export default UserManagementPanel;
