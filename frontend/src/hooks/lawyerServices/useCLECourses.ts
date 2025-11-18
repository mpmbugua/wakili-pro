import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CLECourse } from '@shared/types/lawyerCLE';
import axios from 'axios';

export const useCLECourses = () => {
  const queryClient = useQueryClient();
  const { data: courses = [], isLoading } = useQuery<CLECourse[]>({
    queryKey: ['cle-courses'],
    queryFn: async () => {
      const res = await axios.get('/api/lawyerCLE/courses');
      return res.data;
    },
  });

  const enroll = useMutation({
    mutationFn: (courseId: string) => axios.post('/api/lawyerCLE/enroll', { courseId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cle-courses'] })
  });

  return {
    courses,
    isLoading,
    enroll: enroll.mutate
  };
};
