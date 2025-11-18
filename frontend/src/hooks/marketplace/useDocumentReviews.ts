import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

export function useDocumentReviews(documentId: string) {
  return useQuery({
    queryKey: ['documentReviews', documentId],
    queryFn: async () => {
      const { data } = await axios.get(`/api/marketplace/templates/${documentId}/reviews`);
      return data;
    },
  });
}

export function useAddReview(documentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (review: { rating: number; comment: string }) => {
      const { data } = await axios.post(`/api/marketplace/templates/${documentId}/review`, review);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentReviews', documentId] });
    },
  });
}
