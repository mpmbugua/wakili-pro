import { Request, Response } from 'express';
import { LawyerMarketingService } from '../services/lawyerMarketingService';

export const getProfile = (req: Request, res: Response) => {
  const profile = LawyerMarketingService.getProfile(req.params.lawyerId);
  res.json(profile);
};

export const updateProfile = (req: Request, res: Response) => {
  const updated = LawyerMarketingService.updateProfile(req.params.lawyerId, req.body);
  res.json(updated);
};

export const getReviews = (req: Request, res: Response) => {
  const reviews = LawyerMarketingService.getReviews(req.params.lawyerId);
  res.json(reviews);
};

export const addReview = (req: Request, res: Response) => {
  const review = LawyerMarketingService.addReview(req.params.lawyerId, req.body);
  res.status(201).json(review);
};

export const getSEOAnalytics = (req: Request, res: Response) => {
  const analytics = LawyerMarketingService.getSEOAnalytics(req.params.lawyerId);
  res.json(analytics);
};
