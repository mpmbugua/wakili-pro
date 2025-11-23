import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
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
    duration: '30',
    consultationType: 'video',
    description: '',
    urgency: 'normal'
  });

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
    <div className="min-h-screen bg-gradient-secondary">
      {/* Header */}
      <header className="navbar">
        <div className="container">
          <div className="flex items-center justify-between">
            <Link to="/" className="text-2xl font-display font-bold text-primary">
              Wakili Pro
            </Link>
            <div className="flex items-center space-x-4">
              <Link to="/dashboard" className="btn-primary">Dashboard</Link>
            </div>
          </div>
        </div>
      </header>

      <div className="container py-12">
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
              <p className="text-slate-600 mb-8">
                Schedule your video consultation with a qualified lawyer
              </p>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Date */}
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    <Calendar className="inline h-4 w-4 mr-2" />
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
                </div>

                {/* Time */}
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    <Clock className="inline h-4 w-4 mr-2" />
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

                {/* Duration */}
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Duration
                  </label>
                  <select
                    required
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    className="input-field"
                  >
                    <option value="30">30 minutes - KES 3,500</option>
                    <option value="60">1 hour - KES 6,000</option>
                    <option value="90">1.5 hours - KES 8,500</option>
                  </select>
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

                {/* Urgency */}
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Urgency
                  </label>
                  <select
                    required
                    value={formData.urgency}
                    onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
                    className="input-field"
                  >
                    <option value="normal">Normal (within 3-5 days)</option>
                    <option value="urgent">Urgent (within 24 hours) - Additional 50%</option>
                    <option value="emergency">Emergency (same day) - Additional 100%</option>
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
                  <strong>Note:</strong> Your consultation will be confirmed once the lawyer approves your request 
                  and you complete the payment. You'll receive email and SMS notifications.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
