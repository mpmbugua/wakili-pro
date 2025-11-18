export type UserRole = 'PUBLIC' | 'LAWYER' | 'ADMIN' | 'SUPER_ADMIN' | 'SUPPORT' | 'CONTENT_MANAGER';

export interface Permission {
  name: string;
  description: string;
}

export type PermissionKey =
  | 'MANAGE_USERS'
  | 'MANAGE_PRICES'
  | 'VIEW_AUDIT_LOGS'
  | 'MANAGE_CONTENT'
  | 'SEND_NOTIFICATIONS'
  | 'VIEW_ANALYTICS';

export const RolePermissions: Record<UserRole, PermissionKey[]> = {
  PUBLIC: [],
  LAWYER: [],
  ADMIN: ['MANAGE_PRICES', 'VIEW_ANALYTICS'],
  SUPER_ADMIN: ['MANAGE_USERS', 'MANAGE_PRICES', 'VIEW_AUDIT_LOGS', 'MANAGE_CONTENT', 'SEND_NOTIFICATIONS', 'VIEW_ANALYTICS'],
  SUPPORT: ['VIEW_AUDIT_LOGS', 'SEND_NOTIFICATIONS'],
  CONTENT_MANAGER: ['MANAGE_CONTENT', 'SEND_NOTIFICATIONS'],
};
