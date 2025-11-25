import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  DollarSign, 
  Clock, 
  FileText, 
  CheckCircle, 
  AlertCircle,
  Phone,
  Mail,
  User,
  TrendingUp,
  Plus,
  Trash2,
  Info
} from 'lucide-react';
import { GlobalLayout } from '../components/layout/GlobalLayout';

interface ServiceRequest {
  id: string;
  serviceCategory: string;
  serviceTitle: string;
  description: string;
  estimatedFee: number;
  tier: string;
  urgency: string;
  createdAt: string;
  user: {
    firstName: string;
    lastName: string;
  };
}

interface Milestone {
  stage: string;
  percentage: number;
  description: string;
}

export default function LawyerQuoteSubmissionPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Service request data
  const [serviceRequest, setServiceRequest] = useState<ServiceRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Connection fee payment state
  const [connectionFeePaid, setConnectionFeePaid] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'mpesa' | 'card'>('mpesa');
  const [mpesaPhone, setMpesaPhone] = useState('');

  // Quote form state
  const [proposedFee, setProposedFee] = useState('');
  const [proposedTimeline, setProposedTimeline] = useState('');
  const [approach, setApproach] = useState('');
  const [offersMilestones, setOffersMilestones] = useState(false);
  const [milestones, setMilestones] = useState<Milestone[]>([
    { stage: 'Initial consultation & documentation', percentage: 30, description: '' },
    { stage: 'Process execution', percentage: 40, description: '' },
    { stage: 'Completion & handover', percentage: 30, description: '' }
  ]);

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Client contact (revealed after payment)
  const [clientContact, setClientContact] = useState<{
    name: string;
    phone: string;
    email: string;
  } | null>(null);

  const connectionFee = serviceRequest?.tier === 'tier2' ? 5000 : 2000;
  const tierLabel = serviceRequest?.tier === 'tier2' ? 'Premium (PRO only)' : 'Standard';

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

      // Check if lawyer already paid connection fee
      if (data.connectionFeePaid) {
        setConnectionFeePaid(true);
        setClientContact(data.clientContact);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load service request');
    } finally {
      setLoading(false);
    }
  };

  const handlePayConnectionFee = async () => {
    if (paymentMethod === 'mpesa' && !mpesaPhone) {
      alert('Please enter your M-Pesa phone number');
      return;
    }

    setPaymentProcessing(true);
    setError('');

    try {
      // Initiate payment based on method
      const paymentEndpoint = paymentMethod === 'mpesa' 
        ? '/api/payments/mpesa/stk-push'
        : '/api/payments/flutter/card';

      const paymentResponse = await fetch(paymentEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          amount: connectionFee,
          phoneNumber: mpesaPhone,
          description: `Connection fee for ${serviceRequest?.serviceCategory}`,
          serviceRequestId: id
        })
      });

      if (!paymentResponse.ok) {
        throw new Error('Payment initiation failed');
      }

      const paymentData = await paymentResponse.json();

      // For M-Pesa, show STK push message
      if (paymentMethod === 'mpesa') {
        alert('Please check your phone for the M-Pesa payment prompt');
        
        // Poll for payment confirmation (simplified - in production use webhooks)
        setTimeout(() => {
          setConnectionFeePaid(true);
          fetchServiceRequest(); // Refresh to get client contact
        }, 5000);
      } else {
        // For card payment, redirect to Flutter payment page
        window.location.href = paymentData.paymentUrl;
      }
    } catch (err: any) {
      setError(err.message || 'Payment failed. Please try again.');
    } finally {
      setPaymentProcessing(false);
    }
  };

  const addMilestone = () => {
    setMilestones([...milestones, { stage: '', percentage: 0, description: '' }]);
  };

  const removeMilestone = (index: number) => {
    setMilestones(milestones.filter((_, i) => i !== index));
  };

  const updateMilestone = (index: number, field: keyof Milestone, value: string | number) => {
    const updated = [...milestones];
    updated[index] = { ...updated[index], [field]: value };
    setMilestones(updated);
  };

  const totalMilestonePercentage = milestones.reduce((sum, m) => sum + (Number(m.percentage) || 0), 0);

  const handleSubmitQuote = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!connectionFeePaid) {
      alert('Please pay the connection fee first');
      return;
    }

    if (!proposedFee || !proposedTimeline || !approach) {
      alert('Please fill in all required fields');
      return;
    }

    if (offersMilestones && totalMilestonePercentage !== 100) {
      alert('Milestone percentages must total 100%');
      return;
    }

    setSubmitting(true);
    setSubmitError('');

    try {
      const response = await fetch(`/api/service-requests/${id}/quote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          proposedFee: Number(proposedFee),
          proposedTimeline,
          approach,
          offersMilestones,
          milestones: offersMilestones ? milestones : null,
          connectionFeePaid: true,
          connectionFeeAmount: connectionFee
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit quote');
      }

      alert('Quote submitted successfully! The client will review and contact you if selected.');
      navigate('/lawyer/dashboard');
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to submit quote');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <GlobalLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading service request...</p>
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
              onClick={() => navigate('/lawyer/dashboard')}
              className="mt-4 w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </GlobalLayout>
    );
  }

  return (
    <GlobalLayout>
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          
          {/* Header */}
          <div className="mb-6">
            <button
              onClick={() => navigate('/lawyer/dashboard')}
              className="text-blue-600 hover:text-blue-700 mb-4"
            >
              ← Back to Dashboard
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Submit Your Quote</h1>
            <p className="text-gray-600 mt-2">Review the service request and submit your best proposal</p>
          </div>

          {/* Service Request Details */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{serviceRequest?.serviceTitle}</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Posted by {serviceRequest?.user.firstName} {serviceRequest?.user.lastName} • {new Date(serviceRequest?.createdAt || '').toLocaleDateString()}
                </p>
              </div>
              {serviceRequest?.urgency === 'urgent' && (
                <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                  🚨 URGENT
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-600 font-medium">Category</p>
                <p className="text-lg font-semibold text-gray-900">{serviceRequest?.serviceCategory}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-600 font-medium">Estimated Fees</p>
                <p className="text-lg font-semibold text-gray-900">KES {serviceRequest?.estimatedFee.toLocaleString()}</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm text-purple-600 font-medium">Service Tier</p>
                <p className="text-lg font-semibold text-gray-900">{tierLabel}</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Description:</p>
              <p className="text-gray-600 leading-relaxed">{serviceRequest?.description}</p>
            </div>
          </div>

          {/* Connection Fee Section */}
          {!connectionFeePaid && (
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-xl p-6 mb-6">
              <div className="flex items-start gap-4">
                <Info className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Connection Fee Required</h3>
                  <p className="text-gray-700 mb-4">
                    To access client contact details and submit your quote, pay a one-time connection fee of 
                    <span className="font-bold text-orange-600"> KES {connectionFee.toLocaleString()}</span>.
                    This covers platform matching and support services.
                  </p>

                  <div className="bg-white rounded-lg p-4 mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-3">Payment Method</label>
                    <div className="flex gap-4 mb-4">
                      <button
                        onClick={() => setPaymentMethod('mpesa')}
                        className={`flex-1 py-3 px-4 rounded-lg border-2 font-medium transition-colors ${
                          paymentMethod === 'mpesa'
                            ? 'border-green-600 bg-green-50 text-green-700'
                            : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                        }`}
                      >
                        📱 M-Pesa
                      </button>
                      <button
                        onClick={() => setPaymentMethod('card')}
                        className={`flex-1 py-3 px-4 rounded-lg border-2 font-medium transition-colors ${
                          paymentMethod === 'card'
                            ? 'border-blue-600 bg-blue-50 text-blue-700'
                            : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                        }`}
                      >
                        💳 Card
                      </button>
                    </div>

                    {paymentMethod === 'mpesa' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          M-Pesa Phone Number
                        </label>
                        <input
                          type="tel"
                          value={mpesaPhone}
                          onChange={(e) => setMpesaPhone(e.target.value)}
                          placeholder="254712345678"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handlePayConnectionFee}
                    disabled={paymentProcessing}
                    className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 px-6 rounded-lg font-semibold hover:from-orange-600 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {paymentProcessing ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <DollarSign className="w-5 h-5" />
                        Pay KES {connectionFee.toLocaleString()} to Continue
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Client Contact (After Payment) */}
          {connectionFeePaid && clientContact && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6 mb-6">
              <div className="flex items-start gap-4">
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Client Contact Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-3 bg-white p-3 rounded-lg">
                      <User className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Name</p>
                        <p className="font-medium text-gray-900">{clientContact.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 bg-white p-3 rounded-lg">
                      <Phone className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Phone</p>
                        <p className="font-medium text-gray-900">{clientContact.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 bg-white p-3 rounded-lg">
                      <Mail className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Email</p>
                        <p className="font-medium text-gray-900">{clientContact.email}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Quote Submission Form */}
          {connectionFeePaid && (
            <form onSubmit={handleSubmitQuote} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Your Quote Details</h3>

              {/* Proposed Fee */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <DollarSign className="w-4 h-4 inline mr-1" />
                  Proposed Fee (KES) *
                </label>
                <input
                  type="number"
                  value={proposedFee}
                  onChange={(e) => setProposedFee(e.target.value)}
                  placeholder="Enter your fee (e.g., 150000)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  System estimate: KES {serviceRequest?.estimatedFee.toLocaleString()} (you can quote differently)
                </p>
              </div>

              {/* Timeline */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Proposed Timeline *
                </label>
                <input
                  type="text"
                  value={proposedTimeline}
                  onChange={(e) => setProposedTimeline(e.target.value)}
                  placeholder="e.g., 2-3 weeks, 1 month, 45 days"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Approach */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FileText className="w-4 h-4 inline mr-1" />
                  Your Approach *
                </label>
                <textarea
                  value={approach}
                  onChange={(e) => setApproach(e.target.value)}
                  placeholder="Describe your approach to handling this case, relevant experience, and why you're the best fit..."
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Milestone Payments */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={offersMilestones}
                      onChange={(e) => setOffersMilestones(e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      <TrendingUp className="w-4 h-4 inline mr-1" />
                      Offer Milestone-Based Payments
                    </span>
                  </label>
                </div>

                {offersMilestones && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-4">
                      Break down your fee into payment milestones (must total 100%)
                    </p>
                    
                    {milestones.map((milestone, index) => (
                      <div key={index} className="bg-white rounded-lg p-4 mb-3 border border-gray-200">
                        <div className="flex items-start justify-between mb-3">
                          <p className="text-sm font-medium text-gray-700">Milestone {index + 1}</p>
                          {milestones.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeMilestone(index)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Stage Name</label>
                            <input
                              type="text"
                              value={milestone.stage}
                              onChange={(e) => updateMilestone(index, 'stage', e.target.value)}
                              placeholder="e.g., Initial deposit"
                              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Percentage (%)</label>
                            <input
                              type="number"
                              value={milestone.percentage}
                              onChange={(e) => updateMilestone(index, 'percentage', Number(e.target.value))}
                              placeholder="30"
                              min="0"
                              max="100"
                              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Description (optional)</label>
                          <input
                            type="text"
                            value={milestone.description}
                            onChange={(e) => updateMilestone(index, 'description', e.target.value)}
                            placeholder="What's included in this payment"
                            className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                          />
                        </div>
                      </div>
                    ))}

                    <div className="flex items-center justify-between mt-4">
                      <button
                        type="button"
                        onClick={addMilestone}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
                      >
                        <Plus className="w-4 h-4" />
                        Add Milestone
                      </button>
                      <div className={`text-sm font-medium ${totalMilestonePercentage === 100 ? 'text-green-600' : 'text-red-600'}`}>
                        Total: {totalMilestonePercentage}%
                        {totalMilestonePercentage === 100 ? ' ✓' : ' (must be 100%)'}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Error Message */}
              {submitError && (
                <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-red-800 text-sm">{submitError}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Submitting Quote...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Submit Quote
                  </>
                )}
              </button>
            </form>
          )}

        </div>
      </div>
    </GlobalLayout>
  );
}
