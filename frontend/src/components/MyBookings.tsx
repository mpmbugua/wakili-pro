import React, { useState, useEffect } from 'react';
import { 
  Calendar, Clock, Video, Phone, MapPin, User, 
  CheckCircle, XCircle, AlertCircle, Loader 
} from 'lucide-react';
import axiosInstance from '../lib/axios';
import { useNavigate } from 'react-router-dom';

interface Booking {
  id: string;
  consultationType: 'VIDEO' | 'PHONE' | 'IN_PERSON';
  status: string;
  scheduledStartTime: string;
  scheduledEndTime: string;
  clientPaymentAmount: number;
  clientPaymentStatus: string;
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

type UserRole = 'CLIENT' | 'LAWYER';
type FilterStatus = 'ALL' | 'PENDING_PAYMENT' | 'PAYMENT_CONFIRMED' | 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';

export const MyBookings: React.FC = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<UserRole>('CLIENT');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('ALL');
  const [showUpcoming, setShowUpcoming] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, [role, filterStatus, showUpcoming]);

  const fetchBookings = async () => {
    setLoading(true);
    setError(null);

    try {
      const params: any = { role };
      
      if (filterStatus !== 'ALL') {
        params.status = filterStatus;
      }
      
      if (showUpcoming) {
        params.upcoming = true;
      }

      const response = await axiosInstance.get('/consultations/my-bookings', { params });

      if (response.data.success) {
        setBookings(response.data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="w-4 h-4" />;
      case 'CANCELLED':
        return <XCircle className="w-4 h-4" />;
      case 'PENDING_PAYMENT':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getConsultationIcon = (type: string) => {
    switch (type) {
      case 'VIDEO':
        return <Video className="w-5 h-5" />;
      case 'PHONE':
        return <Phone className="w-5 h-5" />;
      case 'IN_PERSON':
        return <MapPin className="w-5 h-5" />;
      default:
        return <Calendar className="w-5 h-5" />;
    }
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return {
      date: date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      }),
      time: date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      })
    };
  };

  const isUpcoming = (dateStr: string) => {
    return new Date(dateStr) > new Date();
  };

  const handleViewDetails = (bookingId: string) => {
    navigate(`/bookings/${bookingId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Bookings</h1>
          <p className="text-gray-600 mt-2">
            Manage your consultation bookings and appointments
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Role Toggle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                View As
              </label>
              <div className="flex rounded-lg border border-gray-300 overflow-hidden">
                <button
                  onClick={() => setRole('CLIENT')}
                  className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                    role === 'CLIENT'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <User className="w-4 h-4 inline mr-2" />
                  Client
                </button>
                <button
                  onClick={() => setRole('LAWYER')}
                  className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                    role === 'LAWYER'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <User className="w-4 h-4 inline mr-2" />
                  Lawyer
                </button>
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING_PAYMENT">Pending Payment</option>
                <option value="PAYMENT_CONFIRMED">Payment Confirmed</option>
                <option value="SCHEDULED">Scheduled</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            {/* Upcoming Toggle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time Range
              </label>
              <div className="flex items-center h-10">
                <input
                  type="checkbox"
                  id="upcomingOnly"
                  checked={showUpcoming}
                  onChange={(e) => setShowUpcoming(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="upcomingOnly" className="ml-2 text-sm text-gray-700">
                  Show upcoming only
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Bookings List */}
        {bookings.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings found</h3>
            <p className="text-gray-600 mb-6">
              {showUpcoming 
                ? "You don't have any upcoming bookings yet."
                : "You don't have any bookings matching the selected filters."}
            </p>
            {role === 'CLIENT' && (
              <button
                onClick={() => navigate('/lawyers')}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Browse Lawyers
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => {
              const startDateTime = formatDateTime(booking.scheduledStartTime);
              const endTime = formatDateTime(booking.scheduledEndTime).time;
              const otherParty = role === 'CLIENT' ? booking.lawyer : booking.client;
              const upcoming = isUpcoming(booking.scheduledStartTime);

              return (
                <div
                  key={booking.id}
                  className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleViewDetails(booking.id)}
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        {/* Consultation Type Icon */}
                        <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                          {getConsultationIcon(booking.consultationType)}
                        </div>

                        {/* Booking Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {booking.consultationType.replace('_', ' ')} Consultation
                            </h3>
                            <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(booking.status)}`}>
                              {getStatusIcon(booking.status)}
                              <span>{booking.status.replace('_', ' ')}</span>
                            </span>
                            {upcoming && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
                                Upcoming
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div className="flex items-center space-x-2 text-gray-600">
                              <User className="w-4 h-4" />
                              <span>
                                {role === 'CLIENT' ? 'Lawyer: ' : 'Client: '}
                                <span className="font-medium text-gray-900">
                                  {otherParty.firstName} {otherParty.lastName}
                                </span>
                              </span>
                            </div>

                            <div className="flex items-center space-x-2 text-gray-600">
                              <Calendar className="w-4 h-4" />
                              <span>{startDateTime.date}</span>
                            </div>

                            <div className="flex items-center space-x-2 text-gray-600">
                              <Clock className="w-4 h-4" />
                              <span>{startDateTime.time} - {endTime}</span>
                            </div>
                          </div>

                          {role === 'LAWYER' && booking.lawyer.lawyerProfile && (
                            <div className="mt-2 text-sm text-gray-500">
                              Specializations: {booking.lawyer.lawyerProfile.specializations.join(', ')}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Amount */}
                      <div className="text-right ml-4">
                        <div className="text-lg font-bold text-gray-900">
                          KES {Number(booking.clientPaymentAmount).toLocaleString()}
                        </div>
                        <div className={`text-xs mt-1 ${
                          booking.clientPaymentStatus === 'COMPLETED' 
                            ? 'text-green-600' 
                            : 'text-yellow-600'
                        }`}>
                          {booking.clientPaymentStatus === 'COMPLETED' ? 'Paid' : 'Payment Pending'}
                        </div>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                      <div className="text-xs text-gray-500">
                        Booked {new Date(booking.createdAt).toLocaleDateString()}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewDetails(booking.id);
                        }}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        View Details →
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
