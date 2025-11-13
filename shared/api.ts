// Shared API service for Wakili Pro Mobile
import axios from 'axios';
import { AuthResponse, AnalyticsData } from './types';
import { API_URL } from '../src/config';

export async function login(email: string, password: string): Promise<AuthResponse> {
  const res = await axios.post(`${API_URL}/auth/login`, { email, password });
  return res.data;
}

export async function register(
  firstName: string,
  lastName: string,
  email: string,
  password: string
): Promise<AuthResponse> {
  const res = await axios.post(`${API_URL}/auth/register`, { firstName, lastName, email, password });
  return res.data;
}

export async function fetchAnalytics(token: string): Promise<AnalyticsData> {
  const res = await axios.get(`${API_URL}/analytics/overview`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

export async function forgotPassword(email: string): Promise<any> {
  const res = await axios.post(`${API_URL}/auth/forgot-password`, { email });
  return res.data;
}

export async function resetPassword(token: string, newPassword: string): Promise<any> {
  const res = await axios.post(`${API_URL}/auth/reset-password`, { token, newPassword });
  return res.data;
}
