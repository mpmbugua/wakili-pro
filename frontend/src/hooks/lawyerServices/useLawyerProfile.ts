import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LawyerProfile } from '@shared/types/lawyerMarketing';
import axios from 'axios';

export const useLawyerProfile = () => {
  const queryClient = useQueryClient();
  const { data: profile, isLoading } = useQuery<LawyerProfile | null>({
    queryKey: ['lawyer-profile'],
    queryFn: async () => {
      const res = await axios.get('/api/lawyerMarketing/profile/me');
      return res.data;
    }
  });

  const updateProfile = useMutation({
    mutationFn: (data: Partial<LawyerProfile>) => axios.put('/api/lawyerMarketing/profile/me', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lawyer-profile'] })
  });

  return {
    profile,
    isLoading,
    updateProfile: updateProfile.mutate
  };
};
