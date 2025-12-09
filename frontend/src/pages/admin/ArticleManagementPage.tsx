import React, { useState, useEffect } from 'react';
import { 
  FileText, Plus, Search, Eye, Edit, Trash2, 
  CheckCircle, XCircle, Clock, RefreshCw, TrendingUp
} from 'lucide-react';
import axiosInstance from '../../lib/axios';
import { ArticleEditor } from '../../components/admin/ArticleEditor';

interface Article {
  id: string;
  title: string;
  content: string;
  category?: string;
  tags?: string[];
  isPremium: boolean;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  summary?: string;
  authorId: string;
  aiScore?: number;
  sourceUrl?: string;
}

interface Stats {
  total: number;
  published: number;
  pending: number;
  aiGenerated: number;
}

export const ArticleManagementPage: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, published: 0, pending: 0, aiGenerated: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'pending'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [selectedArticles, setSelectedArticles] = useState<string[]>([]);
  const [showEditor, setShowEditor] = useState(false);
  const [editingArticleId, setEditingArticleId] = useState<string | undefined>();

  useEffect(() => {
    loadArticles();
    loadStats();
  }, [filterStatus, filterCategory]);

  const loadArticles = async () => {
    setLoading(true);
    try {
      let endpoint = '/articles';
      if (filterStatus === 'published') {
        endpoint = '/articles/published';
      } else if (filterStatus === 'pending') {
        endpoint = '/articles/admin/pending';
      }

      const response = await axiosInstance.get(endpoint);
      if (response.data.success && response.data.data) {
        // Handle paginated response - extract articles array
        let articlesList = response.data.data.articles || response.data.data;
        
        // Ensure articlesList is an array
        if (!Array.isArray(articlesList)) {
          articlesList = [];
        }
        
        // Filter by category if selected
        if (filterCategory !== 'all') {
          articlesList = articlesList.filter((a: Article) => a.category === filterCategory);
        }
        
        console.log('[ArticleManagementPage] Loaded articles:', articlesList);
        setArticles(articlesList);
      }
    } catch (error) {
      console.error('Failed to load articles:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const [allRes, publishedRes, pendingRes] = await Promise.all([
        axiosInstance.get('/articles'),
        axiosInstance.get('/articles/published'),
        axiosInstance.get('/articles/admin/pending')
      ]);

      // Extract articles arrays from paginated responses
      const allArticles = allRes.data.data?.articles || allRes.data.data || [];
      const publishedArticles = publishedRes.data.data?.articles || publishedRes.data.data || [];
      const pendingArticles = pendingRes.data.data?.articles || pendingRes.data.data || [];
      
      const aiGenerated = allArticles.filter((a: Article) => a.aiScore !== undefined && a.aiScore !== null);

      console.log('[ArticleManagementPage] Stats:', {
        total: allArticles.length,
        published: publishedArticles.length,
        pending: pendingArticles.length,
        aiGenerated: aiGenerated.length
      });

      setStats({
        total: allArticles.length,
        published: publishedArticles.length,
        pending: pendingArticles.length,
        aiGenerated: aiGenerated.length
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this article?')) return;

    try {
      const response = await axiosInstance.delete(`/articles/${id}`);
      if (response.data.success) {
        alert('Article deleted successfully');
        loadArticles();
        loadStats();
      }
    } catch (error) {
      console.error('Failed to delete article:', error);
      alert('Failed to delete article');
    }
  };

  const handlePublish = async (id: string) => {
    try {
      const response = await axiosInstance.put(`/articles/${id}`, { isPublished: true });
      if (response.data.success) {
        alert('Article published successfully');
        loadArticles();
        loadStats();
      }
    } catch (error) {
      console.error('Failed to publish article:', error);
      alert('Failed to publish article');
    }
  };

  const handleUnpublish = async (id: string) => {
    try {
      const response = await axiosInstance.put(`/articles/${id}`, { isPublished: false });
      if (response.data.success) {
        alert('Article unpublished successfully');
        loadArticles();
        loadStats();
      }
    } catch (error) {
      console.error('Failed to unpublish article:', error);
      alert('Failed to unpublish article');
    }
  };

  const handleBulkAction = async (action: 'publish' | 'unpublish' | 'delete') => {
    if (selectedArticles.length === 0) {
      alert('Please select articles first');
      return;
    }

    if (action === 'delete' && !confirm(`Delete ${selectedArticles.length} articles?`)) {
      return;
    }

    try {
      for (const id of selectedArticles) {
        if (action === 'delete') {
          await axiosInstance.delete(`/articles/${id}`);
        } else {
          await axiosInstance.put(`/articles/${id}`, { 
            isPublished: action === 'publish' 
          });
        }
      }
      
      alert(`Successfully ${action}ed ${selectedArticles.length} articles`);
      setSelectedArticles([]);
      loadArticles();
      loadStats();
    } catch (error) {
      console.error(`Failed to ${action} articles:`, error);
      alert(`Failed to ${action} some articles`);
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedArticles(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const filteredArticles = articles.filter(article =>
    article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    article.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const categories = Array.from(new Set(articles.map(a => a.category).filter(Boolean)));

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Article Management</h1>
          <p className="text-slate-600">Manage legal articles, approve AI-generated content, and create new posts</p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
            <div className="text-sm text-slate-600">Total Articles</div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900">{stats.published}</div>
            <div className="text-sm text-slate-600">Published</div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900">{stats.pending}</div>
            <div className="text-sm text-slate-600">Pending Review</div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <RefreshCw className="h-5 w-5 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900">{stats.aiGenerated}</div>
            <div className="text-sm text-slate-600">AI Generated</div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="bg-white rounded-lg border border-slate-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search articles..."
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Filters */}
            <div className="flex gap-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="published">Published</option>
                <option value="pending">Pending</option>
              </select>

              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              <button
                onClick={() => {
                  setEditingArticleId(undefined);
                  setShowEditor(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
              >
                <Plus className="h-5 w-5" />
                New Article
              </button>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedArticles.length > 0 && (
            <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-200">
              <span className="text-sm text-slate-600">{selectedArticles.length} selected</span>
              <button
                onClick={() => handleBulkAction('publish')}
                className="px-3 py-1 text-sm bg-green-600 text-blue-700 rounded hover:bg-green-700"
              >
                Publish
              </button>
              <button
                onClick={() => handleBulkAction('unpublish')}
                className="px-3 py-1 text-sm bg-amber-600 text-blue-700 rounded hover:bg-amber-700"
              >
                Unpublish
              </button>
              <button
                onClick={() => handleBulkAction('delete')}
                className="px-3 py-1 text-sm bg-red-600 text-blue-700 rounded hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          )}
        </div>

        {/* Articles Table */}
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <RefreshCw className="h-8 w-8 text-slate-400 animate-spin mx-auto mb-2" />
              <p className="text-slate-600">Loading articles...</p>
            </div>
          ) : filteredArticles.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="h-12 w-12 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-600">No articles found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedArticles.length === filteredArticles.length}
                        onChange={(e) =>
                          setSelectedArticles(
                            e.target.checked ? filteredArticles.map(a => a.id) : []
                          )
                        }
                        className="w-4 h-4 rounded"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Title</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Category</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">AI Score</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Created</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-slate-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredArticles.map((article) => (
                    <tr key={article.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedArticles.includes(article.id)}
                          onChange={() => toggleSelection(article.id)}
                          className="w-4 h-4 rounded"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">{article.title}</div>
                        {article.sourceUrl && (
                          <div className="text-xs text-blue-600 truncate max-w-xs">
                            {article.sourceUrl}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                          {article.category || 'Uncategorized'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {article.isPublished ? (
                            <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                              <CheckCircle className="h-3 w-3" />
                              Published
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-full">
                              <Clock className="h-3 w-3" />
                              Pending
                            </span>
                          )}
                          {article.isPremium && (
                            <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                              Premium
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {article.aiScore !== undefined && article.aiScore !== null ? (
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-slate-200 rounded-full h-2 max-w-[60px]">
                              <div
                                className={`h-2 rounded-full ${
                                  article.aiScore >= 70 ? 'bg-green-500' :
                                  article.aiScore >= 50 ? 'bg-amber-500' :
                                  'bg-red-500'
                                }`}
                                style={{ width: `${article.aiScore}%` }}
                              />
                            </div>
                            <span className="text-sm text-slate-600">{article.aiScore}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-slate-400">Manual</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {new Date(article.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => window.open(`/resources/${article.id}`, '_blank')}
                            className="p-1 hover:bg-slate-100 rounded"
                            title="View"
                          >
                            <Eye className="h-4 w-4 text-slate-600" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingArticleId(article.id);
                              setShowEditor(true);
                            }}
                            className="p-1 hover:bg-slate-100 rounded"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4 text-blue-600" />
                          </button>
                          {article.isPublished ? (
                            <button
                              onClick={() => handleUnpublish(article.id)}
                              className="p-1 hover:bg-slate-100 rounded"
                              title="Unpublish"
                            >
                              <XCircle className="h-4 w-4 text-amber-600" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handlePublish(article.id)}
                              className="p-1 hover:bg-slate-100 rounded"
                              title="Publish"
                            >
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(article.id)}
                            className="p-1 hover:bg-slate-100 rounded"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Article Editor Modal */}
      {showEditor && (
        <ArticleEditor
          articleId={editingArticleId}
          onSave={() => {
            setShowEditor(false);
            setEditingArticleId(undefined);
            loadArticles();
            loadStats();
          }}
          onClose={() => {
            setShowEditor(false);
            setEditingArticleId(undefined);
          }}
        />
      )}
    </div>
  );
};
