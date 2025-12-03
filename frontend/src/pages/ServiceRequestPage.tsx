import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2,
  Phone,
  Mail,
  Info,
  Shield
} from 'lucide-react';
import axiosInstance from '../services/api';

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
  
  // Dynamic service-specific fields (for context only, not fee calculation)
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
    email: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>('');

  // Remove fee calculation - lawyers will quote directly
  // No need to check for pending service request from payment

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

  // Auto-derive category from service title using keywords
  const deriveCategory = (serviceTitle: string): string => {
    const title = serviceTitle.toLowerCase();
    if (title.includes('property') || title.includes('land') || title.includes('title') || title.includes('lease')) return 'Property Transfer';
    if (title.includes('business acquisition') || title.includes('company purchase')) return 'Business Acquisition';
    if (title.includes('debt') || title.includes('collection') || title.includes('recovery')) return 'Debt Collection';
    if (title.includes('business registration') || title.includes('company registration')) return 'Business Registration';
    if (title.includes('will') || title.includes('estate')) return 'Will Drafting';
    if (title.includes('employment') || title.includes('contract')) return 'Employment Contract';
    if (title.includes('divorce') || title.includes('family') || title.includes('custody')) return 'Divorce/Family Law';
    return 'Property Transfer'; // Default fallback
  };

  const getServiceFields = (serviceCategory: string) => {
    // Simplified fields - just context questions, no monetary values
    const fieldMappings: Record<string, any> = {
      'Property Transfer': [
        { name: 'propertyLocation', label: 'Property location', type: 'text', required: true },
        { name: 'titleType', label: 'Title type', type: 'select', options: ['Freehold', 'Leasehold', 'Sectional Title'], required: true },
        { name: 'hasDisputes', label: 'Are there any disputes or caveats?', type: 'boolean', required: false }
      ],
      'Business Acquisition': [
        { name: 'companyType', label: 'Company type', type: 'select', options: ['Private Limited', 'LLC', 'Partnership', 'Sole Proprietor'], required: true },
        { name: 'numberOfEmployees', label: 'Number of employees', type: 'number', required: false },
        { name: 'industry', label: 'Industry/sector', type: 'text', required: true }
      ],
      'Debt Collection': [
        { name: 'debtType', label: 'Type of debt', type: 'select', options: ['Commercial', 'Personal Loan', 'Unpaid Services', 'Rent Arrears'], required: true },
        { name: 'debtAge', label: 'How old is this debt?', type: 'select', options: ['Less than 6 months', '6-12 months', '1-2 years', 'Over 2 years'], required: true },
        { name: 'hasContract', label: 'Do you have a written contract?', type: 'boolean', required: false }
      ],
      'Business Registration': [
        { name: 'businessType', label: 'Business type', type: 'select', options: ['Sole Proprietor', 'Partnership', 'Limited Company', 'NGO'], required: true },
        { name: 'numberOfDirectors', label: 'Number of directors/partners', type: 'number', required: false },
        { name: 'hasNameReserved', label: 'Have you reserved the business name?', type: 'boolean', required: false },
        { name: 'needsTaxRegistration', label: 'Need KRA PIN registration?', type: 'boolean', required: false }
      ],
      'Will Drafting': [
        { name: 'numberOfBeneficiaries', label: 'Number of beneficiaries', type: 'number', required: false },
        { name: 'hasInternationalAssets', label: 'Assets outside Kenya?', type: 'boolean', required: false },
        { name: 'hasBusiness', label: 'Include business succession?', type: 'boolean', required: false }
      ],
      'Employment Contract': [
        { name: 'numberOfEmployees', label: 'Number of employees', type: 'number', required: false },
        { name: 'includesNonCompete', label: 'Include non-compete clause?', type: 'boolean', required: false }
      ],
      'Divorce/Family Law': [
        { name: 'hasProperty', label: 'Property to be divided?', type: 'boolean', required: false },
        { name: 'needsCustody', label: 'Child custody arrangement needed?', type: 'boolean', required: false }
      ]
    };

    return fieldMappings[serviceCategory] || [];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    // Validate required fields
    if (!formData.serviceTitle || !formData.description) {
      setSubmitError('Please fill in all required fields');
      return;
    }

    // Auto-derive category from service title
    const derivedCategory = deriveCategory(formData.serviceTitle);
    formData.serviceCategory = derivedCategory;

    // Validate contact info
    if (!formData.phoneNumber || !formData.email) {
      setSubmitError('Phone number and email are required');
      return;
    }

    // Get phone number for M-Pesa commitment fee payment
    const phoneNumber = prompt('Enter your M-Pesa phone number for KES 500 commitment fee (format: 254XXXXXXXXX):');
    
    if (!phoneNumber) {
      alert('Phone number is required for commitment fee payment');
      return;
    }

    setIsSubmitting(true);

    try {
      // Step 1: Initiate M-Pesa payment for commitment fee
      console.log('[ServiceRequest] Initiating commitment fee payment...');
      const paymentResponse = await axiosInstance.post('/payments/mpesa/initiate', {
        phoneNumber: phoneNumber,
        amount: 500,
        paymentType: 'SERVICE_REQUEST_COMMITMENT'
      });

      if (!paymentResponse.data.success) {
        throw new Error(paymentResponse.data.message || 'Failed to initiate payment');
      }

      const { paymentId } = paymentResponse.data.data;

      // Step 2: Create service request with payment ID
      console.log('[ServiceRequest] Creating service request...');
      const requestData = {
        ...formData,
        commitmentFeeTxId: paymentId,
        commitmentFeeAmount: 500
      };

      const createResponse = await axiosInstance.post('/service-requests', requestData);

      if (createResponse.data.success) {
        alert(`Service request submitted!\n\nM-Pesa payment request for KES 500 commitment fee sent to ${phoneNumber}\n\nPlease complete the payment on your phone.\n\nYou will receive 3 quotes from qualified lawyers within 24-48 hours.`);
        navigate('/dashboard');
      } else {
        throw new Error(createResponse.data.message || 'Failed to create service request');
      }
    } catch (error: any) {
      console.error('Submit error:', error);
      setSubmitError(error.response?.data?.message || error.message || 'Failed to submit request. Please try again.');
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
    <>
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
              Request Legal Service Package
            </h1>
            <p className="text-sm text-slate-600">
              Provide service details to receive quotes from qualified lawyers
            </p>
          </div>

          {/* How It Works Info */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 mb-6">
            <div className="flex items-start space-x-3">
              <Info className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">How It Works</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-slate-700">
                  <li>Pay KES 500 commitment fee to submit your request</li>
                  <li>Receive up to 3 quotes from qualified lawyers within 24-48 hours</li>
                  <li>Select your preferred lawyer based on their quote and profile</li>
                  <li><strong>Pay 30% upfront</strong> of quoted amount</li>
                  <li>Lawyer proceeds with your case - <strong>remaining 70% balance</strong> payable as case progresses</li>
                </ol>
                <p className="text-xs text-slate-600 mt-3">
                  <strong>Note:</strong> The commitment fee is non-refundable.
                </p>
              </div>
            </div>
          </div>

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
                    placeholder="e.g., Land Title Transfer, Company Registration, Residential Lease Agreement"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
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
    </>
  );
};

export default ServiceRequestPage;
