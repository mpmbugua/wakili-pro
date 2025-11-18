// Mock/in-memory audit log for demo
let logs = [
  { id: '1', action: 'USER_ROLE_CHANGE', actor: 'admin@example.com', target: 'lawyer@example.com', timestamp: new Date().toISOString() },
];

export const AuditService = {
  list: () => logs,
  add: (log: any) => {
    logs.push({ ...log, id: Date.now().toString(), timestamp: new Date().toISOString() });
  },
};
