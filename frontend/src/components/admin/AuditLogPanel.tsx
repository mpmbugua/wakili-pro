import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminService } from '../../services/adminService';


const AuditLogPanel: React.FC = () => {
  const { data, isLoading, error } = useQuery(['admin-audit-logs'], () => adminService.getActivityLogs({ limit: 20, page: 1 }));

  return (
    <section className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Audit Logs</h2>
      {isLoading && <div className="text-gray-400">Loading audit logs...</div>}
      {error && <div className="text-red-500">Failed to load audit logs.</div>}
      {data && (
        <table className="min-w-full text-sm mt-4">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2 px-3">User</th>
              <th className="py-2 px-3">Action</th>
              <th className="py-2 px-3">Details</th>
              <th className="py-2 px-3">Timestamp</th>
              <th className="py-2 px-3">IP Address</th>
            </tr>
          </thead>
          <tbody>
            {data.logs.map((log: AuditLog) => (
              <tr key={log.id} className="border-b hover:bg-gray-50">
                <td className="py-2 px-3">{log.userId}</td>
                <td className="py-2 px-3">{log.action}</td>
                <td className="py-2 px-3">
                  <pre className="whitespace-pre-wrap break-all text-xs bg-gray-100 rounded p-1 max-w-xs overflow-x-auto">{JSON.stringify(log.details, null, 2)}</pre>
                </td>
                <td className="py-2 px-3">{new Date(log.timestamp).toLocaleString()}</td>
                <td className="py-2 px-3">{log.ipAddress}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
};

export default AuditLogPanel;
