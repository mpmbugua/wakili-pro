import { LawyerProfile, LawyerReview, SEOAnalytics } from '@wakili-pro/shared';

const profiles: LawyerProfile[] = [];
const reviews: LawyerReview[] = [];
const analytics: SEOAnalytics[] = [];

export const LawyerMarketingService = {
  getProfile: (lawyerId: string) => profiles.find(p => p.id === lawyerId),
  updateProfile: (lawyerId: string, data: Partial<LawyerProfile>) => {
    const idx = profiles.findIndex(p => p.id === lawyerId);
    if (idx !== -1) {
      profiles[idx] = { ...profiles[idx], ...data };
      return profiles[idx];
    }
    return null;
  },
  getReviews: (lawyerId: string) => reviews.filter(r => r.lawyerId === lawyerId),
  addReview: (lawyerId: string, data: LawyerReview) => {
    reviews.push({ ...data, lawyerId });
    return data;
  },
  getSEOAnalytics: (lawyerId: string) => analytics.find(a => a.lawyerId === lawyerId),
};
