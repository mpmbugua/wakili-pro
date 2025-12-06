import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Plus, CheckCircle, Clock, Crown } from 'lucide-react';
import { Button } from '../ui/Button';
import axiosInstance from '../../lib/axios';

interface Article {
  id: string;
  title: string;
  category?: string;
  isPremium: boolean;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  metadata?: {
    category?: string;
    tags?: string[];
  };
}

interface LawyerArticlesSectionProps {
  userId: string;
}

export const LawyerArticlesSection: React.FC<LawyerArticlesSectionProps> = ({ userId }) => {
  const navigate = useNavigate();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get('/api/articles', {
          params: { authorId: userId }
        });
        
        console.log('[LawyerArticlesSection] API Response:', response.data);
        
        if (response.data.success && response.data.data) {
          // Handle both paginated and non-paginated responses
          const articlesData = response.data.data.articles || response.data.data;
          setArticles(Array.isArray(articlesData) ? articlesData : []);
        }
      } catch (error) {
        console.error('[LawyerArticlesSection] Failed to fetch articles:', error);
        setArticles([]);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchArticles();
    }
  }, [userId]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">My Submitted Articles</h3>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">My Submitted Articles</h3>
          <p className="text-sm text-gray-600 mt-1">Track your article submissions and their review status</p>
        </div>
        <Button variant="default" size="sm" onClick={() => navigate('/submit-article')}>
          <Plus className="h-4 w-4 mr-1" />
          Submit New Article
        </Button>
      </div>

      {articles.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No articles yet</h3>
          <p className="text-gray-600 mb-4">Share your legal expertise by writing your first article</p>
          <Button variant="default" onClick={() => navigate('/submit-article')}>
            <Plus className="h-4 w-4 mr-2" />
            Write Your First Article
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Submitted
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Updated
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {articles.map((article) => (
                <tr key={article.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{article.title}</div>
                    {article.isPremium && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 mt-1">
                        <Crown className="h-3 w-3 mr-1" />
                        Premium
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {article.metadata?.category || article.category || 'General'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {article.isPublished ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Published
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        <Clock className="h-3 w-3 mr-1" />
                        Pending Review
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(article.createdAt).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(article.updatedAt).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-4 text-sm text-gray-500">
            Total Articles: {articles.length} | Published: {articles.filter(a => a.isPublished).length} | Pending: {articles.filter(a => !a.isPublished).length}
          </div>
        </div>
      )}
    </div>
  );
};
