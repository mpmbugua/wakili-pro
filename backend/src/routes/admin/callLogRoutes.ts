import { Router } from 'express';
import { 
  createCallLog, 
  getCallLogs, 
  updateCallLogStatus,
  getCallLogStats 
} from '../../controllers/callLogController';
import { authenticateToken } from '../../middleware/authMiddleware';
import { isAdmin } from '../../middleware/roleMiddleware';

const router = Router();

// All routes require admin authentication
router.use(authenticateToken, isAdmin);

router.post('/', createCallLog);
router.get('/', getCallLogs);
router.patch('/:id/status', updateCallLogStatus);
router.get('/stats', getCallLogStats);

export default router;
