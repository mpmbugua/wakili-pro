import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Calendar, Clock, Video, DollarSign, ArrowLeft, Phone } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useEventTracking, useConversionTracking } from '../hooks/useAnalytics';
import axiosInstance from '../lib/axios';

export const BookingPage: React.FC = () => {
  const { lawyerId } = useParams<{ lawyerId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as { lawyerName?: string; hourlyRate?: number; specialty?: string; profileImage?: string } | null;
  const { isAuthenticated, user, refreshAuth } = useAuthStore();
  const { trackFormStart, trackFormSubmit } = useEventTracking();
  const { trackConversion } = useConversionTracking();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect lawyers to their dashboard - they cannot book consultations
  useEffect(() => {
    if (user?.role === 'LAWYER') {
      navigate('/dashboard', { 
        replace: true,
        state: { message: 'Lawyers cannot book consultations. This feature is for clients only.' }
      });
    }
  }, [user, navigate]);

  const [bookingType, setBookingType] = useState<'immediate' | 'scheduled'>('immediate');
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    duration: '60',
    consultationType: 'video',
    description: '',
    phoneNumber: '',
  });
  const [lawyerRate, setLawyerRate] = useState<number>(locationState?.hourlyRate || 5000);
  const [lawyerName, setLawyerName] = useState<string>(locationState?.lawyerName || '');
  const [lawyerSpecialty, setLawyerSpecialty] = useState<string>(locationState?.specialty || '');
  const [lawyerPhoto, setLawyerPhoto] = useState<string>(locationState?.profileImage || '');

  // Fetch lawyer details if not in location state
  useEffect(() => {
    const fetchLawyerDetails = async () => {
      if (!lawyerName && lawyerId) {
        try {
          const response = await axiosInstance.get(`/lawyers/${lawyerId}`);
          if (response.data.success && response.data.data) {
            const lawyer = response.data.data;
            setLawyerName(`${lawyer.user?.firstName || ''} ${lawyer.user?.lastName || ''}`.trim());
            setLawyerSpecialty(lawyer.specializations?.[0] || '');
            setLawyerRate(lawyer.hourlyRate || 5000);
            setLawyerPhoto(lawyer.profileImageUrl || `https://ui-avatars.com/api/?name=${lawyer.user?.firstName}+${lawyer.user?.lastName}&background=3b82f6&color=fff&size=200`);
          }
        } catch (error) {
          console.error('Error fetching lawyer details:', error);
        }
      }
    };

    fetchLawyerDetails();
  }, [lawyerId, lawyerName]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      sessionStorage.setItem('redirectAfterLogin', `/booking/${lawyerId}`);
      navigate('/login');
    }
  }, [isAuthenticated, navigate, lawyerId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Track form submission
    trackFormSubmit('booking_form', {
      bookingType,
      consultationType: formData.consultationType,
      lawyerId,
      lawyerName
    });

    console.log('Form submitted with data:', formData);
    console.log('Lawyer ID:', lawyerId);

    try {
      const bookingData = {
        lawyerId,
        date: bookingType === 'immediate' ? new Date().toISOString().split('T')[0] : formData.date,
        time: bookingType === 'immediate' ? 'ASAP' : formData.time,
        duration: formData.duration,
        consultationType: formData.consultationType,
        description: formData.description,
        isImmediate: bookingType === 'immediate',
      };

      console.log('Sending booking request:', bookingData);
      const response = await axiosInstance.post('/consultations/book', bookingData);
      console.log('Booking response:', response.data);

      if (response.data.success) {
        const booking = response.data.data;
        
        // Get phone number for M-Pesa payment
        const phoneNumber = prompt('Enter your M-Pesa phone number (format: 254XXXXXXXXX):');
        
        if (!phoneNumber) {
          alert('Phone number is required for payment');
          setLoading(false);
          return;
        }

        // Initiate M-Pesa payment
        console.log('[BookingPage] Initiating M-Pesa payment:', {
          bookingId: booking.id,
          amount: lawyerRate,
          phoneNumber
        });

        const paymentResponse = await axiosInstance.post('/payments/mpesa/initiate', {
          phoneNumber: phoneNumber,
          amount: lawyerRate,
          bookingId: booking.id,
          paymentType: 'CONSULTATION'
        });

        if (paymentResponse.data.success) {
          // Track successful booking conversion
          trackConversion('BOOKING', lawyerRate);
          
          alert(`Consultation booked successfully!\n\nM-Pesa payment request sent to ${phoneNumber}\n\nPlease complete the payment on your phone.`);
          navigate('/consultations');
        } else {
          alert(paymentResponse.data.message || 'Failed to initiate payment');
        }
      }
    } catch (err: any) {
      console.error('Booking error:', err);
      console.error('Error response:', err.response?.data);
      console.error('Error status:', err.response?.status);
      console.error('Full error data:', JSON.stringify(err.response?.data, null, 2));
      
      // If it's a 403 (forbidden/expired token), try refreshing auth
      if (err.response?.status === 403) {
        console.log('Token expired, attempting to refresh...');
        const refreshed = await refreshAuth();
        
        if (refreshed) {
          console.log('Token refreshed successfully, retrying booking...');
          // Wait a moment for the token to be persisted to localStorage
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Retry the booking with the new token
          setLoading(true);
          setError(null);
          
          try {
            const bookingData = {
              lawyerId,
              date: bookingType === 'immediate' ? new Date().toISOString().split('T')[0] : formData.date,
              time: bookingType === 'immediate' ? 'ASAP' : formData.time,
              duration: formData.duration,
              consultationType: formData.consultationType,
              description: formData.description,
              isImmediate: bookingType === 'immediate',
            };
            
            console.log('Retrying booking request to /consultations/book');
            const response = await axiosInstance.post('/consultations/book', bookingData);
            
            if (response.data.success) {
              const booking = response.data.data;
              const paymentState = {
                id: booking.id,
                lawyerName: lawyerName || booking.lawyerName,
                lawyerPhoto,
                lawyerSpecialty: lawyerSpecialty,
                date: formData.date,
                time: formData.time,
                consultationType: formData.consultationType,
                fee: lawyerRate,
              };
              
              navigate(`/payment/${booking.id}`, {
                state: paymentState
              });
            }
          } catch (retryErr: any) {
            console.error('Retry booking error:', retryErr);
            console.error('Retry error response:', retryErr.response?.data);
            console.error('Retry error status:', retryErr.response?.status);
            console.error('Full retry error data:', JSON.stringify(retryErr.response?.data, null, 2));
            const errorMessage = retryErr.response?.data?.message || 'Failed to book consultation after token refresh.';
            setError(errorMessage);
          } finally {
            setLoading(false);
          }
        } else {
          // Refresh failed, redirect to login
          setError('Your session has expired. Please log in again.');
          setTimeout(() => {
            navigate('/login');
          }, 2000);
        }
      } else {
        // Other errors
        let errorMessage = err.response?.data?.message || 'Failed to book consultation. Please try again.';
        
        // If there are validation errors, show them
        if (err.response?.data?.errors && Array.isArray(err.response.data.errors)) {
          const validationErrors = err.response.data.errors.map((e: any) => e.message).join(', ');
          errorMessage = `Validation error: ${validationErrors}`;
        }
        
        // Special handling for "Lawyer not found" error
        if (errorMessage === 'Lawyer not found') {
          setError('This lawyer profile is not available for booking at the moment. Please try selecting a different lawyer from the lawyers directory.');
        } else {
          setError(errorMessage);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <div className="max-w-4xl mx-auto py-12 px-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-slate-600 hover:text-primary mb-8 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Lawyers
        </button>

        <div className="max-w-2xl mx-auto">
          <div className="card">
            <div className="p-8">
              <h1 className="text-2xl font-semibold text-slate-900 mb-2">
                Request Consultation Booking
              </h1>
              
              {/* Lawyer Profile Header */}
              {lawyerName && (
                <div className="flex items-center space-x-4 mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                  {lawyerPhoto && (
                    <img
                      src={lawyerPhoto}
                      alt={lawyerName}
                      className="w-20 h-20 rounded-full object-cover border-2 border-blue-500 shadow-md"
                    />
                  )}
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-gray-800">{lawyerName}</h2>
                    {lawyerSpecialty && (
                      <p className="text-sm text-blue-600 font-medium">{lawyerSpecialty}</p>
                    )}
                    <p className="text-sm text-slate-600 mt-1">
                      60-minute session • KES {lawyerRate.toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
              
              <p className="text-slate-600 mb-6">
                {lawyerName ? (
                  <>Request a consultation with <span className="font-semibold text-blue-600">{lawyerName}</span>. 
                  {bookingType === 'immediate' ? ' They will respond within 30 minutes.' : ' They will confirm or suggest alternative times within 30 minutes.'}
                  </>
                ) : (
                  `Request a ${bookingType === 'immediate' ? 'immediate' : 'scheduled'} video consultation with a qualified lawyer.`
                )}
              </p>

              {/* Booking Type Selector */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-slate-900 mb-3">
                  Booking Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setBookingType('immediate');
                      trackFormStart('booking_form_immediate');
                    }}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      bookingType === 'immediate'
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-center mb-2">
                      <Clock className={`h-5 w-5 ${bookingType === 'immediate' ? 'text-blue-600' : 'text-slate-400'}`} />
                    </div>
                    <div className="text-center">
                      <p className={`font-semibold ${bookingType === 'immediate' ? 'text-blue-900' : 'text-slate-700'}`}>
                        Immediate Booking
                      </p>
                      <p className="text-xs text-slate-600 mt-1">
                        Lawyer responds within 30 min
                      </p>
                    </div>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => {
                      setBookingType('scheduled');
                      trackFormStart('booking_form_scheduled');
                    }}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      bookingType === 'scheduled'
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-center mb-2">
                      <Calendar className={`h-5 w-5 ${bookingType === 'scheduled' ? 'text-blue-600' : 'text-slate-400'}`} />
                    </div>
                    <div className="text-center">
                      <p className={`font-semibold ${bookingType === 'scheduled' ? 'text-blue-900' : 'text-slate-700'}`}>
                        Schedule Booking
                      </p>
                      <p className="text-xs text-slate-600 mt-1">
                        Pick your preferred date & time
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Date & Time - Only show for scheduled bookings */}
                {bookingType === 'scheduled' && (
                  <>
                    {/* Date */}
                    <div>
                      <label className="flex items-center text-sm font-semibold text-slate-900 mb-2">
                        <Calendar className="h-4 w-4 mr-2" />
                        Preferred Date
                      </label>
                      <input
                        type="date"
                        required
                        min={new Date().toISOString().split('T')[0]}
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        className="input-field"
                        style={{ width: '200px', colorScheme: 'light' }}
                      />
                      <p className="text-xs text-slate-500 mt-1">
                        Select your preferred consultation date
                      </p>
                    </div>

                    {/* Time */}
                    <div>
                      <label className="flex items-center text-sm font-semibold text-slate-900 mb-2">
                        <Clock className="h-4 w-4 mr-2" />
                        Preferred Time
                      </label>
                      <input
                        type="time"
                        required
                        value={formData.time}
                        onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                        className="input-field"
                        style={{ width: '150px', colorScheme: 'light' }}
                      />
                    </div>
                  </>
                )}

                {/* Immediate Booking Info */}
                {bookingType === 'immediate' && (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border-2 border-green-200">
                    <div className="flex items-start">
                      <Clock className="h-5 w-5 text-green-600 mr-3 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-green-900 mb-1">
                          Immediate Consultation Request
                        </p>
                        <p className="text-xs text-green-800">
                          The lawyer will receive your request immediately and respond within 30 minutes to confirm availability. 
                          If they're available, the consultation can start right away via {formData.consultationType === 'video' ? 'video call' : 'phone call'}.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Session Duration & Pricing */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border-2 border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-sm font-semibold text-slate-900 mb-1">
                        <Clock className="inline h-4 w-4 mr-2" />
                        Session Duration
                      </label>
                      <p className="text-2xl font-bold text-blue-900">60 Minutes</p>
                      <p className="text-xs text-slate-600 mt-1">Standard consultation session</p>
                    </div>
                    <div className="text-right">
                      <label className="block text-sm font-semibold text-slate-900 mb-1">
                        <DollarSign className="inline h-4 w-4 mr-2" />
                        Session Fee
                      </label>
                      <p className="text-2xl font-bold text-green-600">KES {lawyerRate.toLocaleString()}</p>
                      <p className="text-xs text-slate-600 mt-1">Set by lawyer</p>
                    </div>
                  </div>
                </div>

                {/* Consultation Type */}
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    <Video className="inline h-4 w-4 mr-2" />
                    Consultation Type
                  </label>
                  <select
                    required
                    value={formData.consultationType}
                    onChange={(e) => setFormData({ ...formData, consultationType: e.target.value })}
                    className="input-field"
                  >
                    <option value="video">Video Call</option>
                    <option value="phone">Phone Call</option>
                  </select>
                </div>

                {/* Phone Number - Only show for phone consultations */}
                {formData.consultationType === 'phone' && (
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                    <label className="flex items-center text-sm font-semibold text-slate-900 mb-2">
                      <Phone className="h-4 w-4 mr-2 text-blue-600" />
                      Your Phone Number
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g., +254712345678 or 0712345678"
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                      className="input-field"
                      pattern="[+]?[0-9]{10,13}"
                    />
                    <p className="text-xs text-blue-700 mt-2 flex items-start">
                      <svg className="w-4 h-4 mr-1 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      <span>The lawyer will call you at this number at the scheduled time. Please ensure it's active and reachable.</span>
                    </p>
                  </div>
                )}

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Brief Description of Your Legal Matter
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Please provide a brief description of your legal issue..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input-field resize-none"
                    minLength={10}
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    This helps the lawyer prepare for your consultation (minimum 10 characters)
                  </p>
                </div>

                {/* Error Message - Above Submit Button */}
                {error && (
                  <div className="bg-red-50 border-l-4 border-red-500 rounded-r-lg p-4 shadow-sm">
                    <div className="flex items-start">
                      <svg className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-red-800">{error}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white inline-block mr-2"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <DollarSign className="inline h-5 w-5 mr-2" />
                        Proceed to Payment
                      </>
                    )}
                  </button>
                </div>
              </form>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-900 mb-2">
                  <strong>How it works:</strong>
                </p>
                {bookingType === 'immediate' ? (
                  <ol className="text-sm text-blue-900 space-y-1 list-decimal list-inside">
                    <li>You pay for the consultation upfront</li>
                    <li>The lawyer receives your immediate request notification</li>
                    <li>Within 30 minutes, they will confirm availability</li>
                    <li>If confirmed, the consultation starts immediately via {formData.consultationType === 'video' ? 'video call' : 'phone call'}</li>
                    <li>If the lawyer doesn't respond within 30 minutes, the system automatically recommends 3 alternative lawyers</li>
                    <li>You can rebook with any recommended lawyer for free (no additional payment)</li>
                    <li>You'll receive email and SMS notifications at each step</li>
                  </ol>
                ) : (
                  <ol className="text-sm text-blue-900 space-y-1 list-decimal list-inside">
                    <li>You pay for the consultation upfront</li>
                    <li>The lawyer receives your request and reviews your preferred date/time</li>
                    <li>Within 30 minutes, they will confirm or suggest alternative times</li>
                    <li>If the lawyer doesn't respond within 30 minutes, the system automatically recommends 3 alternative lawyers</li>
                    <li>You can rebook with any recommended lawyer for free (no additional payment)</li>
                    <li>You'll receive email and SMS notifications at each step</li>
                  </ol>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
