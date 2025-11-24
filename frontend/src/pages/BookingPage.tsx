import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { GlobalLayout } from '../components/layout';
import { Calendar, Clock, Video, DollarSign, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import axiosInstance from '../lib/axios';

export const BookingPage: React.FC = () => {
  const { lawyerId } = useParams<{ lawyerId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as { lawyerName?: string; hourlyRate?: number; specialty?: string } | null;
  const { isAuthenticated, user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    date: '',
    time: '',
    duration: '60',
    consultationType: 'video',
    description: '',
  });
  const [lawyerRate, setLawyerRate] = useState<number>(locationState?.hourlyRate || 5000);
  const [lawyerName, setLawyerName] = useState<string>(locationState?.lawyerName || '');
  const [lawyerSpecialty, setLawyerSpecialty] = useState<string>(locationState?.specialty || '');

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

    console.log('Form submitted with data:', formData);
    console.log('Lawyer ID:', lawyerId);

    try {
      const bookingData = {
        lawyerId,
        date: formData.date,
        time: formData.time,
        duration: formData.duration,
        consultationType: formData.consultationType,
        description: formData.description,
      };

      console.log('Sending booking request:', bookingData);
      const response = await axiosInstance.post('/consultations/book', bookingData);
      console.log('Booking response:', response.data);

      if (response.data.success) {
        // Redirect to payment page instead of showing success
        const booking = response.data.data;
        console.log('Navigating to payment with booking:', booking);
        
        const paymentState = {
          id: booking.id,
          lawyerName: lawyerName || booking.lawyerName,
          lawyerSpecialty: lawyerSpecialty,
          date: formData.date,
          time: formData.time,
          consultationType: formData.consultationType,
          fee: lawyerRate,
        };
        
        console.log('Payment state:', paymentState);
        console.log('Navigation path:', `/payment/${booking.id}`);
        
        navigate(`/payment/${booking.id}`, {
          state: paymentState
        });
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to book consultation. Please try again.';
      setError(errorMessage);
      console.error('Booking error:', err);
      console.error('Error response:', err.response?.data);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <GlobalLayout>
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
              <h1 className="text-3xl font-display font-bold text-slate-900 mb-2">
                Book a Consultation
              </h1>
              <p className="text-slate-600 mb-2">
                {lawyerName ? (
                  <>Schedule your consultation with <span className="font-semibold text-blue-600">{lawyerName}</span></>
                ) : (
                  'Schedule your video consultation with a qualified lawyer'
                )}
              </p>
              {lawyerName && (
                <p className="text-sm text-slate-500 mb-6">
                  {lawyerSpecialty && <span className="text-blue-600">{lawyerSpecialty}</span>}
                  {lawyerSpecialty && ' • '}
                  60-minute session • KES {lawyerRate.toLocaleString()}
                </p>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
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
                  />
                </div>

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
                    <option value="in-person">In-Person (if available)</option>
                  </select>
                </div>

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
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    This helps the lawyer prepare for your consultation
                  </p>
                </div>

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

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-900">
                  <strong>Important:</strong> After payment, the lawyer must confirm, reschedule, or reject your booking within 24 hours. 
                  If the lawyer doesn't respond within 24 hours, you'll receive a full refund. You'll get email and SMS notifications for all updates.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </GlobalLayout>
  );
};
