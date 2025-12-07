import React, { useState, useEffect } from 'react';
import { Video, Calendar, Clock, User, CheckCircle, XCircle, AlertCircle, Loader } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import axiosInstance from '../lib/axios';

interface Consultation {
  id: string;
  lawyerName?: string;
  clientName?: string;
  lawyerImage?: string;
  specialty: string;
  scheduledAt: string;
  duration: number;
  status: 'PENDING' | 'CONFIRMED' | 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'REJECTED' | 'IN_PROGRESS';
  meetingLink?: string;
  consultationFee: number;
}

export const ConsultationsPage: React.FC = () => {
  const { user } = useAuthStore();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('all');
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const isLawyer = user?.role === 'LAWYER';

  // Check lawyer verification status
  useEffect(() => {
    const checkVerification = async () => {
      if (!isLawyer) {
        setIsVerified(true); // Clients don't need verification
        return;
      }

      try {
        const response = await axiosInstance.get('/users/profile');
        const lawyerProfile = response.data?.data?.lawyerProfile;
        setIsVerified(lawyerProfile?.isVerified === true);
      } catch (error) {
        console.error('[ConsultationsPage] Verification check failed:', error);
        setIsVerified(false);
      }
    };

    checkVerification();
  }, [isLawyer]);

  useEffect(() => {
    if (isVerified) {
      fetchConsultations();
    }
  }, [isVerified]);

  const fetchConsultations = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API endpoint
      // const response = await axiosInstance.get('/consultations');
      // setConsultations(response.data.data);
      
      // Mock data - different for lawyers vs clients
      if (user?.role === 'LAWYER') {
        // Lawyers see their client consultations
        setConsultations([
          {
            id: '1',
            clientName: 'James Omondi',
            specialty: 'Corporate Law',
            scheduledAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
            duration: 60,
            status: 'PENDING',
            consultationFee: 3500,
          },
          {
            id: '2',
            clientName: 'Mary Wambui',
            specialty: 'Family Law',
            scheduledAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            duration: 45,
            status: 'COMPLETED',
            consultationFee: 3000,
          },
        ]);
      } else {
        // Clients see their consultations with lawyers
        setConsultations([
          {
            id: '1',
            lawyerName: 'Sarah Mwangi',
            specialty: 'Corporate Law',
            scheduledAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
            duration: 60,
            status: 'PENDING',
            consultationFee: 3500,
          },
          {
            id: '2',
            lawyerName: 'John Kamau',
            specialty: 'Family Law',
            scheduledAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            duration: 45,
            status: 'COMPLETED',
            consultationFee: 3000,
          },
        ]);
      }
    } catch (error) {
      console.error('Error fetching consultations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmBooking = async (consultationId: string) => {
    try {
      await axiosInstance.post(`/consultations/${consultationId}/lawyer-confirm`);
      alert('Booking confirmed! The client will be notified via email and SMS.');
      fetchConsultations(); // Refresh list
    } catch (error) {
      console.error('Error confirming booking:', error);
      alert('Failed to confirm booking. Please try again.');
    }
  };

  const handleRejectBooking = async (consultationId: string) => {
    const reason = prompt('Please provide a brief reason for declining this booking:');
    if (!reason) return;

    try {
      await axiosInstance.post(`/consultations/${consultationId}/lawyer-reject`, { reason });
      alert('Booking declined. The client will be notified and automatically refunded.');
      fetchConsultations(); // Refresh list
    } catch (error) {
      console.error('Error rejecting booking:', error);
      alert('Failed to decline booking. Please try again.');
    }
  };

  const handleRescheduleBooking = async (consultationId: string) => {
    const newDate = prompt('Suggest a new date (YYYY-MM-DD):');
    const newTime = prompt('Suggest a new time (HH:MM):');
    
    if (!newDate || !newTime) return;

    try {
      await axiosInstance.post(`/consultations/${consultationId}/lawyer-reschedule`, { 
        date: newDate, 
        time: newTime,
        message: 'The suggested time works better with my schedule.'
      });
      alert('Reschedule request sent! The client will be notified to approve the new time.');
      fetchConsultations(); // Refresh list
    } catch (error) {
      console.error('Error requesting reschedule:', error);
      alert('Failed to suggest new time. Please try again.');
    }
  };

  const getStatusBadge = (status: Consultation['status']) => {
    const badges = {
      PENDING: { color: 'bg-yellow-100 text-yellow-700', icon: AlertCircle, text: 'Pending Confirmation' },
      CONFIRMED: { color: 'bg-blue-100 text-blue-700', icon: CheckCircle, text: 'Confirmed' },
      SCHEDULED: { color: 'bg-blue-100 text-blue-700', icon: Clock, text: 'Scheduled' },
      IN_PROGRESS: { color: 'bg-green-100 text-green-700', icon: Video, text: 'In Progress' },
      COMPLETED: { color: 'bg-gray-100 text-gray-700', icon: CheckCircle, text: 'Completed' },
      CANCELLED: { color: 'bg-red-100 text-red-700', icon: XCircle, text: 'Cancelled' },
      REJECTED: { color: 'bg-red-100 text-red-700', icon: XCircle, text: 'Declined' },
    };
    const badge = badges[status];
    const Icon = badge.icon;
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className="h-3 w-3 mr-1" />
        {badge.text}
      </span>
    );
  };

  const filteredConsultations = consultations.filter(consultation => {
    const consultationDate = new Date(consultation.scheduledAt);
    const now = new Date();
    
    if (filter === 'upcoming') {
      return consultationDate > now && ['PENDING', 'CONFIRMED', 'SCHEDULED'].includes(consultation.status);
    } else if (filter === 'past') {
      return consultationDate < now || ['COMPLETED', 'CANCELLED', 'REJECTED'].includes(consultation.status);
    }
    return true;
  });

  // Show verification check loading
  if (isVerified === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader className="h-8 w-8 animate-spin mx-auto text-blue-600 mb-2" />
          <p className="text-sm text-slate-600">Checking verification status...</p>
        </div>
      </div>
    );
  }

  // Show verification required for unverified lawyers
  if (isLawyer && !isVerified) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-8 text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="h-8 w-8 text-amber-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Verification Required</h2>
          <p className="text-gray-700 mb-4">
            You must be a verified lawyer to access consultations. Your profile is currently under admin review.
          </p>
          <p className="text-sm text-gray-600">
            You'll receive an email notification once approved (typically 24-48 hours).
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">{isLawyer ? 'Client Consultations' : 'My Consultations'}</h1>
        <p className="text-slate-600 mt-2">
          {isLawyer ? 'Manage consultations with your clients' : 'Manage your video consultations with lawyers'}
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex space-x-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            filter === 'all'
              ? 'bg-blue-100 text-white'
              : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter('upcoming')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            filter === 'upcoming'
              ? 'bg-blue-100 text-white'
              : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
          }`}
        >
          Upcoming
        </button>
        <button
          onClick={() => setFilter('past')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            filter === 'past'
              ? 'bg-blue-100 text-white'
              : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
          }`}
        >
          Past
        </button>
      </div>

      {/* Consultations List */}
      {filteredConsultations.length === 0 ? (
        <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
          <Video className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">No consultations found</h3>
          <p className="text-slate-600 mb-6">You don't have any {filter !== 'all' ? filter : ''} consultations yet.</p>
          <a
            href="/lawyers"
            className="inline-flex items-center px-6 py-3 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition font-medium"
          >
            Find a Lawyer
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredConsultations.map((consultation) => (
            <div key={consultation.id} className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-md transition">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start space-x-4">
                  <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <User className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">
                      {isLawyer ? consultation.clientName : consultation.lawyerName}
                    </h3>
                    <p className="text-sm text-slate-600">{consultation.specialty}</p>
                  </div>
                </div>
                {getStatusBadge(consultation.status)}
              </div>

              <div className="grid md:grid-cols-3 gap-4 mb-4">
                <div className="flex items-center space-x-2 text-sm text-slate-600">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(consultation.scheduledAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-slate-600">
                  <Clock className="h-4 w-4" />
                  <span>{new Date(consultation.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-slate-600">
                  <Video className="h-4 w-4" />
                  <span>{consultation.duration} minutes</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                <span className="text-sm font-medium text-slate-700">
                  Fee: KES {consultation.consultationFee.toLocaleString()}
                </span>
                
                {/* Lawyer Actions - Pending Confirmation */}
                {isLawyer && consultation.status === 'PENDING' && (
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => handleRejectBooking(consultation.id)}
                      className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition text-sm font-medium"
                    >
                      Decline
                    </button>
                    <button 
                      onClick={() => handleRescheduleBooking(consultation.id)}
                      className="px-4 py-2 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition text-sm font-medium"
                    >
                      Suggest New Time
                    </button>
                    <button 
                      onClick={() => handleConfirmBooking(consultation.id)}
                      className="px-4 py-2 bg-green-600 text-blue-700 rounded-lg hover:bg-green-700 transition text-sm font-medium"
                    >
                      Confirm Booking
                    </button>
                  </div>
                )}

                {/* Client View - Pending */}
                {!isLawyer && consultation.status === 'PENDING' && (
                  <div className="flex items-center space-x-2 text-sm text-yellow-700">
                    <AlertCircle className="h-4 w-4" />
                    <span>Waiting for lawyer confirmation</span>
                  </div>
                )}

                {/* Scheduled/Confirmed Actions */}
                {(consultation.status === 'SCHEDULED' || consultation.status === 'CONFIRMED') && (
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => handleRescheduleBooking(consultation.id)}
                      className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition text-sm font-medium"
                    >
                      Reschedule
                    </button>
                    {consultation.meetingLink && (
                      <a
                        href={consultation.meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition text-sm font-medium"
                      >
                        Join Meeting
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ConsultationsPage;
