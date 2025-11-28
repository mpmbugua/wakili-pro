import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { GlobalLayout } from '../components/layout';
import { ArrowLeft, Calendar, User, Tag, ExternalLink, BookOpen } from 'lucide-react';
import axiosInstance from '../lib/axios';

interface Article {
  id: string;
  title: string;
  content: string;
  author: {
    id: string;
    firstName: string;
    lastName: string;
  };
  sourceUrl?: string;
  metadata?: {
    aiSummary?: string;
    category?: string;
    tags?: string[];
    qualityScore?: number;
    source?: string;
    publishedDate?: string;
  };
}

export const ArticleDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchArticle();
    }
  }, [id]);

  const fetchArticle = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/articles/${id}`);
      
      if (response.data.success) {
        setArticle(response.data.data);
      } else {
        setError('Article not found');
      }
    } catch (err) {
      console.error('Error fetching article:', err);
      setError('Failed to load article');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <GlobalLayout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-sm text-slate-600">Loading article...</p>
          </div>
        </div>
      </GlobalLayout>
    );
  }

  if (error || !article) {
    return (
      <GlobalLayout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
          <div className="text-center">
            <BookOpen className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Article Not Found</h2>
            <p className="text-sm text-slate-600 mb-6">{error || 'The article you are looking for does not exist.'}</p>
            <Link 
              to="/resources"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded hover:bg-blue-700"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Resources
            </Link>
          </div>
        </div>
      </GlobalLayout>
    );
  }

  return (
    <GlobalLayout>
      {/* Header */}
      <section className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <Link 
            to="/resources"
            className="inline-flex items-center text-sm text-slate-600 hover:text-slate-900 mb-4"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Resources
          </Link>

          {article.metadata?.category && (
            <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full mb-4">
              {article.metadata.category}
            </span>
          )}

          <h1 className="text-3xl font-bold text-slate-900 mb-4">
            {article.title}
          </h1>

          {article.metadata?.aiSummary && (
            <p className="text-lg text-slate-700 mb-6">
              {article.metadata.aiSummary}
            </p>
          )}

          {/* Article Metadata */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
            <div className="flex items-center">
              <User className="h-4 w-4 mr-1" />
              {article.author.firstName} {article.author.lastName}
            </div>
            
            {article.metadata?.publishedDate && (
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                {new Date(article.metadata.publishedDate).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </div>
            )}

            {article.metadata?.source && (
              <div className="flex items-center">
                <Tag className="h-4 w-4 mr-1" />
                Source: {article.metadata.source}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Article Content */}
      <article className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="prose prose-slate max-w-none">
          <div className="bg-white rounded-lg border border-slate-200 p-8">
            {/* Article body */}
            <div 
              className="article-content text-slate-800 leading-relaxed whitespace-pre-wrap"
              style={{ 
                fontSize: '16px',
                lineHeight: '1.8'
              }}
            >
              {article.content}
            </div>

            {/* Source Link */}
            {article.sourceUrl && (
              <div className="mt-8 pt-6 border-t border-slate-200">
                <a 
                  href={article.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  View Original Source
                  <ExternalLink className="ml-1 h-4 w-4" />
                </a>
              </div>
            )}

            {/* Tags */}
            {article.metadata?.tags && article.metadata.tags.length > 0 && (
              <div className="mt-6 pt-6 border-t border-slate-200">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">Related Topics</h3>
                <div className="flex flex-wrap gap-2">
                  {article.metadata.tags.map((tag, index) => (
                    <span 
                      key={index}
                      className="px-3 py-1 bg-slate-100 text-slate-700 text-xs rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-8 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-8 rounded-lg border border-blue-200">
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            Need Personalized Legal Advice?
          </h3>
          <p className="text-sm text-slate-600 mb-4">
            This article provides general information. For advice specific to your situation, consult with a qualified lawyer.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link 
              to="/ai"
              className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded hover:bg-blue-700"
            >
              Ask AI Assistant
            </Link>
            <Link 
              to="/lawyers"
              className="px-4 py-2 bg-white border border-slate-300 text-slate-700 text-sm font-semibold rounded hover:bg-slate-50"
            >
              Find a Lawyer
            </Link>
          </div>
        </div>
      </article>
    </GlobalLayout>
  );
};

export default ArticleDetailPage;
