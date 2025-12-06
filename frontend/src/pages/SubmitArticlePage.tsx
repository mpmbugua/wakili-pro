import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Save, Info, CheckCircle } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import axiosInstance from '../lib/axios';

export const SubmitArticlePage: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: '',
    tags: '',
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const metadata = {
        category: formData.category,
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        aiSummary: formData.content.substring(0, 200) + '...',
      };

      await axiosInstance.post('/articles', {
        title: formData.title,
        content: formData.content,
        isPremium: false,
        isPublished: false, // All submissions go for admin review
        metadata,
      });

      setSubmitted(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 3000);
    } catch (error: any) {
      console.error('Failed to submit article:', error);
      alert(error.response?.data?.message || 'Failed to submit article');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Article Submitted!</h2>
          <p className="text-slate-600 mb-4">
            Your article has been submitted for review. Our admin team will review it within 24-48 hours. 
            If approved, it will be published on the Wakili Pro legal resources page and blog.
          </p>
          <p className="text-sm text-slate-500">
            Redirecting to dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
              <FileText className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Submit Legal Article</h1>
              <p className="text-slate-600">Share your legal expertise with the Wakili Pro community</p>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border-l-4 border-blue-600 rounded-r-lg p-6 mb-8">
          <div className="flex items-start">
            <Info className="h-5 w-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-900">
              <p className="font-semibold mb-2">Submission Guidelines</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Articles should be original, informative, and relevant to Kenyan law</li>
                <li>Minimum 500 words recommended for comprehensive coverage</li>
                <li>Include practical examples and actionable advice where applicable</li>
                <li>All submissions will be reviewed by our admin team before publication</li>
                <li>Approved articles may be featured on the homepage and shared via our newsletter</li>
                <li>You will be credited as the author with your name and professional title</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Article Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Understanding the New Data Protection Act in Kenya"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-xs text-slate-500 mt-1">
                Make it clear, descriptive, and engaging
              </p>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Category *
              </label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select a category</option>
                <option value="Corporate Law">Corporate Law</option>
                <option value="Property Law">Property Law</option>
                <option value="Employment Law">Employment Law</option>
                <option value="Family Law">Family Law</option>
                <option value="Criminal Law">Criminal Law</option>
                <option value="Constitutional Law">Constitutional Law</option>
                <option value="Tax Law">Tax Law</option>
                <option value="Intellectual Property">Intellectual Property</option>
                <option value="Immigration Law">Immigration Law</option>
                <option value="Technology Law">Technology Law</option>
                <option value="Commercial Law">Commercial Law</option>
                <option value="Banking & Finance">Banking & Finance</option>
              </select>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="e.g., contracts, compliance, startups, data protection"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-xs text-slate-500 mt-1">
                Help readers find your article by adding relevant keywords
              </p>
            </div>

            {/* Content */}
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Article Content *
              </label>
              <textarea
                required
                rows={16}
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Write your article here... 

Tip: Structure your content with clear headings and paragraphs. Include:
- Introduction: Brief overview of the topic
- Main Content: Detailed explanation with examples
- Practical Advice: Actionable tips for readers
- Conclusion: Summary and next steps

You can use plain text or Markdown formatting."
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
              />
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-slate-500">
                  {formData.content.length} characters • ~{Math.ceil(formData.content.length / 1000)} min read
                </p>
                {formData.content.length < 500 && (
                  <p className="text-xs text-amber-600">
                    Recommended minimum: 500 characters
                  </p>
                )}
              </div>
            </div>

            {/* Author Info */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-slate-900 mb-2">Author Information</p>
              <div className="text-sm text-slate-600 space-y-1">
                <p><strong>Name:</strong> {user?.firstName} {user?.lastName}</p>
                <p><strong>Email:</strong> {user?.email}</p>
                {user?.role === 'LAWYER' && (
                  <p className="text-xs text-slate-500 mt-2">
                    Your lawyer profile information will be used for author attribution
                  </p>
                )}
              </div>
            </div>

            {/* Submit */}
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Save className="h-5 w-5" />
                {loading ? 'Submitting...' : 'Submit for Review'}
              </button>
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>

            <p className="text-xs text-slate-500 text-center">
              By submitting, you agree that your article may be edited for clarity and published 
              on Wakili Pro. You retain copyright ownership of your work.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};
