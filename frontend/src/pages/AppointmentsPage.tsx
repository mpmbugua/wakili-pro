import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, User, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

interface Appointment {
  id: string;
  lawyerName?: string;
  clientName?: string;
  lawyerImage?: string;
  specialty: string;
  scheduledAt: string;
  duration: number;
  location: string;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'CONFIRMED';
  appointmentType: 'IN_PERSON' | 'PHONE' | 'VIDEO';
  fee: number;
}

export const AppointmentsPage: React.FC = () => {
  const { user } = useAuthStore();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('all');
  const isLawyer = user?.role === 'LAWYER';

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API endpoint
      // const response = await axiosInstance.get('/appointments');
      // setAppointments(response.data.data);
      
      // Mock data - different for lawyers vs clients
      if (user?.role === 'LAWYER') {
        // Lawyers see their client appointments
        setAppointments([
          {
            id: '1',
            clientName: 'Peter Maina',
            specialty: 'Real Estate Law',
            scheduledAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
            duration: 90,
            location: 'Your Office - Nairobi CBD',
            status: 'CONFIRMED',
            appointmentType: 'IN_PERSON',
            fee: 5000,
          },
          {
            id: '2',
            clientName: 'Susan Wanjiku',
            specialty: 'Employment Law',
            scheduledAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            duration: 60,
            location: 'Phone Consultation',
            status: 'COMPLETED',
            appointmentType: 'PHONE',
            fee: 2500,
          },
        ]);
      } else {
        // Clients see their appointments with lawyers
        setAppointments([
          {
            id: '1',
            lawyerName: 'David Ochieng',
            specialty: 'Real Estate Law',
            scheduledAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
            duration: 90,
            location: 'Nairobi CBD, Kenya Re Towers',
            status: 'CONFIRMED',
            appointmentType: 'IN_PERSON',
            fee: 5000,
          },
          {
            id: '2',
            lawyerName: 'Grace Wanjiru',
            specialty: 'Employment Law',
            scheduledAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            duration: 60,
            location: 'Phone Consultation',
            status: 'COMPLETED',
            appointmentType: 'PHONE',
            fee: 2500,
          },
        ]);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: Appointment['status']) => {
    const badges = {
      SCHEDULED: { color: 'bg-yellow-100 text-yellow-700', icon: AlertCircle, text: 'Scheduled' },
      CONFIRMED: { color: 'bg-green-100 text-green-700', icon: CheckCircle, text: 'Confirmed' },
      COMPLETED: { color: 'bg-gray-100 text-gray-700', icon: CheckCircle, text: 'Completed' },
      CANCELLED: { color: 'bg-red-100 text-red-700', icon: XCircle, text: 'Cancelled' },
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

  const getTypeBadge = (type: Appointment['appointmentType']) => {
    const types = {
      IN_PERSON: { color: 'bg-blue-100 text-blue-700', text: 'In Person' },
      PHONE: { color: 'bg-purple-100 text-purple-700', text: 'Phone' },
      VIDEO: { color: 'bg-indigo-100 text-indigo-700', text: 'Video Call' },
    };
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${types[type].color}`}>
        {types[type].text}
      </span>
    );
  };

  const filteredAppointments = appointments.filter(appointment => {
    const appointmentDate = new Date(appointment.scheduledAt);
    const now = new Date();
    
    if (filter === 'upcoming') {
      return appointmentDate > now && (appointment.status === 'SCHEDULED' || appointment.status === 'CONFIRMED');
    } else if (filter === 'past') {
      return appointmentDate < now || appointment.status === 'COMPLETED' || appointment.status === 'CANCELLED';
    }
    return true;
  });

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
        <h1 className="text-3xl font-bold text-slate-900">{isLawyer ? 'Client Appointments' : 'My Appointments'}</h1>
        <p className="text-slate-600 mt-2">
          {isLawyer ? 'Manage appointments with your clients' : 'View and manage your scheduled appointments'}
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex space-x-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            filter === 'all'
              ? 'bg-blue-100 text-blue-700'
              : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter('upcoming')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            filter === 'upcoming'
              ? 'bg-blue-100 text-blue-700'
              : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
          }`}
        >
          Upcoming
        </button>
        <button
          onClick={() => setFilter('past')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            filter === 'past'
              ? 'bg-blue-100 text-blue-700'
              : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
          }`}
        >
          Past
        </button>
      </div>

      {/* Appointments List */}
      {filteredAppointments.length === 0 ? (
        <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
          <Calendar className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">No appointments found</h3>
          <p className="text-slate-600 mb-6">You don't have any {filter !== 'all' ? filter : ''} appointments yet.</p>
          <a
            href="/lawyers"
            className="inline-flex items-center px-6 py-3 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition font-medium"
          >
            Find a Lawyer
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAppointments.map((appointment) => (
            <div key={appointment.id} className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-md transition">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start space-x-4">
                  <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <User className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">
                      {isLawyer ? appointment.clientName : appointment.lawyerName}
                    </h3>
                    <p className="text-sm text-slate-600">{appointment.specialty}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end space-y-2">
                  {getStatusBadge(appointment.status)}
                  {getTypeBadge(appointment.appointmentType)}
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4 mb-4">
                <div className="flex items-center space-x-2 text-sm text-slate-600">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(appointment.scheduledAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-slate-600">
                  <Clock className="h-4 w-4" />
                  <span>{new Date(appointment.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({appointment.duration} min)</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-slate-600">
                  <MapPin className="h-4 w-4" />
                  <span className="truncate">{appointment.location}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                <span className="text-sm font-medium text-slate-700">
                  Fee: KES {appointment.fee.toLocaleString()}
                </span>
                {(appointment.status === 'SCHEDULED' || appointment.status === 'CONFIRMED') && (
                  <div className="flex space-x-2">
                    <button className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition text-sm font-medium">
                      Cancel
                    </button>
                    <button className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition text-sm font-medium">
                      Reschedule
                    </button>
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

export default AppointmentsPage;
