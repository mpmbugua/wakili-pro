import axios from 'axios';
import { AppNotification } from './notificationTypes';
import { API_URL } from '../src/config';

export async function fetchNotifications(token: string): Promise<AppNotification[]> {
  const res = await axios.get(`${API_URL}/notifications`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

export async function markNotificationRead(token: string, id: string): Promise<AppNotification> {
  const res = await axios.patch(`${API_URL}/notifications/${id}/read`, {}, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}
