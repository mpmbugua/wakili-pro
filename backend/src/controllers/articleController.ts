/**
 * Article Controller - Handle article HTTP requests
 */

import { Request, Response } from 'express';
import { logger } from '../utils/logger';
import * as articleService from '../services/articleService';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

/**
 * GET /api/articles - Get all articles (with filters)
 */
export async function getAllArticles(req: AuthenticatedRequest, res: Response) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const isPublished = req.query.isPublished === 'true' ? true : req.query.isPublished === 'false' ? false : undefined;
    const isPremium = req.query.isPremium === 'true' ? true : req.query.isPremium === 'false' ? false : undefined;
    const search = req.query.search as string;
    const category = req.query.category as string;
    const authorId = req.query.authorId as string;

    const result = await articleService.getArticles(
      { isPublished, isPremium, search, category, authorId },
      page,
      limit
    );

    res.json({
      success: true,
      message: 'Articles fetched successfully',
      data: result
    });

  } catch (error) {
    logger.error('Error in getAllArticles:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch articles'
    });
  }
}

/**
 * GET /api/articles/published - Get published articles
 */
export async function getPublishedArticles(req: Request, res: Response) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const category = req.query.category as string;

    const result = await articleService.getPublishedArticles(page, limit, category);

    res.json({
      success: true,
      message: 'Published articles fetched successfully',
      data: result
    });

  } catch (error) {
    logger.error('Error in getPublishedArticles:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch published articles'
    });
  }
}

/**
 * GET /api/articles/pending - Get pending articles (admin only)
 */
export async function getPendingArticles(req: AuthenticatedRequest, res: Response) {
  try {
    // Check if user is admin
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: Admin access required'
      });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await articleService.getPendingArticles(page, limit);

    res.json({
      success: true,
      message: 'Pending articles fetched successfully',
      data: result
    });

  } catch (error) {
    logger.error('Error in getPendingArticles:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending articles'
    });
  }
}

/**
 * GET /api/articles/:id - Get single article
 */
export async function getArticle(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const article = await articleService.getArticleById(id);

    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }

    res.json({
      success: true,
      message: 'Article fetched successfully',
      data: article
    });

  } catch (error) {
    logger.error('Error in getArticle:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch article'
    });
  }
}

/**
 * POST /api/articles - Create new article
 */
export async function createArticle(req: AuthenticatedRequest, res: Response) {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Authentication required'
      });
    }

    const { title, content, isPremium, isPublished, sourceUrl, metadata } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Title and content are required'
      });
    }

    const article = await articleService.createArticle({
      title,
      content,
      authorId: req.user.id,
      isPremium,
      isPublished,
      sourceUrl,
      metadata
    });

    res.status(201).json({
      success: true,
      message: 'Article created successfully',
      data: article
    });

  } catch (error) {
    logger.error('Error in createArticle:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create article'
    });
  }
}

/**
 * PUT /api/articles/:id - Update article
 */
export async function updateArticle(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { title, content, isPremium, isPublished } = req.body;

    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Authentication required'
      });
    }

    const article = await articleService.updateArticle(id, {
      title,
      content,
      isPremium,
      isPublished
    });

    res.json({
      success: true,
      message: 'Article updated successfully',
      data: article
    });

  } catch (error) {
    logger.error('Error in updateArticle:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update article'
    });
  }
}

/**
 * DELETE /api/articles/:id - Delete article (admin only)
 */
export async function deleteArticle(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;

    // Check if user is admin
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: Admin access required'
      });
    }

    await articleService.deleteArticle(id);

    res.json({
      success: true,
      message: 'Article deleted successfully'
    });

  } catch (error) {
    logger.error('Error in deleteArticle:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete article'
    });
  }
}

/**
 * PUT /api/articles/:id/approve - Approve article (publish)
 */
export async function approveArticle(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;

    // Check if user is admin
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: Admin access required'
      });
    }

    const article = await articleService.approveArticle(id);

    res.json({
      success: true,
      message: 'Article approved and published successfully',
      data: article
    });

  } catch (error) {
    logger.error('Error in approveArticle:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve article'
    });
  }
}

/**
 * PUT /api/articles/:id/reject - Reject article (unpublish)
 */
export async function rejectArticle(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;

    // Check if user is admin
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: Admin access required'
      });
    }

    const article = await articleService.rejectArticle(id);

    res.json({
      success: true,
      message: 'Article rejected and unpublished successfully',
      data: article
    });

  } catch (error) {
    logger.error('Error in rejectArticle:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject article'
    });
  }
}
