import { Request, Response } from 'express';
import { AuditService } from '../../../services/admin/audit/auditService';

export const listAuditLogs = (req: Request, res: Response) => {
  res.json(AuditService.list());
};
