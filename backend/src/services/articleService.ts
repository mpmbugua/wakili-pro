/**
 * Article Service - Business logic for article management
 */

import { PrismaClient } from '@prisma/client';
import { nanoid } from 'nanoid';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

interface CreateArticleData {
  title: string;
  content: string;
  authorId: string;
  isPremium?: boolean;
  isPublished?: boolean;
  sourceUrl?: string;
  metadata?: {
    aiSummary?: string;
    category?: string;
    tags?: string[];
    qualityScore?: number;
    source?: string;
  };
}

interface UpdateArticleData {
  title?: string;
  content?: string;
  isPremium?: boolean;
  isPublished?: boolean;
}

interface ArticleFilters {
  isPublished?: boolean;
  isPremium?: boolean;
  authorId?: string;
  search?: string;
  category?: string;
}

/**
 * Extract metadata from article content
 */
function extractMetadata(content: string): {  
  metadata: any;
  cleanContent: string;
} {
  const metadataMatch = content.match(/<!--METADATA:(.+?)-->/);
  
  if (metadataMatch) {
    try {
      const metadata = JSON.parse(metadataMatch[1]);
      const cleanContent = content.replace(/<!--METADATA:.+?-->\n\n/, '');
      return { metadata, cleanContent };
    } catch (error) {
      logger.warn('Failed to parse article metadata:', error);
    }
  }
  
  return { metadata: {}, cleanContent: content };
}

/**
 * Get all articles with filtering and pagination
 */
export async function getArticles(
  filters: ArticleFilters = {},
  page: number = 1,
  limit: number = 20
) {
  try {
    const skip = (page - 1) * limit;
    
    const where: any = {};
    
    if (filters.isPublished !== undefined) {
      where.isPublished = filters.isPublished;
    }
    
    if (filters.isPremium !== undefined) {
      where.isPremium = filters.isPremium;
    }
    
    if (filters.authorId) {
      where.authorId = filters.authorId;
    }
    
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { content: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        where,
        skip,
        take: limit,
        orderBy: { id: 'desc' }, // Most recent first
        include: {
          User: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      }),
      prisma.article.count({ where })
    ]);

    // Extract metadata and filter by category if specified
    let processedArticles = articles.map(article => {
      const { metadata, cleanContent } = extractMetadata(article.content);
      
      return {
        id: article.id,
        title: article.title,
        content: cleanContent,
        author: article.User,
        isPremium: article.isPremium,
        isPublished: article.isPublished,
        sourceUrl: article.fileName, // fileName field stores source URL
        metadata
      };
    });

    // Filter by category if specified
    if (filters.category) {
      processedArticles = processedArticles.filter(
        article => article.metadata.category === filters.category
      );
    }

    return {
      articles: processedArticles,
      total: filters.category ? processedArticles.length : total,
      page,
      totalPages: Math.ceil((filters.category ? processedArticles.length : total) / limit)
    };

  } catch (error) {
    logger.error('Error fetching articles:', error);
    throw error;
  }
}

/**
 * Get single article by ID
 */
export async function getArticleById(id: string) {
  try {
    const article = await prisma.article.findUnique({
      where: { id },
      include: {
        User: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    if (!article) {
      return null;
    }

    const { metadata, cleanContent } = extractMetadata(article.content);

    return {
      id: article.id,
      title: article.title,
      content: cleanContent,
      author: article.User,
      isPremium: article.isPremium,
      isPublished: article.isPublished,
      sourceUrl: article.fileName,
      metadata
    };

  } catch (error) {
    logger.error('Error fetching article:', error);
    throw error;
  }
}

/**
 * Create new article
 */
export async function createArticle(data: CreateArticleData) {
  try {
    let content = data.content;
    
    // Add metadata to content if provided
    if (data.metadata) {
      content = `<!--METADATA:${JSON.stringify(data.metadata)}-->\n\n${content}`;
    }

    const article = await prisma.article.create({
      data: {
        id: nanoid(),
        title: data.title,
        content,
        authorId: data.authorId,
        isPremium: data.isPremium || false,
        isPublished: data.isPublished || false,
        fileName: data.sourceUrl || null
      },
      include: {
        User: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    logger.info(`Article created: ${article.title} (ID: ${article.id})`);
    
    const { metadata, cleanContent } = extractMetadata(article.content);

    return {
      id: article.id,
      title: article.title,
      content: cleanContent,
      author: article.User,
      isPremium: article.isPremium,
      isPublished: article.isPublished,
      sourceUrl: article.fileName,
      metadata
    };

  } catch (error) {
    logger.error('Error creating article:', error);
    throw error;
  }
}

/**
 * Update article
 */
export async function updateArticle(id: string, data: UpdateArticleData) {
  try {
    const article = await prisma.article.update({
      where: { id },
      data,
      include: {
        User: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    logger.info(`Article updated: ${article.title} (ID: ${article.id})`);

    const { metadata, cleanContent } = extractMetadata(article.content);

    return {
      id: article.id,
      title: article.title,
      content: cleanContent,
      author: article.User,
      isPremium: article.isPremium,
      isPublished: article.isPublished,
      sourceUrl: article.fileName,
      metadata
    };

  } catch (error) {
    logger.error('Error updating article:', error);
    throw error;
  }
}

/**
 * Delete article
 */
export async function deleteArticle(id: string) {
  try {
    await prisma.article.delete({
      where: { id }
    });

    logger.info(`Article deleted: ID ${id}`);
    return true;

  } catch (error) {
    logger.error('Error deleting article:', error);
    throw error;
  }
}

/**
 * Get published articles (for public display)
 */
export async function getPublishedArticles(
  page: number = 1,
  limit: number = 20,
  category?: string
) {
  return getArticles(
    { isPublished: true, category },
    page,
    limit
  );
}

/**
 * Get pending articles (for admin review)
 */
export async function getPendingArticles(
  page: number = 1,
  limit: number = 20
) {
  return getArticles(
    { isPublished: false },
    page,
    limit
  );
}

/**
 * Approve article (publish)
 */
export async function approveArticle(id: string) {
  return updateArticle(id, { isPublished: true });
}

/**
 * Reject article (unpublish)
 */
export async function rejectArticle(id: string) {
  return updateArticle(id, { isPublished: false });
}
