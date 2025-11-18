import { Router } from 'express';
import { authenticateToken, authorizeRoles } from '../../middleware/auth';
import { listAuditLogs } from '../../../controllers/admin/audit/auditController';

const router = Router();
router.use(authenticateToken, authorizeRoles('SUPER_ADMIN', 'ADMIN', 'SUPPORT'));

router.get('/', listAuditLogs);

export default router;
