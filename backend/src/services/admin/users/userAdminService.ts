import { UserRole } from '@shared';

// Mock/in-memory user store for demo
let users = [
  { id: '1', email: 'admin@example.com', role: 'SUPER_ADMIN', active: true },
  { id: '2', email: 'lawyer@example.com', role: 'LAWYER', active: true },
];

export const UserAdminService = {
  list: () => users,
  update: (id: string, data: any) => {
    const idx = users.findIndex(u => u.id === id);
    if (idx !== -1) {
      users[idx] = { ...users[idx], ...data };
      return users[idx];
    }
    return null;
  },
  changeRole: (id: string, role: UserRole) => {
    const idx = users.findIndex(u => u.id === id);
    if (idx !== -1) {
      users[idx].role = role;
      return users[idx];
    }
    return null;
  },
  deactivate: (id: string) => {
    const idx = users.findIndex(u => u.id === id);
    if (idx !== -1) users[idx].active = false;
  },
};
