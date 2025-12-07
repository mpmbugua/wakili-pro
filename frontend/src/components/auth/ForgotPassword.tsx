import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { WakiliLogo } from '../ui/WakiliLogo';
import { Button } from '../ui/Button';
import { Card, CardContent } from '../ui/Card';
import axiosInstance from '../../services/api';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await axiosInstance.post('/auth/forgot-password', { email });
      
      if (response.data.success) {
        setSuccess(true);
        // Store debug info if available (development mode)
        if (response.data.debug) {
          setDebugInfo(response.data.debug);
          console.log('Password reset debug info:', response.data.debug);
        }
      }
    } catch (err: any) {
      console.error('Forgot password error:', err);
      setError(err.response?.data?.message || 'Failed to send reset email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <Card variant="glass" className="overflow-hidden">
            <CardContent className="px-8 py-8">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
                  <CheckCircle className="h-10 w-10 text-green-600" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 tracking-tight mb-4">
                  Check Your Email
                </h2>
                <p className="text-sm text-gray-600 mb-8">
                  We've sent password reset instructions to <strong>{email}</strong>
                </p>
                <p className="text-xs text-gray-500 mb-6">
                  Didn't receive the email? Check your spam folder or try again in a few minutes.
                </p>
                
                {/* Debug info for development */}
                {debugInfo && (
                  <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-left">
                    <p className="text-xs font-semibold text-yellow-800 mb-2">Development Mode - Reset Link:</p>
                    <a 
                      href={debugInfo.resetUrl}
                      className="text-xs text-blue-600 hover:underline break-all"
                    >
                      {debugInfo.resetUrl}
                    </a>
                  </div>
                )}
                
                <Link
                  to="/login"
                  className="inline-flex items-center text-sm font-medium text-sky-600 hover:text-sky-500 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Login
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <Card variant="glass" className="overflow-hidden">
          <CardContent className="px-8 py-8">
            <div className="text-center mb-8">
              <WakiliLogo size="lg" className="mx-auto mb-6" />
              <h2 className="text-2xl font-semibold text-gray-900 tracking-tight">
                Reset Your Password
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Enter your email address and we'll send you instructions to reset your password
              </p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border-0 rounded-xl bg-gray-50 focus:ring-2 focus:ring-sky-500 focus:bg-white placeholder-gray-400 text-gray-900 transition-all duration-200 focus:outline-none text-sm"
                    placeholder="your.email@example.com"
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-xl bg-red-50 border border-red-200 p-4">
                  <div className="text-sm text-red-700 flex items-center">
                    <span className="w-2 h-2 bg-red-500 rounded-full mr-3 flex-shrink-0"></span>
                    {error}
                  </div>
                </div>
              )}

              <Button
                type="submit"
                isLoading={isLoading}
                className="w-full"
                size="lg"
              >
                {isLoading ? 'Sending...' : 'Send Reset Instructions'}
              </Button>

              <div className="text-center pt-4">
                <Link
                  to="/login"
                  className="inline-flex items-center text-sm font-medium text-sky-600 hover:text-sky-500 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Login
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;
