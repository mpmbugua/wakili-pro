import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LawyerDocumentTemplate } from '@shared/types/lawyerDocumentTemplate';
import axios from 'axios';

export const useLawyerDocumentTemplates = () => {
  const queryClient = useQueryClient();
  const { data: templates = [], isLoading } = useQuery<LawyerDocumentTemplate[]>({
    queryKey: ['lawyer-templates'],
    queryFn: async () => {
      const res = await axios.get('/api/lawyerDocumentTemplates');
      return res.data;
    }
  });

  const createTemplate = useMutation({
    mutationFn: (data: LawyerDocumentTemplate) => axios.post('/api/lawyerDocumentTemplates', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lawyer-templates'] })
  });

  const updateTemplate = useMutation({
    mutationFn: ({ id, ...data }: Partial<LawyerDocumentTemplate> & { id: string }) => axios.put(`/api/lawyerDocumentTemplates/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lawyer-templates'] })
  });

  const deleteTemplate = useMutation({
    mutationFn: (id: string) => axios.delete(`/api/lawyerDocumentTemplates/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lawyer-templates'] })
  });

  return {
    templates,
    isLoading,
    createTemplate: createTemplate.mutate,
    updateTemplate: updateTemplate.mutate,
    deleteTemplate: deleteTemplate.mutate
  };
};
