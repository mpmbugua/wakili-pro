import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  createChatRoom,
  getUserChatRooms,
  getChatMessages,
  sendMessage,
  markMessageRead,
  getUserNotifications
} from '../controllers/chatController';

import type { Router as ExpressRouter } from 'express';
const router: ExpressRouter = Router();

// Protect all chat routes with authentication
router.use(authenticateToken);

// Chat room management
router.post('/rooms', createChatRoom);
router.get('/rooms', getUserChatRooms);

// Message management
router.get('/rooms/:roomId/messages', getChatMessages);
router.post('/messages', sendMessage);
router.patch('/messages/:messageId/read', markMessageRead);

// Notifications
router.get('/notifications', getUserNotifications);

export default router;