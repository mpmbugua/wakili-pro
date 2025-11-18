import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Price } from '@shared/types/admin/Price';
import axios from 'axios';

export const usePrices = () => {
  const queryClient = useQueryClient();
  const { data: prices = [], isLoading } = useQuery<Price[]>({
    queryKey: ['admin-prices'],
    queryFn: async () => {
      const res = await axios.get('/api/admin/prices');
      return res.data;
    },
  });

  const createPrice = useMutation({
    mutationFn: (data: Price) => axios.post('/api/admin/prices', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-prices'] })
  });

  const updatePrice = useMutation({
    mutationFn: ({ id, ...data }: Partial<Price> & { id: string }) => axios.put(`/api/admin/prices/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-prices'] })
  });

  const deletePrice = useMutation({
    mutationFn: (id: string) => axios.delete(`/api/admin/prices/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-prices'] })
  });

  return {
    prices,
    isLoading,
    createPrice: createPrice.mutate,
    updatePrice: updatePrice.mutate,
    deletePrice: deletePrice.mutate
  };
};
