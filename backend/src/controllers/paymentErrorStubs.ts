import { Response } from 'express';
import { AuthRequest } from './paymentControllerSimple';

export const rateLimitPayment = (req: AuthRequest, res: Response) => {
  res.status(429);
  return res.json({ success: false, message: 'Rate limit exceeded' });
};

export const paymentProcessorDown = (req: AuthRequest, res: Response) => {
  res.status(503);
  return res.json({ success: false, message: 'Payment processor temporarily unavailable' });
};

export const paymentRollback = (req: AuthRequest, res: Response) => {
  res.status(500);
  return res.json({ success: false, message: 'Internal server error' });
};
