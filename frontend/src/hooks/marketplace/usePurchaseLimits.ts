import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';


export function usePurchaseLimits() {
  return useQuery({
    queryKey: ['purchaseLimits'],
    queryFn: async () => {
      const { data } = await axios.get('/api/marketplace/purchase/limits');
      return data;
    },
  });
}

export function useSetPurchaseLimit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (limit: { documentId: string; limit: number; period: string }) => {
      const { data } = await axios.post('/api/marketplace/purchase/limits', limit);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseLimits'] });
    },
  });
}
