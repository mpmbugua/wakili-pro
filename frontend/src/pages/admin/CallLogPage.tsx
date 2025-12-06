import React, { useState, useEffect } from 'react';
import { Phone, Plus, Search, Filter, Calendar, User, FileText, ShoppingCart, Users, CheckCircle } from 'lucide-react';
import axiosInstance from '../../services/api';
import { useAuthStore } from '../../store/authStore';

interface CallLog {
  id: string;
  callerName: string;
  callerPhone: string;
  callerEmail?: string;
  issueCategory: string;
  issueDescription: string;
  recommendation: 'DOCUMENT_PURCHASE' | 'LAWYER_SESSION' | 'SERVICE_PACKAGE' | 'DOCUMENT_REVIEW';
  recommendationNotes?: string;
  handledBy: string;
  callDuration?: number;
  followUpRequired: boolean;
  followUpDate?: string;
  status: 'PENDING' | 'CONTACTED' | 'CONVERTED' | 'CLOSED';
  createdAt: string;
}

export const CallLogPage: React.FC = () => {
  const { user } = useAuthStore();
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRecommendation, setFilterRecommendation] = useState<string>('');

  const [formData, setFormData] = useState({
    callerName: '',
    callerPhone: '',
    callerEmail: '',
    issueCategory: '',
    issueDescription: '',
    recommendation: 'LAWYER_SESSION' as CallLog['recommendation'],
    recommendationNotes: '',
    callDuration: '',
    followUpRequired: false,
    followUpDate: ''
  });

  useEffect(() => {
    fetchCallLogs();
  }, []);

  const fetchCallLogs = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/admin/call-logs');
      setCallLogs(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch call logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axiosInstance.post('/admin/call-logs', {
        ...formData,
        callDuration: formData.callDuration ? parseInt(formData.callDuration) : undefined,
        handledBy: user?.id
      });
      
      setShowAddModal(false);
      setFormData({
        callerName: '',
        callerPhone: '',
        callerEmail: '',
        issueCategory: '',
        issueDescription: '',
        recommendation: 'LAWYER_SESSION',
        recommendationNotes: '',
        callDuration: '',
        followUpRequired: false,
        followUpDate: ''
      });
      
      fetchCallLogs();
      alert('Call log saved successfully!');
    } catch (error) {
      console.error('Failed to save call log:', error);
      alert('Failed to save call log');
    }
  };

  const getRecommendationIcon = (recommendation: CallLog['recommendation']) => {
    switch (recommendation) {
      case 'DOCUMENT_PURCHASE':
        return <FileText className="w-4 h-4" />;
      case 'LAWYER_SESSION':
        return <Users className="w-4 h-4" />;
      case 'SERVICE_PACKAGE':
        return <ShoppingCart className="w-4 h-4" />;
      case 'DOCUMENT_REVIEW':
        return <CheckCircle className="w-4 h-4" />;
    }
  };

  const getRecommendationColor = (recommendation: CallLog['recommendation']) => {
    switch (recommendation) {
      case 'DOCUMENT_PURCHASE':
        return 'bg-purple-100 text-purple-700';
      case 'LAWYER_SESSION':
        return 'bg-blue-100 text-blue-700';
      case 'SERVICE_PACKAGE':
        return 'bg-green-100 text-green-700';
      case 'DOCUMENT_REVIEW':
        return 'bg-amber-100 text-amber-700';
    }
  };

  const filteredLogs = callLogs.filter(log => {
    const matchesSearch = 
      log.callerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.callerPhone.includes(searchQuery) ||
      log.issueDescription.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = !filterRecommendation || log.recommendation === filterRecommendation;
    
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Direct Call Logs</h1>
        <p className="text-gray-600">Record and track calls from clients seeking legal assistance</p>
      </div>

      {/* Actions Bar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by name, phone, or issue..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filter */}
          <div className="flex items-center gap-3">
            <Filter className="text-gray-400 w-5 h-5" />
            <select
              value={filterRecommendation}
              onChange={(e) => setFilterRecommendation(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Recommendations</option>
              <option value="DOCUMENT_PURCHASE">Document Purchase</option>
              <option value="LAWYER_SESSION">Lawyer Session</option>
              <option value="SERVICE_PACKAGE">Service Package</option>
              <option value="DOCUMENT_REVIEW">Document Review</option>
            </select>

            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Log New Call
            </button>
          </div>
        </div>
      </div>

      {/* Call Logs Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Caller Info
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Issue
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Recommendation
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  Loading call logs...
                </td>
              </tr>
            ) : filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  No call logs found
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-gray-900">{log.callerName}</div>
                      <div className="text-sm text-gray-500">{log.callerPhone}</div>
                      {log.callerEmail && (
                        <div className="text-xs text-gray-400">{log.callerEmail}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <div className="font-medium text-gray-700">{log.issueCategory}</div>
                      <div className="text-gray-500 line-clamp-2">{log.issueDescription}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getRecommendationColor(log.recommendation)}`}>
                        {getRecommendationIcon(log.recommendation)}
                        {log.recommendation.replace('_', ' ')}
                      </span>
                    </div>
                    {log.recommendationNotes && (
                      <div className="text-xs text-gray-500 mt-1">{log.recommendationNotes}</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      log.status === 'CONVERTED' ? 'bg-green-100 text-green-700' :
                      log.status === 'CONTACTED' ? 'bg-blue-100 text-blue-700' :
                      log.status === 'CLOSED' ? 'bg-gray-100 text-gray-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {log.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(log.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Call Log Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Log New Call</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Caller Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Caller Information</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Caller Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.callerName}
                    onChange={(e) => setFormData({ ...formData, callerName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.callerPhone}
                      onChange={(e) => setFormData({ ...formData, callerPhone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="07XXXXXXXX"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email (Optional)
                    </label>
                    <input
                      type="email"
                      value={formData.callerEmail}
                      onChange={(e) => setFormData({ ...formData, callerEmail: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Issue Details */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Issue Details</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Issue Category *
                  </label>
                  <select
                    required
                    value={formData.issueCategory}
                    onChange={(e) => setFormData({ ...formData, issueCategory: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select category...</option>
                    <option value="Property Law">Property Law</option>
                    <option value="Family Law">Family Law</option>
                    <option value="Corporate Law">Corporate Law</option>
                    <option value="Employment Law">Employment Law</option>
                    <option value="Criminal Law">Criminal Law</option>
                    <option value="Contract Law">Contract Law</option>
                    <option value="Debt Recovery">Debt Recovery</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Issue Description *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={formData.issueDescription}
                    onChange={(e) => setFormData({ ...formData, issueDescription: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Describe the caller's legal issue..."
                  />
                </div>
              </div>

              {/* Recommendation */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Recommendation</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Recommended Action *
                  </label>
                  <select
                    required
                    value={formData.recommendation}
                    onChange={(e) => setFormData({ ...formData, recommendation: e.target.value as CallLog['recommendation'] })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="DOCUMENT_PURCHASE">Document Purchase (Marketplace)</option>
                    <option value="LAWYER_SESSION">Book Lawyer Consultation</option>
                    <option value="SERVICE_PACKAGE">Service Request Package</option>
                    <option value="DOCUMENT_REVIEW">Document Review/Certification</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Recommendation Notes
                  </label>
                  <textarea
                    rows={2}
                    value={formData.recommendationNotes}
                    onChange={(e) => setFormData({ ...formData, recommendationNotes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Additional notes about the recommendation..."
                  />
                </div>
              </div>

              {/* Call Details */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Call Details</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Call Duration (minutes)
                    </label>
                    <input
                      type="number"
                      value={formData.callDuration}
                      onChange={(e) => setFormData({ ...formData, callDuration: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Follow-up Date
                    </label>
                    <input
                      type="date"
                      value={formData.followUpDate}
                      onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="followUpRequired"
                    checked={formData.followUpRequired}
                    onChange={(e) => setFormData({ ...formData, followUpRequired: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="followUpRequired" className="text-sm text-gray-700">
                    Follow-up required
                  </label>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                >
                  Save Call Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
