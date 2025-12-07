import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar as CalendarIcon, Clock, Video, MapPin, User, Phone, Mail, Plus, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useAuthStore } from '../store/authStore';
import axiosInstance from '../lib/axios';

interface Appointment {
  id: string;
  title: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  date: string;
  time: string;
  endTime?: string;
  type: 'video' | 'phone' | 'in-person';
  status: 'upcoming' | 'completed' | 'cancelled';
  location?: string;
  notes?: string;
}

export const CalendarPage: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'video' | 'phone' | 'in-person'>('all');

  useEffect(() => {
    fetchAppointments();
  }, [currentDate]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      // Fetch consultations/bookings for the current month
      const response = await axiosInstance.get('/consultations', {
        params: {
          month: currentDate.getMonth() + 1,
          year: currentDate.getFullYear()
        }
      });
      
      if (response.data.success && response.data.data) {
        setAppointments(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch appointments:', error);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days in the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const getAppointmentsForDate = (date: Date | null) => {
    if (!date) return [];
    const dateStr = date.toISOString().split('T')[0];
    return appointments.filter(apt => apt.date === dateStr);
  };

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  const isToday = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date: Date | null) => {
    if (!date || !selectedDate) return false;
    return date.toDateString() === selectedDate.toDateString();
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const days = getDaysInMonth(currentDate);
  const selectedDateAppointments = selectedDate ? getAppointmentsForDate(selectedDate).filter(apt => 
    filterType === 'all' || apt.type === filterType
  ) : [];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="h-4 w-4" />;
      case 'phone': return <Phone className="h-4 w-4" />;
      case 'in-person': return <MapPin className="h-4 w-4" />;
      default: return <CalendarIcon className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'video': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'phone': return 'bg-green-100 text-green-700 border-green-200';
      case 'in-person': return 'bg-purple-100 text-purple-700 border-purple-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Calendar</h1>
            <p className="text-gray-600 mt-1">Manage your consultations and appointments</p>
          </div>
          <Button variant="default" onClick={() => navigate('/lawyer/consultations')}>
            <Plus className="h-4 w-4 mr-2" />
            New Appointment
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar View */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={goToToday}>
                Today
              </Button>
              <Button variant="ghost" size="sm" onClick={goToPreviousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={goToNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Day Names */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {dayNames.map(day => (
              <div key={day} className="text-center text-sm font-medium text-gray-600 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-2">
              {days.map((day, index) => {
                const dayAppointments = day ? getAppointmentsForDate(day) : [];
                return (
                  <button
                    key={index}
                    onClick={() => day && setSelectedDate(day)}
                    disabled={!day}
                    className={`
                      aspect-square p-2 rounded-lg border transition-all
                      ${!day ? 'invisible' : ''}
                      ${isToday(day) ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:border-emerald-300'}
                      ${isSelected(day) ? 'bg-emerald-100 border-emerald-500 ring-2 ring-emerald-500' : ''}
                      ${dayAppointments.length > 0 ? 'font-semibold' : ''}
                    `}
                  >
                    {day && (
                      <>
                        <div className="text-sm text-gray-900">{day.getDate()}</div>
                        {dayAppointments.length > 0 && (
                          <div className="flex justify-center gap-0.5 mt-1">
                            {dayAppointments.slice(0, 3).map((apt, i) => (
                              <div
                                key={i}
                                className={`w-1.5 h-1.5 rounded-full ${
                                  apt.type === 'video' ? 'bg-blue-500' :
                                  apt.type === 'phone' ? 'bg-green-500' :
                                  'bg-purple-500'
                                }`}
                              />
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Legend */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm font-medium text-gray-700 mb-2">Appointment Types:</p>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-gray-600">Video Call</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-gray-600">Phone Call</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                <span className="text-gray-600">In-Person</span>
              </div>
            </div>
          </div>
        </div>

        {/* Appointments Sidebar */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {selectedDate ? selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Select a date'}
            </h3>
            {selectedDate && (
              <Button variant="ghost" size="sm" onClick={() => setSelectedDate(null)}>
                Clear
              </Button>
            )}
          </div>

          {/* Filter */}
          {selectedDate && selectedDateAppointments.length > 0 && (
            <div className="mb-4">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">All Types</option>
                <option value="video">Video Calls</option>
                <option value="phone">Phone Calls</option>
                <option value="in-person">In-Person</option>
              </select>
            </div>
          )}

          {/* Appointments List */}
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {!selectedDate ? (
              <div className="text-center py-12">
                <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">Select a date to view appointments</p>
              </div>
            ) : selectedDateAppointments.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No appointments on this date</p>
              </div>
            ) : (
              selectedDateAppointments.map(appointment => (
                <div
                  key={appointment.id}
                  className={`border rounded-lg p-4 ${getTypeColor(appointment.type)}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(appointment.type)}
                      <span className="font-medium">{appointment.time}</span>
                      {appointment.endTime && (
                        <span className="text-sm">- {appointment.endTime}</span>
                      )}
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      appointment.status === 'upcoming' ? 'bg-blue-100 text-blue-700' :
                      appointment.status === 'completed' ? 'bg-green-100 text-green-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {appointment.status}
                    </span>
                  </div>
                  
                  <h4 className="font-semibold mb-2">{appointment.title || 'Consultation'}</h4>
                  
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="h-3 w-3" />
                      <span>{appointment.clientName}</span>
                    </div>
                    {appointment.clientPhone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-3 w-3" />
                        <span>{appointment.clientPhone}</span>
                      </div>
                    )}
                    {appointment.clientEmail && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-3 w-3" />
                        <span>{appointment.clientEmail}</span>
                      </div>
                    )}
                    {appointment.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3 w-3" />
                        <span>{appointment.location}</span>
                      </div>
                    )}
                  </div>

                  {appointment.notes && (
                    <div className="mt-3 pt-3 border-t border-current border-opacity-20">
                      <p className="text-sm italic">{appointment.notes}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
