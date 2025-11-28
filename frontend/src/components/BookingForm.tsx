import React, { useState } from 'react';
import { Video, Phone, MapPin, Loader, AlertCircle, Check } from 'lucide-react';
import axiosInstance from '../lib/axios';
import { AvailableSlots } from './AvailableSlots';

interface TimeSlot {
  start: string;
  end: string;
  available: boolean;
}

interface LawyerDetails {
  id: string;
  firstName: string;
  lastName: string;
  hourlyRate: number;
  specializations: string[];
  profileImageUrl?: string;
}

interface BookingFormProps {
  lawyer: LawyerDetails;
  onSuccess?: (bookingId: string) => void;
  onCancel?: () => void;
}

type ConsultationType = 'VIDEO' | 'PHONE' | 'IN_PERSON';

export const BookingForm: React.FC<BookingFormProps> = ({ lawyer, onSuccess, onCancel }) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [consultationType, setConsultationType] = useState<ConsultationType>('VIDEO');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [duration, setDuration] = useState(60); // minutes
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'pending' | 'success' | 'failed'>('idle');

  const totalCost = lawyer.hourlyRate * (duration / 60);

  const consultationTypes = [
    { value: 'VIDEO' as ConsultationType, label: 'Video Call', icon: Video, description: 'Meet via video conference' },
    { value: 'PHONE' as ConsultationType, label: 'Phone Call', icon: Phone, description: 'Speak over the phone' },
    { value: 'IN_PERSON' as ConsultationType, label: 'In Person', icon: MapPin, description: 'Meet at office' },
  ];

  const durationOptions = [
    { value: 30, label: '30 minutes' },
    { value: 60, label: '1 hour' },
    { value: 90, label: '1.5 hours' },
    { value: 120, label: '2 hours' },
  ];

  const handleSlotSelect = (slot: TimeSlot) => {
    setSelectedSlot(slot);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedSlot) {
      setError('Please select a time slot');
      return;
    }

    if (!phoneNumber || !phoneNumber.match(/^(\+254|254|0)[17]\d{8}$/)) {
      setError('Please enter a valid Kenyan phone number (e.g., 0712345678)');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create booking and initiate payment
      const response = await axiosInstance.post('/consultations/create', {
        lawyerId: lawyer.id,
        consultationType,
        scheduledStart: selectedSlot.start,
        scheduledEnd: selectedSlot.end,
        phoneNumber,
      });

      if (response.data.success) {
        const booking = response.data.data;
        setPaymentStatus('pending');

        // Poll for payment status
        pollPaymentStatus(booking.id);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create booking. Please try again.');
      setLoading(false);
    }
  };

  const pollPaymentStatus = async (bookingId: string) => {
    const maxAttempts = 40; // 2 minutes (3 seconds * 40)
    let attempts = 0;

    const poll = setInterval(async () => {
      attempts++;

      try {
        const response = await axiosInstance.get(`/consultations/${bookingId}`);
        const booking = response.data.data;

        if (booking.status === 'PAYMENT_CONFIRMED' || booking.clientPaymentStatus === 'COMPLETED') {
          clearInterval(poll);
          setPaymentStatus('success');
          setLoading(false);
          
          setTimeout(() => {
            if (onSuccess) {
              onSuccess(bookingId);
            }
          }, 2000);
        } else if (booking.clientPaymentStatus === 'FAILED' || booking.clientPaymentStatus === 'CANCELLED') {
          clearInterval(poll);
          setPaymentStatus('failed');
          setError('Payment failed. Please try again.');
          setLoading(false);
        }

        if (attempts >= maxAttempts) {
          clearInterval(poll);
          setPaymentStatus('failed');
          setError('Payment timeout. Please check your phone for the M-Pesa prompt.');
          setLoading(false);
        }
      } catch (err) {
        console.error('Error polling payment status:', err);
      }
    }, 3000);
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          {lawyer.profileImageUrl && (
            <img 
              src={lawyer.profileImageUrl} 
              alt={`${lawyer.firstName} ${lawyer.lastName}`}
              className="w-16 h-16 rounded-full object-cover"
            />
          )}
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Book Consultation with {lawyer.firstName} {lawyer.lastName}
            </h2>
            <p className="text-gray-600">KES {lawyer.hourlyRate}/hour</p>
          </div>
        </div>
        {onCancel && (
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <span className="sr-only">Close</span>
            ×
          </button>
        )}
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Consultation Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Consultation Type
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {consultationTypes.map((type) => {
              const Icon = type.icon;
              return (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setConsultationType(type.value)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    consultationType === type.value
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Icon className={`w-6 h-6 mx-auto mb-2 ${
                    consultationType === type.value ? 'text-blue-600' : 'text-gray-400'
                  }`} />
                  <div className="text-sm font-medium text-gray-900">{type.label}</div>
                  <div className="text-xs text-gray-500 mt-1">{type.description}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Duration */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Duration
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {durationOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setDuration(option.value)}
                className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                  duration === option.value
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-gray-200 text-gray-700 hover:border-gray-300'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Date Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Select Date
          </label>
          <input
            type="date"
            value={selectedDate.toISOString().split('T')[0]}
            onChange={(e) => setSelectedDate(new Date(e.target.value))}
            min={new Date().toISOString().split('T')[0]}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Available Time Slots */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Available Time Slots
          </label>
          <AvailableSlots
            lawyerId={lawyer.id}
            selectedDate={selectedDate}
            onSlotSelect={handleSlotSelect}
            selectedSlot={selectedSlot || undefined}
            slotDuration={duration}
          />
        </div>

        {/* Phone Number */}
        <div>
          <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-2">
            M-Pesa Phone Number
          </label>
          <input
            type="tel"
            id="phoneNumber"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="0712345678"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
          <p className="mt-1 text-xs text-gray-500">
            Enter the phone number to receive M-Pesa payment prompt
          </p>
        </div>

        {/* Summary */}
        {selectedSlot && (
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <h3 className="font-semibold text-gray-900">Booking Summary</h3>
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-600">Date:</span>
                <span className="font-medium">{selectedDate.toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Time:</span>
                <span className="font-medium">
                  {formatTime(selectedSlot.start)} - {formatTime(selectedSlot.end)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Type:</span>
                <span className="font-medium">{consultationType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Duration:</span>
                <span className="font-medium">{duration} minutes</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-200">
                <span className="text-gray-900 font-semibold">Total Cost:</span>
                <span className="text-lg font-bold text-blue-600">KES {totalCost.toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}

        {/* Payment Status */}
        {paymentStatus === 'pending' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <Loader className="w-5 h-5 text-blue-600 animate-spin" />
              <div>
                <p className="font-medium text-blue-900">Waiting for M-Pesa payment...</p>
                <p className="text-sm text-blue-700 mt-1">
                  Check your phone for the M-Pesa prompt and enter your PIN
                </p>
              </div>
            </div>
          </div>
        )}

        {paymentStatus === 'success' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <Check className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-medium text-green-900">Payment successful!</p>
                <p className="text-sm text-green-700 mt-1">
                  Your booking has been confirmed. Redirecting...
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex space-x-4">
          <button
            type="submit"
            disabled={!selectedSlot || loading || paymentStatus === 'pending'}
            className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <span>Book & Pay KES {totalCost.toLocaleString()}</span>
            )}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
};
