import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../lib/axios';
import {
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  Download,
  Eye,
  User,
  Calendar,
  DollarSign,
  Loader2
} from 'lucide-react';

interface ReviewResult {
  overallScore: number;
  completeness: any;
  consistency: any;
  legalCompliance: any;
  formatting: any;
  summary: string;
  detailedAnalysis: string;
  recommendsCertification: boolean;
}

interface DocumentReview {
  id: string;
  status: string;
  reviewType: 'AI_ONLY' | 'CERTIFICATION' | 'AI_PLUS_CERTIFICATION';
  price: number;
  paidAt: string;
  estimatedDeliveryDate: string;
  aiReviewStatus?: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  aiReviewResults?: ReviewResult;
  aiReviewCompletedAt?: string;
  certifiedDocumentUrl?: string;
  certificationLetterUrl?: string;
  certificateId?: string;
  userDocument: {
    title: string;
    uploadUrl: string;
    documentType: string;
  };
  lawyer?: {
    firstName: string;
    lastName: string;
  };
}

const DocumentReviewDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState<DocumentReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReview, setSelectedReview] = useState<DocumentReview | null>(null);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const response = await axiosInstance.get('/document-review/user/all');
      if (response.data.success) {
        setReviews(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (review: DocumentReview) => {
    const statusMap: Record<string, { label: string; color: string; icon: any }> = {
      'pending_payment': {
        label: 'Awaiting Payment',
        color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
        icon: DollarSign
      },
      'pending_lawyer_assignment': {
        label: 'Processing Payment',
        color: 'bg-blue-100 text-blue-800 border-blue-300',
        icon: Clock
      },
      'assigned': {
        label: 'Lawyer Assigned',
        color: 'bg-purple-100 text-purple-800 border-purple-300',
        icon: User
      },
      'in_progress': {
        label: 'Under Review',
        color: 'bg-indigo-100 text-indigo-800 border-indigo-300',
        icon: Loader2
      },
      'completed': {
        label: 'Completed',
        color: 'bg-green-100 text-green-800 border-green-300',
        icon: CheckCircle
      },
      'failed': {
        label: 'Failed',
        color: 'bg-red-100 text-red-800 border-red-300',
        icon: AlertCircle
      }
    };

    const status = statusMap[review.status] || statusMap['pending_payment'];
    const Icon = status.icon;

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${status.color}`}>
        <Icon className="h-3 w-3 mr-1" />
        {status.label}
      </span>
    );
  };

  const getAIReviewStatusBadge = (aiStatus?: string) => {
    if (!aiStatus) return null;

    const statusMap: Record<string, { label: string; color: string }> = {
      'PENDING': { label: 'Queued', color: 'bg-gray-100 text-gray-800' },
      'PROCESSING': { label: 'Analyzing...', color: 'bg-blue-100 text-blue-800 animate-pulse' },
      'COMPLETED': { label: 'AI Review Complete', color: 'bg-green-100 text-green-800' },
      'FAILED': { label: 'AI Review Failed', color: 'bg-red-100 text-red-800' }
    };

    const status = statusMap[aiStatus];
    if (!status) return null;

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${status.color}`}>
        {status.label}
      </span>
    );
  };

  const getReviewTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      'AI_ONLY': 'AI Review Only',
      'CERTIFICATION': 'Lawyer Certification',
      'AI_PLUS_CERTIFICATION': 'AI Review + Certification'
    };
    return types[type] || type;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-blue-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Document Reviews</h1>
          <p className="text-slate-600">Track your document review and certification requests</p>
        </div>

        {/* Reviews List */}
        {reviews.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Reviews Yet</h3>
            <p className="text-gray-600 mb-6">Upload a document to get started with AI review or certification</p>
            <button
              onClick={() => navigate('/documents')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Upload Document
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  {/* Header Row */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-slate-900 mb-2">
                        {review.userDocument.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        {getStatusBadge(review)}
                        {review.aiReviewStatus && getAIReviewStatusBadge(review.aiReviewStatus)}
                        <span className="text-sm text-gray-600">
                          {getReviewTypeLabel(review.reviewType)}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">
                        KES {review.price.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        Paid {formatDate(review.paidAt)}
                      </div>
                    </div>
                  </div>

                  {/* Info Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <FileText className="h-4 w-4 mr-2" />
                      {review.userDocument.documentType}
                    </div>
                    {review.lawyer && (
                      <div className="flex items-center text-sm text-gray-600">
                        <User className="h-4 w-4 mr-2" />
                        {review.lawyer.firstName} {review.lawyer.lastName}
                      </div>
                    )}
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      Est. {formatDate(review.estimatedDeliveryDate)}
                    </div>
                  </div>

                  {/* AI Review Results */}
                  {review.aiReviewStatus === 'COMPLETED' && review.aiReviewResults && (
                    <div className="bg-blue-50 rounded-lg p-4 mb-4">
                      <h4 className="font-semibold text-slate-900 mb-3 flex items-center">
                        <CheckCircle className="h-5 w-5 text-blue-600 mr-2" />
                        AI Review Results
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-gray-700">Overall Score</span>
                            <span className={`text-2xl font-bold ${getScoreColor(review.aiReviewResults.overallScore)}`}>
                              {review.aiReviewResults.overallScore}%
                            </span>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-gray-700 font-medium mb-1">Summary</p>
                          <p className="text-sm text-gray-600">{review.aiReviewResults.summary}</p>
                        </div>
                        <button
                          onClick={() => setSelectedReview(review)}
                          className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View Detailed Analysis
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Download Buttons */}
                  <div className="flex flex-wrap gap-3">
                    {review.certifiedDocumentUrl && (
                      <a
                        href={review.certifiedDocumentUrl}
                        download
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download Certified Document
                      </a>
                    )}
                    {review.certificationLetterUrl && (
                      <a
                        href={review.certificationLetterUrl}
                        download
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download Certificate
                      </a>
                    )}
                    {review.certificateId && (
                      <div className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-mono">
                        ID: {review.certificateId}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Detailed Analysis Modal */}
        {selectedReview?.aiReviewResults && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <h2 className="text-2xl font-bold text-slate-900">Detailed AI Analysis</h2>
                  <button
                    onClick={() => setSelectedReview(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Overall Score */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
                    <div className="text-center">
                      <div className={`text-5xl font-bold mb-2 ${getScoreColor(selectedReview.aiReviewResults.overallScore)}`}>
                        {selectedReview.aiReviewResults.overallScore}%
                      </div>
                      <div className="text-gray-600">Overall Document Quality</div>
                    </div>
                  </div>

                  {/* Detailed Scores */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-sm text-gray-600 mb-1">Completeness</div>
                      <div className={`text-2xl font-bold ${getScoreColor(selectedReview.aiReviewResults.completeness.score)}`}>
                        {selectedReview.aiReviewResults.completeness.score}%
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-sm text-gray-600 mb-1">Consistency</div>
                      <div className={`text-2xl font-bold ${getScoreColor(selectedReview.aiReviewResults.consistency.score)}`}>
                        {selectedReview.aiReviewResults.consistency.score}%
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-sm text-gray-600 mb-1">Legal Compliance</div>
                      <div className={`text-2xl font-bold ${getScoreColor(selectedReview.aiReviewResults.legalCompliance.score)}`}>
                        {selectedReview.aiReviewResults.legalCompliance.score}%
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-sm text-gray-600 mb-1">Formatting</div>
                      <div className={`text-2xl font-bold ${getScoreColor(selectedReview.aiReviewResults.formatting.score)}`}>
                        {selectedReview.aiReviewResults.formatting.score}%
                      </div>
                    </div>
                  </div>

                  {/* Detailed Analysis */}
                  <div>
                    <h3 className="font-semibold text-lg text-slate-900 mb-3">Analysis</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-gray-700 whitespace-pre-line">
                        {selectedReview.aiReviewResults.detailedAnalysis}
                      </p>
                    </div>
                  </div>

                  {/* Issues and Recommendations */}
                  {selectedReview.aiReviewResults.completeness.missingFields.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-lg text-slate-900 mb-3">Missing Fields</h3>
                      <ul className="list-disc list-inside space-y-1 text-gray-700">
                        {selectedReview.aiReviewResults.completeness.missingFields.map((field, idx) => (
                          <li key={idx}>{field}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selectedReview.aiReviewResults.legalCompliance.issues.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-lg text-slate-900 mb-3">Legal Issues</h3>
                      <ul className="list-disc list-inside space-y-1 text-red-700">
                        {selectedReview.aiReviewResults.legalCompliance.issues.map((issue, idx) => (
                          <li key={idx}>{issue}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Certification Recommendation */}
                  <div className={`rounded-lg p-4 ${
                    selectedReview.aiReviewResults.recommendsCertification
                      ? 'bg-green-50 border border-green-200'
                      : 'bg-yellow-50 border border-yellow-200'
                  }`}>
                    <div className="flex items-start">
                      {selectedReview.aiReviewResults.recommendsCertification ? (
                        <CheckCircle className="h-5 w-5 text-green-600 mr-3 mt-0.5" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-yellow-600 mr-3 mt-0.5" />
                      )}
                      <div>
                        <div className="font-semibold mb-1">
                          {selectedReview.aiReviewResults.recommendsCertification
                            ? 'Ready for Certification'
                            : 'Improvements Recommended'}
                        </div>
                        <div className="text-sm text-gray-700">
                          {selectedReview.aiReviewResults.recommendsCertification
                            ? 'This document meets the requirements for lawyer certification.'
                            : 'Consider addressing the identified issues before lawyer certification.'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setSelectedReview(null)}
                    className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentReviewDashboard;
