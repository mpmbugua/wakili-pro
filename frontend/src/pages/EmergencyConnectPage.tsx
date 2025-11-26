import React from 'react';
import { EmergencyConnectFlow } from '@/components/ai/EmergencyConnectFlow';

// Example: This page would be routed to when a user clicks the emergency connect button
// In a real app, pass the actual lawyerId, lawyerName, and lawyerFee from selection/context
const EmergencyConnectPage: React.FC = () => {
  // These would come from the selected lawyer/profile
  const lawyerId = 'lawyer-123';
  const lawyerName = 'Jane Doe';
  const lawyerFee = 2000;

  const handleSuccess = () => {
    // Redirect to chat/consultation or show success message
    navigate('/chat');
  };

  const handleCancel = () => {
    // Go back to previous page or show a message
    window.history.back();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50 flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg bg-white rounded-lg shadow-lg p-6 mb-6">
        <h1 className="text-2xl font-bold text-red-700 mb-2 text-center">Emergency Lawyer Connect</h1>
        <p className="text-gray-700 text-center mb-4">
          Instantly connect to a qualified lawyer for urgent legal help. You will be charged an emergency fee in addition to the lawyer&apos;s standard rate. Please proceed only if you require immediate assistance.
        </p>
        <button
          className="mb-6 text-blue-600 hover:underline text-sm"
          onClick={() => window.history.back()}
        >
          &larr; Back
        </button>
        <EmergencyConnectFlow
          lawyerId={lawyerId}
          lawyerName={lawyerName}
          lawyerFee={lawyerFee}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
};

export default EmergencyConnectPage;
