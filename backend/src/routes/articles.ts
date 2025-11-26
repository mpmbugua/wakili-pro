/**
 * Article Routes
 */

import express from 'express';
import * as articleController from '../controllers/articleController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = express.Router();

// Public routes
router.get('/published', articleController.getPublishedArticles);
router.get('/:id', articleController.getArticle);

// Protected routes (require authentication)
router.get('/', authenticateToken, articleController.getAllArticles);
router.post('/', authenticateToken, articleController.createArticle);
router.put('/:id', authenticateToken, articleController.updateArticle);

// Admin routes
router.get('/admin/pending', authenticateToken, articleController.getPendingArticles);
router.delete('/:id', authenticateToken, articleController.deleteArticle);
router.put('/:id/approve', authenticateToken, articleController.approveArticle);
router.put('/:id/reject', authenticateToken, articleController.rejectArticle);

export default router;
