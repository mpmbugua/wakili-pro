import { z } from 'zod';

export const LawyerProfileSchema = z.object({
  id: z.string(),
  name: z.string(),
  bio: z.string(),
  specialties: z.array(z.string()),
  website: z.string().optional(),
  photoUrl: z.string().optional(),
});

export const LawyerReviewSchema = z.object({
  id: z.string(),
  lawyerId: z.string(),
  reviewer: z.string(),
  rating: z.number().min(1).max(5),
  comment: z.string(),
  createdAt: z.string(),
});

export const SEOAnalyticsSchema = z.object({
  lawyerId: z.string(),
  profileViews: z.number(),
  searchAppearances: z.number(),
  reviewCount: z.number(),
});
