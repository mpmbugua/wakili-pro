/**
 * Article Validation Service - AI-powered validation of scraped legal content
 * Uses GPT-4o to validate quality, accuracy, relevance and generate metadata
 */

import { OpenAI } from 'openai';
import * as cheerio from 'cheerio';
import axios from 'axios';
import { logger } from '../../utils/logger';

interface ArticleValidationRequest {
  title: string;
  sourceUrl: string;
  publishedDate?: string;
  summary?: string;
  source: 'Kenya Law' | 'Judiciary' | 'LSK' | 'Other';
}

interface ArticleValidationResult {
  decision: 'auto_publish' | 'needs_review' | 'reject';
  qualityScore: number; // 0-100
  relevanceScore: number; // 0-100
  accuracyScore: number; // 0-100
  overallScore: number; // 0-100
  aiSummary: string;
  category: string;
  tags: string[];
  extractedContent: string;
  reasoning: string;
  isDuplicate: boolean;
  recommendations?: string;
}

class ArticleValidationService {
  private openai: OpenAI;
  private qualityThreshold: number = 70; // Auto-publish if >= 70
  private reviewThreshold: number = 50; // Manual review if 50-69
  // Reject if < 50

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY not found in environment variables');
    }
    this.openai = new OpenAI({ apiKey });
  }

  /**
   * Extract full article content from URL
   */
  async extractArticleContent(url: string): Promise<string> {
    try {
      logger.info(`Extracting content from: ${url}`);
      
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const $ = cheerio.load(response.data);

      // Remove unwanted elements
      $('script, style, nav, header, footer, aside, .advertisement, .ads').remove();

      // Try common article content selectors
      const contentSelectors = [
        'article',
        '.article-content',
        '.post-content',
        '.entry-content',
        '.content',
        'main',
        '#content',
        '.article-body'
      ];

      let content = '';
      for (const selector of contentSelectors) {
        const element = $(selector);
        if (element.length > 0) {
          content = element.text().trim();
          if (content.length > 200) break; // Valid content found
        }
      }

      // Fallback: get body text if no specific selector worked
      if (content.length < 200) {
        content = $('body').text().trim();
      }

      // Clean up whitespace
      content = content.replace(/\s+/g, ' ').trim();

      // Limit to reasonable length for AI processing
      if (content.length > 10000) {
        content = content.substring(0, 10000) + '...';
      }

      logger.info(`Extracted ${content.length} characters from ${url}`);
      return content;

    } catch (error) {
      logger.error(`Failed to extract content from ${url}:`, error);
      return '';
    }
  }

  /**
   * Validate article using AI
   */
  async validateArticle(request: ArticleValidationRequest): Promise<ArticleValidationResult> {
    try {
      logger.info(`Validating article: ${request.title}`);

      // Extract full content from source URL
      const extractedContent = await this.extractArticleContent(request.sourceUrl);

      if (!extractedContent || extractedContent.length < 100) {
        return {
          decision: 'reject',
          qualityScore: 0,
          relevanceScore: 0,
          accuracyScore: 0,
          overallScore: 0,
          aiSummary: '',
          category: 'Unknown',
          tags: [],
          extractedContent: '',
          reasoning: 'Could not extract sufficient content from the source URL',
          isDuplicate: false
        };
      }

      // Build AI validation prompt
      const validationPrompt = `You are a legal content validator for a Kenyan legal platform. Analyze this article and provide detailed validation.

**Article Information:**
Title: ${request.title}
Source: ${request.source}
URL: ${request.sourceUrl}
Published: ${request.publishedDate || 'Unknown'}

**Article Content:**
${extractedContent}

**Your Task:**
Provide a JSON response with the following structure:
{
  "qualityScore": <0-100, assess writing quality, clarity, structure>,
  "relevanceScore": <0-100, relevance to Kenyan law and legal practice>,
  "accuracyScore": <0-100, legal accuracy and credibility of source>,
  "aiSummary": "<2-3 sentence summary of the article>",
  "category": "<one of: Constitutional Law, Criminal Law, Civil Law, Commercial Law, Employment Law, Family Law, Land Law, Tax Law, Legal Technology, Court News, Legislative Updates, Legal Analysis, Other>",
  "tags": ["<tag1>", "<tag2>", "<tag3>"],
  "reasoning": "<brief explanation of scores>",
  "isDuplicate": <true/false, does this seem like duplicate/repetitive content?>,
  "recommendations": "<optional suggestions for improvement if needed>"
}

**Scoring Guidelines:**
- Quality: Professional writing, clear structure, proper citations
- Relevance: Direct connection to Kenyan law, practical value for lawyers/clients
- Accuracy: Legally sound, credible source, up-to-date information

Respond ONLY with valid JSON, no additional text.`;

      // Call GPT-4o for validation
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are an expert Kenyan legal content validator. Provide thorough, objective analysis of legal articles.'
          },
          {
            role: 'user',
            content: validationPrompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1000,
        response_format: { type: 'json_object' }
      });

      const aiResponse = completion.choices[0].message.content;
      if (!aiResponse) {
        throw new Error('No response from AI validation');
      }

      const validation = JSON.parse(aiResponse);

      // Calculate overall score (weighted average)
      const overallScore = Math.round(
        (validation.qualityScore * 0.3) +
        (validation.relevanceScore * 0.4) +
        (validation.accuracyScore * 0.3)
      );

      // Determine decision based on overall score
      let decision: 'auto_publish' | 'needs_review' | 'reject';
      if (overallScore >= this.qualityThreshold && !validation.isDuplicate) {
        decision = 'auto_publish';
      } else if (overallScore >= this.reviewThreshold) {
        decision = 'needs_review';
      } else {
        decision = 'reject';
      }

      const result: ArticleValidationResult = {
        decision,
        qualityScore: validation.qualityScore,
        relevanceScore: validation.relevanceScore,
        accuracyScore: validation.accuracyScore,
        overallScore,
        aiSummary: validation.aiSummary,
        category: validation.category,
        tags: validation.tags || [],
        extractedContent,
        reasoning: validation.reasoning,
        isDuplicate: validation.isDuplicate || false,
        recommendations: validation.recommendations
      };

      logger.info(`Validation complete for "${request.title}": ${decision} (score: ${overallScore})`);
      return result;

    } catch (error) {
      logger.error('Article validation error:', error);
      
      // Return rejection on error
      return {
        decision: 'reject',
        qualityScore: 0,
        relevanceScore: 0,
        accuracyScore: 0,
        overallScore: 0,
        aiSummary: '',
        category: 'Unknown',
        tags: [],
        extractedContent: '',
        reasoning: `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        isDuplicate: false
      };
    }
  }

  /**
   * Batch validate multiple articles
   */
  async validateArticleBatch(articles: ArticleValidationRequest[]): Promise<ArticleValidationResult[]> {
    const results: ArticleValidationResult[] = [];
    
    for (const article of articles) {
      try {
        const result = await this.validateArticle(article);
        results.push(result);
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        logger.error(`Failed to validate article "${article.title}":`, error);
        results.push({
          decision: 'reject',
          qualityScore: 0,
          relevanceScore: 0,
          accuracyScore: 0,
          overallScore: 0,
          aiSummary: '',
          category: 'Unknown',
          tags: [],
          extractedContent: '',
          reasoning: 'Batch validation error',
          isDuplicate: false
        });
      }
    }

    return results;
  }
}

// Export singleton instance
export const articleValidationService = new ArticleValidationService();
