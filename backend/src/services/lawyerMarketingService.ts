// LawyerProfile, LawyerReview, SEOAnalytics removed: not in shared package.

const profiles: any[] = [];
const reviews: any[] = [];
const analytics: any[] = [];

export const LawyerMarketingService = {
  getProfile: (lawyerId: string) => profiles.find(p => p.id === lawyerId),
  updateProfile: (lawyerId: string, data: any) => {
    const idx = profiles.findIndex(p => p.id === lawyerId);
    if (idx !== -1) {
      profiles[idx] = { ...profiles[idx], ...data };
      return profiles[idx];
    }
    return null;
  },
  getReviews: (lawyerId: string) => reviews.filter(r => r.lawyerId === lawyerId),
  addReview: (lawyerId: string, data: any) => {
    reviews.push({ ...data, lawyerId });
    return data;
  },
  getSEOAnalytics: (lawyerId: string) => analytics.find(a => a.lawyerId === lawyerId),
};
