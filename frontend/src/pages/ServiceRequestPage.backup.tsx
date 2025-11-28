import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { GlobalLayout } from '../components/layout';
import { ArrowLeft, Upload, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface ServiceRequestForm {
  serviceTitle: string;
  serviceCategory: string;
  description: string;
  urgency: 'standard' | 'urgent' | 'emergency';
  budget: string;
  preferredTimeline: string;
  additionalNotes: string;
  documents: File[];
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
    budget: '',
    preferredTimeline: '',
    additionalNotes: '',
    documents: []
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setFormData(prev => ({
      ...prev,
      documents: [...prev.documents, ...files]
    }));
  };

  const removeDocument = (index: number) => {
    setFormData(prev => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const formDataToSend = new FormData();
      formDataToSend.append('serviceTitle', formData.serviceTitle);
      formDataToSend.append('serviceCategory', formData.serviceCategory);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('urgency', formData.urgency);
      formDataToSend.append('budget', formData.budget);
      formDataToSend.append('preferredTimeline', formData.preferredTimeline);
      formDataToSend.append('additionalNotes', formData.additionalNotes);
      
      formData.documents.forEach((doc, index) => {
        formDataToSend.append(`documents`, doc);
      });

      const response = await fetch(`${import.meta.env.VITE_API_URL}/service-requests`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      });

      const data = await response.json();

      if (data.success) {
        // Navigate to a confirmation page or dashboard
        navigate('/dashboard', {
          state: {
            message: 'Service request submitted successfully! We are matching you with a qualified lawyer.',
            requestId: data.data.id
          }
        });
      } else {
        setSubmitError(data.message || 'Failed to submit request');
      }
    } catch (error) {
      console.error('Submit error:', error);
      setSubmitError('An error occurred while submitting your request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
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
              Tell us about your legal needs and we'll match you with the best lawyer based on their expertise and availability.
            </p>
          </div>

          {/* Info Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 text-sm text-blue-800">
              <p className="font-medium mb-1">How it works:</p>
              <ol className="list-decimal list-inside space-y-1 text-blue-700">
                <li>Fill out the service request form below</li>
                <li>Our system matches you with qualified lawyers based on expertise, tier, and availability</li>
                <li>Receive lawyer recommendations within 24 hours</li>
                <li>Choose your preferred lawyer and proceed with payment</li>
              </ol>
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
                    <option value="Property & Conveyancing">Property & Conveyancing</option>
                    <option value="Business & Corporate">Business & Corporate</option>
                    <option value="Family Law">Family Law</option>
                    <option value="Employment Law">Employment Law</option>
                    <option value="Intellectual Property">Intellectual Property</option>
                    <option value="Immigration">Immigration</option>
                    <option value="Litigation">Litigation</option>
                    <option value="Tax & Compliance">Tax & Compliance</option>
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
                    Budget Range (KES)
                  </label>
                  <select
                    value={formData.budget}
                    onChange={(e) => setFormData(prev => ({ ...prev, budget: e.target.value }))}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Not sure</option>
                    <option value="under-10000">Under KES 10,000</option>
                    <option value="10000-30000">KES 10,000 - 30,000</option>
                    <option value="30000-50000">KES 30,000 - 50,000</option>
                    <option value="over-50000">Over KES 50,000</option>
                  </select>
                </div>
              </div>

              <div className="mt-4">
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
                placeholder="Any other information that might help us match you with the right lawyer..."
                rows={3}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

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
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    <span>Submit Request</span>
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
                    Our algorithm analyzes your requirements and matches you with qualified lawyers based on expertise, subscription tier, workload, and success rate.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  2
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">Review Recommendations</p>
                  <p className="text-xs text-slate-600">
                    You'll receive 2-3 lawyer recommendations with their profiles, pricing, and availability within 24 hours.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  3
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">Connect & Proceed</p>
                  <p className="text-xs text-slate-600">
                    Choose your preferred lawyer, confirm the service details, and proceed with secure payment to begin.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </GlobalLayout>
  );
};

export default ServiceRequestPage;
