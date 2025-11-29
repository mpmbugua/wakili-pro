import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { GlobalLayout } from '../components/layout';
import {
  ArrowLeft,
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2,
  DollarSign,
  Phone,
  Mail,
  Info,
  Shield
} from 'lucide-react';
import { calculateServiceFee, getServiceFields, ServiceFeeEstimate } from '../utils/serviceFeeCalculator';

interface ServiceRequestForm {
  serviceTitle: string;
  serviceCategory: string;
  description: string;
  urgency: 'standard' | 'urgent' | 'emergency';
  preferredTimeline: string;
  additionalNotes: string;
  documents: File[];
  
  // Contact info
  phoneNumber: string;
  email: string;
  
  // Dynamic service-specific fields
  transactionValue?: number;
  dealValue?: number;
  claimAmount?: number;
  businessType?: string;
  complexity?: string;
  serviceType?: string;
  propertyLocation?: string;
  titleType?: string;
  hasDisputes?: boolean;
  hasMortgage?: boolean;
  companyType?: string;
  numberOfEmployees?: number;
  industry?: string;
  hasLiabilities?: boolean;
  debtType?: string;
  debtAge?: string;
  hasContract?: boolean;
  hasCollateral?: boolean;
  numberOfDirectors?: number;
  hasNameReserved?: boolean;
  needsTaxRegistration?: boolean;
  numberOfBeneficiaries?: number;
  hasInternationalAssets?: boolean;
  hasBusiness?: boolean;
  includesNonCompete?: boolean;
  hasProperty?: boolean;
  needsCustody?: boolean;
  
  // Payment tracking
  commitmentFeePaid: boolean;
  commitmentFeeAmount?: number;
  commitmentFeeTxId?: string;
}

