import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

export interface DocumentVersionInput {
  content: string;
}

export function useDocumentVersions(documentId: string) {
  return useQuery({
    queryKey: ['documentVersions', documentId],
    queryFn: async () => {
      const { data } = await axios.get(`/api/marketplace/templates/${documentId}/versions`);
      return data;
    },
  });
}

export function useAddDocumentVersion(documentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (version: DocumentVersionInput) => {
      const { data } = await axios.post(`/api/marketplace/templates/${documentId}/versions`, version);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentVersions', documentId] });
    },
  });
}
