import React, { useState, useEffect } from 'react';
import {
  Calendar, Clock, Video, Phone, MapPin, User, CheckCircle, XCircle,
  AlertCircle, Loader, ArrowLeft
} from 'lucide-react';
import axiosInstance from '../lib/axios';
import { useNavigate, useParams } from 'react-router-dom';

interface Booking {
  id: string;
  clientId: string;
  lawyerId: string;
  consultationType: 'VIDEO' | 'PHONE' | 'IN_PERSON';
  status: string;
  scheduledStartTime: string;
  scheduledEndTime: string;
  clientPaymentAmount: number;
  clientPaymentStatus: string;
  platformCommission: number;
  lawyerPayout: number;
  mpesaTransactionId: string | null;
  mpesaReceiptNumber: string | null;
  clientPaidAt: string | null;
  createdAt: string;
  client: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string | null;
  };
  lawyer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string | null;
    lawyerProfile: {
      hourlyRate: number | null;
      specializations: string[];
    } | null;
  };
}

export const BookingDetails: React.FC = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    fetchBooking();
    getCurrentUser();
  }, [bookingId]);

  const getCurrentUser = () => {
    const authStorage = localStorage.getItem('wakili-auth-storage');
    if (authStorage) {
      try {
        const parsed = JSON.parse(authStorage);
        setCurrentUserId(parsed.state?.user?.id || '');
      } catch (err) {
        console.error('Error parsing auth:', err);
      }
    }
  };

  const fetchBooking = async () => {
    if (!bookingId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await axiosInstance.get(`/consultations/${bookingId}`);
      if (response.data.success) {
        setBooking(response.data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load booking details');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmCompletion = async () => {
    if (!booking || !currentUserId) return;

    const confirmedBy = currentUserId === booking.clientId ? 'CLIENT' : 'LAWYER';

    setActionLoading(true);
    try {
      await axiosInstance.patch(`/consultations/${booking.id}/confirm`, {
        confirmedBy
      });
      
      alert('Session confirmed successfully!');
      fetchBooking();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to confirm session');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!booking) return;

    setActionLoading(true);
    try {
      await axiosInstance.patch(`/consultations/${booking.id}/cancel`, {
        reason: cancelReason
      });
      
      alert('Booking cancelled successfully');
      setShowCancelModal(false);
      fetchBooking();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to cancel booking');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING_PAYMENT':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'PAYMENT_CONFIRMED':
      case 'SCHEDULED':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getConsultationIcon = (type: string) => {
    switch (type) {
      case 'VIDEO':
        return <Video className="w-6 h-6" />;
      case 'PHONE':
        return <Phone className="w-6 h-6" />;
      case 'IN_PERSON':
        return <MapPin className="w-6 h-6" />;
      default:
        return <Calendar className="w-6 h-6" />;
    }
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return {
      date: date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
    };
  };

  const isPast = (dateStr: string) => {
    return new Date(dateStr) < new Date();
  };

  const canCancel = () => {
    if (!booking) return false;
    if (booking.status === 'COMPLETED' || booking.status === 'CANCELLED') return false;
    
    // Check if more than 24 hours before session
    const hoursUntil = (new Date(booking.scheduledStartTime).getTime() - new Date().getTime()) / (1000 * 60 * 60);
    return hoursUntil >= 24;
  };

  const canConfirm = () => {
    if (!booking) return false;
    return (booking.status === 'PAYMENT_CONFIRMED' || booking.status === 'SCHEDULED') && 
           isPast(booking.scheduledEndTime);
  };

  const isLawyer = currentUserId === booking?.lawyerId;
  const isClient = currentUserId === booking?.clientId;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <AlertCircle className="w-6 h-6 text-red-600 mx-auto mb-3" />
            <p className="text-red-800 text-center">{error || 'Booking not found'}</p>
            <button
              onClick={() => navigate('/bookings')}
              className="mt-4 mx-auto block bg-blue-100 text-blue-700 px-6 py-2 rounded-lg hover:bg-blue-200"
            >
              Back to Bookings
            </button>
          </div>
        </div>
      </div>
    );
  }

  const startDateTime = formatDateTime(booking.scheduledStartTime);
  const endDateTime = formatDateTime(booking.scheduledEndTime);
  const otherParty = isClient ? booking.lawyer : booking.client;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/bookings')}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Bookings</span>
        </button>

        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4">
              <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                {getConsultationIcon(booking.consultationType)}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {booking.consultationType.replace('_', ' ')} Consultation
                </h1>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(booking.status)}`}>
                  {booking.status.replace('_', ' ')}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">
                KES {Number(booking.clientPaymentAmount).toLocaleString()}
              </div>
              <div className={`text-sm mt-1 ${
                booking.clientPaymentStatus === 'COMPLETED' ? 'text-green-600' : 'text-yellow-600'
              }`}>
                {booking.clientPaymentStatus === 'COMPLETED' ? '✓ Paid' : 'Payment Pending'}
              </div>
            </div>
          </div>
        </div>

        {/* Session Details */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Session Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start space-x-3">
              <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <div className="text-sm text-gray-500">Date</div>
                <div className="font-medium text-gray-900">{startDateTime.date}</div>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <div className="text-sm text-gray-500">Time</div>
                <div className="font-medium text-gray-900">
                  {startDateTime.time} - {endDateTime.time}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Participant Details */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {isClient ? 'Lawyer Information' : 'Client Information'}
          </h2>
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-gray-500" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">
                {otherParty.firstName} {otherParty.lastName}
              </h3>
              <p className="text-sm text-gray-600">{otherParty.email}</p>
              {otherParty.phoneNumber && (
                <p className="text-sm text-gray-600">{otherParty.phoneNumber}</p>
              )}
              {isClient && booking.lawyer.lawyerProfile && (
                <div className="mt-2">
                  <div className="text-sm text-gray-500">Specializations:</div>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {booking.lawyer.lawyerProfile.specializations.map((spec, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs"
                      >
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Payment Details */}
        {isLawyer && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Breakdown</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Client Payment</span>
                <span className="font-medium">KES {Number(booking.clientPaymentAmount).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-red-600">
                <span>Platform Commission (10%)</span>
                <span className="font-medium">- KES {Number(booking.platformCommission).toLocaleString()}</span>
              </div>
              <div className="pt-3 border-t border-gray-200 flex justify-between">
                <span className="font-semibold text-gray-900">Your Payout</span>
                <span className="text-lg font-bold text-green-600">
                  KES {Number(booking.lawyerPayout).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Transaction Details */}
        {booking.mpesaTransactionId && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Transaction Details</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">M-Pesa Receipt</span>
                <span className="font-medium font-mono">{booking.mpesaReceiptNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Transaction ID</span>
                <span className="font-medium font-mono text-xs">{booking.mpesaTransactionId}</span>
              </div>
              {booking.clientPaidAt && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Paid At</span>
                  <span className="font-medium">
                    {new Date(booking.clientPaidAt).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions</h2>
          <div className="space-y-3">
            {canConfirm() && (
              <button
                onClick={handleConfirmCompletion}
                disabled={actionLoading}
                className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
              >
                <CheckCircle className="w-5 h-5" />
                <span>Confirm Session Completion</span>
              </button>
            )}

            {canCancel() && (
              <button
                onClick={() => setShowCancelModal(true)}
                disabled={actionLoading}
                className="w-full bg-red-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
              >
                <XCircle className="w-5 h-5" />
                <span>Cancel Booking</span>
              </button>
            )}

            {!canCancel() && booking.status !== 'COMPLETED' && booking.status !== 'CANCELLED' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  Cancellation is only allowed 24+ hours before the scheduled session.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Cancel Modal */}
        {showCancelModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Cancel Booking</h3>
              <p className="text-sm text-gray-600 mb-4">
                Are you sure you want to cancel this booking? This action cannot be undone.
              </p>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Reason for cancellation (optional)"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
                rows={3}
              />
              <div className="flex space-x-3">
                <button
                  onClick={handleCancelBooking}
                  disabled={actionLoading}
                  className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-red-700 disabled:bg-gray-300"
                >
                  {actionLoading ? 'Cancelling...' : 'Confirm Cancel'}
                </button>
                <button
                  onClick={() => setShowCancelModal(false)}
                  disabled={actionLoading}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-semibold hover:bg-gray-300"
                >
                  Keep Booking
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
