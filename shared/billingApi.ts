import axios from 'axios';
import { Invoice, Payment } from './billingTypes';
import { API_URL } from '../src/config';

export async function fetchInvoices(token: string): Promise<Invoice[]> {
  const res = await axios.get(`${API_URL}/invoices`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

export async function fetchInvoiceById(token: string, id: string): Promise<Invoice> {
  const res = await axios.get(`${API_URL}/invoices/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

export async function fetchPayments(token: string, invoiceId: string): Promise<Payment[]> {
  const res = await axios.get(`${API_URL}/invoices/${invoiceId}/payments`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

export async function makePayment(token: string, invoiceId: string, amount: number, method: string): Promise<Payment> {
  const res = await axios.post(`${API_URL}/invoices/${invoiceId}/payments`, { amount, method }, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

export async function createInvoice(token: string, data: { amount: number; description: string }): Promise<Invoice> {
  const res = await axios.post(`${API_URL}/invoices`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}
