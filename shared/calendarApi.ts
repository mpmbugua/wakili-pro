import axios from 'axios';
import { Appointment } from './calendarTypes';
import { API_URL } from '../src/config';

export async function fetchAppointments(token: string): Promise<Appointment[]> {
  const res = await axios.get(`${API_URL}/appointments`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

export async function createAppointment(token: string, data: Partial<Appointment>): Promise<Appointment> {
  const res = await axios.post(`${API_URL}/appointments`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

export async function updateAppointment(token: string, id: string, data: Partial<Appointment>): Promise<Appointment> {
  const res = await axios.put(`${API_URL}/appointments/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}
