import { Request, Response } from 'express';
import { LawyerCollaborationService } from '../services/lawyerCollaborationService';

export const getMessages = (req: Request, res: Response) => {
  const messages = LawyerCollaborationService.getMessages(req.params.lawyerId);
  res.json(messages);
};

export const sendMessage = (req: Request, res: Response) => {
  const message = LawyerCollaborationService.sendMessage(req.params.lawyerId, req.body);
  res.status(201).json(message);
};

export const getReferrals = (req: Request, res: Response) => {
  const referrals = LawyerCollaborationService.getReferrals(req.params.lawyerId);
  res.json(referrals);
};

export const createReferral = (req: Request, res: Response) => {
  const referral = LawyerCollaborationService.createReferral(req.params.lawyerId, req.body);
  res.status(201).json(referral);
};

export const getForumPosts = (req: Request, res: Response) => {
  const posts = LawyerCollaborationService.getForumPosts();
  res.json(posts);
};

export const addForumPost = (req: Request, res: Response) => {
  const post = LawyerCollaborationService.addForumPost(req.body);
  res.status(201).json(post);
};
