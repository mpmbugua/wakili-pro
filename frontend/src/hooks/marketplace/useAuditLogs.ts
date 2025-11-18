import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

export function useAuditLogs() {
  return useQuery({
    queryKey: ['auditLogs'],
    queryFn: async () => {
      const { data } = await axios.get('/api/marketplace/audit');
      return data;
    }
  });
}
