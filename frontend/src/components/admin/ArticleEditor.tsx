import React, { useState, useEffect } from 'react';
import { X, Save, Eye } from 'lucide-react';
import axiosInstance from '../../lib/axios';

interface ArticleEditorProps {
  articleId?: string;
  onSave: () => void;
  onClose: () => void;
}

interface ArticleFormData {
  title: string;
  content: string;
  category: string;
  tags: string[];
  isPremium: boolean;
  isPublished: boolean;
  summary?: string;
}

const categories = [
  'Employment Law',
  'Property Law',
  'Family Law',
  'Criminal Law',
  'Business Law',
  'Constitutional Law',
  'Tax Law',
  'Immigration Law',
  'Intellectual Property',
  'Other'
];

export const ArticleEditor: React.FC<ArticleEditorProps> = ({ articleId, onSave, onClose }) => {
  const [formData, setFormData] = useState<ArticleFormData>({
    title: '',
    content: '',
    category: 'Other',
    tags: [],
    isPremium: false,
    isPublished: false,
    summary: ''
  });
  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    if (articleId) {
      loadArticle();
    }
  }, [articleId]);

  const loadArticle = async () => {
    try {
      const response = await axiosInstance.get(`/articles/${articleId}`);
      if (response.data.success && response.data.data) {
        const article = response.data.data;
        setFormData({
          title: article.title,
          content: article.content,
          category: article.category || 'Other',
          tags: article.tags || [],
          isPremium: article.isPremium,
          isPublished: article.isPublished,
          summary: article.summary || ''
        });
      }
    } catch (error) {
      console.error('Failed to load article:', error);
      alert('Failed to load article');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.content.trim()) {
      alert('Title and content are required');
      return;
    }

    setLoading(true);
    try {
      const endpoint = articleId ? `/api/articles/${articleId}` : '/api/articles';
      const method = articleId ? 'put' : 'post';
      
      const response = await axiosInstance[method](endpoint, formData);
      
      if (response.data.success) {
        alert(articleId ? 'Article updated successfully' : 'Article created successfully');
        onSave();
      } else {
        alert(response.data.message || 'Failed to save article');
      }
    } catch (error: any) {
      console.error('Failed to save article:', error);
      alert(error.response?.data?.message || 'Failed to save article');
    } finally {
      setLoading(false);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()]
      });
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(t => t !== tag)
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">
            {articleId ? 'Edit Article' : 'Create New Article'}
          </h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPreviewMode(!previewMode)}
              className="flex items-center gap-2 px-4 py-2 text-sm border border-slate-300 rounded-md hover:bg-slate-50"
            >
              <Eye className="h-4 w-4" />
              {previewMode ? 'Edit' : 'Preview'}
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-md transition-colors"
            >
              <X className="h-5 w-5 text-slate-600" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {!previewMode ? (
            <>
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter article title..."
                  required
                />
              </div>

              {/* Summary */}
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  Summary (Optional)
                </label>
                <textarea
                  value={formData.summary}
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Brief summary of the article..."
                />
              </div>

              {/* Category and Tags */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">
                    Tags
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                      className="flex-1 px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Add tag..."
                    />
                    <button
                      type="button"
                      onClick={addTag}
                      className="px-4 py-2 bg-slate-100 text-slate-700 rounded-md hover:bg-slate-200"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.tags.map(tag => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="hover:text-blue-900"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  Content *
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={16}
                  className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  placeholder="Write your article content here... (Markdown supported)"
                  required
                />
                <p className="text-xs text-slate-500 mt-1">
                  Supports basic formatting: **bold**, *italic*, lists, etc.
                </p>
              </div>

              {/* Settings */}
              <div className="space-y-3">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isPremium}
                    onChange={(e) => setFormData({ ...formData, isPremium: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-slate-900">
                    Premium Article (requires subscription)
                  </span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isPublished}
                    onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-slate-900">
                    Publish immediately
                  </span>
                </label>
              </div>
            </>
          ) : (
            /* Preview Mode */
            <div className="prose max-w-none">
              <h1 className="text-3xl font-bold text-slate-900 mb-4">{formData.title || 'Untitled Article'}</h1>
              
              {formData.summary && (
                <p className="text-lg text-slate-600 mb-6 italic">{formData.summary}</p>
              )}
              
              <div className="flex flex-wrap gap-2 mb-6">
                <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">
                  {formData.category}
                </span>
                {formData.tags.map(tag => (
                  <span key={tag} className="px-3 py-1 bg-slate-100 text-slate-700 text-sm rounded-full">
                    {tag}
                  </span>
                ))}
                {formData.isPremium && (
                  <span className="px-3 py-1 bg-amber-100 text-amber-700 text-sm rounded-full">
                    Premium
                  </span>
                )}
              </div>
              
              <div className="whitespace-pre-wrap text-slate-800 leading-relaxed">
                {formData.content || 'No content yet...'}
              </div>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {loading ? 'Saving...' : (articleId ? 'Update Article' : 'Create Article')}
          </button>
        </div>
      </div>
    </div>
  );
};
