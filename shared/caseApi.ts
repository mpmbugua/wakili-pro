import axios from 'axios';
import { Case } from './caseTypes';
import { API_URL } from '../src/config';

export async function fetchCases(token: string): Promise<Case[]> {
  const res = await axios.get(`${API_URL}/cases`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

export async function fetchCaseById(token: string, id: string): Promise<Case> {
  const res = await axios.get(`${API_URL}/cases/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

export async function createCase(token: string, data: Partial<Case>): Promise<Case> {
  const res = await axios.post(`${API_URL}/cases`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

export async function updateCase(token: string, id: string, data: Partial<Case>): Promise<Case> {
  const res = await axios.put(`${API_URL}/cases/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}
