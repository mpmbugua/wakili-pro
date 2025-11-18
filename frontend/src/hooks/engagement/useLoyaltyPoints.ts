import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

export function useLoyaltyPoints() {
  return useQuery({
    queryKey: ['loyaltyPoints'],
    queryFn: async () => {
      const { data } = await axios.get('/api/engagement/loyalty');
      return data;
    },
  });
}
