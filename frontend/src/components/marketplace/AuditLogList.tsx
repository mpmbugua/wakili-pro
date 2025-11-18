import React from 'react';

interface Log {
  action: string;
  targetType: string;
  targetId: string;
  createdAt: string;
}

// List of audit log entries for user actions
export const AuditLogList: React.FC<{ logs: Log[] }> = ({ logs }) => {
  // Display audit logs
  return (
    <div className="mt-6">
      <h3 className="font-bold text-lg mb-2">Audit Log</h3>
      <ul className="text-xs text-gray-600 space-y-1">
        {logs.map((log, i) => (
          <li key={i}>{log.action} on {log.targetType} ({log.targetId}) at {new Date(log.createdAt).toLocaleString()}</li>
        ))}
      </ul>
    </div>
  );
};
