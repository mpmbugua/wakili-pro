import { Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth';
import * as lawyerMonetizationService from '../services/lawyerMonetizationService';

export async function upgradeTier(req: AuthenticatedRequest, res: Response) {
  // Accepts { tier: 'LITE' | 'PRO' }
  const { tier } = req.body;
  const userId = req.user!.id;
  const result = await lawyerMonetizationService.upgradeTier(userId, tier);
  res.json(result);
}

export async function featureProfile(req: AuthenticatedRequest, res: Response) {
  // Accepts { durationDays: number }
  const { durationDays } = req.body;
  const userId = req.user!.id;
  const result = await lawyerMonetizationService.featureProfile(userId, durationDays);
  res.json(result);
}

export async function publishArticle(req: AuthenticatedRequest, res: Response) {
  // Accepts { title, content, isPremium, premiumDays }
  const { title, content, isPremium, premiumDays } = req.body;
  const userId = req.user!.id;
  const result = await lawyerMonetizationService.publishArticle(userId, { title, content, isPremium, premiumDays });
  res.json(result);
}

export async function payForMonetization(req: AuthenticatedRequest, res: Response) {
  // Accepts { type: 'feature' | 'article', targetId, amount }
  const { type, targetId, amount } = req.body;
  const userId = req.user!.id;
  const result = await lawyerMonetizationService.payForMonetization(userId, { type, targetId, amount });
  res.json(result);
}
