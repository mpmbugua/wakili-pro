import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LawyerMessage, LawyerReferral, ForumPost } from '@shared/types/lawyerCollaboration';
import axios from 'axios';

export const useLawyerCollaboration = () => {
  const queryClient = useQueryClient();
  const { data: messages = [], isLoading: loadingMessages } = useQuery<LawyerMessage[]>({
    queryKey: ['lawyer-messages'],
    queryFn: async () => {
      const res = await axios.get('/api/lawyerCollaboration/messages/me');
      return res.data;
    }
  });
  const { data: referrals = [], isLoading: loadingReferrals } = useQuery<LawyerReferral[]>({
    queryKey: ['lawyer-referrals'],
    queryFn: async () => {
      const res = await axios.get('/api/lawyerCollaboration/referrals/me');
      return res.data;
    }
  });
  const { data: forumPosts = [], isLoading: loadingForum } = useQuery<ForumPost[]>({
    queryKey: ['lawyer-forum'],
    queryFn: async () => {
      const res = await axios.get('/api/lawyerCollaboration/forum');
      return res.data;
    }
  });

  const sendMessage = useMutation({
    mutationFn: (data: Omit<LawyerMessage, 'id' | 'sentAt'>) => axios.post('/api/lawyerCollaboration/messages/me', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lawyer-messages'] })
  });
  const createReferral = useMutation({
    mutationFn: (data: Omit<LawyerReferral, 'id' | 'referredAt'>) => axios.post('/api/lawyerCollaboration/referrals/me', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lawyer-referrals'] })
  });
  const addForumPost = useMutation({
    mutationFn: (data: Omit<ForumPost, 'id' | 'createdAt'>) => axios.post('/api/lawyerCollaboration/forum', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lawyer-forum'] })
  });

  return {
    messages,
    referrals,
    forumPosts,
    isLoading: loadingMessages || loadingReferrals || loadingForum,
    sendMessage: sendMessage.mutate,
    createReferral: createReferral.mutate,
    addForumPost: addForumPost.mutate
  };
};
