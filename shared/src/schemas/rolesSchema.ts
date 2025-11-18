import { z } from 'zod';

export const UserRoleSchema = z.enum(['PUBLIC', 'LAWYER', 'ADMIN', 'SUPER_ADMIN', 'SUPPORT', 'CONTENT_MANAGER']);

export const PermissionKeySchema = z.enum([
  'MANAGE_USERS',
  'MANAGE_PRICES',
  'VIEW_AUDIT_LOGS',
  'MANAGE_CONTENT',
  'SEND_NOTIFICATIONS',
  'VIEW_ANALYTICS',
]);
