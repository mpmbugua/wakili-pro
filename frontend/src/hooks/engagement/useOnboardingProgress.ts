import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

export function useOnboardingProgress() {
  return useQuery({
    queryKey: ['onboardingProgress'],
    queryFn: async () => {
      const { data } = await axios.get('/api/engagement/onboarding');
      return data;
    },
  });
}

export function useUpdateOnboardingProgress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (progress: { step: string; completed: boolean }) => {
      const { data } = await axios.post('/api/engagement/onboarding', progress);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboardingProgress'] });
    },
  });
}
