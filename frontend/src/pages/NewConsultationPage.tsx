import React, { useState } from 'react';
import { Calendar, Clock, User, Video, Phone, MessageSquare, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../lib/axios';

export const NewConsultationPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [consultationType, setConsultationType] = useState<'video' | 'phone' | 'in-person'>('video');
  const [formData, setFormData] = useState({
    clientName: '',
    date: '',
    time: '',
    duration: '30',
    notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.clientName || !formData.date || !formData.time) {
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const response = await axiosInstance.post('/consultations', {
        ...formData,
        type: consultationType,
        duration: parseInt(formData.duration)
      });
      
      if (response.data.success) {
        alert('Consultation scheduled successfully!');
        navigate('/lawyer/consultations');
      }
    } catch (error: any) {
      console.error('Error scheduling consultation:', error);
      alert(error.response?.data?.error || 'Failed to schedule consultation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Schedule New Consultation</h1>
          <p className="text-sm text-gray-600 mt-1">Create a new consultation appointment</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
          <form onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Client <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.clientName}
              onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
              placeholder="Search or select client..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Consultation Type</label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setConsultationType('video')}
                className={`p-4 border-2 rounded-lg transition ${consultationType === 'video' ? 'border-blue-600 bg-blue-50' : 'border-gray-300'}`}
              >
                <Video className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                <span className="text-sm font-medium">Video Call</span>
              </button>
              <button
                type="button"
                onClick={() => setConsultationType('phone')}
                className={`p-4 border-2 rounded-lg transition ${consultationType === 'phone' ? 'border-green-600 bg-green-50' : 'border-gray-300'}`}
              >
                <Phone className="h-6 w-6 mx-auto mb-2 text-green-600" />
                <span className="text-sm font-medium">Phone Call</span>
              </button>
              <button
                type="button"
                onClick={() => setConsultationType('in-person')}
                className={`p-4 border-2 rounded-lg transition ${consultationType === 'in-person' ? 'border-purple-600 bg-purple-50' : 'border-gray-300'}`}
              >
                <User className="h-6 w-6 mx-auto mb-2 text-purple-600" />
                <span className="text-sm font-medium">In Person</span>
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                required
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Duration (minutes)</label>
            <select 
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="30">30 minutes</option>
              <option value="60">60 minutes</option>
              <option value="90">90 minutes</option>
              <option value="120">120 minutes</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
            <textarea
              rows={4}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Add consultation notes or agenda..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Scheduling...' : 'Schedule Consultation'}
            </button>
          </div>
          </form>
        </div>
      </div>
    </div>
  );
};
