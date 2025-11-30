import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  Mail, 
  Phone, 
  MapPin,
  Briefcase,
  Calendar,
  Shield,
  AlertCircle,
  Trash2
} from 'lucide-react';
import axiosInstance from '../../lib/axios';

interface LawyerApplication {
  id: string;
  licenseNumber: string;
  yearOfAdmission: number;
  specializations: string[];
  location: string | any;
  bio: string;
  yearsOfExperience: number;
  linkedInProfile?: string;
  isVerified: boolean;
  tier: string;
  createdAt: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    profileImageUrl?: string;
    createdAt: string;
    verificationStatus: string;
  };
}

export const AdminLawyerApproval: React.FC = () => {
  const [pendingLawyers, setPendingLawyers] = useState<LawyerApplication[]>([]);
  const [verifiedLawyers, setVerifiedLawyers] = useState<LawyerApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'verified'>('pending');
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchLawyers();
  }, [activeTab]);

  const fetchLawyers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const endpoint = activeTab === 'pending' 
        ? '/admin/lawyers/pending' 
        : '/admin/lawyers/verified';
      
      const response = await axiosInstance.get(endpoint);
      
      if (response.data.success) {
        if (activeTab === 'pending') {
          setPendingLawyers(response.data.data);
        } else {
          setVerifiedLawyers(response.data.data);
        }
      }
    } catch (err: any) {
      console.error('Fetch lawyers error:', err);
      setError(err.response?.data?.message || 'Failed to fetch lawyers');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (lawyerId: string) => {
    console.log('🚀 handleApprove called with lawyerId:', lawyerId);
    
    if (!confirm('Are you sure you want to approve this lawyer?')) {
      console.log('User cancelled approval');
      return;
    }

    try {
      setProcessingId(lawyerId);
      console.log('Approving lawyer:', lawyerId);
      console.log('API endpoint:', `/admin/lawyers/${lawyerId}/approve`);
      
      const response = await axiosInstance.post(`/admin/lawyers/${lawyerId}/approve`);
      
      console.log('Approve response:', response.data);
      
      if (response.data.success) {
        // Remove from pending list
        setPendingLawyers(prev => prev.filter(l => l.id !== lawyerId));
        alert('✅ Lawyer approved successfully! Switching to Verified tab...');
        // Switch to verified tab and refresh
        setActiveTab('verified');
      }
    } catch (err: any) {
      console.error('Approve error:', err);
      console.error('Error response:', err.response);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to approve lawyer';
      alert('❌ Error: ' + errorMessage);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (lawyerId: string) => {
    console.log('🚀 handleReject called with lawyerId:', lawyerId);
    
    const reason = prompt('Enter rejection reason (optional):');
    
    if (reason === null) {
      // User clicked cancel
      console.log('User cancelled rejection');
      return;
    }
    
    try {
      setProcessingId(lawyerId);
      console.log('Rejecting lawyer:', lawyerId, 'with reason:', reason);
      console.log('API endpoint:', `/admin/lawyers/${lawyerId}/reject`);
      
      const response = await axiosInstance.post(`/admin/lawyers/${lawyerId}/reject`, {
        reason
      });
      
      console.log('Reject response:', response.data);
      
      if (response.data.success) {
        // Remove from pending list
        setPendingLawyers(prev => prev.filter(l => l.id !== lawyerId));
        alert('✅ Lawyer application rejected');
        // Refresh the list
        fetchLawyers();
      }
    } catch (err: any) {
      console.error('Reject error:', err);
      console.error('Error response:', err.response);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to reject lawyer';
      alert('❌ Error: ' + errorMessage);
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (lawyerId: string) => {
    console.log('🗑️ handleDelete called with lawyerId:', lawyerId);
    
    if (!confirm('⚠️ Are you sure you want to DELETE this lawyer?\n\nThis action cannot be undone and will:\n- Delete the lawyer profile\n- Delete the user account\n- Remove all associated data')) {
      console.log('User cancelled deletion');
      return;
    }
    
    try {
      setProcessingId(lawyerId);
      console.log('Deleting lawyer:', lawyerId);
      console.log('API endpoint:', `/admin/lawyers/${lawyerId}`);
      
      const response = await axiosInstance.delete(`/admin/lawyers/${lawyerId}`);
      
      console.log('Delete response:', response.data);
      
      if (response.data.success) {
        // Remove from both lists
        setPendingLawyers(prev => prev.filter(l => l.id !== lawyerId));
        setVerifiedLawyers(prev => prev.filter(l => l.id !== lawyerId));
        alert('✅ Lawyer deleted successfully');
        // Refresh the list
        fetchLawyers();
      }
    } catch (err: any) {
      console.error('Delete error:', err);
      console.error('Error response:', err.response);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to delete lawyer';
      alert('❌ Error: ' + errorMessage);
    } finally {
      setProcessingId(null);
    }
  };

  const LawyerCard: React.FC<{ lawyer: LawyerApplication }> = ({ lawyer }) => {
    const location = typeof lawyer.location === 'string' 
      ? JSON.parse(lawyer.location) 
      : lawyer.location;

    console.log('Rendering LawyerCard:', {
      id: lawyer.id,
      name: `${lawyer.user.firstName} ${lawyer.user.lastName}`,
      isVerified: lawyer.isVerified,
      showButtons: !lawyer.isVerified
    });

    return (
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow">
        <div className="flex items-start gap-4">
          {/* Profile Image */}
          <div className="flex-shrink-0">
            {lawyer.user.profileImageUrl ? (
              <img
                src={lawyer.user.profileImageUrl}
                alt={`${lawyer.user.firstName} ${lawyer.user.lastName}`}
                className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
                <User className="h-10 w-10 text-gray-400" />
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex-1">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {lawyer.user.firstName} {lawyer.user.lastName}
                </h3>
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium mt-1 ${
                  lawyer.tier === 'FREE' ? 'bg-gray-100 text-gray-700' :
                  lawyer.tier === 'LITE' ? 'bg-blue-100 text-blue-700' :
                  'bg-purple-100 text-purple-700'
                }`}>
                  <Shield className="h-3 w-3" />
                  {lawyer.tier} Tier
                </span>
              </div>
              
              {lawyer.isVerified ? (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">
                  <CheckCircle className="h-4 w-4" />
                  Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-700">
                  <Clock className="h-4 w-4" />
                  Pending
                </span>
              )}
            </div>

            {/* Contact Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-400" />
                <span>{lawyer.user.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-400" />
                <span>{lawyer.user.phoneNumber}</span>
              </div>
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-gray-400" />
                <span>License: {lawyer.licenseNumber}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span>Admitted: {lawyer.yearOfAdmission}</span>
              </div>
              {location?.county && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span>{location.county}, Kenya</span>
                </div>
              )}
            </div>

            {/* Specializations */}
            <div className="mb-3">
              <p className="text-xs font-medium text-gray-500 mb-1">Specializations:</p>
              <div className="flex flex-wrap gap-1">
                {lawyer.specializations.map((spec, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full"
                  >
                    {spec}
                  </span>
                ))}
              </div>
            </div>

            {/* Bio */}
            {lawyer.bio && (
              <div className="mb-3">
                <p className="text-xs font-medium text-gray-500 mb-1">Bio:</p>
                <p className="text-sm text-gray-700 line-clamp-2">{lawyer.bio}</p>
              </div>
            )}

            {/* LinkedIn */}
            {lawyer.linkedInProfile && (
              <div className="mb-3">
                <a
                  href={lawyer.linkedInProfile}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline"
                >
                  View LinkedIn Profile →
                </a>
              </div>
            )}

            {/* Actions */}
            {!lawyer.isVerified ? (
              <div className="flex gap-2 mt-4">
                <button
                  type="button"
                  onClick={(e) => {
                    console.log('✅ Approve button clicked!', lawyer.id);
                    e.preventDefault();
                    e.stopPropagation();
                    handleApprove(lawyer.id);
                  }}
                  disabled={processingId === lawyer.id}
                  className="flex-1 inline-flex justify-center items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <CheckCircle className="h-4 w-4" />
                  {processingId === lawyer.id ? 'Approving...' : 'Approve'}
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    console.log('❌ Reject button clicked!', lawyer.id);
                    e.preventDefault();
                    e.stopPropagation();
                    handleReject(lawyer.id);
                  }}
                  disabled={processingId === lawyer.id}
                  className="flex-1 inline-flex justify-center items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <XCircle className="h-4 w-4" />
                  {processingId === lawyer.id ? 'Rejecting...' : 'Reject'}
                </button>
              </div>
            ) : (
              <div className="flex gap-2 mt-4">
                <button
                  type="button"
                  onClick={(e) => {
                    console.log('🗑️ Delete button clicked!', lawyer.id);
                    e.preventDefault();
                    e.stopPropagation();
                    handleDelete(lawyer.id);
                  }}
                  disabled={processingId === lawyer.id}
                  className="flex-1 inline-flex justify-center items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                  {processingId === lawyer.id ? 'Deleting...' : 'Delete Lawyer'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Lawyer Applications</h1>
        <p className="text-gray-600">Review and approve lawyer registration applications</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'pending'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Pending ({pendingLawyers.length})
        </button>
        <button
          onClick={() => setActiveTab('verified')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'verified'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Verified ({verifiedLawyers.length})
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-red-900">Error</h3>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {activeTab === 'pending' && pendingLawyers.length === 0 && (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No pending applications</p>
            </div>
          )}
          {activeTab === 'verified' && verifiedLawyers.length === 0 && (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No verified lawyers yet</p>
            </div>
          )}
          
          {activeTab === 'pending' && pendingLawyers.map(lawyer => (
            <LawyerCard key={lawyer.id} lawyer={lawyer} />
          ))}
          {activeTab === 'verified' && verifiedLawyers.map(lawyer => (
            <LawyerCard key={lawyer.id} lawyer={lawyer} />
          ))}
        </div>
      )}
    </div>
  );
};
