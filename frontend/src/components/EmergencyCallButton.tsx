import React, { useState } from 'react';
import { Phone, X, Video } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export const EmergencyCallButton: React.FC = () => {
  const { user, isAuthenticated } = useAuthStore();
  const [isExpanded, setIsExpanded] = useState(false);

  // Hide button for lawyers and admins
  if (isAuthenticated && (user?.role === 'LAWYER' || user?.role === 'ADMIN')) {
    return null;
  }

  const emergencyNumbers = [
    { number: '0727114573', label: 'Safaricom' },
    { number: '0787679378', label: 'Airtel' },
  ];

  const handleCall = (number: string) => {
    window.location.href = `tel:+254${number.slice(1)}`;
  };

  const handleVoipCall = () => {
    // Open VOIP call in new window - can integrate with WebRTC or third-party VOIP service
    window.open('/voip-call', 'VOIPCall', 'width=400,height=600');
  };

  return (
    <>
      {/* Floating Button */}
      <div className="fixed top-20 left-4 sm:left-6 z-50">
        {!isExpanded ? (
          <button
            onClick={() => setIsExpanded(true)}
            className="group relative bg-gradient-to-r from-red-600 to-red-700 text-white rounded-full p-4 shadow-2xl hover:shadow-red-500/50 transition-all duration-300 hover:scale-110 animate-pulse"
            aria-label="Emergency Legal Help"
          >
            <Phone className="h-6 w-6" />
            <span className="absolute -top-1 left-12 bg-yellow-400 text-red-900 text-[10px] font-bold px-2 py-0.5 rounded-full animate-bounce whitespace-nowrap leading-tight">
              Talk to a Lawyer now
            </span>
          </button>
        ) : (
          <div className="bg-white rounded-2xl shadow-2xl border-2 border-red-600 p-6 w-80 max-w-[calc(100vw-2rem)] animate-in slide-in-from-left-5">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="bg-red-100 p-2 rounded-full">
                  <Phone className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Need Urgent Legal Help?</h3>
                  <p className="text-xs text-gray-500">Available 24/7</p>
                </div>
              </div>
              <button
                onClick={() => setIsExpanded(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Emergency Numbers */}
            <div className="space-y-3">
              {emergencyNumbers.map((contact) => (
                <button
                  key={contact.number}
                  onClick={() => handleCall(contact.number)}
                  className="w-full bg-gradient-to-r from-red-50 to-red-100 hover:from-red-100 hover:to-red-200 border border-red-300 rounded-lg p-4 transition-all duration-200 hover:shadow-md group"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-left">
                      <p className="text-sm text-red-700 font-medium">{contact.label}</p>
                      <p className="text-lg font-bold text-red-900 group-hover:underline">
                        {contact.number}
                      </p>
                    </div>
                    <Phone className="h-5 w-5 text-red-600 group-hover:animate-pulse" />
                  </div>
                </button>
              ))}
              
              {/* VOIP Call Option */}
              <button
                onClick={handleVoipCall}
                className="w-full bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 border border-blue-300 rounded-lg p-4 transition-all duration-200 hover:shadow-md group"
              >
                <div className="flex items-center justify-between">
                  <div className="text-left">
                    <p className="text-sm text-blue-700 font-medium">Internet Call (VOIP)</p>
                    <p className="text-xs text-blue-600">Call via web browser</p>
                  </div>
                  <Video className="h-5 w-5 text-blue-600 group-hover:animate-pulse" />
                </div>
              </button>
            </div>

            {/* Info Text */}
            <p className="text-xs text-gray-600 mt-4 text-center">
              Our legal team will assist you immediately and create a special booking for your case
            </p>
          </div>
        )}
      </div>
    </>
  );
};
