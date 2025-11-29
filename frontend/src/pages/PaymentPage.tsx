import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { GlobalLayout } from '../components/layout';
import { CreditCard, CheckCircle, AlertCircle, ArrowLeft, Lock, Smartphone } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import axiosInstance from '../lib/axios';

interface BookingDetails {
  id: string;
  lawyerName: string;
  lawyerSpecialty: string;
  date: string;
  time: string;
  consultationType: string;
  fee: number;
}

interface DocumentPaymentDetails {
  reviewId: string;
  documentId?: string; // UUID of the uploaded document
  documentType: string;
  serviceType: 'ai-review' | 'certification' | 'marketplace-purchase';
  price: number;
  fileName: string;
  templateId?: string;
}

interface ServiceRequestPayment {
  serviceType: string;
  price: number;
  description: string;
  serviceDetails?: any;
}

type PaymentMethod = 'card' | 'mpesa';

export const PaymentPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { bookingId, reviewId } = useParams<{ bookingId?: string; reviewId?: string }>();
  const { isAuthenticated, user } = useAuthStore();
  
  const bookingDetails = location.state as (BookingDetails | DocumentPaymentDetails | ServiceRequestPayment) | null;
  const isDocumentPayment = (bookingDetails && 'reviewId' in bookingDetails) || !!reviewId;
  const isServiceRequest = bookingDetails && 'serviceType' in bookingDetails && bookingDetails.serviceType === 'service-request-commitment';
  
  // Safe price getter
  const getPrice = () => {
    if (!bookingDetails) return 0;
    if ('price' in bookingDetails) return bookingDetails.price;
    if ('fee' in bookingDetails) return bookingDetails.fee;
    return 0;
  };

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mpesa'); // Default to M-Pesa
  const [loading, setLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: '',
  });

  const [mpesaDetails, setMpesaDetails] = useState({
    phoneNumber: '',
  });

  useEffect(() => {
    console.log('PaymentPage mounted');
    console.log('isAuthenticated:', isAuthenticated);
    console.log('bookingId:', bookingId);
    console.log('reviewId:', reviewId);
    console.log('bookingDetails:', bookingDetails);
    
    if (!isAuthenticated) {
      console.log('Not authenticated, redirecting to login');
      navigate('/login');
      return;
    }
    
    // Only redirect if we have neither bookingDetails, bookingId, nor reviewId
    if (!bookingDetails && !bookingId && !reviewId) {
      console.log('No booking details, booking ID, or review ID, redirecting to lawyers');
      navigate('/lawyers');
    }
  }, [isAuthenticated, bookingDetails, bookingId, reviewId, navigate]);

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];

    for (let i = 0; i < match.length; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };

  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return `${v.substring(0, 2)}/${v.substring(2, 4)}`;
    }
    return v;
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    if (formatted.replace(/\s/g, '').length <= 16) {
      setCardDetails({ ...cardDetails, cardNumber: formatted });
    }
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatExpiryDate(e.target.value);
    if (formatted.length <= 5) {
      setCardDetails({ ...cardDetails, expiryDate: formatted });
    }
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    if (value.length <= 4) {
      setCardDetails({ ...cardDetails, cvv: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (paymentMethod === 'mpesa') {
        // M-Pesa Daraja API payment flow - use document-payment endpoint for consistency
        
        if (isDocumentPayment) {
          // For document payments, use the document-payment/initiate endpoint
          const documentDetails = bookingDetails as DocumentPaymentDetails;
          
          // Convert frontend service type to backend format
          const backendServiceType = documentDetails.serviceType === 'ai-review' 
            ? 'ai_review' 
            : documentDetails.serviceType === 'certification'
            ? 'certification'
            : 'ai_and_certification';
          
          const paymentData = {
            documentId: (documentDetails as any).documentId || reviewId || '', // documentId from navigation state
            serviceType: backendServiceType,
            urgencyLevel: 'standard', // Default to standard
            paymentMethod: 'mpesa',
            phoneNumber: mpesaDetails.phoneNumber,
          };

          console.log('[PaymentPage] Initiating M-Pesa payment for document:', paymentData);
          const mpesaResponse = await axiosInstance.post('/document-payment/initiate', paymentData);

          console.log('[PaymentPage] M-Pesa response:', mpesaResponse.data);
          
          if (!mpesaResponse.data.success) {
            throw new Error(mpesaResponse.data.message || 'Failed to initiate M-Pesa payment');
          }

          const { paymentId, customerMessage } = mpesaResponse.data.data;

          // Show M-Pesa prompt message
          setError(null);
          alert(customerMessage || `Please check your phone (${mpesaDetails.phoneNumber}) and enter your M-Pesa PIN to complete the payment.`);

          // Poll for payment status every 3 seconds (max 60 seconds)
          let attempts = 0;
          const maxAttempts = 20;
          const pollInterval = 3000;

          const checkStatus = async (): Promise<boolean> => {
            try {
              const statusResponse = await axiosInstance.get(`/document-payment/${paymentId}/status`);
              
              if (statusResponse.data.success) {
                const { status } = statusResponse.data.data;
              
              if (status === 'COMPLETED') {
                setPaymentSuccess(true);
                setTimeout(() => {
                  navigate('/dashboard');
                }, 3000);
                return true;
              } else if (status === 'FAILED') {
                throw new Error('Payment failed or was cancelled');
              }
            }
            return false;
          } catch (err) {
            console.error('Status check error:', err);
            return false;
          }
        };

        // Start polling
        const pollPaymentStatus = setInterval(async () => {
          attempts++;
          const completed = await checkStatus();
          
          if (completed || attempts >= maxAttempts) {
            clearInterval(pollPaymentStatus);
            setLoading(false);
            
            if (!completed && attempts >= maxAttempts) {
              setError('Payment verification timed out. Please check your payment history or contact support.');
            }
          }
        }, pollInterval);

      } else {
        // Card payment flow (Flutterwave)
        const paymentIntentData = isDocumentPayment
          ? {
              reviewId: reviewId || (bookingDetails as DocumentPaymentDetails).reviewId,
              amount: (bookingDetails as DocumentPaymentDetails).price,
              paymentMethod: 'FLUTTERWAVE_CARD',
              provider: 'FLUTTERWAVE',
              paymentType: 'DOCUMENT_REVIEW',
              cardDetails: {
                number: cardDetails.cardNumber.replace(/\s/g, ''),
                name: cardDetails.cardName,
                expiry: cardDetails.expiryDate,
                cvv: cardDetails.cvv,
              }
            }
          : {
              bookingId: bookingId || (bookingDetails as BookingDetails).id,
              amount: (bookingDetails as BookingDetails).fee || 5000,
              paymentMethod: 'FLUTTERWAVE_CARD',
              provider: 'FLUTTERWAVE',
              cardDetails: {
                number: cardDetails.cardNumber.replace(/\s/g, ''),
                name: cardDetails.cardName,
                expiry: cardDetails.expiryDate,
                cvv: cardDetails.cvv,
              }
            };

        const paymentIntent = await axiosInstance.post('/payments/intent', paymentIntentData);

        if (!paymentIntent.data.success) {
          throw new Error(paymentIntent.data.message || 'Failed to create payment intent');
        }

        // Simulate card payment processing
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Verify payment
        const verification = await axiosInstance.post('/payments/verify', {
          transactionId: paymentIntent.data.data.paymentId,
          paymentMethod: 'FLUTTERWAVE_CARD',
        });

        if (verification.data.success) {
          setPaymentSuccess(true);
          setTimeout(() => {
            navigate('/dashboard');
          }, 3000);
        } else {
          throw new Error('Payment verification failed');
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!bookingDetails && !bookingId) {
    return null;
  }

  if (paymentSuccess) {
    return (
      <div className="min-h-screen bg-gradient-secondary flex items-center justify-center">
        <div className="max-w-md mx-auto text-center p-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Payment Successful!</h2>
          <p className="text-slate-600 mb-6">
            {isDocumentPayment
              ? (bookingDetails as DocumentPaymentDetails).serviceType === 'marketplace-purchase'
                ? 'Your legal document template is ready for download!'
                : 'Your document review payment is confirmed. Processing will begin shortly.'
              : 'Your consultation has been confirmed. You\'ll receive a confirmation email with the meeting link.'}
          </p>
          <div className="bg-white rounded-lg p-6 mb-6 text-left">
            <h3 className="font-semibold text-slate-900 mb-4">
              {isDocumentPayment ? 'Payment Details' : 'Booking Details'}
            </h3>
            <div className="space-y-2 text-sm">
              {isDocumentPayment ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Service:</span>
                    <span className="font-medium">
                      {(bookingDetails as DocumentPaymentDetails).serviceType === 'marketplace-purchase' 
                        ? 'Legal Document Purchase'
                        : (bookingDetails as DocumentPaymentDetails).serviceType === 'ai-review' 
                        ? 'AI Document Review' 
                        : 'Lawyer Certification'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Document:</span>
                    <span className="font-medium">{(bookingDetails as DocumentPaymentDetails).fileName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Type:</span>
                    <span className="font-medium">{(bookingDetails as DocumentPaymentDetails).documentType}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2 mt-2">
                    <span className="text-slate-600">Amount Paid:</span>
                    <span className="font-bold text-green-600">KES {getPrice().toLocaleString()}</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Lawyer:</span>
                    <span className="font-medium">{(bookingDetails as BookingDetails).lawyerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Date:</span>
                    <span className="font-medium">{(bookingDetails as BookingDetails).date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Time:</span>
                    <span className="font-medium">{(bookingDetails as BookingDetails).time}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2 mt-2">
                    <span className="text-slate-600">Amount Paid:</span>
                    <span className="font-bold text-green-600">KES {getPrice().toLocaleString()}</span>
                  </div>
                </>
              )}
            </div>
          </div>
          <button onClick={() => navigate('/dashboard')} className="btn-primary w-full">
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <GlobalLayout>
      <div className="max-w-4xl mx-auto py-12 px-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-slate-600 hover:text-primary mb-8 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back
        </button>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Booking/Document Summary */}
          <div>
            <h2 className="text-2xl font-display font-bold text-slate-900 mb-6">
              {isServiceRequest ? 'Payment Summary' : isDocumentPayment ? 'Service Summary' : 'Booking Summary'}
            </h2>
            <div className="card p-6 space-y-4">
              {isServiceRequest ? (
                <>
                  <div>
                    <p className="text-sm text-slate-600">Service Type</p>
                    <p className="font-semibold text-slate-900">Service Request Commitment Fee</p>
                    <p className="text-sm text-blue-600">Lawyer Matching Service</p>
                  </div>
                  <div className="border-t pt-4">
                    <p className="text-sm text-slate-600">Description</p>
                    <p className="font-semibold text-slate-900">
                      {(bookingDetails as ServiceRequestPayment).description || 'Service Request Commitment Fee'}
                    </p>
                  </div>
                  {(bookingDetails as ServiceRequestPayment).serviceDetails && (
                    <>
                      <div className="border-t pt-4">
                        <p className="text-sm text-slate-600">Category</p>
                        <p className="font-semibold text-slate-900">
                          {(bookingDetails as ServiceRequestPayment).serviceDetails.category || 'Legal Service'}
                        </p>
                      </div>
                      {(bookingDetails as ServiceRequestPayment).serviceDetails.estimatedFee && (
                        <div className="border-t pt-4">
                          <p className="text-sm text-slate-600">Estimated Service Fee</p>
                          <p className="font-semibold text-slate-900">
                            KES {(bookingDetails as ServiceRequestPayment).serviceDetails.estimatedFee.toLocaleString()}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            You'll pay this separately to your chosen lawyer
                          </p>
                        </div>
                      )}
                    </>
                  )}
                  <div className="border-t pt-4">
                    <p className="text-sm text-slate-600">What happens next?</p>
                    <ul className="text-sm text-slate-700 mt-2 space-y-1">
                      <li>• We match you with 3-5 qualified lawyers</li>
                      <li>• Receive detailed quotes from each lawyer</li>
                      <li>• Choose your preferred lawyer</li>
                    </ul>
                  </div>
                  <div className="border-t pt-4 bg-blue-50 -mx-6 -mb-6 px-6 py-4 rounded-b-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-900 font-semibold">Commitment Fee</span>
                      <span className="text-2xl font-bold text-blue-600">KES {getPrice().toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-slate-600 mt-2">Non-refundable • Ensures serious requests</p>
                  </div>
                </>
              ) : isDocumentPayment ? (
                <>
                  <div>
                    <p className="text-sm text-slate-600">Service Type</p>
                    <p className="font-semibold text-slate-900">
                      {(bookingDetails as DocumentPaymentDetails).serviceType === 'marketplace-purchase' 
                        ? 'Legal Document Template' 
                        : (bookingDetails as DocumentPaymentDetails).serviceType === 'ai-review' 
                        ? 'AI Document Review' 
                        : 'Lawyer Certification'}
                    </p>
                    <p className="text-sm text-blue-600">
                      {(bookingDetails as DocumentPaymentDetails).serviceType === 'marketplace-purchase'
                        ? 'Instant Download'
                        : (bookingDetails as DocumentPaymentDetails).serviceType === 'ai-review' 
                        ? 'Automated Analysis' 
                        : 'Professional Certification'}
                    </p>
                  </div>
                  <div className="border-t pt-4">
                    <p className="text-sm text-slate-600">Document</p>
                    <p className="font-semibold text-slate-900">{(bookingDetails as DocumentPaymentDetails).fileName}</p>
                  </div>
                  <div className="border-t pt-4">
                    <p className="text-sm text-slate-600">Document Type</p>
                    <p className="font-semibold text-slate-900">{(bookingDetails as DocumentPaymentDetails).documentType}</p>
                  </div>
                  <div className="border-t pt-4">
                    <p className="text-sm text-slate-600">
                      {(bookingDetails as DocumentPaymentDetails).serviceType === 'marketplace-purchase' 
                        ? 'Availability' 
                        : 'Processing Time'}
                    </p>
                    <p className="font-semibold text-slate-900">
                      {(bookingDetails as DocumentPaymentDetails).serviceType === 'marketplace-purchase'
                        ? 'Instant download after payment'
                        : (bookingDetails as DocumentPaymentDetails).serviceType === 'ai-review' 
                        ? '5-10 minutes' 
                        : 'Within 24 hours'}
                    </p>
                  </div>
                  <div className="border-t pt-4 bg-blue-50 -mx-6 -mb-6 px-6 py-4 rounded-b-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-900 font-semibold">Total Amount</span>
                      <span className="text-2xl font-bold text-blue-600">KES {getPrice().toLocaleString()}</span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <p className="text-sm text-slate-600">Lawyer</p>
                    <p className="font-semibold text-slate-900">{(bookingDetails as BookingDetails).lawyerName}</p>
                    <p className="text-sm text-blue-600">{(bookingDetails as BookingDetails).lawyerSpecialty}</p>
                  </div>
                  <div className="border-t pt-4">
                    <p className="text-sm text-slate-600">Consultation Type</p>
                    <p className="font-semibold text-slate-900 capitalize">{(bookingDetails as BookingDetails).consultationType}</p>
                  </div>
                  <div className="border-t pt-4">
                    <p className="text-sm text-slate-600">Date & Time</p>
                    <p className="font-semibold text-slate-900">{(bookingDetails as BookingDetails).date}</p>
                    <p className="text-slate-700">{(bookingDetails as BookingDetails).time}</p>
                  </div>
                  <div className="border-t pt-4">
                    <p className="text-sm text-slate-600">Duration</p>
                    <p className="font-semibold text-slate-900">60 minutes</p>
                  </div>
                  <div className="border-t pt-4 bg-blue-50 -mx-6 -mb-6 px-6 py-4 rounded-b-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-900 font-semibold">Total Amount</span>
                      <span className="text-2xl font-bold text-blue-600">KES {getPrice().toLocaleString()}</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Payment Form */}
          <div>
            <h2 className="text-2xl font-display font-bold text-slate-900 mb-6">Payment Details</h2>
            
            {/* M-Pesa Info Banner */}
            <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 mb-6 flex items-start">
              <Smartphone className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-green-800">
                <p className="font-medium mb-1">Quick & Easy Payment with M-Pesa</p>
                <p className="text-green-700">
                  {isDocumentPayment 
                    ? (bookingDetails as DocumentPaymentDetails).serviceType === 'marketplace-purchase'
                      ? 'Pay for your legal document template instantly with M-Pesa. Download available immediately after payment confirmation.'
                      : 'Pay for your document review instantly with M-Pesa. Processing begins immediately after payment confirmation.'
                    : 'Pay instantly using your M-Pesa mobile money. You\'ll receive an STK push notification to complete payment.'
                  }
                </p>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-start">
                <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="card p-6 space-y-6">
              {/* Payment Method Selector */}
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-3">
                  Select Payment Method
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`p-4 border-2 rounded-lg transition-all ${
                      paymentMethod === 'card'
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <CreditCard className={`h-8 w-8 mx-auto mb-2 ${
                      paymentMethod === 'card' ? 'text-blue-600' : 'text-gray-400'
                    }`} />
                    <p className={`text-sm font-medium ${
                      paymentMethod === 'card' ? 'text-blue-600' : 'text-gray-600'
                    }`}>
                      Card Payment
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Visa, Mastercard</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('mpesa')}
                    className={`p-4 border-2 rounded-lg transition-all ${
                      paymentMethod === 'mpesa'
                        ? 'border-green-600 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Smartphone className={`h-8 w-8 mx-auto mb-2 ${
                      paymentMethod === 'mpesa' ? 'text-green-600' : 'text-gray-400'
                    }`} />
                    <p className={`text-sm font-medium ${
                      paymentMethod === 'mpesa' ? 'text-green-600' : 'text-gray-600'
                    }`}>
                      M-Pesa
                    </p>
                    <p className="text-xs text-gray-500 mt-1">STK Push</p>
                  </button>
                </div>
              </div>

              {/* Security Badge */}
              <div className="flex items-center justify-between py-2 border-y">
                <div className="flex items-center text-slate-600">
                  <Lock className="h-4 w-4 mr-2" />
                  <span className="text-sm">Secure Payment</span>
                </div>
                {paymentMethod === 'card' && (
                  <div className="flex space-x-2">
                    <img src="https://img.icons8.com/color/48/000000/visa.png" alt="Visa" className="h-6" />
                    <img src="https://img.icons8.com/color/48/000000/mastercard.png" alt="Mastercard" className="h-6" />
                  </div>
                )}
                {paymentMethod === 'mpesa' && (
                  <div className="flex items-center">
                    <span className="text-xs font-semibold text-green-600">SAFARICOM M-PESA</span>
                  </div>
                )}
              </div>

              {/* Card Payment Form */}
              {paymentMethod === 'card' && (
                <>
                  {/* Card Number */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">
                      Card Number
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        placeholder="1234 5678 9012 3456"
                        value={cardDetails.cardNumber}
                        onChange={handleCardNumberChange}
                        className="input-field pl-10"
                      />
                      <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                    </div>
                  </div>

                  {/* Cardholder Name */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">
                      Cardholder Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="John Doe"
                      value={cardDetails.cardName}
                      onChange={(e) => setCardDetails({ ...cardDetails, cardName: e.target.value })}
                      className="input-field"
                    />
                  </div>

                  {/* Expiry and CVV */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-900 mb-2">
                        Expiry Date
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="MM/YY"
                        value={cardDetails.expiryDate}
                        onChange={handleExpiryChange}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-900 mb-2">
                        CVV
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="123"
                        value={cardDetails.cvv}
                        onChange={handleCvvChange}
                        className="input-field"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* M-Pesa Payment Form */}
              {paymentMethod === 'mpesa' && (
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    M-Pesa Phone Number
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      required
                      placeholder="0712345678"
                      value={mpesaDetails.phoneNumber}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, '');
                        if (value.length <= 10) {
                          setMpesaDetails({ phoneNumber: value });
                        }
                      }}
                      className="input-field pl-10"
                    />
                    <Smartphone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-green-600" />
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    You'll receive an STK push on your phone to complete the payment
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-semibold transition ${
                  paymentMethod === 'mpesa'
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white inline-block mr-2"></div>
                    {paymentMethod === 'mpesa' ? 'Initiating M-Pesa...' : 'Processing Payment...'}
                  </>
                ) : (
                  <>
                    {paymentMethod === 'mpesa' ? (
                      <>
                        <Smartphone className="inline h-5 w-5 mr-2" />
                        Pay KES {getPrice().toLocaleString()} via M-Pesa
                      </>
                    ) : (
                      <>
                        <Lock className="inline h-5 w-5 mr-2" />
                        Pay KES {getPrice().toLocaleString()}
                      </>
                    )}
                  </>
                )}
              </button>

              <p className="text-xs text-slate-500 text-center mt-4">
                {paymentMethod === 'mpesa' ? (
                  <>Your M-Pesa payment is secure. You'll receive an STK push notification on your phone.</>
                ) : (
                  <>Your payment information is secure and encrypted. Powered by Flutterwave.</>
                )}
              </p>
            </form>
          </div>
        </div>
      </div>
    </GlobalLayout>
  );
};
