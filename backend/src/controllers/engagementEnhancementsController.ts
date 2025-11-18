import { Request, Response } from 'express';
import * as engagementService from '../services/engagementEnhancementsService';

// Favorites
export async function listFavorites(req: Request, res: Response) {
  const userId = req['user']?.id || 'mock-user';
  res.json(await engagementService.listFavorites(userId));
}
export async function addFavorite(req: Request, res: Response) {
  const userId = req['user']?.id || 'mock-user';
  res.json(await engagementService.addFavorite(userId, req.body));
}
export async function removeFavorite(req: Request, res: Response) {
  const userId = req['user']?.id || 'mock-user';
  res.json(await engagementService.removeFavorite(userId, req.params.id));
}

// Referrals
export async function listReferrals(req: Request, res: Response) {
  const userId = req['user']?.id || 'mock-user';
  res.json(await engagementService.listReferrals(userId));
}
export async function createReferral(req: Request, res: Response) {
  const userId = req['user']?.id || 'mock-user';
  res.json(await engagementService.createReferral(userId, req.body));
}

// Loyalty Points
export async function getLoyaltyPoints(req: Request, res: Response) {
  const userId = req['user']?.id || 'mock-user';
  res.json(await engagementService.getLoyaltyPoints(userId));
}

// Notifications
export async function listNotifications(req: Request, res: Response) {
  const userId = req['user']?.id || 'mock-user';
  res.json(await engagementService.listNotifications(userId));
}
export async function markNotificationRead(req: Request, res: Response) {
  const userId = req['user']?.id || 'mock-user';
  res.json(await engagementService.markNotificationRead(userId, req.body.id));
}

// Badges
export async function listBadges(req: Request, res: Response) {
  const userId = req['user']?.id || 'mock-user';
  res.json(await engagementService.listBadges(userId));
}

// Onboarding Progress
export async function getOnboardingProgress(req: Request, res: Response) {
  const userId = req['user']?.id || 'mock-user';
  res.json(await engagementService.getOnboardingProgress(userId));
}
export async function updateOnboardingProgress(req: Request, res: Response) {
  const userId = req['user']?.id || 'mock-user';
  res.json(await engagementService.updateOnboardingProgress(userId, req.body));
}

// AI Chat History
export async function getAIChatHistory(req: Request, res: Response) {
  const userId = req['user']?.id || 'mock-user';
  res.json(await engagementService.getAIChatHistory(userId));
}
export async function addAIChatMessage(req: Request, res: Response) {
  const userId = req['user']?.id || 'mock-user';
  res.json(await engagementService.addAIChatMessage(userId, req.body));
}
