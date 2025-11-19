
import { Router } from 'express';
import { authenticateToken, authorizeRoles } from '../../../middleware/auth';
import { listAuditLogs } from '../../../controllers/admin/audit/auditController';
import type { UserRole } from '@wakili-pro/shared';


const router = Router();
router.use(
	authenticateToken,
	authorizeRoles('SUPER_ADMIN' as UserRole, 'ADMIN' as UserRole, 'SUPPORT' as UserRole)
);

router.get('/', listAuditLogs);

export default router;
