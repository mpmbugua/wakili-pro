import { Response } from 'express';
import type { AuthenticatedRequest } from '../../middleware/auth';
import { TwoFAService } from '../../services/security/twoFAService';

export const setup2FA = (req: AuthenticatedRequest, res: Response) => {
  const { method } = req.body;
  const result = TwoFAService.setup(req.user!.id, method);
  res.json(result);
};

export const verify2FA = (req: AuthenticatedRequest, res: Response) => {
  const { code } = req.body;
  const result = TwoFAService.verify(req.user!.id, code);
  if (result.success) {
    res.json({ success: true });
  } else {
    res.status(400).json({ success: false, message: result.message });
  }
};

export const disable2FA = (req: AuthenticatedRequest, res: Response) => {
  TwoFAService.disable(req.user!.id);
  res.json({ success: true });
};
