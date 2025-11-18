import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

export function useReferrals() {
  return useQuery({
    queryKey: ['referrals'],
    queryFn: async () => {
      const { data } = await axios.get('/api/engagement/referrals');
      return data;
    },
  });
}

export function useCreateReferral() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (ref: { refereeId: string }) => {
      const { data } = await axios.post('/api/engagement/referrals', ref);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referrals'] });
    },
  });
}
