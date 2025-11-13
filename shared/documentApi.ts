import axios from 'axios';
import { LegalDocument } from './documentTypes';
import { API_URL } from '../src/config';

export async function fetchDocuments(token: string): Promise<LegalDocument[]> {
  const res = await axios.get(`${API_URL}/documents`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

export async function uploadDocument(token: string, data: FormData): Promise<LegalDocument> {
  const res = await axios.post(`${API_URL}/documents`, data, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}
