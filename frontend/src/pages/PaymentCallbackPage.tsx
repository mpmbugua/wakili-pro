import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import axiosInstance from '../lib/axios';

export const PaymentCallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'verifying' | 'success' | 'failed'>('verifying');
  const [message, setMessage] = useState('Verifying your payment...');
  const [paymentDetails, setPaymentDetails] = useState<any>(null);

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        // Get transaction details from URL params
        const transactionId = searchParams.get('transaction_id');
        const txRef = searchParams.get('tx_ref');
        const statusParam = searchParams.get('status');

        console.log('Payment callback params:', { transactionId, txRef, statusParam });

        if (!transactionId && !txRef) {
          setStatus('failed');
          setMessage('Missing transaction information');
          return;
        }

        // Extract payment ID from tx_ref (format: payment_<paymentId>_<timestamp>)
        let paymentId = txRef;
        if (txRef?.startsWith('payment_')) {
          const parts = txRef.split('_');
          paymentId = parts[1]; // Extract the middle part
        }

        if (!paymentId) {
          setStatus('failed');
          setMessage('Invalid payment reference');
          return;
        }

        // Verify payment status via backend
        const response = await axiosInstance.get(`/document-payment/${paymentId}/status`);

        if (response.data.success) {
          const payment = response.data.data;
          setPaymentDetails(payment);

          if (payment.status === 'COMPLETED') {
            setStatus('success');
            setMessage('Payment completed successfully!');
            
            // Redirect to dashboard after 3 seconds
            setTimeout(() => {
              navigate('/dashboard');
            }, 3000);
          } else if (payment.status === 'PENDING') {
            // Payment is still pending, keep checking
            setMessage('Payment is being processed...');
            setTimeout(() => verifyPayment(), 3000);
          } else {
            setStatus('failed');
            setMessage(payment.metadata?.failureReason || 'Payment verification failed');
          }
        } else {
          setStatus('failed');
          setMessage(response.data.message || 'Failed to verify payment');
        }
      } catch (error: any) {
        console.error('Error verifying payment:', error);
        setStatus('failed');
        setMessage(error.response?.data?.message || 'An error occurred while verifying payment');
      }
    };

    verifyPayment();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
        {status === 'verifying' && (
          <div className="text-center">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">
              Verifying Payment
            </h2>
            <p className="text-slate-600 mb-6">{message}</p>
            <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-scale-in">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">
              Payment Successful!
            </h2>
            <p className="text-slate-600 mb-6">{message}</p>

            {paymentDetails && (
              <div className="bg-slate-50 rounded-lg p-4 mb-6 text-left">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Amount:</span>
                    <span className="font-semibold text-slate-900">
                      KES {paymentDetails.amount.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Payment Method:</span>
                    <span className="font-semibold text-slate-900">
                      {paymentDetails.paymentMethod.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Transaction ID:</span>
                    <span className="font-mono text-xs text-slate-900">
                      {paymentDetails.transactionId}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <p className="text-sm text-slate-500">
              Redirecting to your dashboard...
            </p>
          </div>
        )}

        {status === 'failed' && (
          <div className="text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="h-10 w-10 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">
              Payment Failed
            </h2>
            <p className="text-slate-600 mb-6">{message}</p>

            <div className="space-y-3">
              <button
                onClick={() => navigate('/documents')}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
              >
                Back to Documents
              </button>
              <button
                onClick={() => navigate('/help')}
                className="w-full px-6 py-3 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition font-medium"
              >
                Contact Support
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentCallbackPage;
