import { Request, Response } from 'express';
import * as marketplaceEnhancementsService from '../services/marketplaceEnhancementsService';

// Advanced filtering/search
export async function advancedSearchTemplates(req: Request, res: Response) {
  const result = await marketplaceEnhancementsService.advancedSearchTemplates(req.query);
  res.json(result);
}

// Document ratings/reviews
export async function addReview(req: Request, res: Response) {
  const { id } = req.params;
  const userId = req['user']?.id || 'mock-user';
  const review = await marketplaceEnhancementsService.addReview(id, userId, req.body);
  res.json(review);
}
export async function listReviews(req: Request, res: Response) {
  const { id } = req.params;
  const reviews = await marketplaceEnhancementsService.listReviews(id);
  res.json(reviews);
}

// Popularity analytics
export async function getAnalytics(req: Request, res: Response) {
  const { id } = req.params;
  const analytics = await marketplaceEnhancementsService.getAnalytics(id);
  res.json(analytics);
}

// Real payment integration (stub)
export async function purchaseDocument(req: Request, res: Response) {
  const userId = req['user']?.id || 'mock-user';
  const purchase = await marketplaceEnhancementsService.purchaseDocument(userId, req.body);
  res.json(purchase);
}

// Purchase limits
export async function getPurchaseLimits(req: Request, res: Response) {
  const userId = req['user']?.id || 'mock-user';
  const limits = await marketplaceEnhancementsService.getPurchaseLimits(userId);
  res.json(limits);
}
export async function setPurchaseLimit(req: Request, res: Response) {
  const userId = req['user']?.id || 'mock-user';
  const limit = await marketplaceEnhancementsService.setPurchaseLimit(userId, req.body);
  res.json(limit);
}

// Audit logging
export async function listAuditLogs(req: Request, res: Response) {
  const userId = req['user']?.id || 'mock-user';
  const logs = await marketplaceEnhancementsService.listAuditLogs(userId);
  res.json(logs);
}

// Document versioning
export async function listVersions(req: Request, res: Response) {
  const { id } = req.params;
  const versions = await marketplaceEnhancementsService.listVersions(id);
  res.json(versions);
}
export async function addVersion(req: Request, res: Response) {
  const { id } = req.params;
  const version = await marketplaceEnhancementsService.addVersion(id, req.body);
  res.json(version);
}
