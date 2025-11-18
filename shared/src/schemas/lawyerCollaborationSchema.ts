import { z } from 'zod';

export const LawyerMessageSchema = z.object({
  id: z.string(),
  lawyerId: z.string(),
  sender: z.string(),
  content: z.string(),
  sentAt: z.string(),
});

export const LawyerReferralSchema = z.object({
  id: z.string(),
  lawyerId: z.string(),
  referredLawyer: z.string(),
  clientName: z.string(),
  referredAt: z.string(),
});

export const ForumPostSchema = z.object({
  id: z.string(),
  author: z.string(),
  title: z.string(),
  content: z.string(),
  createdAt: z.string(),
});
