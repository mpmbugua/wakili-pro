import React, { useEffect, useState } from 'react';
import { Loader2, Smartphone, CheckCircle, XCircle } from 'lucide-react';
import axiosInstance from '../../lib/axios';

interface PaymentStatusPollerProps {
  paymentId: string;
  paymentMethod: 'MPESA' | 'FLUTTERWAVE';
  onSuccess: (payment: any) => void;
  onError: (error: string) => void;
}

export const PaymentStatusPoller: React.FC<PaymentStatusPollerProps> = ({
  paymentId,
  paymentMethod,
  onSuccess,
  onError
}) => {
  const [status, setStatus] = useState<'pending' | 'processing' | 'success' | 'failed'>('pending');
  const [attempts, setAttempts] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);

  console.log('[PaymentStatusPoller] Mounted with:', { paymentId, paymentMethod });

  useEffect(() => {
    const maxAttempts = 60; // 5 minutes (60 * 5 seconds)
    const pollInterval = 5000; // 5 seconds

    const checkPaymentStatus = async () => {
      try {
        console.log('[PaymentStatusPoller] Checking payment status, attempt:', attempts + 1);
        const response = await axiosInstance.get(`/document-payment/${paymentId}/status`);
        
        console.log('[PaymentStatusPoller] Status response:', response.data);
        
        if (response.data.success) {
          const payment = response.data.data || response.data;
          
          if (payment.status === 'PAID' || payment.status === 'COMPLETED') {
            console.log('[PaymentStatusPoller] Payment completed!');
            setStatus('success');
            onSuccess(payment);
            return true;
          } else if (payment.status === 'FAILED' || payment.status === 'CANCELLED') {
            console.log('[PaymentStatusPoller] Payment failed or cancelled');
            setStatus('failed');
            onError(payment.metadata?.failureReason || 'Payment failed');
            return true;
          }
        }
        return false;
      } catch (error: any) {
        console.error('[PaymentStatusPoller] Error checking payment status:', error);
        return false;
      }
    };

    // Start polling
    console.log('[PaymentStatusPoller] Starting payment status polling');
    setStatus('processing');
    const pollTimer = setInterval(async () => {
      setAttempts(prev => prev + 1);
      setTimeElapsed(prev => prev + 5);
      
      const completed = await checkPaymentStatus();
      
      if (completed || attempts >= maxAttempts) {
        clearInterval(pollTimer);
        
        if (!completed && attempts >= maxAttempts) {
          console.log('[PaymentStatusPoller] Polling timed out');
          setStatus('failed');
          onError('Payment verification timed out. Please check your payment history.');
        }
      }
    }, pollInterval);

    // Initial check
    checkPaymentStatus();

    return () => {
      console.log('[PaymentStatusPoller] Unmounting, clearing interval');
      clearInterval(pollTimer);
    };
  }, [paymentId, attempts, onSuccess, onError]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-8">
        {status === 'processing' && (
          <div className="text-center">
            <div className="mb-6">
              {paymentMethod === 'MPESA' ? (
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                  <Smartphone className="h-10 w-10 text-green-600" />
                </div>
              ) : (
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
                </div>
              )}
            </div>

            <h2 className="text-2xl font-bold text-slate-900 mb-3">
              {paymentMethod === 'MPESA' ? 'Check Your Phone' : 'Processing Payment'}
            </h2>
            
            <p className="text-slate-600 mb-6">
              {paymentMethod === 'MPESA' 
                ? 'Enter your M-Pesa PIN to complete the payment'
                : 'Please wait while we verify your payment...'}
            </p>

            <div className="bg-slate-50 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-center gap-2 text-sm text-slate-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Verifying payment... ({timeElapsed}s)</span>
              </div>
            </div>

            {paymentMethod === 'MPESA' && (
              <div className="text-xs text-slate-500">
                <p>If you don't see the M-Pesa prompt:</p>
                <ul className="mt-2 space-y-1 text-left ml-8">
                  <li>• Check your phone for notifications</li>
                  <li>• Ensure you have sufficient M-Pesa balance</li>
                  <li>• The request expires after 60 seconds</li>
                </ul>
              </div>
            )}
          </div>
        )}

        {status === 'success' && (
          <div className="text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">
              Payment Successful!
            </h2>
            <p className="text-slate-600">
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
            <p className="text-slate-600">
              {paymentMethod === 'MPESA' 
                ? 'Payment was cancelled or failed. Please try again.'
                : 'Payment verification failed. Please contact support if amount was deducted.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
