import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

export interface MarketplaceFilter {
  search?: string;
  category?: string;
  price?: string;
  rating?: string;
}

export function useMarketplaceFilter(filters: MarketplaceFilter) {
  return useQuery({
    queryKey: ['marketplaceTemplates', filters],
    queryFn: async () => {
      const { data } = await axios.get('/api/marketplace/templates', { params: filters });
      return data;
    },
  });
}
