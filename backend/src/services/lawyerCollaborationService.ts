// LawyerMessage, LawyerReferral, ForumPost removed: not in shared package.

const messages: any[] = [];
const referrals: any[] = [];
const forumPosts: any[] = [];

export const LawyerCollaborationService = {
  getMessages: (lawyerId: string) => messages.filter(m => m.lawyerId === lawyerId),
  sendMessage: (lawyerId: string, data: any) => {
    messages.push({ ...data, lawyerId });
    return data;
  },
  getReferrals: (lawyerId: string) => referrals.filter(r => r.lawyerId === lawyerId),
  createReferral: (lawyerId: string, data: any) => {
    referrals.push({ ...data, lawyerId });
    return data;
  },
  getForumPosts: () => forumPosts,
  addForumPost: (data: any) => {
    forumPosts.push(data);
    return data;
  },
};
