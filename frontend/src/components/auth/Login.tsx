import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { WakiliLogo } from '../ui/WakiliLogo';
import { Button } from '../ui/Button';
import { Card, CardContent } from '../ui/Card';

// Inline type to replace shared dependency
interface LoginRequest {
  identifier: string;
  password: string;
}

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading, error, clearError } = useAuthStore();

  const [formData, setFormData] = useState<LoginRequest>({
    identifier: '',
    password: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Get redirect path from location state or default to dashboard
  // Safely handle null/undefined location.state
  const fromState = location.state && typeof location.state === 'object' 
    ? (location.state as { from?: string | { pathname?: string } }).from 
    : undefined;
  
  const from = typeof fromState === 'string' 
    ? fromState 
    : (fromState && typeof fromState === 'object' && 'pathname' in fromState)
      ? fromState.pathname 
      : '/dashboard';

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Identifier validation (phone or email)
    if (!formData.identifier) {
      errors.identifier = 'Phone number or email is required';
    }

    // Password validation
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 1) {
      errors.password = 'Password is required';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }

    // Clear auth error when user starts typing
    if (error) {
      clearError();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const result = await login(formData);
    
    if (result.success) {
      // Check for pending actions in sessionStorage - these take PRIORITY over 'from' path
      const pendingBooking = sessionStorage.getItem('pendingBooking');
      const pendingPurchase = sessionStorage.getItem('pendingPurchase');
      const pendingReviewRequest = sessionStorage.getItem('pendingReviewRequest');
      
      console.log('Login success - checking pending actions:', { 
        pendingBooking: !!pendingBooking, 
        pendingPurchase: !!pendingPurchase, 
        pendingReviewRequest: !!pendingReviewRequest,
        fromPath: from
      });
      
      let redirectPath: string;
      let redirectState: any = undefined;
      
      // Prioritize pending actions FIRST, then use 'from' path as fallback
      if (pendingReviewRequest) {
        // HIGHEST PRIORITY: Redirect to documents page where useEffect will handle the review request
        console.log('Pending review request found, redirecting to /documents');
        redirectPath = '/documents';
        // Keep in sessionStorage so DocumentsPage can process it
        // Don't remove it yet - let DocumentsPage handle it
      } else if (pendingBooking) {
        const booking = JSON.parse(pendingBooking);
        redirectPath = `/booking/${booking.lawyerId}`;
        redirectState = {
          lawyerName: booking.lawyerName,
          hourlyRate: booking.hourlyRate,
          profileImage: booking.profileImage
        };
        sessionStorage.removeItem('pendingBooking');
      } else if (pendingPurchase) {
        const purchase = JSON.parse(pendingPurchase);
        // Redirect to marketplace page with purchase info in sessionStorage
        redirectPath = '/marketplace';
        redirectState = {
          docId: purchase.docId,
          docTitle: purchase.docTitle
        };
        // Keep in sessionStorage so marketplace page can handle it
        // Don't remove it yet - let marketplace page handle it
      } else {
        // No pending actions, use the 'from' path
        redirectPath = from;
      }
      
      console.log('Redirecting to:', redirectPath);
      // Redirect to the intended destination
      navigate(redirectPath, { state: redirectState, replace: true });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <Card variant="glass" className="overflow-hidden">
            <CardContent className="px-8 py-8">
              <div className="text-center mb-8">
              <WakiliLogo size="lg" className="mx-auto mb-6" />
              <h2 className="text-2xl font-semibold text-gray-900 tracking-tight">
                Welcome Back
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Sign in to continue to your dashboard
              </p>
            </div>

            {/* Development Test Credentials Notice */}
            {import.meta.env.DEV && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs font-medium text-blue-900 mb-2">Test Credentials (if database is seeded):</p>
                <div className="text-xs text-blue-700 space-y-1">
                  <p><strong>Admin:</strong> admin@wakili.com</p>
                  <p><strong>Lawyer:</strong> lawyer@wakili.com</p>
                  <p><strong>User:</strong> user@wakili.com</p>
                  <p className="mt-2"><strong>Password:</strong> Password123!</p>
                  <p className="mt-3 text-blue-600 font-medium">If you get "Invalid email or password", please create a new account below.</p>
                </div>
              </div>
            )}

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-4">
                {/* Identifier Field (Phone or Email) */}
                <div>
                  <label htmlFor="identifier" className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number or Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="identifier"
                      name="identifier"
                      type="text"
                      autoComplete="username"
                      required
                      value={formData.identifier}
                      onChange={handleInputChange}
                      className={`w-full pl-12 pr-4 py-3 border-0 rounded-xl bg-gray-50 ${
                        validationErrors.identifier 
                          ? 'ring-2 ring-red-500 bg-red-50' 
                          : 'focus:ring-2 focus:ring-sky-500 focus:bg-white'
                      } placeholder-gray-400 text-gray-900 transition-all duration-200 focus:outline-none text-sm`}
                      placeholder="0712345678 or email@example.com"
                    />
                  </div>
                  {validationErrors.identifier && (
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                      <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                      {validationErrors.identifier}
                    </p>
                  )}
                </div>

                {/* Password Field */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      value={formData.password}
                      onChange={handleInputChange}
                      className={`w-full pl-12 pr-12 py-3 border-0 rounded-xl bg-gray-50 ${
                        validationErrors.password 
                          ? 'ring-2 ring-red-500 bg-red-50' 
                          : 'focus:ring-2 focus:ring-sky-500 focus:bg-white'
                      } placeholder-gray-400 text-gray-900 transition-all duration-200 focus:outline-none text-sm`}
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-4 flex items-center group"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
                      )}
                    </button>
                  </div>
                  {validationErrors.password && (
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                      <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                      {validationErrors.password}
                    </p>
                  )}
                </div>
              </div>

              {/* Server Error */}
              {error && (
                <div className="rounded-xl bg-red-50 border border-red-200 p-4">
                  <div className="text-sm text-red-700 flex items-center">
                    <span className="w-2 h-2 bg-red-500 rounded-full mr-3 flex-shrink-0"></span>
                    {error}
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                isLoading={isLoading}
                className="w-full"
                size="lg"
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>

              {/* Links */}
              <div className="text-center space-y-3 pt-4">
                <div className="text-sm">
                  <Link 
                    to="/forgot-password" 
                    className="font-medium text-sky-600 hover:text-sky-500 transition-colors"
                  >
                    Forgot your password?
                  </Link>
                </div>
                <div className="text-sm text-gray-600">
                  Don&apos;t have an account?{' '}
                  <Link 
                    to="/register" 
                    className="font-medium text-sky-600 hover:text-sky-500 transition-colors"
                  >
                    Sign up here
                  </Link>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
