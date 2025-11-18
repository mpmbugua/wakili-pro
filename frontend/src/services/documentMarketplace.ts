import axios from 'axios';
import { DocumentTemplate } from '@shared/types/ai';

export interface PurchaseAIInput {
  [key: string]: string | number | boolean;
}

export interface PurchaseResult {
  paymentInfo: unknown;
  purchase: { id: string };
}

export async function getPurchaseStatus(purchaseId: string): Promise<string> {
  const res = await axios.get(`/api/document-marketplace/purchase-status/${purchaseId}`);
  return res.data.status;
}

export async function downloadDocument(purchaseId: string): Promise<string> {
  // This should return a file URL or trigger a download
  // For now, just return the backend download endpoint
  return `/api/document-marketplace/download/${purchaseId}`;
}

export async function purchaseDocumentTemplate(templateId: string, aiInput: PurchaseAIInput): Promise<PurchaseResult> {
  const res = await axios.post('/api/document-marketplace/purchase', { documentId: templateId, aiInput });
  return res.data;
}

export async function fetchDocumentTemplates(): Promise<{ templates: DocumentTemplate[] }> {
  const res = await axios.get('/api/document-marketplace/templates');
  return res.data;
}
