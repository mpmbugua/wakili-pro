import React, { useState, useEffect } from 'react';
import { Calendar, Clock, X, Loader } from 'lucide-react';
import axiosInstance from '../lib/axios';

interface TimeSlot {
  start: string;
  end: string;
  available: boolean;
}

interface AvailableSlotsProps {
  lawyerId: string;
  selectedDate: Date;
  onSlotSelect: (slot: TimeSlot) => void;
  selectedSlot?: TimeSlot;
  slotDuration?: number; // in minutes
}

export const AvailableSlots: React.FC<AvailableSlotsProps> = ({
  lawyerId,
  selectedDate,
  onSlotSelect,
  selectedSlot,
  slotDuration = 60
}) => {
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAvailableSlots();
  }, [lawyerId, selectedDate, slotDuration]);

  const fetchAvailableSlots = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const dateStr = selectedDate.toISOString().split('T')[0]; // YYYY-MM-DD
      const response = await axiosInstance.get(
        `/lawyers/${lawyerId}/available-slots`,
        {
          params: {
            date: dateStr,
            duration: slotDuration
          }
        }
      );

      if (response.data.success) {
        setSlots(response.data.data);
      } else {
        setError('Failed to load available slots');
      }
    } catch (err: any) {
      console.error('Error fetching slots:', err);
      setError(err.response?.data?.message || 'Failed to load available slots');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const isSelected = (slot: TimeSlot): boolean => {
    return selectedSlot?.start === slot.start && selectedSlot?.end === slot.end;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="h-8 w-8 text-blue-600 animate-spin" />
        <span className="ml-3 text-gray-600">Loading available slots...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center text-red-800">
          <X className="h-5 w-5 mr-2" />
          <p>{error}</p>
        </div>
        <button
          onClick={fetchAvailableSlots}
          className="mt-3 text-sm text-red-600 hover:text-red-800 font-medium"
        >
          Try again
        </button>
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600 font-medium">No available slots on this date</p>
        <p className="text-sm text-gray-500 mt-1">
          Please try selecting another date
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center mb-4">
        <Clock className="h-5 w-5 text-blue-600 mr-2" />
        <h3 className="text-lg font-semibold text-gray-900">
          Available Time Slots
        </h3>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {slots.map((slot, index) => (
          <button
            key={index}
            onClick={() => onSlotSelect(slot)}
            className={`
              px-4 py-3 rounded-lg border-2 text-center transition-all
              ${
                isSelected(slot)
                  ? 'border-blue-600 bg-blue-50 text-blue-700 font-semibold'
                  : 'border-gray-300 bg-white text-gray-700 hover:border-blue-400 hover:bg-blue-50'
              }
            `}
          >
            <div className="text-sm font-medium">
              {formatTime(slot.start)}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {slotDuration} min
            </div>
          </button>
        ))}
      </div>

      {selectedSlot && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-900">
            <strong>Selected:</strong> {formatTime(selectedSlot.start)} - {formatTime(selectedSlot.end)}
          </p>
        </div>
      )}
    </div>
  );
};
