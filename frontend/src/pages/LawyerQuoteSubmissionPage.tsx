import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  DollarSign, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  ArrowLeft,
  Plus,
  Trash2,
  Info
} from 'lucide-react';
import { GlobalLayout } from '../components/layout/GlobalLayout';
import axiosInstance from '../lib/axios';

interface ServiceRequest {
  id: string;
  serviceCategory: string;
  serviceTitle: string;
  description: string;
  urgency: string;
  phoneNumber: string;
  email: string;
  preferredTimeline: string;
  additionalNotes?: string;
  createdAt: string;
  status: string;
  user: {
    firstName: string;
    lastName: string;
  };
  // Context fields
  propertyLocation?: string;
  titleType?: string;
  hasDisputes?: boolean;
  companyType?: string;
  numberOfEmployees?: number;
  industry?: string;
  debtType?: string;
  debtAge?: string;
  hasContract?: boolean;
  businessType?: string;
  numberOfDirectors?: number;
  hasNameReserved?: boolean;
  needsTaxRegistration?: boolean;
  numberOfBeneficiaries?: number;
  hasInternationalAssets?: boolean;
  hasBusiness?: boolean;
  includesNonCompete?: boolean;
  hasProperty?: boolean;
  needsCustody?: boolean;
}

interface Milestone {
  stage: string;
  percentage: number;
  description: string;
}

