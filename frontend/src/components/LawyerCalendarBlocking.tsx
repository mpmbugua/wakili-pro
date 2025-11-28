import React, { useState, useEffect } from 'react';
import { Calendar, Clock, X, Plus, Trash2, Loader, AlertCircle } from 'lucide-react';
import axiosInstance from '../lib/axios';

interface BlockedSlot {
  id: string;
  start: Date;
  end: Date;
  reason?: string;
}

export const LawyerCalendarBlocking: React.FC = () => {
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    fetchBlockedSlots();
  }, []);

  const fetchBlockedSlots = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axiosInstance.get('/lawyers/availability/blocked');
      
      if (response.data.success) {
        setBlockedSlots(response.data.data.map((slot: any) => ({
          ...slot,
          start: new Date(slot.start),
          end: new Date(slot.end)
        })));
      }
    } catch (err: any) {
      console.error('Error fetching blocked slots:', err);
      setError(err.response?.data?.message || 'Failed to load blocked slots');
    } finally {
      setLoading(false);
    }
  };

  const handleBlockSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // Combine date and time
      const start = new Date(`${startDate}T${startTime}`);
      const end = new Date(`${endDate}T${endTime}`);

      // Validate
      if (start >= end) {
        setError('End time must be after start time');
        setSubmitting(false);
        return;
      }

      const response = await axiosInstance.post('/lawyers/availability/block', {
        start: start.toISOString(),
        end: end.toISOString(),
        reason: reason || 'Unavailable'
      });

      if (response.data.success) {
        setSuccessMessage('Time slot blocked successfully');
        setShowForm(false);
        resetForm();
        fetchBlockedSlots(); // Refresh list
      }
    } catch (err: any) {
      console.error('Error blocking slot:', err);
      setError(err.response?.data?.message || 'Failed to block time slot');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnblockSlot = async (slotId: string) => {
    if (!confirm('Are you sure you want to unblock this time slot?')) {
      return;
    }

    try {
      const response = await axiosInstance.delete(`/lawyers/availability/${slotId}`);
      
      if (response.data.success) {
        setSuccessMessage('Time slot unblocked successfully');
        fetchBlockedSlots(); // Refresh list
      }
    } catch (err: any) {
      console.error('Error unblocking slot:', err);
      setError(err.response?.data?.message || 'Failed to unblock time slot');
    }
  };

  const resetForm = () => {
    setStartDate('');
    setStartTime('');
    setEndDate('');
    setEndTime('');
    setReason('');
  };

  const formatDateTime = (date: Date): string => {
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Auto-fill end date when start date is selected
  const handleStartDateChange = (value: string) => {
    setStartDate(value);
    if (!endDate) {
      setEndDate(value);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Calendar className="h-6 w-6 text-blue-600 mr-2" />
          <h2 className="text-2xl font-bold text-gray-900">Block Time Slots</h2>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
        >
          {showForm ? (
            <>
              <X className="h-5 w-5 mr-2" />
              Cancel
            </>
          ) : (
            <>
              <Plus className="h-5 w-5 mr-2" />
              Block Time
            </>
          )}
        </button>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center">
          <div className="flex-1 text-green-800">{successMessage}</div>
          <button onClick={() => setSuccessMessage(null)} className="text-green-600 hover:text-green-800">
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
          <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
          <div className="flex-1 text-red-800">{error}</div>
          <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800">
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Block Time Form */}
      {showForm && (
        <form onSubmit={handleBlockSlot} className="mb-6 p-6 bg-gray-50 rounded-lg border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Start Date & Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => handleStartDateChange(e.target.value)}
                required
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Time
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* End Date & Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                min={startDate || new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Time
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Reason */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason (Optional)
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g., Vacation, Court appearance, Personal time"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="mt-4 w-full flex items-center justify-center px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <Loader className="h-5 w-5 mr-2 animate-spin" />
                Blocking...
              </>
            ) : (
              <>
                <Clock className="h-5 w-5 mr-2" />
                Block Time Slot
              </>
            )}
          </button>
        </form>
      )}

      {/* Blocked Slots List */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Currently Blocked Times
        </h3>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="h-8 w-8 text-blue-600 animate-spin" />
            <span className="ml-3 text-gray-600">Loading blocked slots...</span>
          </div>
        ) : blockedSlots.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <Clock className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No blocked time slots</p>
            <p className="text-sm text-gray-500 mt-1">
              Click "Block Time" to mark yourself unavailable
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {blockedSlots.map((slot) => (
              <div
                key={slot.id}
                className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center text-gray-900 font-medium">
                    <Clock className="h-4 w-4 text-red-600 mr-2" />
                    {formatDateTime(slot.start)} → {formatDateTime(slot.end)}
                  </div>
                  {slot.reason && (
                    <p className="text-sm text-gray-600 mt-1 ml-6">{slot.reason}</p>
                  )}
                </div>
                <button
                  onClick={() => handleUnblockSlot(slot.id)}
                  className="ml-4 p-2 text-red-600 hover:bg-red-100 rounded-lg transition-all"
                  title="Unblock this time slot"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
