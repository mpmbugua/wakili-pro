import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { GlobalLayout } from '../components/layout';
import { Calendar, Clock, Video, DollarSign, ArrowLeft, Check } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import axiosInstance from '../lib/axios';

export const BookingPage: React.FC = () => {
  const { lawyerId } = useParams<{ lawyerId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    date: '',
    time: '',
    duration: '60',
    consultationType: 'video',
    description: '',
  });
  const [lawyerRate, setLawyerRate] = useState<number>(5000);
  const [lawyerName, setLawyerName] = useState<string>('');
  const [loadingLawyer, setLoadingLawyer] = useState<boolean>(true);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      sessionStorage.setItem('redirectAfterLogin', `/booking/${lawyerId}`);
      navigate('/login');
    }
  }, [isAuthenticated, navigate, lawyerId]);

  // Fetch lawyer's profile and consultation rate
  useEffect(() => {
    const fetchLawyerProfile = async () => {
      if (!lawyerId) return;
      
      try {
        setLoadingLawyer(true);
        const response = await axiosInstance.get(`/api/lawyers/${lawyerId}`);
        
        if (response.data) {
          const lawyer = response.data;
          // Set the lawyer's hourly rate (consultation fee)
          const rate = lawyer.hourlyRate || lawyer.consultationRate || 5000;
          setLawyerRate(rate);
          setLawyerName(`${lawyer.name || lawyer.user?.firstName + ' ' + lawyer.user?.lastName || 'Lawyer'}`);
        }
      } catch (err) {
        console.error('Error fetching lawyer profile:', err);
        // Keep default rate if fetch fails
      } finally {
        setLoadingLawyer(false);
      }
    };

    fetchLawyerProfile();
  }, [lawyerId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // TODO: Replace with actual booking API endpoint
      const response = await axiosInstance.post('/api/consultations/book', {
        lawyerId,
        ...formData,
        clientId: user?.id
      });

      if (response.data.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/dashboard');
        }, 3000);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to book consultation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-secondary flex items-center justify-center">
        <div className="max-w-md mx-auto text-center p-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Booking Confirmed!</h2>
          <p className="text-slate-600 mb-6">
            Your consultation has been scheduled. You'll receive a confirmation email with details.
          </p>
          <Link to="/dashboard" className="btn-primary inline-block">
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
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
                {loadingLawyer ? (
                  <span className="animate-pulse">Loading lawyer details...</span>
                ) : lawyerName ? (
                  <>Schedule your consultation with <span className="font-semibold text-blue-600">{lawyerName}</span></>
                ) : (
                  'Schedule your video consultation with a qualified lawyer'
                )}
              </p>
              {!loadingLawyer && lawyerName && (
                <p className="text-sm text-slate-500 mb-6">
                  60-minute session • KES {lawyerRate.toLocaleString()}
                </p>
              )}
              {loadingLawyer && (
                <div className="mb-6" />
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
                    max={new Date(Date.now() + 24*60*60*1000).toISOString().split('T')[0]}
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="input-field"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Bookings available for today and tomorrow only
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
                  <strong>Note:</strong> All consultations are scheduled within 24 hours. Your booking will be confirmed 
                  once the lawyer approves your request and you complete the payment. You'll receive email and SMS notifications.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </GlobalLayout>
  );
};
