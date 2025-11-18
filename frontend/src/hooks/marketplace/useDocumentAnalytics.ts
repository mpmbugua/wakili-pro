import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

export function useDocumentAnalytics(documentId: string) {
  return useQuery({
    queryKey: ['documentAnalytics', documentId],
    queryFn: async () => {
      const { data } = await axios.get(`/api/marketplace/templates/${documentId}/analytics`);
      return data;
    }
  });
}
