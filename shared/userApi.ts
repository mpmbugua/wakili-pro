import axios from 'axios';
import { User } from './types';
import { API_URL } from '../src/config';

export async function updateUserRole(token: string, userId: string, role: 'client' | 'lawyer' | 'admin'): Promise<User> {
  const res = await axios.patch(`${API_URL}/users/${userId}/role`, { role }, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}