export const ServiceRequestPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const serviceFromState = location.state?.fromService || '';

  const [formData, setFormData] = useState<ServiceRequestForm>({
    serviceTitle: serviceFromState,
    serviceCategory: '',
    description: '',
    urgency: 'standard',
    preferredTimeline: '',
    additionalNotes: '',
    documents: [],
    phoneNumber: '',
    email: '',
    commitmentFeePaid: false
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>('');
  const [feeEstimate, setFeeEstimate] = useState<ServiceFeeEstimate | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentPhone, setPaymentPhone] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Check if returning from payment page
  useEffect(() => {
    const pendingServiceRequest = sessionStorage.getItem('pendingServiceRequest');
    const paymentSuccess = location.state?.paymentSuccess;
    
    if (pendingServiceRequest && paymentSuccess) {
      try {
        const { formData: savedFormData, feeEstimate: savedFeeEstimate } = JSON.parse(pendingServiceRequest);
        setFormData({
          ...savedFormData,
          commitmentFeePaid: true,
          commitmentFeeAmount: 500
        });
        setFeeEstimate(savedFeeEstimate);
        sessionStorage.removeItem('pendingServiceRequest');
      } catch (error) {
        console.error('Failed to restore service request data:', error);
      }
    }
  }, [location]);

  // Calculate fee estimate whenever relevant fields change
  useEffect(() => {
    if (formData.serviceCategory) {
      const estimate = calculateServiceFee(formData.serviceCategory, formData);
      setFeeEstimate(estimate);
    }
  }, [
    formData.serviceCategory,
    formData.transactionValue,
    formData.dealValue,
    formData.claimAmount,
    formData.businessType,
    formData.complexity,
    formData.serviceType
  ]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFormData(prev => ({
        ...prev,
        documents: [...prev.documents, ...newFiles]
      }));
    }
  };

  const removeDocument = (index: number) => {
    setFormData(prev => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index)
    }));
  };

  const handleCommitmentFeePayment = async () => {
    if (!paymentPhone || paymentPhone.length < 10) {
      alert('Please enter a valid phone number');
      return;
    }

    setIsProcessingPayment(true);
    try {
      // Import axiosInstance at the top if not already imported
      const axiosInstance = (await import('../lib/axios')).default;
      
      // Call M-Pesa STK Push API with proper auth
      const response = await axiosInstance.post('/document-payment/initiate', {
        amount: 500,
        phoneNumber: paymentPhone,
        paymentType: 'SERVICE_REQUEST_COMMITMENT'
      });

      const data = response.data;

      if (data.success) {
        const { paymentId } = data.data;
        
        // Poll for payment status
        const checkPayment = setInterval(async () => {
          const statusResponse = await axiosInstance.get(`/document-payment/${paymentId}/status`);
          const statusData = statusResponse.data;

          if (statusData.success && statusData.data.status === 'COMPLETED') {
            clearInterval(checkPayment);
            setFormData(prev => ({
              ...prev,
              commitmentFeePaid: true,
              commitmentFeeAmount: 500,
              commitmentFeeTxId: statusData.data.transactionId || paymentId
            }));
            setShowPaymentModal(false);
            setIsProcessingPayment(false);
          } else if (statusData.status === 'FAILED') {
            clearInterval(checkPayment);
            alert('Payment failed. Please try again.');
            setIsProcessingPayment(false);
          }
        }, 2000);

        // Timeout after 60 seconds
        setTimeout(() => {
          clearInterval(checkPayment);
          setIsProcessingPayment(false);
        }, 60000);
      } else {
        alert('Failed to initiate payment. Please try again.');
        setIsProcessingPayment(false);
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('Payment error. Please try again.');
      setIsProcessingPayment(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    // Validate contact info
    if (!formData.phoneNumber || !formData.email) {
      setSubmitError('Phone number and email are required');
      return;
    }

    // Check if commitment fee is paid - navigate to payment page instead of modal
    if (!formData.commitmentFeePaid) {
      // Store service request data in sessionStorage
      sessionStorage.setItem('pendingServiceRequest', JSON.stringify({
        formData,
        feeEstimate
      }));
      
      // Navigate to payment page for commitment fee
      navigate('/payment/service-request', {
        state: {
          serviceType: 'service-request-commitment',
          price: 500,
          description: 'Service Request Commitment Fee',
          serviceDetails: {
            serviceType: formData.serviceType,
            category: formData.category,
            estimatedFee: feeEstimate?.estimatedFee
          }
        }
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const requestFormData = new FormData();
      
      // Append all form fields
      Object.entries(formData).forEach(([key, value]) => {
        if (key !== 'documents' && value !== undefined && value !== '') {
          requestFormData.append(key, String(value));
        }
      });

      // Append fee estimate
      if (feeEstimate) {
        requestFormData.append('estimatedFee', String(feeEstimate.estimatedFee));
        requestFormData.append('tier', feeEstimate.tier);
        requestFormData.append('connectionFee', String(feeEstimate.connectionFee));
      }

      // Append documents
      formData.documents.forEach((doc) => {
        requestFormData.append('documents', doc);
      });

      const response = await fetch('/api/service-requests', {
        method: 'POST',
        body: requestFormData,
        credentials: 'include'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to submit request');
      }

      const result = await response.json();
      
      // Navigate to dashboard with success message
      navigate('/dashboard', {
        state: {
          message: 'Service request submitted successfully! You will receive lawyer quotes within 24 hours.',
          requestId: result.id
        }
      });
    } catch (error: any) {
      console.error('Submit error:', error);
      setSubmitError(error.message || 'Failed to submit request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get dynamic fields based on selected service category
  const dynamicFields = getServiceFields(formData.serviceCategory);

  const renderDynamicField = (field: any) => {
    const fieldName = field.name as keyof ServiceRequestForm;

    if (field.type === 'number') {
      return (
        <div key={field.name}>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            {field.label} {field.required && <span className="text-red-500">*</span>}
          </label>
          <input
            type="number"
            required={field.required}
            value={(formData[fieldName] as number) || ''}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              [fieldName]: parseFloat(e.target.value) || 0
            }))}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      );
    }

    if (field.type === 'select') {
      return (
        <div key={field.name}>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            {field.label} {field.required && <span className="text-red-500">*</span>}
          </label>
          <select
            required={field.required}
            value={(formData[fieldName] as string) || ''}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              [fieldName]: e.target.value
            }))}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select...</option>
            {field.options.map((option: string) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
      );
    }

    if (field.type === 'boolean') {
      return (
        <div key={field.name} className="flex items-center">
          <input
            type="checkbox"
            id={field.name}
            checked={(formData[fieldName] as boolean) || false}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              [fieldName]: e.target.checked
            }))}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
          />
          <label htmlFor={field.name} className="ml-2 block text-sm text-slate-700">
            {field.label}
          </label>
        </div>
      );
    }

    return (
      <div key={field.name}>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          {field.label} {field.required && <span className="text-red-500">*</span>}
        </label>
        <input
          type="text"
          required={field.required}
          value={(formData[fieldName] as string) || ''}
          onChange={(e) => setFormData(prev => ({
            ...prev,
            [fieldName]: e.target.value
          }))}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
    );
  };

  return (
    <GlobalLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          {/* Header */}
          <div className="mb-6">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center text-sm text-slate-600 hover:text-slate-900 mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </button>
            <h1 className="text-2xl font-semibold text-slate-900 mb-2">
              Request Legal Service
            </h1>
            <p className="text-sm text-slate-600">
              Provide service details to receive quotes from qualified lawyers
            </p>
          </div>

          {/* Info Banner - Updated for connection fee model */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-start space-x-3">
            <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 text-sm text-blue-800">
              <p className="font-medium mb-1">How it works:</p>
              <ol className="list-decimal list-inside space-y-1 text-blue-700">
                <li>Pay KES 500 commitment fee (non-refundable, ensures serious requests)</li>
                <li>We match you with 3-5 qualified lawyers based on your needs</li>
                <li>Review all quotes side-by-side and select your preferred lawyer</li>
                <li>Handle payment directly with your chosen lawyer (no platform fees)</li>
              </ol>
            </div>
          </div>

          {/* Fee Estimate Card */}
          {feeEstimate && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6 mb-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    <h3 className="text-lg font-semibold text-slate-900">Estimated Legal Fees</h3>
                  </div>
                  <p className="text-3xl font-bold text-green-600 mb-2">
                    KES {feeEstimate.estimatedFee.toLocaleString()}
                  </p>
                  <p className="text-sm text-slate-600 mb-3">{feeEstimate.calculation}</p>
                  <div className="flex items-center space-x-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      feeEstimate.tier === 'tier2'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {feeEstimate.tier === 'tier2' ? 'High-Value Service' : 'Standard Service'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    Eligible for: {feeEstimate.eligibleTiers.join(' & ')} tier lawyers
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 space-y-6">
            {/* Service Details */}
            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Service Details</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Service Type <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.serviceTitle}
                    onChange={(e) => setFormData(prev => ({ ...prev, serviceTitle: e.target.value }))}
                    placeholder="e.g., Land Title Transfer, Company Registration"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.serviceCategory}
                    onChange={(e) => setFormData(prev => ({ ...prev, serviceCategory: e.target.value }))}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select a category</option>
                    <option value="Property Transfer">Property Transfer</option>
                    <option value="Business Acquisition">Business Acquisition</option>
                    <option value="Debt Collection">Debt Collection</option>
                    <option value="Business Registration">Business Registration</option>
                    <option value="Will Drafting">Will Drafting</option>
                    <option value="Employment Contract">Employment Contract</option>
                    <option value="Divorce/Family Law">Divorce/Family Law</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Please provide detailed information about your legal needs..."
                    rows={5}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Dynamic Service-Specific Fields */}
            {dynamicFields.length > 0 && (
              <div className="border-t border-slate-200 pt-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Service-Specific Information</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {dynamicFields.map(renderDynamicField)}
                </div>
              </div>
            )}

            {/* Contact Information */}
            <div className="border-t border-slate-200 pt-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Contact Information</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    <Phone className="h-4 w-4 inline mr-1" />
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                    placeholder="e.g., 0712345678"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-slate-500 mt-1">Lawyers will contact you on this number</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    <Mail className="h-4 w-4 inline mr-1" />
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="your.email@example.com"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Requirements */}
            <div className="border-t border-slate-200 pt-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Your Requirements</h2>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Urgency <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.urgency}
                    onChange={(e) => setFormData(prev => ({ ...prev, urgency: e.target.value as any }))}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="standard">Standard (7-14 days)</option>
                    <option value="urgent">Urgent (3-7 days)</option>
                    <option value="emergency">Emergency (1-2 days)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Preferred Timeline
                  </label>
                  <input
                    type="text"
                    value={formData.preferredTimeline}
                    onChange={(e) => setFormData(prev => ({ ...prev, preferredTimeline: e.target.value }))}
                    placeholder="e.g., Within 2 weeks, By end of month"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Supporting Documents */}
            <div className="border-t border-slate-200 pt-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Supporting Documents</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Upload Documents (Optional)
                  </label>
                  <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                    <Upload className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm text-slate-600 mb-2">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-slate-500 mb-3">
                      PDF, DOC, DOCX, or images up to 10MB each
                    </p>
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="document-upload"
                    />
                    <label
                      htmlFor="document-upload"
                      className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 cursor-pointer"
                    >
                      Choose Files
                    </label>
                  </div>
                </div>

                {/* Uploaded Files List */}
                {formData.documents.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-slate-700">Uploaded Files:</p>
                    {formData.documents.map((doc, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <FileText className="h-5 w-5 text-slate-400" />
                          <div>
                            <p className="text-sm font-medium text-slate-900">{doc.name}</p>
                            <p className="text-xs text-slate-500">{(doc.size / 1024).toFixed(1)} KB</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeDocument(index)}
                          className="text-red-600 hover:text-red-700 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Additional Notes */}
            <div className="border-t border-slate-200 pt-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Additional Notes
              </label>
              <textarea
                value={formData.additionalNotes}
                onChange={(e) => setFormData(prev => ({ ...prev, additionalNotes: e.target.value }))}
                placeholder="Any other information that might help lawyers provide accurate quotes..."
                rows={3}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Commitment Fee Status */}
            {formData.commitmentFeePaid && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start space-x-3">
                <Shield className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-900">Commitment Fee Paid</p>
                  <p className="text-xs text-green-700">Transaction ID: {formData.commitmentFeeTxId}</p>
                </div>
              </div>
            )}

            {/* Error Message */}
            {submitError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{submitError}</p>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex items-center justify-between pt-6 border-t border-slate-200">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-6 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-sm font-medium hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : formData.commitmentFeePaid ? (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    <span>Submit Request</span>
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4" />
                    <span>Pay KES 500 & Submit</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* What Happens Next */}
          <div className="mt-6 bg-slate-50 rounded-lg p-6 border border-slate-200">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">What happens next?</h3>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  1
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">Lawyer Matching</p>
                  <p className="text-xs text-slate-600">
                    Our system matches you with 3-5 qualified lawyers based on expertise, tier eligibility, and ratings.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  2
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">Receive Multiple Quotes</p>
                  <p className="text-xs text-slate-600">
                    Qualified lawyers submit detailed quotes with their fee, timeline, and approach to your case.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  3
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">Compare & Select</p>
                  <p className="text-xs text-slate-600">
                    Review all quotes side-by-side and select your preferred lawyer based on price, timeline, and reputation.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  4
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">Direct Payment</p>
                  <p className="text-xs text-slate-600">
                    Handle payment directly with your chosen lawyer via M-Pesa, bank transfer, or cash. No additional platform fees.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal removed - now navigates to payment page directly */}
    </GlobalLayout>
  );
};

export default ServiceRequestPage;
