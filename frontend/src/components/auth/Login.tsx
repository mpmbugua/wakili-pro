import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { WakiliLogo } from '../ui/WakiliLogo';
import { Button } from '../ui/Button';
import { Card, CardContent } from '../ui/Card';
import { SocialLoginButtons } from './SocialLoginButtons';

// Inline type to replace shared dependency
interface LoginRequest {
  email: string;
  password: string;
}

const Login: React.FC = () => {
  console.log('[Login] Component rendering');
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading, error, clearError } = useAuthStore();
  console.log('[Login] Auth store loaded, isLoading:', isLoading, 'error:', error);

  const [formData, setFormData] = useState<LoginRequest>({
    email: '',
    password: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Get redirect path from location state or default to dashboard
  const from = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/dashboard';

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Email validation
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
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

    const success = await login(formData);
    
    if (success) {
      // Redirect to the page they were trying to visit, or dashboard
      navigate(from, { replace: true });
    }
  };

  console.log('[Login] About to render, formData:', formData);
  
  try {
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

            {/* Social Login Buttons */}
            {/* Temporarily commented out to test if this is causing blank page */}
            {/* <SocialLoginButtons /> */}
            
            {/* Manual Divider to replace what SocialLoginButtons provided */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500 font-medium">Sign in with email</span>
              </div>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-4">
                {/* Email Field */}
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
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`w-full pl-12 pr-4 py-3 border-0 rounded-xl bg-gray-50 ${
                        validationErrors.email 
                          ? 'ring-2 ring-red-500 bg-red-50' 
                          : 'focus:ring-2 focus:ring-sky-500 focus:bg-white'
                      } placeholder-gray-400 text-gray-900 transition-all duration-200 focus:outline-none text-sm`}
                      placeholder="Enter your email address"
                    />
                  </div>
                  {validationErrors.email && (
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                      <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                      {validationErrors.email}
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
  } catch (renderError) {
    console.error('[Login] Render error:', renderError);
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md">
          <h2 className="text-xl font-bold text-red-600 mb-4">Login Page Error</h2>
          <p className="text-gray-700">An error occurred while loading the login page.</p>
          <pre className="mt-4 p-4 bg-gray-100 rounded text-xs overflow-auto">
            {renderError instanceof Error ? renderError.message : String(renderError)}
          </pre>
        </div>
      </div>
    );
  }
};

export default Login;
