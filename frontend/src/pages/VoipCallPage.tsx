import React, { useState, useEffect, useRef } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';

export const VoipCallPage: React.FC = () => {
  const [isConnecting, setIsConnecting] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [callStatus, setCallStatus] = useState<string>('Connecting...');
  
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Simulate connection after 2 seconds
    const connectTimeout = setTimeout(() => {
      setIsConnecting(false);
      setIsConnected(true);
      setCallStatus('Connected');
      
      // Start call timer
      callTimerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }, 2000);

    return () => {
      clearTimeout(connectTimeout);
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
      }
    };
  }, []);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEndCall = () => {
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
    }
    setIsConnected(false);
    setCallStatus('Call ended');
    
    // Close window after 1 second
    setTimeout(() => {
      window.close();
    }, 1000);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const toggleSpeaker = () => {
    setIsSpeakerOn(!isSpeakerOn);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md">
        {/* Lawyer Info */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 bg-blue-100 rounded-full mx-auto mb-4 flex items-center justify-center">
            <Phone className="w-12 h-12 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Wakili Pro Support</h2>
          <p className="text-gray-600">Legal Assistance Hotline</p>
        </div>

        {/* Call Status */}
        <div className="text-center mb-8">
          {isConnecting && (
            <div className="space-y-3">
              <div className="flex justify-center">
                <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <p className="text-gray-700 font-medium">{callStatus}</p>
            </div>
          )}
          
          {isConnected && (
            <div className="space-y-2">
              <div className="flex justify-center mb-3">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              </div>
              <p className="text-green-600 font-semibold text-lg">{callStatus}</p>
              <p className="text-3xl font-mono font-bold text-gray-900">
                {formatDuration(callDuration)}
              </p>
            </div>
          )}
          
          {!isConnecting && !isConnected && (
            <p className="text-gray-600 font-medium">{callStatus}</p>
          )}
        </div>

        {/* Call Controls */}
        {isConnected && (
          <div className="flex justify-center items-center gap-4 mb-6">
            {/* Mute Button */}
            <button
              onClick={toggleMute}
              className={`p-4 rounded-full transition-all ${
                isMuted
                  ? 'bg-red-100 text-red-600 hover:bg-red-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </button>

            {/* End Call Button */}
            <button
              onClick={handleEndCall}
              className="p-6 bg-red-600 text-white rounded-full hover:bg-red-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
              aria-label="End call"
            >
              <PhoneOff className="w-8 h-8" />
            </button>

            {/* Speaker Button */}
            <button
              onClick={toggleSpeaker}
              className={`p-4 rounded-full transition-all ${
                isSpeakerOn
                  ? 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              aria-label={isSpeakerOn ? 'Speaker on' : 'Speaker off'}
            >
              {isSpeakerOn ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
            </button>
          </div>
        )}

        {/* Info Text */}
        <div className="bg-blue-50 rounded-lg p-4 text-center">
          <p className="text-sm text-blue-900">
            {isConnecting && 'Please wait while we connect you to our legal team...'}
            {isConnected && 'You are now speaking with our legal support team. Describe your issue clearly.'}
            {!isConnecting && !isConnected && 'Thank you for calling Wakili Pro.'}
          </p>
        </div>

        {/* Disclaimer */}
        <p className="text-xs text-gray-500 text-center mt-4">
          All calls are recorded for quality assurance and training purposes
        </p>
      </div>
    </div>
  );
};
