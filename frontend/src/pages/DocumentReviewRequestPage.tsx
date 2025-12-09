import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { FileText, CheckCircle, Clock, DollarSign, ArrowLeft } from 'lucide-react';
import axiosInstance from '../services/api';

interface ServiceTier {
  id: string;
  name: string;
  price: number;
  estimatedTime: string;
  features: string[];
  recommended?: boolean;
}

const serviceTiers: ServiceTier[] = [
  {
    id: 'AI_ONLY',
    name: 'AI Review Only',
    price: 500,
    estimatedTime: 'Within 2 hours',
    features: [
      'Automated AI analysis',
      'Risk identification',
      'Compliance check',
      'Key terms extraction',
      'Basic recommendations'
    ]
  },
  {
    id: 'CERTIFICATION',
    name: 'Lawyer Certification',
    price: 2000,
    estimatedTime: 'Within 2 hours',
    recommended: true,
    features: [
      'Professional lawyer review',
      'Legal certification stamp',
      'Detailed legal opinion',
      'Court-ready document',
      'Lawyer signature & seal'
    ]
  },
  {
    id: 'AI_PLUS_CERTIFICATION',
    name: 'AI + Certification Combo',
    price: 2200,
    estimatedTime: 'Within 2 hours',
    features: [
      'AI analysis + Lawyer review',
      'Comprehensive report',
      'Legal certification',
      'Best value package',
      'Complete legal assurance'
    ]
  }
];

export const DocumentReviewRequestPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { documentId } = useParams<{ documentId: string }>();
  
  const [selectedTier, setSelectedTier] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [loading, setLoading] = useState(true);

  const documentFromState = location.state?.document;
  const documentTitle = documentFromState?.title || 'Your Document';

  useEffect(() => {
    if (documentFromState) {
      setLoading(false);
    } else if (documentId) {
      // Fetch document details if needed
      setLoading(false);
    } else {
      navigate('/documents');
    }
  }, [documentId, documentFromState]);

  const handleProceedToPayment = async () => {
    if (!selectedTier) {
      alert('Please select a service tier');
      return;
    }

    const tier = serviceTiers.find(t => t.id === selectedTier);
    if (!tier) return;

    const phoneNumber = prompt('Enter your M-Pesa phone number (format: 254XXXXXXXXX):');
    
    if (!phoneNumber) {
      alert('Phone number is required for M-Pesa payment');
      return;
    }

    // Validate phone number format
    if (!/^254\d{9}$/.test(phoneNumber)) {
      alert('Invalid phone number format. Use 254XXXXXXXXX');
      return;
    }

    setIsProcessing(true);

    try {
      // Step 1: Create document review record
      console.log('[DocumentReviewRequest] Creating document review:', {
        documentId: documentFromState?.id || documentId,
        reviewType: selectedTier
      });

      const createResponse = await axiosInstance.post('/document-review/create', {
        documentId: documentFromState?.id || documentId,
        reviewType: selectedTier,
        urgencyLevel: 'STANDARD' // All services are standard 2-hour delivery
      });

      if (!createResponse.data.success) {
        alert(createResponse.data.message || 'Failed to create document review');
        setIsProcessing(false);
        return;
      }

      const { reviewId, amount, isFreebie, savings } = createResponse.data.data;

      // Check if this is a freebie (first AI review)
      if (isFreebie) {
        setIsProcessing(false);
        alert(`🎉 First AI Review FREE! You saved KES ${savings.toLocaleString()}! Results ready in 2 hours.`);
        navigate('/documents');
        return;
      }

      console.log('[DocumentReviewRequest] Review created, initiating payment:', {
        reviewId,
        amount,
        phoneNumber
      });

      // Step 2: Initiate M-Pesa payment (only for non-freebies)
      const paymentResponse = await axiosInstance.post('/payments/mpesa/initiate', {
        phoneNumber,
        amount,
        reviewId,
        paymentType: 'DOCUMENT_REVIEW'
      });

      if (!paymentResponse.data.success) {
        alert(paymentResponse.data.message || 'Failed to initiate payment');
        setIsProcessing(false);
        return;
      }

      const { paymentId } = paymentResponse.data.data;

      console.log('[DocumentReviewRequest] Payment initiated, polling status:', { paymentId });

      // Step 3: Poll for payment status
      const pollInterval = setInterval(async () => {
        try {
          const statusResponse = await axiosInstance.get(`/payments/mpesa/status/${paymentId}`);
          const status = statusResponse.data.data.status;

          console.log('[DocumentReviewRequest] Payment status:', status);

          if (status === 'COMPLETED') {
            clearInterval(pollInterval);
            setIsProcessing(false);
            alert('Payment successful! Your document review is being processed.');
            navigate('/documents');
          } else if (status === 'FAILED') {
            clearInterval(pollInterval);
            setIsProcessing(false);
            alert('Payment failed. Please try again.');
          }
        } catch (error) {
          console.error('Error checking payment status:', error);
        }
      }, 3000);

      // Stop polling after 2 minutes
      setTimeout(() => {
        clearInterval(pollInterval);
        if (isProcessing) {
          setIsProcessing(false);
          alert('Payment verification timeout. Please check your documents page for status.');
          navigate('/documents');
        }
      }, 120000);

    } catch (error: any) {
      console.error('[DocumentReviewRequest] Error:', error);
      alert(error.response?.data?.message || 'An error occurred. Please try again.');
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading document...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/documents')}
            className="flex items-center text-slate-600 hover:text-slate-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Documents
          </button>
          <h1 className="text-3xl font-bold text-slate-900">Request Document Review</h1>
          <p className="text-slate-600 mt-2">
            Document: <span className="font-medium">{documentTitle}</span>
          </p>
        </div>

        {/* Service Tiers */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {serviceTiers.map((tier) => (
            <div
              key={tier.id}
              onClick={() => setSelectedTier(tier.id)}
              className={`bg-white rounded-lg border-2 p-6 cursor-pointer transition ${
                selectedTier === tier.id
                  ? 'border-blue-600 shadow-lg'
                  : 'border-slate-200 hover:border-blue-300'
              } ${tier.recommended ? 'ring-2 ring-blue-200' : ''}`}
            >
              {tier.recommended && (
                <div className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full inline-block mb-3">
                  RECOMMENDED
                </div>
              )}
              
              <h3 className="text-xl font-bold text-slate-900 mb-2">{tier.name}</h3>
              
              <div className="flex items-baseline mb-4">
                <span className="text-3xl font-bold text-blue-600">KES {tier.price.toLocaleString()}</span>
              </div>

              <div className="flex items-center text-slate-600 text-sm mb-4">
                <Clock className="w-4 h-4 mr-2" />
                {tier.estimatedTime}
              </div>

              <ul className="space-y-2">
                {tier.features.map((feature, index) => (
                  <li key={index} className="flex items-start text-sm text-slate-700">
                    <CheckCircle className="w-4 h-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              {selectedTier === tier.id && (
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <div className="flex items-center text-blue-600 font-medium">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Selected
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <FileText className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
            <div className="text-sm text-blue-900">
              <p className="font-medium mb-1">All services delivered within 2 hours</p>
              <p>Payment is processed via M-Pesa STK Push. You'll receive a prompt on your phone to complete the transaction.</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={() => navigate('/documents')}
            className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition"
            disabled={isProcessing}
          >
            Cancel
          </button>
          <button
            onClick={handleProceedToPayment}
            disabled={!selectedTier || isProcessing}
            className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Processing Payment...
              </>
            ) : (
              <>
                <DollarSign className="w-5 h-5 mr-2" />
                Proceed to M-Pesa Payment
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
