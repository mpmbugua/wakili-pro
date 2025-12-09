import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, Shield, CheckCircle, AlertCircle } from 'lucide-react';
import axiosInstance from '../services/api';
import { useAuthStore } from '../store/authStore';

export const PhoneVerificationPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [phoneNumber, setPhoneNumber] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [expiresIn, setExpiresIn] = useState(0);

  // Auto-format phone number
  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    
    // Auto-prefix with 254 if starting with 0 or 7
    if (digits.startsWith('0')) {
      return '254' + digits.substring(1);
    } else if (digits.startsWith('7') || digits.startsWith('1')) {
      return '254' + digits;
    }
    
    return digits;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhoneNumber(formatted);
  };

  const handleSendCode = async () => {
    if (!phoneNumber || phoneNumber.length !== 12) {
      setError('Please enter a valid phone number (254XXXXXXXXX)');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axiosInstance.post('/verification/send-code', {
        phoneNumber
      });

      if (response.data.success) {
        setSuccess('Verification code sent via SMS!');
        setStep('code');
        setExpiresIn(response.data.expiresIn || 600);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (code.length !== 6) {
      setError('Please enter the 6-digit code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axiosInstance.post('/verification/verify-code', {
        code
      });

      if (response.data.success) {
        setSuccess('Phone verified successfully!');
        
        // Wait 2 seconds then redirect to dashboard
        setTimeout(() => {
          navigate(user?.role === 'LAWYER' ? '/lawyer/dashboard' : '/dashboard');
        }, 2000);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  // Countdown timer
  useEffect(() => {
    if (expiresIn > 0) {
      const timer = setInterval(() => {
        setExpiresIn(prev => Math.max(0, prev - 1));
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [expiresIn]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-amber-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Verify Your Phone</h1>
          <p className="text-slate-600 mt-2">
            {step === 'phone' 
              ? 'Enter your phone number to receive a verification code'
              : 'Enter the 6-digit code sent to your phone'
            }
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start">
            <CheckCircle className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
            <p className="text-green-800 text-sm">{success}</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
            <AlertCircle className="w-5 h-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Phone Number Input */}
        {step === 'phone' && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Phone Number
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
              <input
                type="tel"
                value={phoneNumber}
                onChange={handlePhoneChange}
                placeholder="254712345678"
                maxLength={12}
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Format: 254XXXXXXXXX (Kenya)
            </p>

            <button
              onClick={handleSendCode}
              disabled={loading || phoneNumber.length !== 12}
              className="w-full mt-6 bg-amber-600 text-white py-3 rounded-lg font-medium hover:bg-amber-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition"
            >
              {loading ? 'Sending...' : 'Send Verification Code'}
            </button>
          </div>
        )}

        {/* Code Input */}
        {step === 'code' && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Verification Code
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="123456"
              maxLength={6}
              className="w-full px-4 py-3 text-center text-2xl tracking-widest border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            
            {expiresIn > 0 && (
              <p className="text-sm text-slate-600 mt-2 text-center">
                Code expires in {formatTime(expiresIn)}
              </p>
            )}

            <button
              onClick={handleVerifyCode}
              disabled={loading || code.length !== 6}
              className="w-full mt-6 bg-amber-600 text-white py-3 rounded-lg font-medium hover:bg-amber-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition"
            >
              {loading ? 'Verifying...' : 'Verify Code'}
            </button>

            <button
              onClick={() => {
                setStep('phone');
                setCode('');
                setError('');
              }}
              className="w-full mt-3 text-amber-600 py-2 font-medium hover:underline"
            >
              Change Phone Number
            </button>

            {expiresIn === 0 && (
              <button
                onClick={handleSendCode}
                className="w-full mt-3 text-amber-600 py-2 font-medium hover:underline"
              >
                Resend Code
              </button>
            )}
          </div>
        )}

        {/* Why Verification */}
        <div className="mt-8 p-4 bg-slate-50 rounded-lg">
          <h3 className="text-sm font-semibold text-slate-900 mb-2">
            Why verify your phone?
          </h3>
          <ul className="text-xs text-slate-600 space-y-1">
            <li>✓ Access lawyer-exclusive features and quotas</li>
            <li>✓ Prevent unauthorized account access</li>
            <li>✓ Receive important case notifications</li>
            <li>✓ Comply with legal practice requirements</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
