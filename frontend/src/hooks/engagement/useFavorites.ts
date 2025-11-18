import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

export function useFavorites() {
  return useQuery({
    queryKey: ['favorites'],
    queryFn: async () => {
      const { data } = await axios.get('/api/engagement/favorites');
      return data;
    },
  });
}

export function useAddFavorite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (fav: { targetType: string; targetId: string }) => {
      const { data } = await axios.post('/api/engagement/favorites', fav);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });
}

export function useRemoveFavorite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await axios.delete(`/api/engagement/favorites/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });
}
