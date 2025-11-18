import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

export function useAIChatHistory() {
  return useQuery({
    queryKey: ['aiChatHistory'],
    queryFn: async () => {
      const { data } = await axios.get('/api/engagement/ai-chat');
      return data;
    },
  });
}

export function useAddAIChatMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (message: { content: string; role: string }) => {
      const { data } = await axios.post('/api/engagement/ai-chat', message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aiChatHistory'] });
    },
  });
}
