import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { getNotifications, markNotificationRead } from '../controllers/notificationController';

const router = Router();

// Get notifications (paginated, unread filter)
router.get('/', authenticateToken, getNotifications);

// Mark notification as read
router.patch('/:notificationId/read', authenticateToken, markNotificationRead);

export default router;
