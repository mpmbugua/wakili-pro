import React, { useState } from 'react';
import { Calendar, Clock, User, Video, Phone, MessageSquare, ArrowLeft } from 'lucide-react';
import { GlobalLayout } from '@/components/layout/GlobalLayout';
import { useNavigate } from 'react-router-dom';
export const NewConsultationPage: React.FC = () => {
  const navigate = useNavigate();
  const [consultationType, setConsultationType] = useState<'video' | 'phone' | 'in-person'>('video');
  return (
    <GlobalLayout>
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Client</label>
            <input
              type="text"
              placeholder="Search or select client..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Consultation Type</label>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setConsultationType('video')}
                className={\p-4 border-2 rounded-lg transition \\}
              >
                <Video className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                <span className="text-sm font-medium">Video Call</span>
              </button>
              <button
                onClick={() => setConsultationType('phone')}
                className={\p-4 border-2 rounded-lg transition \\}
              >
                <Phone className="h-6 w-6 mx-auto mb-2 text-green-600" />
                <span className="text-sm font-medium">Phone Call</span>
              </button>
              <button
                onClick={() => setConsultationType('in-person')}
                className={\p-4 border-2 rounded-lg transition \\}
              >
                <User className="h-6 w-6 mx-auto mb-2 text-purple-600" />
                <span className="text-sm font-medium">In Person</span>
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
              <input
                type="date"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
              <input
                type="time"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Duration (minutes)</label>
            <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
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
              placeholder="Add consultation notes or agenda..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button
              onClick={() => navigate(-1)}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
            >
              Cancel
            </button>
            <button
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
            >
              Schedule Consultation
            </button>
          </div>
        </div>
      </div>
    </GlobalLayout>
  );
};
