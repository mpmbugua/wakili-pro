import React from 'react';

interface Notification {
  id: string;
  message: string;
  read: boolean;
}
export const NotificationList: React.FC<{ notifications: Notification[]; onMarkRead: (id: string) => void }> = ({ notifications, onMarkRead }) => (
  <div className="mt-6">
    <h3 className="font-bold text-lg mb-2">Notifications</h3>
    <ul className="space-y-1">
      {notifications.map((notif, i) => (
        <li key={i} className={notif.read ? 'text-gray-400' : 'text-blue-700'}>
          {notif.message}
          {!notif.read && <button className="ml-2 text-xs underline" onClick={() => onMarkRead(notif.id)}>Mark as read</button>}
        </li>
      ))}
    </ul>
  </div>
);
