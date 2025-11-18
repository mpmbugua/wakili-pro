import React, { useState } from 'react';
import { EmergencyFeeBreakdown } from '../payments/EmergencyFeeBreakdown';
import { PaymentProcessor } from '../payments/PaymentProcessor';
import { analyticsService } from '../../services/analyticsService';

interface EmergencyConnectFlowProps {
  lawyerId: string;
  lawyerName: string;
  lawyerFee: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export const EmergencyConnectFlow: React.FC<EmergencyConnectFlowProps> = ({
  lawyerId,
  lawyerName,
  lawyerFee,
  onSuccess,
  onCancel
}) => {
  const [step, setStep] = useState<'breakdown' | 'payment' | 'success'>('breakdown');
  const [isEmergency] = useState(true); // Always true for this flow

  // Called after user confirms fee breakdown
  const handleProceedToPayment = () => {
    analyticsService.logEvent({ type: 'emergency_connect_payment_initiated', details: { lawyerId, lawyerName, lawyerFee } });
    setStep('payment');
  };

  // Called after successful payment
  const handlePaymentSuccess = () => {
    analyticsService.logEvent({ type: 'emergency_connect_payment_success', details: { lawyerId, lawyerName, lawyerFee } });
    setStep('success');
    onSuccess();
  };

  // Called if user cancels at any step
  const handleCancel = () => {
    onCancel();
  };

  return (
    <div className="max-w-lg mx-auto bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-4">Emergency Connect with {lawyerName}</h2>
      {step === 'breakdown' && (
        <EmergencyFeeBreakdown
          lawyerFee={lawyerFee}
          onProceed={handleProceedToPayment}
        />
      )}
      {step === 'payment' && (
        <PaymentProcessor
          bookingId={lawyerId} // Replace with actual bookingId after booking creation
          amount={lawyerFee}   // PaymentProcessor will use the total (fee + surcharge)
          serviceTitle={`Emergency Connect with ${lawyerName}`}
          onSuccess={handlePaymentSuccess}
          onCancel={handleCancel}
          isEmergency={isEmergency}
        />
      )}
      {step === 'success' && (
        <div className="text-green-700 font-semibold text-center">
          Payment successful! You are now being connected to {lawyerName}.
        </div>
      )}
      <button
        className="mt-6 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
        onClick={handleCancel}
      >
        Cancel
      </button>
    </div>
  );
};
