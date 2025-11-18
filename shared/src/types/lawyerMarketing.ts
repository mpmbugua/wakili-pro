export interface LawyerMarketingProfile {
  id: string;
  name: string;
  bio: string;
  specialties: string[];
  website?: string;
  photoUrl?: string;
}

export interface LawyerReview {
  id: string;
  lawyerId: string;
  reviewer: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface SEOAnalytics {
  lawyerId: string;
  profileViews: number;
  searchAppearances: number;
  reviewCount: number;
}
