import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  DollarSign, 
  Clock, 
  FileText, 
  CheckCircle, 
  AlertCircle,
  Star,
  Award,
  TrendingUp,
  Phone,
  Mail,
  User,
  Briefcase,
  ChevronDown,
  ChevronUp,
  Info
} from 'lucide-react';
import { GlobalLayout } from '../components/layout/GlobalLayout';

interface LawyerQuote {
  id: string;
  lawyerId: string;
  proposedFee: number;
  proposedTimeline: string;
  approach: string;
  offersMilestones: boolean;
  milestones: Array<{
    stage: string;
    percentage: number;
    description?: string;
  }> | null;
  submittedAt: string;
  lawyer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
    profileImageUrl?: string;
    lawyerProfile: {
      specializations: string[];
      yearsOfExperience: number;
      rating: number;
      reviewCount?: number;
      licenseNumber?: string;
    };
  };
}

interface ServiceRequest {
  id: string;
  serviceCategory: string;
  serviceTitle: string;
  description: string;
  estimatedFee: number;
  tier: string;
  status: string;
  createdAt: string;
}

export default function QuoteComparisonPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [serviceRequest, setServiceRequest] = useState<ServiceRequest | null>(null);
  const [quotes, setQuotes] = useState<LawyerQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedQuotes, setExpandedQuotes] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<'price' | 'rating' | 'timeline'>('price');
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);
  const [selecting, setSelecting] = useState(false);
  const [selectedLawyer, setSelectedLawyer] = useState<{
    name: string;
    phone: string;
    email: string;
    proposedFee: number;
    proposedTimeline: string;
  } | null>(null);

  useEffect(() => {
    fetchQuotes();
  }, [id]);

  const fetchQuotes = async () => {
    try {
      const response = await fetch(`/api/service-requests/${id}/quotes`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch quotes');
      }

      const data = await response.json();
      setServiceRequest(data.serviceRequest);
      setQuotes(data.quotes);

      // Auto-expand first quote
      if (data.quotes.length > 0) {
        setExpandedQuotes(new Set([data.quotes[0].id]));
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load quotes');
    } finally {
      setLoading(false);
    }
  };

  const toggleQuoteExpansion = (quoteId: string) => {
    setExpandedQuotes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(quoteId)) {
        newSet.delete(quoteId);
      } else {
        newSet.add(quoteId);
      }
      return newSet;
    });
  };

  const sortedQuotes = [...quotes].sort((a, b) => {
    if (sortBy === 'price') {
      return a.proposedFee - b.proposedFee;
    } else if (sortBy === 'rating') {
      return (b.lawyer.lawyerProfile.rating || 0) - (a.lawyer.lawyerProfile.rating || 0);
    } else {
      // Timeline sorting (simple text comparison)
      return a.proposedTimeline.localeCompare(b.proposedTimeline);
    }
  });

  const handleSelectLawyer = async (quoteId: string) => {
    const selectedQuote = quotes.find(q => q.id === quoteId);
    if (!selectedQuote) return;

    const upfrontAmount = Math.round(selectedQuote.proposedFee * 0.3);
    const platformCommission = Math.round(selectedQuote.proposedFee * 0.2);
    const lawyerEscrow = Math.round(selectedQuote.proposedFee * 0.1);

    const confirmMessage = `Pay 30% upfront via M-Pesa?\n\n` +
      `Total Quote: KES ${selectedQuote.proposedFee.toLocaleString()}\n` +
      `30% Payment: KES ${upfrontAmount.toLocaleString()}\n\n` +
      `Split:\n` +
      `• Platform (20%): KES ${platformCommission.toLocaleString()}\n` +
      `• Lawyer Escrow (10%): KES ${lawyerEscrow.toLocaleString()}\n\n` +
      `Remaining 70% (KES ${(selectedQuote.proposedFee * 0.7).toLocaleString()}) paid as case progresses.`;

    if (!confirm(confirmMessage)) {
      return;
    }

    // Prompt for M-Pesa phone number
    const phoneNumber = prompt('Enter your M-Pesa phone number (254XXXXXXXXX):');
    if (!phoneNumber) return;

    setSelecting(true);
    setSelectedQuoteId(quoteId);

    try {
      // Import axiosInstance dynamically
      const axiosInstance = (await import('../lib/axios')).default;

      // Step 1: Initiate 30% upfront payment via M-Pesa
      const paymentResponse = await axiosInstance.post('/payments/mpesa/initiate', {
        phoneNumber,
        amount: upfrontAmount,
        serviceRequestId: id,
        quoteId,
        paymentType: 'SERVICE_REQUEST_PAYMENT'
      });

      const { paymentId } = paymentResponse.data.data;

      alert(`M-Pesa payment request sent to ${phoneNumber}. Please complete the payment on your phone.`);

      // Step 2: Poll for payment status
      let paymentComplete = false;
      const maxAttempts = 60; // 3 minutes (60 * 3 seconds)
      let attempts = 0;

      const pollInterval = setInterval(async () => {
        attempts++;

        try {
          const statusResponse = await axiosInstance.get(`/payments/mpesa/status/${paymentId}`);
          const status = statusResponse.data.data.status;

          if (status === 'COMPLETED') {
            clearInterval(pollInterval);
            paymentComplete = true;

            // Payment successful - get updated service request with selected lawyer
            const requestResponse = await axiosInstance.get(`/service-requests/${id}`);
            const updatedRequest = requestResponse.data.data;

            setSelectedLawyer({
              name: `${selectedQuote.lawyer.firstName} ${selectedQuote.lawyer.lastName}`,
              phone: selectedQuote.lawyer.phoneNumber || 'Not provided',
              email: selectedQuote.lawyer.email,
              proposedFee: selectedQuote.proposedFee,
              proposedTimeline: selectedQuote.proposedTimeline
            });

            setSelecting(false);
          } else if (status === 'FAILED') {
            clearInterval(pollInterval);
            setSelecting(false);
            setSelectedQuoteId(null);
            alert('Payment failed. Please try again.');
          } else if (attempts >= maxAttempts) {
            clearInterval(pollInterval);
            setSelecting(false);
            setSelectedQuoteId(null);
            alert('Payment timeout. Please check your M-Pesa and try again if payment was not completed.');
          }
        } catch (pollError) {
          console.error('Payment status polling error:', pollError);
        }
      }, 3000); // Poll every 3 seconds

    } catch (err: any) {
      setSelecting(false);
      setSelectedQuoteId(null);
      alert(err.response?.data?.error || err.message || 'Failed to process payment');
    }
  };

  if (loading) {
    return (
      <GlobalLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading quotes...</p>
          </div>
        </div>
      </GlobalLayout>
    );
  }

  if (error) {
    return (
      <GlobalLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
            <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <p className="text-red-800 text-center">{error}</p>
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

  if (selectedLawyer) {
    return (
      <GlobalLayout>
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Lawyer Selected!</h1>
              <p className="text-gray-600 mb-8">You've successfully selected a lawyer for your service request.</p>

              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Selected Lawyer Contact</h2>
                <div className="space-y-3">
                  <div className="flex items-center justify-center gap-3">
                    <User className="w-5 h-5 text-gray-500" />
                    <span className="font-medium text-gray-900">{selectedLawyer.name}</span>
                  </div>
                  <div className="flex items-center justify-center gap-3">
                    <Phone className="w-5 h-5 text-gray-500" />
                    <a href={`tel:${selectedLawyer.phone}`} className="text-blue-600 hover:underline">
                      {selectedLawyer.phone}
                    </a>
                  </div>
                  <div className="flex items-center justify-center gap-3">
                    <Mail className="w-5 h-5 text-gray-500" />
                    <a href={`mailto:${selectedLawyer.email}`} className="text-blue-600 hover:underline">
                      {selectedLawyer.email}
                    </a>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="text-left">
                    <p className="font-medium text-gray-900 mb-2">Next Steps:</p>
                    <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
                      <li>Check your <strong>Messages inbox</strong> - the lawyer has sent you a message</li>
                      <li>Discuss case details and timeline ({selectedLawyer.proposedTimeline})</li>
                      <li>Lawyer proceeds with your case (KES {selectedLawyer.proposedFee.toLocaleString()} total)</li>
                      <li>Pay remaining 70% balance as case progresses</li>
                      <li>After completion, confirm and rate the lawyer</li>
                    </ol>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => navigate('/messages')}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 flex items-center justify-center gap-2"
                >
                  <MessageSquare className="w-5 h-5" />
                  Open Messages
                </button>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="flex-1 bg-white border border-gray-300 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-50"
                >
                  Back to Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      </GlobalLayout>
    );
  }

  return (
    <GlobalLayout>
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          
          {/* Header */}
          <div className="mb-6">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-blue-600 hover:text-blue-700 mb-4"
            >
              ← Back to Dashboard
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Compare Quotes</h1>
            <p className="text-gray-600 mt-2">Review proposals from qualified lawyers and select the best fit</p>
          </div>

          {/* Service Request Summary */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">{serviceRequest?.serviceTitle}</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-xs text-blue-600 font-medium">Category</p>
                <p className="text-sm font-semibold text-gray-900">{serviceRequest?.serviceCategory}</p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <p className="text-xs text-green-600 font-medium">Estimated Fees</p>
                <p className="text-sm font-semibold text-gray-900">KES {serviceRequest?.estimatedFee.toLocaleString()}</p>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <p className="text-xs text-purple-600 font-medium">Quotes Received</p>
                <p className="text-sm font-semibold text-gray-900">{quotes.length} Lawyer{quotes.length !== 1 ? 's' : ''}</p>
              </div>
              <div className="bg-orange-50 p-3 rounded-lg">
                <p className="text-xs text-orange-600 font-medium">Status</p>
                <p className="text-sm font-semibold text-gray-900">
                  {serviceRequest?.status === 'QUOTES_RECEIVED' ? 'Awaiting Selection' : serviceRequest?.status}
                </p>
              </div>
            </div>
          </div>

          {/* Sort Controls */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-700">Sort by:</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setSortBy('price')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    sortBy === 'price'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <DollarSign className="w-4 h-4 inline mr-1" />
                  Lowest Price
                </button>
                <button
                  onClick={() => setSortBy('rating')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    sortBy === 'rating'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Star className="w-4 h-4 inline mr-1" />
                  Highest Rating
                </button>
                <button
                  onClick={() => setSortBy('timeline')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    sortBy === 'timeline'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Clock className="w-4 h-4 inline mr-1" />
                  Timeline
                </button>
              </div>
            </div>
          </div>

          {/* Quotes List */}
          {quotes.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No quotes yet</h3>
              <p className="text-gray-600">Lawyers are reviewing your request. You'll be notified when quotes arrive.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedQuotes.map((quote) => {
                const isExpanded = expandedQuotes.has(quote.id);
                const isLowestPrice = quote.proposedFee === Math.min(...quotes.map(q => q.proposedFee));
                const isHighestRated = quote.lawyer.lawyerProfile.rating === Math.max(...quotes.map(q => q.lawyer.lawyerProfile.rating || 0));

                return (
                  <div
                    key={quote.id}
                    className={`bg-white rounded-xl shadow-sm border-2 transition-all ${
                      isLowestPrice ? 'border-green-300 bg-green-50' : 'border-gray-200'
                    }`}
                  >
                    {/* Quote Header */}
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start gap-4">
                          {/* Lawyer Avatar */}
                          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                            {quote.lawyer.firstName[0]}{quote.lawyer.lastName[0]}
                          </div>
                          
                          {/* Lawyer Info */}
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {quote.lawyer.firstName} {quote.lawyer.lastName}
                            </h3>
                            <div className="flex items-center gap-4 mt-1">
                              <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                                <span className="text-sm font-medium text-gray-700">
                                  {quote.lawyer.lawyerProfile.rating?.toFixed(1) || 'New'}
                                </span>
                                {quote.lawyer.lawyerProfile.reviewCount && (
                                  <span className="text-xs text-gray-500">
                                    ({quote.lawyer.lawyerProfile.reviewCount} reviews)
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1 text-sm text-gray-600">
                                <Briefcase className="w-4 h-4" />
                                {quote.lawyer.lawyerProfile.yearsOfExperience} years exp.
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {quote.lawyer.lawyerProfile.specializations.slice(0, 3).map((spec, i) => (
                                <span key={i} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                  {spec}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Badges */}
                        <div className="flex flex-col gap-2 items-end">
                          {isLowestPrice && (
                            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                              <Award className="w-3 h-3" />
                              Best Price
                            </span>
                          )}
                          {isHighestRated && (
                            <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                              <Star className="w-3 h-3" />
                              Top Rated
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Quote Summary */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <DollarSign className="w-4 h-4 text-gray-500" />
                            <p className="text-xs text-gray-600 font-medium">Proposed Fee</p>
                          </div>
                          <p className="text-xl font-bold text-gray-900">KES {quote.proposedFee.toLocaleString()}</p>
                          {quote.offersMilestones && (
                            <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                              <TrendingUp className="w-3 h-3" />
                              Milestone payments available
                            </p>
                          )}
                        </div>
                        
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <Clock className="w-4 h-4 text-gray-500" />
                            <p className="text-xs text-gray-600 font-medium">Timeline</p>
                          </div>
                          <p className="text-lg font-semibold text-gray-900">{quote.proposedTimeline}</p>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <FileText className="w-4 h-4 text-gray-500" />
                            <p className="text-xs text-gray-600 font-medium">Submitted</p>
                          </div>
                          <p className="text-sm text-gray-900">
                            {new Date(quote.submittedAt).toLocaleDateString('en-KE', { 
                              month: 'short', 
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>

                      {/* Expand/Collapse Button */}
                      <button
                        onClick={() => toggleQuoteExpansion(quote.id)}
                        className="w-full flex items-center justify-center gap-2 text-blue-600 hover:text-blue-700 font-medium py-2 border-t border-gray-200"
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp className="w-5 h-5" />
                            Hide Details
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-5 h-5" />
                            View Full Proposal
                          </>
                        )}
                      </button>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="border-t border-gray-200 p-6 bg-gray-50">
                        {/* Approach */}
                        <div className="mb-6">
                          <h4 className="font-semibold text-gray-900 mb-2">Lawyer's Approach</h4>
                          <p className="text-gray-700 leading-relaxed whitespace-pre-line">{quote.approach}</p>
                        </div>

                        {/* Milestones */}
                        {quote.offersMilestones && quote.milestones && (
                          <div className="mb-6">
                            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                              <TrendingUp className="w-5 h-5 text-green-600" />
                              Payment Milestones
                            </h4>
                            <div className="space-y-2">
                              {quote.milestones.map((milestone, idx) => (
                                <div key={idx} className="bg-white rounded-lg p-4 border border-gray-200">
                                  <div className="flex items-start justify-between mb-2">
                                    <p className="font-medium text-gray-900">{milestone.stage}</p>
                                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-semibold">
                                      {milestone.percentage}%
                                    </span>
                                  </div>
                                  {milestone.description && (
                                    <p className="text-sm text-gray-600">{milestone.description}</p>
                                  )}
                                  <p className="text-xs text-gray-500 mt-2">
                                    KES {((quote.proposedFee * milestone.percentage) / 100).toLocaleString()}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Select Button with 30% Payment Info */}
                        <div className="border-t border-gray-200 pt-4 mt-4">
                          <div className="bg-blue-50 rounded-lg p-3 mb-3">
                            <p className="text-sm font-medium text-blue-900 mb-1">
                              30% Upfront Payment: KES {(quote.proposedFee * 0.3).toLocaleString()}
                            </p>
                            <p className="text-xs text-blue-700">
                              Platform: 20% • Lawyer Escrow: 10% • Balance: 70% (paid as case progresses)
                            </p>
                          </div>
                          <button
                            onClick={() => handleSelectLawyer(quote.id)}
                            disabled={selecting && selectedQuoteId === quote.id}
                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
                          >
                            {selecting && selectedQuoteId === quote.id ? (
                              <>
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                Processing M-Pesa Payment...
                              </>
                            ) : (
                              <>
                                <CheckCircle className="w-5 w-5" />
                                Pay 30% & Select Lawyer
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

        </div>
      </div>
    </GlobalLayout>
  );
}
