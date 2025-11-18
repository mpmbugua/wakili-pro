import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

export function useBadges() {
  return useQuery({
    queryKey: ['badges'],
    queryFn: async () => {
      const { data } = await axios.get('/api/engagement/badges');
      return data;
    },
  });
}
