import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { GlobalLayout } from '../components/layout';
import { CheckCircle, Upload, Sparkles, Shield, Clock, AlertCircle, FileText } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

type ServiceType = 'ai-review' | 'certification' | null;
type DocumentSource = 'marketplace' | 'external' | null;

interface UploadedFile {
  file: File;
  preview: string;
}

interface LocationState {
  documentId?: string;
  documentTitle?: string;
  requestType?: 'review' | 'certification';
}

const DocumentServicesPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, accessToken } = useAuthStore();
  const [selectedService, setSelectedService] = useState<ServiceType>(null);
  const [documentSource, setDocumentSource] = useState<DocumentSource>(null);
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [documentType, setDocumentType] = useState('');
  const [documentCategory, setDocumentCategory] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fromUploadedDocument, setFromUploadedDocument] = useState(false);

  // Check if coming from Request Review button or restore from sessionStorage
  useEffect(() => {
    // First, check sessionStorage for persisted document review
    const savedReviewRequest = sessionStorage.getItem('activeDocumentReview');
    if (savedReviewRequest) {
      try {
        const reviewData = JSON.parse(savedReviewRequest);
        setFromUploadedDocument(true);
        setDocumentType(reviewData.documentTitle);
        setSelectedService(reviewData.selectedService || 'ai-review');
        setDocumentSource('external');
        
        const mockFile = new File([''], reviewData.documentTitle, { type: 'application/pdf' });
        setUploadedFile({
          file: mockFile,
          preview: reviewData.documentTitle
        });
        return;
      } catch (error) {
        console.error('Error restoring document review:', error);
      }
    }

    // If no saved data, check navigation state
    const state = location.state as LocationState;
    if (state?.documentId && state?.documentTitle) {
      // User clicked Request Review from DocumentsPage
      const reviewData = {
        documentId: state.documentId,
        documentTitle: state.documentTitle,
        requestType: state.requestType,
        selectedService: state.requestType === 'review' ? 'ai-review' : 'certification'
      };
      
      // Save to sessionStorage for persistence
      sessionStorage.setItem('activeDocumentReview', JSON.stringify(reviewData));
      
      setFromUploadedDocument(true);
      setDocumentType(state.documentTitle);
      setSelectedService(reviewData.selectedService);
      setDocumentSource('external');
      
      // Create a mock file reference (since document is already uploaded)
      const mockFile = new File([''], state.documentTitle, { type: 'application/pdf' });
      setUploadedFile({
        file: mockFile,
        preview: state.documentTitle
      });
    }
  }, [location.state]);

  // Restore pending document review after user logs in/registers
  useEffect(() => {
    if (isAuthenticated) {
      const pendingReview = sessionStorage.getItem('pendingDocumentReview');
      if (pendingReview) {
        try {
          const reviewData = JSON.parse(pendingReview);
          
          // Check if this was from an uploaded document (has documentId)
          if (reviewData.documentId && reviewData.documentTitle) {
            // Restore the uploaded document review
            setFromUploadedDocument(true);
            setDocumentType(reviewData.documentTitle);
            setSelectedService(reviewData.selectedService || 'ai-review');
            setDocumentSource('external');
            
            const mockFile = new File([''], reviewData.documentTitle, { type: 'application/pdf' });
            setUploadedFile({
              file: mockFile,
              preview: reviewData.documentTitle
            });
            
            // Move pendingDocumentReview back to activeDocumentReview
            sessionStorage.setItem('activeDocumentReview', pendingReview);
          } else {
            // New file upload - restore form state but user needs to re-upload
            setSelectedService(reviewData.selectedService);
            setDocumentType(reviewData.documentType);
            setDocumentCategory(reviewData.documentCategory);
            setDocumentSource('external');
            
            // Show a message to the user
            alert(`Welcome back! Please re-upload "${reviewData.fileName}" to continue.`);
          }
          
          // Clear the pending review
          sessionStorage.removeItem('pendingDocumentReview');
        } catch (error) {
          console.error('Error restoring pending review:', error);
        }
      }
    }
  }, [isAuthenticated]);

  const handleServiceChange = () => {
    // When changing service for an uploaded document, preserve the document
    if (fromUploadedDocument) {
      const savedReview = sessionStorage.getItem('activeDocumentReview');
      if (savedReview) {
        sessionStorage.removeItem('activeDocumentReview');
      }
    }
    
    setSelectedService(null);
    
    // Only clear uploaded file if it's a newly uploaded file, not from documents page
    if (!fromUploadedDocument) {
      setUploadedFile(null);
    }
  };

  const handleFileSelect = (file: File) => {
    if (file.size > 20 * 1024 * 1024) {
      alert('File size must be less than 20MB');
      return;
    }

    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];

    if (!allowedTypes.includes(file.type)) {
      alert('Only PDF, DOC, DOCX, and TXT files are allowed');
      return;
    }

    setUploadedFile({
      file,
      preview: file.name
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const calculatePrice = (): number => {
    if (selectedService === 'ai-review' && documentSource === 'external') {
      return 500;
    }
    if (selectedService === 'certification' && documentSource === 'external') {
      return 3000; // Base price, can vary
    }
    return 0; // Free for marketplace
  };

  const handleSubmit = async () => {
    if (!uploadedFile || !selectedService) {
      alert('Please select a service and upload a document');
      return;
    }

    // Check authentication before proceeding
    if (!isAuthenticated) {
      // If coming from uploaded document, preserve the activeDocumentReview
      const savedReview = sessionStorage.getItem('activeDocumentReview');
      if (savedReview) {
        // Document is already uploaded, just save that we need to continue after login
        sessionStorage.setItem('pendingDocumentReview', savedReview);
      } else {
        // Store new document review details in sessionStorage
        sessionStorage.setItem('pendingDocumentReview', JSON.stringify({
          fileName: uploadedFile.file.name,
          documentType,
          documentCategory,
          selectedService,
          price: calculatePrice()
        }));
      }
      
      // Redirect to registration/login
      navigate('/register', { 
        state: { 
          returnTo: '/document-services',
          message: 'Please register or login to submit your document for review'
        } 
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // If document is from uploaded documents (already on server), handle differently
      if (fromUploadedDocument) {
        const savedReview = sessionStorage.getItem('activeDocumentReview');
        let documentId = '';
        
        if (savedReview) {
          try {
            const reviewData = JSON.parse(savedReview);
            documentId = reviewData.documentId;
          } catch (error) {
            console.error('Error parsing review data:', error);
          }
        }
        
        // Simulate upload progress
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => {
            if (prev >= 100) {
              clearInterval(progressInterval);
              return 100;
            }
            return prev + 20;
          });
        }, 100);
        
        // Simulate processing delay then redirect to payment
        setTimeout(() => {
          clearInterval(progressInterval);
          setUploadProgress(100);
          setIsUploading(false);
          
          // Clear the active review from sessionStorage
          sessionStorage.removeItem('activeDocumentReview');
          
          // Generate a temporary review ID (in production, this would come from API)
          const reviewId = `review_${Date.now()}`;
          
          // Redirect to payment page
          navigate(`/payment/document/${reviewId}`, {
            state: {
              reviewId: reviewId,
              documentType: documentType,
              serviceType: selectedService,
              price: calculatePrice(),
              fileName: documentType,
              documentId: documentId
            }
          });
        }, 1000);
        
        return;
      }

      const formData = new FormData();
      formData.append('document', uploadedFile.file);
      formData.append('documentType', documentType);
      formData.append('documentCategory', documentCategory);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const endpoint = selectedService === 'ai-review'
        ? '/document-review/external/ai-review'
        : '/document-review/certification';

      // Get token from localStorage the same way axios interceptor does
      let token = accessToken;
      if (!token) {
        const authStorage = localStorage.getItem('wakili-auth-storage');
        if (authStorage) {
          try {
            const parsed = JSON.parse(authStorage);
            token = parsed.state?.accessToken;
          } catch (error) {
            console.error('Error parsing auth storage:', error);
          }
        }
      }

      console.log('🔐 Document Upload Authentication:');
      console.log('   Token available:', token ? 'Yes' : 'No');
      console.log('   Token preview:', token ? `${token.substring(0, 20)}...` : 'NULL');

      if (!token) {
        throw new Error('No authentication token available. Please log in again.');
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const data = await response.json();

      if (data.success) {
        // Clear pending review from sessionStorage
        sessionStorage.removeItem('pendingDocumentReview');
        sessionStorage.removeItem('activeDocumentReview');
        
        // Redirect to payment page with document review details
        if (data.data.paymentRequired) {
          navigate(`/payment/document/${data.data.reviewId}`, {
            state: {
              reviewId: data.data.reviewId,
              documentType: documentType,
              serviceType: selectedService,
              price: data.data.price,
              fileName: uploadedFile.file.name
            }
          });
        } else {
          alert('Document uploaded! AI review in progress...');
          // Redirect to results page
          navigate('/dashboard');
        }
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload document. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <GlobalLayout>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-slate-900 mb-2">
              Document Review & Certification Services
            </h1>
            <p className="text-sm text-slate-600 max-w-2xl mx-auto">
              Get your legal documents reviewed by AI or certified by licensed lawyers. 
              Fast, affordable, and reliable.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Service Selection */}
        {!selectedService && (
          <div className="grid md:grid-cols-2 gap-6">
            {/* AI Review Card */}
            <div
              onClick={() => {
                setSelectedService('ai-review');
                setDocumentSource('external');
                
                // Update sessionStorage if document is from uploaded documents
                const savedReview = sessionStorage.getItem('activeDocumentReview');
                if (savedReview) {
                  try {
                    const reviewData = JSON.parse(savedReview);
                    reviewData.selectedService = 'ai-review';
                    sessionStorage.setItem('activeDocumentReview', JSON.stringify(reviewData));
                  } catch (error) {
                    console.error('Error updating service:', error);
                  }
                }
              }}
              className="bg-white rounded-lg border border-slate-200 hover:border-blue-500 hover:shadow-lg transition-all cursor-pointer p-6"
            >
              <div className="flex items-center justify-center w-12 h-12 bg-blue-50 rounded-lg mb-4">
                <Sparkles className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                AI Document Review
              </h3>
              <p className="text-sm text-slate-600 mb-4">
                Get comprehensive AI-powered analysis of your document's completeness, 
                consistency, legal compliance, and formatting.
              </p>
              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-slate-700">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-2 flex-shrink-0" />
                  Completeness check
                </div>
                <div className="flex items-center text-sm text-slate-700">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-2 flex-shrink-0" />
                  Legal compliance analysis
                </div>
                <div className="flex items-center text-sm text-slate-700">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-2 flex-shrink-0" />
                  Risk identification
                </div>
                <div className="flex items-center text-sm text-slate-700">
                  <Clock className="h-4 w-4 text-blue-600 mr-2 flex-shrink-0" />
                  Results in 5-10 minutes
                </div>
              </div>
              <div className="border-t border-slate-200 pt-4">
                <div className="flex items-baseline">
                  <span className="text-xl font-bold text-slate-900">KES 500</span>
                  <span className="text-sm text-slate-600 ml-2">per document</span>
                </div>
              </div>
            </div>

            {/* Certification Card */}
            <div
              onClick={() => {
                setSelectedService('certification');
                setDocumentSource('external');
                
                // Update sessionStorage if document is from uploaded documents
                const savedReview = sessionStorage.getItem('activeDocumentReview');
                if (savedReview) {
                  try {
                    const reviewData = JSON.parse(savedReview);
                    reviewData.selectedService = 'certification';
                    sessionStorage.setItem('activeDocumentReview', JSON.stringify(reviewData));
                  } catch (error) {
                    console.error('Error updating service:', error);
                  }
                }
              }}
              className="bg-white rounded-lg border border-slate-200 hover:border-blue-500 hover:shadow-lg transition-all cursor-pointer p-6"
            >
              <div className="flex items-center justify-center w-12 h-12 bg-indigo-50 rounded-lg mb-4">
                <Shield className="h-6 w-6 text-indigo-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Lawyer Certification
              </h3>
              <p className="text-sm text-slate-600 mb-4">
                Get your document officially certified by a licensed lawyer. 
                Includes lawyer stamp and certification letter for legal validity.
              </p>
              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-slate-700">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-2 flex-shrink-0" />
                  Licensed lawyer review
                </div>
                <div className="flex items-center text-sm text-slate-700">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-2 flex-shrink-0" />
                  Official certification stamp
                </div>
                <div className="flex items-center text-sm text-slate-700">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-2 flex-shrink-0" />
                  Quality control review
                </div>
                <div className="flex items-center text-sm text-slate-700">
                  <Clock className="h-4 w-4 text-blue-600 mr-2 flex-shrink-0" />
                  Completed within 24 hours
                </div>
              </div>
              <div className="border-t border-slate-200 pt-4">
                <div className="flex items-baseline">
                  <span className="text-xl font-bold text-slate-900">KES 3,000+</span>
                  <span className="text-sm text-slate-600 ml-2">varies by complexity</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Document Upload Form */}
        {selectedService && (
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-lg border border-slate-200 p-8">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-slate-900">
                  {selectedService === 'ai-review' ? 'AI Document Review' : 'Lawyer Certification'}
                </h2>
                <button
                  onClick={handleServiceChange}
                  className="text-sm text-slate-600 hover:text-slate-900"
                >
                  Change Service
                </button>
              </div>

              {/* File Upload Area */}
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  isDragging
                    ? 'border-blue-500 bg-blue-50'
                    : uploadedFile
                    ? 'border-green-500 bg-green-50'
                    : 'border-slate-300 hover:border-slate-400'
                }`}
              >
                {uploadedFile ? (
                  <div className="space-y-3">
                    {fromUploadedDocument ? (
                      <FileText className="h-12 w-12 text-blue-600 mx-auto" />
                    ) : (
                      <CheckCircle className="h-12 w-12 text-green-600 mx-auto" />
                    )}
                    <p className="text-sm font-medium text-slate-900">{uploadedFile.preview}</p>
                    {fromUploadedDocument && (
                      <p className="text-xs text-blue-600">
                        Document already uploaded • Ready for review
                      </p>
                    )}
                    {!fromUploadedDocument && (
                      <button
                        onClick={() => setUploadedFile(null)}
                        className="text-xs text-slate-600 hover:text-slate-900"
                      >
                        Remove file
                      </button>
                    )}
                  </div>
                ) : (
                  <>
                    <Upload className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-sm font-medium text-slate-900 mb-1">
                      Drop your document here or click to browse
                    </p>
                    <p className="text-xs text-slate-600 mb-4">
                      PDF, DOC, DOCX, or TXT • Max 20MB
                    </p>
                    <input
                      type="file"
                      onChange={handleFileInputChange}
                      accept=".pdf,.doc,.docx,.txt"
                      className="hidden"
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className="inline-block px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 cursor-pointer"
                    >
                      Choose File
                    </label>
                  </>
                )}
              </div>

              {/* Document Details */}
              {uploadedFile && (
                <div className="mt-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-2">
                      Document Type
                    </label>
                    <input
                      type="text"
                      value={documentType}
                      onChange={(e) => setDocumentType(e.target.value)}
                      placeholder="e.g., Employment Contract, Rental Agreement"
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-2">
                      Category (Optional)
                    </label>
                    <select
                      value={documentCategory}
                      onChange={(e) => setDocumentCategory(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select a category</option>
                      <option value="EMPLOYMENT_CONTRACT">Employment Contract</option>
                      <option value="RENTAL_AGREEMENT">Rental Agreement</option>
                      <option value="BUSINESS_CONTRACT">Business Contract</option>
                      <option value="PARTNERSHIP_AGREEMENT">Partnership Agreement</option>
                      <option value="LEASE_AGREEMENT">Lease Agreement</option>
                      <option value="SALES_AGREEMENT">Sales Agreement</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Price Summary */}
              {uploadedFile && (
                <div className="mt-6 bg-slate-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-700">Service Fee</span>
                    <span className="text-sm font-semibold text-slate-900">
                      KES {calculatePrice().toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center text-xs text-slate-600">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    <span>
                      {selectedService === 'ai-review'
                        ? 'Results ready in 5-10 minutes'
                        : 'Certified within 24 hours'}
                    </span>
                  </div>
                </div>
              )}

              {/* Upload Progress */}
              {isUploading && (
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-700">Uploading...</span>
                    <span className="text-sm font-semibold text-slate-900">{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Submit Button */}
              {uploadedFile && !isUploading && (
                <button
                  onClick={handleSubmit}
                  disabled={!documentType}
                  className="mt-6 w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold rounded-md hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  Proceed to Payment • KES {calculatePrice().toLocaleString()}
                </button>
              )}
            </div>

            {/* Info Box */}
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">What happens next?</h3>
              <ul className="space-y-1 text-xs text-blue-800">
                {selectedService === 'ai-review' ? (
                  <>
                    <li>• Your document will be analyzed by our AI system</li>
                    <li>• You'll receive a comprehensive review report in 5-10 minutes</li>
                    <li>• Option to upgrade to lawyer certification if needed</li>
                  </>
                ) : (
                  <>
                    <li>• Your document will be assigned to a licensed lawyer</li>
                    <li>• Lawyer reviews and certifies with official stamp</li>
                    <li>• Quality control review ensures accuracy</li>
                    <li>• Certified document delivered within 24 hours</li>
                  </>
                )}
              </ul>
            </div>
          </div>
        )}
      </div>
    </GlobalLayout>
  );
};

export default DocumentServicesPage;
