import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { GlobalLayout } from '../components/layout';
import { CreditCard, CheckCircle, AlertCircle, ArrowLeft, Lock } from 'lucide-react';
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

export const PaymentPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { bookingId } = useParams<{ bookingId: string }>();
  const { isAuthenticated } = useAuthStore();
  
  const bookingDetails = location.state as BookingDetails | null;

  const [loading, setLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: '',
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
    if (!bookingDetails && !bookingId) {
      navigate('/lawyers');
    }
  }, [isAuthenticated, bookingDetails, bookingId, navigate]);

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
      // Create payment intent
      const paymentIntent = await axiosInstance.post('/api/payments/create-intent', {
        bookingId: bookingId || bookingDetails?.id,
        amount: bookingDetails?.fee || 5000,
        paymentMethod: 'STRIPE_CARD',
        provider: 'STRIPE',
      });

      if (!paymentIntent.data.success) {
        throw new Error(paymentIntent.data.message || 'Failed to create payment intent');
      }

      // Simulate card payment processing
      // In production, this would integrate with Stripe Elements
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Verify payment
      const verification = await axiosInstance.post('/api/payments/verify', {
        transactionId: paymentIntent.data.data.paymentId,
        paymentMethod: 'STRIPE_CARD',
      });

      if (verification.data.success) {
        setPaymentSuccess(true);
        setTimeout(() => {
          navigate('/dashboard');
        }, 3000);
      } else {
        throw new Error('Payment verification failed');
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
            Your consultation has been confirmed. You'll receive a confirmation email with the meeting link.
          </p>
          <div className="bg-white rounded-lg p-6 mb-6 text-left">
            <h3 className="font-semibold text-slate-900 mb-4">Booking Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Lawyer:</span>
                <span className="font-medium">{bookingDetails?.lawyerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Date:</span>
                <span className="font-medium">{bookingDetails?.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Time:</span>
                <span className="font-medium">{bookingDetails?.time}</span>
              </div>
              <div className="flex justify-between border-t pt-2 mt-2">
                <span className="text-slate-600">Amount Paid:</span>
                <span className="font-bold text-green-600">KES {bookingDetails?.fee.toLocaleString()}</span>
              </div>
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
          {/* Booking Summary */}
          <div>
            <h2 className="text-2xl font-display font-bold text-slate-900 mb-6">Booking Summary</h2>
            <div className="card p-6 space-y-4">
              <div>
                <p className="text-sm text-slate-600">Lawyer</p>
                <p className="font-semibold text-slate-900">{bookingDetails?.lawyerName}</p>
                <p className="text-sm text-blue-600">{bookingDetails?.lawyerSpecialty}</p>
              </div>
              <div className="border-t pt-4">
                <p className="text-sm text-slate-600">Consultation Type</p>
                <p className="font-semibold text-slate-900 capitalize">{bookingDetails?.consultationType}</p>
              </div>
              <div className="border-t pt-4">
                <p className="text-sm text-slate-600">Date & Time</p>
                <p className="font-semibold text-slate-900">{bookingDetails?.date}</p>
                <p className="text-slate-700">{bookingDetails?.time}</p>
              </div>
              <div className="border-t pt-4">
                <p className="text-sm text-slate-600">Duration</p>
                <p className="font-semibold text-slate-900">60 minutes</p>
              </div>
              <div className="border-t pt-4 bg-blue-50 -mx-6 -mb-6 px-6 py-4 rounded-b-lg">
                <div className="flex justify-between items-center">
                  <span className="text-slate-900 font-semibold">Total Amount</span>
                  <span className="text-2xl font-bold text-blue-600">KES {bookingDetails?.fee.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Form */}
          <div>
            <h2 className="text-2xl font-display font-bold text-slate-900 mb-6">Payment Details</h2>
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-start">
                <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="card p-6 space-y-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center text-slate-600">
                  <Lock className="h-4 w-4 mr-2" />
                  <span className="text-sm">Secure Payment</span>
                </div>
                <div className="flex space-x-2">
                  <img src="https://img.icons8.com/color/48/000000/visa.png" alt="Visa" className="h-6" />
                  <img src="https://img.icons8.com/color/48/000000/mastercard.png" alt="Mastercard" className="h-6" />
                </div>
              </div>

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

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white inline-block mr-2"></div>
                    Processing Payment...
                  </>
                ) : (
                  <>
                    <Lock className="inline h-5 w-5 mr-2" />
                    Pay KES {bookingDetails?.fee.toLocaleString()}
                  </>
                )}
              </button>

              <p className="text-xs text-slate-500 text-center mt-4">
                Your payment information is secure and encrypted. We use industry-standard security measures to protect your data.
              </p>
            </form>
          </div>
        </div>
      </div>
    </GlobalLayout>
  );
};
