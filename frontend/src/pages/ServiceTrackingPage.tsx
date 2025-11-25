import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Star,
  User,
  Phone,
  Mail,
  DollarSign,
  FileText,
  TrendingUp,
  Calendar,
  MessageSquare
} from 'lucide-react';
import { GlobalLayout } from '../components/layout/GlobalLayout';

interface ServiceRequest {
  id: string;
  serviceCategory: string;
  serviceTitle: string;
  description: string;
  estimatedFee: number;
  tier: string;
  status: string;
  createdAt: string;
  completedAt?: string;
  confirmedAt?: string;
  rating?: number;
  feedback?: string;
  selectedLawyer?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
    lawyerProfile: {
      rating: number;
      yearsOfExperience: number;
      specializations: string[];
    };
  };
  selectedQuote?: {
    proposedFee: number;
    proposedTimeline: string;
    approach: string;
    offersMilestones: boolean;
    milestones?: Array<{
      stage: string;
      percentage: number;
      description?: string;
    }>;
  };
}

export default function ServiceTrackingPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [serviceRequest, setServiceRequest] = useState<ServiceRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Rating modal state
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchServiceRequest();
  }, [id]);

  const fetchServiceRequest = async () => {
    try {
      const response = await fetch(`/api/service-requests/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch service request');
      }

      const data = await response.json();
      setServiceRequest(data.serviceRequest);
    } catch (err: any) {
      setError(err.message || 'Failed to load service request');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmCompletion = async () => {
    if (!rating || rating < 1 || rating > 5) {
      alert('Please select a rating between 1 and 5 stars');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`/api/service-requests/${id}/confirm-complete`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ rating, feedback })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to confirm completion');
      }

      alert('Thank you for your feedback! Service marked as confirmed.');
      setShowRatingModal(false);
      fetchServiceRequest(); // Refresh data
    } catch (err: any) {
      alert(err.message || 'Failed to confirm completion');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'PENDING':
        return {
          label: 'Waiting for Quotes',
          color: 'bg-yellow-100 text-yellow-800',
          icon: Clock,
          description: 'Lawyers are reviewing your request and preparing quotes.'
        };
      case 'QUOTES_RECEIVED':
        return {
          label: 'Quotes Available',
          color: 'bg-blue-100 text-blue-800',
          icon: FileText,
          description: 'You have received quotes from lawyers. Review and select one.'
        };
      case 'LAWYER_SELECTED':
        return {
          label: 'Lawyer Selected',
          color: 'bg-purple-100 text-purple-800',
          icon: User,
          description: 'Lawyer has been selected and will contact you to begin work.'
        };
      case 'IN_PROGRESS':
        return {
          label: 'Work In Progress',
          color: 'bg-indigo-100 text-indigo-800',
          icon: TrendingUp,
          description: 'Your lawyer is working on your case.'
        };
      case 'COMPLETED':
        return {
          label: 'Awaiting Confirmation',
          color: 'bg-orange-100 text-orange-800',
          icon: AlertCircle,
          description: 'Lawyer has marked the service as complete. Please review and confirm.'
        };
      case 'CONFIRMED':
        return {
          label: 'Completed',
          color: 'bg-green-100 text-green-800',
          icon: CheckCircle,
          description: 'Service has been successfully completed and confirmed.'
        };
      default:
        return {
          label: status,
          color: 'bg-gray-100 text-gray-800',
          icon: FileText,
          description: ''
        };
    }
  };

  if (loading) {
    return (
      <GlobalLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading service details...</p>
          </div>
        </div>
      </GlobalLayout>
    );
  }

  if (error || !serviceRequest) {
    return (
      <GlobalLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
            <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <p className="text-red-800 text-center">{error || 'Service request not found'}</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="mt-4 w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </GlobalLayout>
    );
  }

  const statusInfo = getStatusInfo(serviceRequest.status);
  const StatusIcon = statusInfo.icon;

  return (
    <GlobalLayout>
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          
          {/* Header */}
          <div className="mb-6">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-blue-600 hover:text-blue-700 mb-4"
            >
              ← Back to Dashboard
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Service Request Tracking</h1>
            <p className="text-gray-600 mt-2">Monitor the progress of your legal service</p>
          </div>

          {/* Status Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">{serviceRequest.serviceTitle}</h2>
              <span className={`px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 ${statusInfo.color}`}>
                <StatusIcon className="w-4 h-4" />
                {statusInfo.label}
              </span>
            </div>
            
            <p className="text-gray-600 mb-6">{statusInfo.description}</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-xs text-gray-600 font-medium mb-1">Category</p>
                <p className="text-sm font-semibold text-gray-900">{serviceRequest.serviceCategory}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-xs text-gray-600 font-medium mb-1">Estimated Fee</p>
                <p className="text-sm font-semibold text-gray-900">KES {serviceRequest.estimatedFee.toLocaleString()}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-xs text-gray-600 font-medium mb-1">Created</p>
                <p className="text-sm font-semibold text-gray-900">
                  {new Date(serviceRequest.createdAt).toLocaleDateString('en-KE')}
                </p>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Progress Timeline</h3>
            
            <div className="space-y-6">
              {/* Created */}
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="w-0.5 h-full bg-gray-200 mt-2"></div>
                </div>
                <div className="flex-1 pb-8">
                  <p className="font-semibold text-gray-900">Request Created</p>
                  <p className="text-sm text-gray-500">
                    {new Date(serviceRequest.createdAt).toLocaleString('en-KE')}
                  </p>
                </div>
              </div>

              {/* Quotes Received */}
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    ['QUOTES_RECEIVED', 'LAWYER_SELECTED', 'IN_PROGRESS', 'COMPLETED', 'CONFIRMED'].includes(serviceRequest.status)
                      ? 'bg-green-100'
                      : 'bg-gray-100'
                  }`}>
                    <FileText className={`w-5 h-5 ${
                      ['QUOTES_RECEIVED', 'LAWYER_SELECTED', 'IN_PROGRESS', 'COMPLETED', 'CONFIRMED'].includes(serviceRequest.status)
                        ? 'text-green-600'
                        : 'text-gray-400'
                    }`} />
                  </div>
                  <div className="w-0.5 h-full bg-gray-200 mt-2"></div>
                </div>
                <div className="flex-1 pb-8">
                  <p className="font-semibold text-gray-900">Quotes Received</p>
                  {['QUOTES_RECEIVED', 'LAWYER_SELECTED', 'IN_PROGRESS', 'COMPLETED', 'CONFIRMED'].includes(serviceRequest.status) ? (
                    <button
                      onClick={() => navigate(`/service-requests/${id}/quotes`)}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      View quotes →
                    </button>
                  ) : (
                    <p className="text-sm text-gray-500">Waiting for lawyers to submit quotes</p>
                  )}
                </div>
              </div>

              {/* Lawyer Selected */}
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    ['LAWYER_SELECTED', 'IN_PROGRESS', 'COMPLETED', 'CONFIRMED'].includes(serviceRequest.status)
                      ? 'bg-green-100'
                      : 'bg-gray-100'
                  }`}>
                    <User className={`w-5 h-5 ${
                      ['LAWYER_SELECTED', 'IN_PROGRESS', 'COMPLETED', 'CONFIRMED'].includes(serviceRequest.status)
                        ? 'text-green-600'
                        : 'text-gray-400'
                    }`} />
                  </div>
                  <div className="w-0.5 h-full bg-gray-200 mt-2"></div>
                </div>
                <div className="flex-1 pb-8">
                  <p className="font-semibold text-gray-900">Lawyer Selected</p>
                  {serviceRequest.selectedLawyer && (
                    <p className="text-sm text-gray-600">
                      {serviceRequest.selectedLawyer.firstName} {serviceRequest.selectedLawyer.lastName}
                    </p>
                  )}
                </div>
              </div>

              {/* Work Completed */}
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    ['COMPLETED', 'CONFIRMED'].includes(serviceRequest.status)
                      ? 'bg-green-100'
                      : 'bg-gray-100'
                  }`}>
                    <CheckCircle className={`w-5 h-5 ${
                      ['COMPLETED', 'CONFIRMED'].includes(serviceRequest.status)
                        ? 'text-green-600'
                        : 'text-gray-400'
                    }`} />
                  </div>
                  <div className="w-0.5 h-full bg-gray-200 mt-2"></div>
                </div>
                <div className="flex-1 pb-8">
                  <p className="font-semibold text-gray-900">Work Completed</p>
                  {serviceRequest.completedAt ? (
                    <p className="text-sm text-gray-500">
                      {new Date(serviceRequest.completedAt).toLocaleString('en-KE')}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-500">Pending</p>
                  )}
                </div>
              </div>

              {/* Confirmed */}
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    serviceRequest.status === 'CONFIRMED'
                      ? 'bg-green-100'
                      : 'bg-gray-100'
                  }`}>
                    <Star className={`w-5 h-5 ${
                      serviceRequest.status === 'CONFIRMED'
                        ? 'text-green-600'
                        : 'text-gray-400'
                    }`} />
                  </div>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">Confirmed & Rated</p>
                  {serviceRequest.confirmedAt ? (
                    <div>
                      <p className="text-sm text-gray-500">
                        {new Date(serviceRequest.confirmedAt).toLocaleString('en-KE')}
                      </p>
                      {serviceRequest.rating && (
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-4 h-4 ${
                                  star <= (serviceRequest.rating || 0)
                                    ? 'text-yellow-500 fill-current'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm text-gray-600">
                            {serviceRequest.rating}/5
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Pending confirmation</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Selected Lawyer Details */}
          {serviceRequest.selectedLawyer && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Selected Lawyer</h3>
              
              <div className="flex items-start gap-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                  {serviceRequest.selectedLawyer.firstName[0]}{serviceRequest.selectedLawyer.lastName[0]}
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-gray-900">
                    {serviceRequest.selectedLawyer.firstName} {serviceRequest.selectedLawyer.lastName}
                  </h4>
                  <div className="flex items-center gap-4 mt-1">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span className="text-sm font-medium text-gray-700">
                        {serviceRequest.selectedLawyer.lawyerProfile.rating?.toFixed(1) || 'New'}
                      </span>
                    </div>
                    <span className="text-sm text-gray-600">
                      {serviceRequest.selectedLawyer.lawyerProfile.yearsOfExperience} years experience
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Phone</p>
                    <a href={`tel:${serviceRequest.selectedLawyer.phoneNumber}`} className="text-sm font-medium text-blue-600 hover:underline">
                      {serviceRequest.selectedLawyer.phoneNumber || 'Not provided'}
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <a href={`mailto:${serviceRequest.selectedLawyer.email}`} className="text-sm font-medium text-blue-600 hover:underline">
                      {serviceRequest.selectedLawyer.email}
                    </a>
                  </div>
                </div>
              </div>

              {serviceRequest.selectedQuote && (
                <div className="border-t border-gray-200 pt-4">
                  <h5 className="font-medium text-gray-900 mb-3">Agreed Terms</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="text-xs text-gray-500">Fee</p>
                        <p className="text-sm font-semibold text-gray-900">
                          KES {serviceRequest.selectedQuote.proposedFee.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="text-xs text-gray-500">Timeline</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {serviceRequest.selectedQuote.proposedTimeline}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Confirm Completion Button */}
          {serviceRequest.status === 'COMPLETED' && (
            <div className="bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-200 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <AlertCircle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Action Required: Confirm Completion
                  </h3>
                  <p className="text-gray-700 mb-4">
                    Your lawyer has marked the service as complete. Please review the work and confirm completion by providing a rating.
                  </p>
                  <button
                    onClick={() => setShowRatingModal(true)}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 flex items-center gap-2"
                  >
                    <Star className="w-5 h-5" />
                    Confirm & Rate Service
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Feedback Display */}
          {serviceRequest.status === 'CONFIRMED' && serviceRequest.feedback && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-blue-600" />
                Your Feedback
              </h3>
              <p className="text-gray-700 italic">&ldquo;{serviceRequest.feedback}&rdquo;</p>
            </div>
          )}

        </div>
      </div>

      {/* Rating Modal */}
      {showRatingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Rate Your Experience</h3>
            <p className="text-gray-600 mb-6">How would you rate the service provided?</p>

            {/* Star Rating */}
            <div className="flex justify-center gap-2 mb-6">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-12 h-12 ${
                      star <= rating
                        ? 'text-yellow-500 fill-current'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>

            {/* Feedback */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Feedback (Optional)
              </label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Share your experience with this lawyer..."
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowRatingModal(false)}
                disabled={submitting}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmCompletion}
                disabled={submitting}
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Confirm
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </GlobalLayout>
  );
}
