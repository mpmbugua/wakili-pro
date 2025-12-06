import { Router } from 'express';
import { 
  createCallLog, 
  getCallLogs, 
  updateCallLogStatus,
  getCallLogStats 
} from '../../controllers/callLogController';
import { authenticateToken, authorizeRoles } from '../../middleware/auth';

const router = Router();

// All routes require admin authentication
router.use(authenticateToken);
router.use(authorizeRoles('ADMIN', 'SUPER_ADMIN'));

router.post('/', createCallLog);
router.get('/', getCallLogs);
router.patch('/:id/status', updateCallLogStatus);
router.get('/stats', getCallLogStats);

export default router;
