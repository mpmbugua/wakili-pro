/**
 * Article Routes
 */

import express from 'express';
import * as articleController from '../controllers/articleController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = express.Router();

// IMPORTANT: Specific routes MUST come before parameterized routes (/:id)
// Otherwise Express will match /admin/pending as /:id with id="admin"

// Public routes
router.get('/published', articleController.getPublishedArticles);

// Admin routes (BEFORE /:id routes)
router.get('/admin/pending', authenticateToken, articleController.getPendingArticles);

// Protected routes (require authentication)
router.get('/', authenticateToken, articleController.getAllArticles);
router.post('/', authenticateToken, articleController.createArticle);

// Parameterized routes (MUST be last to avoid conflicts)
router.get('/:id', articleController.getArticle);
router.put('/:id', authenticateToken, articleController.updateArticle);
router.delete('/:id', authenticateToken, articleController.deleteArticle);
router.put('/:id/approve', authenticateToken, articleController.approveArticle);
router.put('/:id/reject', authenticateToken, articleController.rejectArticle);

export default router;
