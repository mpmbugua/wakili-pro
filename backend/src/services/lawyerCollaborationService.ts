import { LawyerMessage, LawyerReferral, ForumPost } from '@wakili-pro/shared';

const messages: LawyerMessage[] = [];
const referrals: LawyerReferral[] = [];
const forumPosts: ForumPost[] = [];

export const LawyerCollaborationService = {
  getMessages: (lawyerId: string) => messages.filter(m => m.lawyerId === lawyerId),
  sendMessage: (lawyerId: string, data: LawyerMessage) => {
    messages.push({ ...data, lawyerId });
    return data;
  },
  getReferrals: (lawyerId: string) => referrals.filter(r => r.lawyerId === lawyerId),
  createReferral: (lawyerId: string, data: LawyerReferral) => {
    referrals.push({ ...data, lawyerId });
    return data;
  },
  getForumPosts: () => forumPosts,
  addForumPost: (data: ForumPost) => {
    forumPosts.push(data);
    return data;
  },
};
