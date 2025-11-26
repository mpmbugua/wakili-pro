import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { RegisterRequest } from '@wakili-pro/shared/src/types/auth';
import { Mail, Lock, User, Phone, Eye, EyeOff, Scale } from 'lucide-react';
import { WakiliLogo } from '../ui/WakiliLogo';
import { Button } from '../ui/Button';
import { Card, CardContent } from '../ui/Card';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const { register, isLoading, error, clearError } = useAuthStore();

  const [formData, setFormData] = useState<RegisterRequest>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    role: 'PUBLIC'
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // First name validation
    if (!formData.firstName.trim()) {
      errors.firstName = 'First name is required';
    } else if (formData.firstName.trim().length < 2) {
      errors.firstName = 'First name must be at least 2 characters';
    }

    // Last name validation
    if (!formData.lastName.trim()) {
      errors.lastName = 'Last name is required';
    } else if (formData.lastName.trim().length < 2) {
      errors.lastName = 'Last name must be at least 2 characters';
    }

    // Email validation (optional but must be valid if provided)
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    // Phone number validation (required)
    if (!formData.phoneNumber) {
      errors.phoneNumber = 'Phone number is required';
    } else if (!/^(\+254|0)[17]\d{8}$/.test(formData.phoneNumber)) {
      errors.phoneNumber = 'Please enter a valid Kenyan phone number (e.g., 0712345678)';
    }

    // Password validation
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      errors.password = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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

    const success = await register(formData);
    
    if (success) {
      // Check for pending actions in sessionStorage
      const pendingBooking = sessionStorage.getItem('pendingBooking');
      const pendingPurchase = sessionStorage.getItem('pendingPurchase');
      
      let redirectPath = '/dashboard';
      let redirectState: any = undefined;
      
      if (pendingBooking) {
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
      }
      
      // Wait a moment for zustand persist to save state
      setTimeout(() => {
        navigate(redirectPath, { state: redirectState });
      }, 100);
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
                Create Your Account
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Join Wakili Pro and get instant legal assistance
              </p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-4">
                {/* Name Fields - Side by Side */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                      First Name
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="firstName"
                        name="firstName"
                        type="text"
                        autoComplete="given-name"
                        required
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className={`w-full pl-12 pr-4 py-3 border-0 rounded-xl bg-gray-50 ${
                          validationErrors.firstName 
                            ? 'ring-2 ring-red-500 bg-red-50' 
                            : 'focus:ring-2 focus:ring-sky-500 focus:bg-white'
                        } placeholder-gray-400 text-gray-900 transition-all duration-200 focus:outline-none text-sm`}
                        placeholder="John"
                      />
                    </div>
                    {validationErrors.firstName && (
                      <p className="mt-1 text-xs text-red-600">{validationErrors.firstName}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name
                    </label>
                    <input
                      id="lastName"
                      name="lastName"
                      type="text"
                      autoComplete="family-name"
                      required
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border-0 rounded-xl bg-gray-50 ${
                        validationErrors.lastName 
                          ? 'ring-2 ring-red-500 bg-red-50' 
                          : 'focus:ring-2 focus:ring-sky-500 focus:bg-white'
                      } placeholder-gray-400 text-gray-900 transition-all duration-200 focus:outline-none text-sm`}
                      placeholder="Doe"
                    />
                    {validationErrors.lastName && (
                      <p className="mt-1 text-xs text-red-600">{validationErrors.lastName}</p>
                    )}
                  </div>
                </div>

                {/* Phone Number Field - Now Required */}
                <div>
                  <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="phoneNumber"
                      name="phoneNumber"
                      type="tel"
                      autoComplete="tel"
                      required
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                      className={`w-full pl-12 pr-4 py-3 border-0 rounded-xl bg-gray-50 ${
                        validationErrors.phoneNumber 
                          ? 'ring-2 ring-red-500 bg-red-50' 
                          : 'focus:ring-2 focus:ring-sky-500 focus:bg-white'
                      } placeholder-gray-400 text-gray-900 transition-all duration-200 focus:outline-none text-sm`}
                      placeholder="0712345678 or +254712345678"
                    />
                  </div>
                  {validationErrors.phoneNumber && (
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                      <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                      {validationErrors.phoneNumber}
                    </p>
                  )}
                </div>

                {/* Email Field - Now Optional */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address <span className="text-gray-400 text-xs">(Optional)</span>
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
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`w-full pl-12 pr-4 py-3 border-0 rounded-xl bg-gray-50 ${
                        validationErrors.email 
                          ? 'ring-2 ring-red-500 bg-red-50' 
                          : 'focus:ring-2 focus:ring-sky-500 focus:bg-white'
                      } placeholder-gray-400 text-gray-900 transition-all duration-200 focus:outline-none text-sm`}
                      placeholder="john.doe@example.com (optional)"
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
                      autoComplete="new-password"
                      required
                      value={formData.password}
                      onChange={handleInputChange}
                      className={`w-full pl-12 pr-12 py-3 border-0 rounded-xl bg-gray-50 ${
                        validationErrors.password 
                          ? 'ring-2 ring-red-500 bg-red-50' 
                          : 'focus:ring-2 focus:ring-sky-500 focus:bg-white'
                      } placeholder-gray-400 text-gray-900 transition-all duration-200 focus:outline-none text-sm`}
                      placeholder="At least 8 characters"
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

                {/* Account Type Field */}
                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                    I am a
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Scale className="h-5 w-5 text-gray-400" />
                    </div>
                    <select
                      id="role"
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                      className="w-full pl-12 pr-4 py-3 border-0 rounded-xl bg-gray-50 focus:ring-2 focus:ring-sky-500 focus:bg-white text-gray-900 transition-all duration-200 focus:outline-none text-sm appearance-none cursor-pointer"
                    >
                      <option value="PUBLIC">Client (Seeking Legal Services)</option>
                      <option value="LAWYER">Lawyer (Providing Legal Services)</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
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
                {isLoading ? 'Creating account...' : 'Create Account'}
              </Button>

              {/* Link to Login */}
              <div className="text-center pt-4">
                <div className="text-sm text-gray-600">
                  Already have an account?{' '}
                  <Link 
                    to="/login" 
                    className="font-medium text-sky-600 hover:text-sky-500 transition-colors"
                  >
                    Sign in here
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

export default Register;
