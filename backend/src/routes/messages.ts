import { Router } from 'express';
import multer from 'multer';
import { authenticateJWT } from '../middleware/auth';
import {
  getConversations,
  getOrCreateConversation,
  getMessages,
  sendMessage,
  markAsRead,
  deleteMessage
} from '../controllers/messageController';

const router = Router();

// Configure multer for file uploads (memory storage for Cloudinary)
const attachmentUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
    files: 5 // Max 5 files per message
  },
  fileFilter: (req, file, cb) => {
    // Allow common file types
    const allowedMimes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Allowed: images, PDFs, Word, Excel'));
    }
  }
});

/**
 * Get all conversations for authenticated user
 * GET /api/messages/conversations
 */
router.get('/conversations', authenticateJWT, getConversations);

/**
 * Get or create conversation with another user
 * POST /api/messages/conversations
 * Body: { otherUserId: string }
 */
router.post('/conversations', authenticateJWT, getOrCreateConversation);

/**
 * Get messages in a conversation
 * GET /api/messages/:conversationId
 * Query params: limit (default 50), before (ISO date for pagination)
 */
router.get('/:conversationId', authenticateJWT, getMessages);

/**
 * Send a message in a conversation
 * POST /api/messages/:conversationId
 * Body: { content: string }
 * Files: Optional attachments (max 5, 10MB each)
 */
router.post(
  '/:conversationId',
  authenticateJWT,
  attachmentUpload.array('attachments', 5),
  sendMessage
);

/**
 * Mark messages as read in a conversation
 * PUT /api/messages/:conversationId/read
 */
router.put('/:conversationId/read', authenticateJWT, markAsRead);

/**
 * Delete a message
 * DELETE /api/messages/:messageId
 */
router.delete('/:messageId', authenticateJWT, deleteMessage);

export default router;
