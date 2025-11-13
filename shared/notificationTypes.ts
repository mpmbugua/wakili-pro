// Shared types for notifications

export type NotificationType = 'info' | 'warning' | 'success' | 'error' | 'case_update' | 'message';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}
