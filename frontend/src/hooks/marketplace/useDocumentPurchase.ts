import { useMutation } from '@tanstack/react-query';
import axios from 'axios';

export interface DocumentPurchasePayload {
  documentId: string;
  paymentMethod?: string;
  couponCode?: string;
  userId?: string;
  // Add more fields as needed, but do not use index signature
}

export function useDocumentPurchase() {
  return useMutation({
    mutationFn: async (payload: DocumentPurchasePayload) => {
      const { data } = await axios.post('/api/marketplace/purchase', payload);
      return data;
    },
  });
}