export default function LawyerQuoteSubmissionPage() {
  const { id } = useParams<{ id: string}>();
  const navigate = useNavigate();

  const [serviceRequest, setServiceRequest] = useState<ServiceRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    proposedFee: '',
    proposedTimeline: '',
    approach: '',
    offersMilestones: false,
    milestones: [] as Milestone[]
  });

  useEffect(() => {
    fetchServiceRequest();
  }, [id]);

  const fetchServiceRequest = async () => {
    try {
      const response = await axiosInstance.get(`/service-requests/${id}`);
      setServiceRequest(response.data.data || response.data);
      setLoading(false);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load service request');
      setLoading(false);
    }
  };

  const addMilestone = () => {
    setFormData(prev => ({
      ...prev,
      milestones: [...prev.milestones, { stage: '', percentage: 0, description: '' }]
    }));
  };

  const updateMilestone = (index: number, field: keyof Milestone, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      milestones: prev.milestones.map((m, i) => 
        i === index ? { ...m, [field]: value } : m
      )
    }));
  };

  const removeMilestone = (index: number) => {
    setFormData(prev => ({
      ...prev,
      milestones: prev.milestones.filter((_, i) => i !== index)
    }));
  };

  const validateMilestones = () => {
    if (!formData.offersMilestones) return true;
    
    const totalPercentage = formData.milestones.reduce((sum, m) => sum + (Number(m.percentage) || 0), 0);
    if (Math.abs(totalPercentage - 100) > 0.01) {
      setError('Milestone percentages must add up to 100%');
      return false;
    }

    const hasEmptyFields = formData.milestones.some(m => !m.stage || !m.percentage);
    if (hasEmptyFields) {
      setError('All milestone fields are required');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateMilestones()) return;

    setSubmitting(true);

    try {
      const payload = {
        proposedFee: Number(formData.proposedFee),
        proposedTimeline: formData.proposedTimeline,
        approach: formData.approach,
        offersMilestones: formData.offersMilestones,
        milestones: formData.offersMilestones ? formData.milestones : null
      };

      await axiosInstance.post(`/service-requests/${id}/quotes`, payload);

      setSuccess('Quote submitted successfully! The client will review your proposal.');
      
      setTimeout(() => {
        navigate('/lawyer/service-requests');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit quote');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <GlobalLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-600">Loading service request...</p>
          </div>
        </div>
      </GlobalLayout>
    );
  }

  if (!serviceRequest) {
    return (
      <GlobalLayout>
        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Request Not Found</h2>
            <p className="text-slate-600">The service request could not be found or you don't have access to it.</p>
          </div>
        </div>
      </GlobalLayout>
    );
  }

  return (
    <GlobalLayout>
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <button
          onClick={() => navigate('/lawyer/service-requests')}
          className="flex items-center text-blue-600 hover:text-blue-700 mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Service Requests
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Submit Quote</h1>
          <p className="text-slate-600">
            Provide your proposed fee, timeline, and approach for this case
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-start">
            <CheckCircle className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-green-800 font-medium">{success}</p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start">
            <AlertCircle className="h-5 w-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-800 font-medium">{error}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Service Request Details */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 sticky top-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Case Details</h2>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Service</p>
                  <p className="font-medium text-slate-900">{serviceRequest.serviceTitle}</p>
                  <p className="text-sm text-slate-600">{serviceRequest.serviceCategory}</p>
                </div>

                <div>
                  <p className="text-sm text-slate-500 mb-1">Description</p>
                  <p className="text-sm text-slate-700">{serviceRequest.description}</p>
                </div>

                {serviceRequest.additionalNotes && (
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Additional Notes</p>
                    <p className="text-sm text-slate-700">{serviceRequest.additionalNotes}</p>
                  </div>
                )}

                <div>
                  <p className="text-sm text-slate-500 mb-1">Client Timeline</p>
                  <p className="text-sm text-slate-700">{serviceRequest.preferredTimeline || serviceRequest.urgency}</p>
                </div>

                <div>
                  <p className="text-sm text-slate-500 mb-1">Submitted</p>
                  <p className="text-sm text-slate-700">
                    {new Date(serviceRequest.createdAt).toLocaleDateString()}
                  </p>
                </div>

                {/* Context Fields */}
                {serviceRequest.propertyLocation && (
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Property Location</p>
                    <p className="text-sm text-slate-700">{serviceRequest.propertyLocation}</p>
                  </div>
                )}

                {serviceRequest.companyType && (
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Company Type</p>
                    <p className="text-sm text-slate-700">{serviceRequest.companyType}</p>
                  </div>
                )}

                {serviceRequest.debtType && (
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Debt Type</p>
                    <p className="text-sm text-slate-700">{serviceRequest.debtType}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quote Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 space-y-6">
              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start">
                <Info className="h-5 w-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Quote Submission is FREE</p>
                  <p>Submit your best proposal. If selected, client pays 30% upfront.</p>
                </div>
              </div>

              {/* Proposed Fee */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Proposed Total Fee (KES) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    type="number"
                    required
                    min="1000"
                    step="100"
                    value={formData.proposedFee}
                    onChange={(e) => setFormData(prev => ({ ...prev, proposedFee: e.target.value }))}
                    placeholder="e.g., 50000"
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                {formData.proposedFee && (
                  <p className="text-xs text-slate-600 mt-1">
                    Client pays 30% upfront: <strong>KES {(Number(formData.proposedFee) * 0.3).toLocaleString()}</strong>
                    {' '}(You receive 10% = KES {(Number(formData.proposedFee) * 0.1).toLocaleString()} to start case)
                  </p>
                )}
              </div>

              {/* Timeline */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Proposed Timeline <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={formData.proposedTimeline}
                    onChange={(e) => setFormData(prev => ({ ...prev, proposedTimeline: e.target.value }))}
                    placeholder="e.g., 2-3 weeks, 1 month, 6 weeks"
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Approach */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Your Approach <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={6}
                  value={formData.approach}
                  onChange={(e) => setFormData(prev => ({ ...prev, approach: e.target.value }))}
                  placeholder="Explain how you will handle this case, your strategy, and what makes you the best choice..."
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Milestones Toggle */}
              <div className="flex items-start">
                <input
                  type="checkbox"
                  id="offersMilestones"
                  checked={formData.offersMilestones}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    offersMilestones: e.target.checked,
                    milestones: e.target.checked ? prev.milestones : []
                  }))}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
                />
                <label htmlFor="offersMilestones" className="ml-3">
                  <p className="text-sm font-medium text-slate-700">Offer milestone-based payments</p>
                  <p className="text-xs text-slate-500">Break down the case into stages with specific deliverables</p>
                </label>
              </div>

              {/* Milestones */}
              {formData.offersMilestones && (
                <div className="border border-slate-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium text-slate-900">Case Milestones</h3>
                    <button
                      type="button"
                      onClick={addMilestone}
                      className="flex items-center text-sm text-blue-600 hover:text-blue-700"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Milestone
                    </button>
                  </div>

                  {formData.milestones.length === 0 && (
                    <p className="text-sm text-slate-500 text-center py-4">
                      No milestones added yet. Click "Add Milestone" to start.
                    </p>
                  )}

                  <div className="space-y-4">
                    {formData.milestones.map((milestone, index) => (
                      <div key={index} className="bg-slate-50 rounded-lg p-4 relative">
                        <button
                          type="button"
                          onClick={() => removeMilestone(index)}
                          className="absolute top-2 right-2 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>

                        <div className="grid grid-cols-2 gap-4 mb-3">
                          <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">
                              Stage {index + 1}
                            </label>
                            <input
                              type="text"
                              value={milestone.stage}
                              onChange={(e) => updateMilestone(index, 'stage', e.target.value)}
                              placeholder="e.g., Initial Review"
                              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">
                              Payment %
                            </label>
                            <input
                              type="number"
                              min="1"
                              max="100"
                              step="1"
                              value={milestone.percentage}
                              onChange={(e) => updateMilestone(index, 'percentage', Number(e.target.value))}
                              placeholder="25"
                              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">
                            Description
                          </label>
                          <textarea
                            rows={2}
                            value={milestone.description}
                            onChange={(e) => updateMilestone(index, 'description', e.target.value)}
                            placeholder="What will be delivered at this stage?"
                            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {formData.milestones.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-200">
                      <p className="text-sm text-slate-700">
                        Total: <strong>{formData.milestones.reduce((sum, m) => sum + (Number(m.percentage) || 0), 0)}%</strong>
                        {formData.milestones.reduce((sum, m) => sum + (Number(m.percentage) || 0), 0) !== 100 && (
                          <span className="text-red-600 ml-2">(Must equal 100%)</span>
                        )}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Submit Button */}
              <div className="flex items-center justify-end space-x-4 pt-6 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => navigate('/lawyer/service-requests')}
                  className="px-6 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Submit Quote
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </GlobalLayout>
  );
}
