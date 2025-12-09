import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  MapPin, 
  Briefcase, 
  Award, 
  Linkedin,
  Mail,
  Phone,
  Calendar,
  CheckCircle,
  Clock,
  Edit,
  Crown,
  Shield,
  Save,
  X,
  Upload
} from 'lucide-react';
import axiosInstance from '../lib/axios';

interface LawyerProfileData {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    profileImageUrl?: string;
    createdAt: string;
  };
  lawyerProfile: {
    id: string;
    licenseNumber: string;
    yearOfAdmission: number;
    specializations: string[];
    location: string;
    bio: string;
    yearsOfExperience: number;
    linkedInProfile?: string;
    isVerified: boolean;
    tier: 'FREE' | 'LITE' | 'PRO';
    rating: number;
    reviewCount: number;
  };
}

export const LawyerProfile: React.FC = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<LawyerProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editedProfile, setEditedProfile] = useState<any>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // Check if token exists
        const authStorage = localStorage.getItem('wakili-auth-storage');
        if (!authStorage) {
          setError('Not authenticated. Please log in.');
          setLoading(false);
          navigate('/login');
          return;
        }

        const response = await axiosInstance.get('/users/profile');
        
        if (response.data.success && response.data.data) {
          setProfile(response.data.data);
          setEditedProfile(response.data.data);
        } else {
          setError('Failed to load profile');
        }
      } catch (err: any) {
        console.error('Profile fetch error:', err);
        
        // Handle token expiration
        if (err.response?.status === 401 || err.response?.status === 403) {
          setError('Session expired. Please log in again.');
          localStorage.removeItem('wakili-auth-storage');
          setTimeout(() => navigate('/login'), 2000);
        } else {
          setError(err.response?.data?.message || 'Failed to load profile');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      // Update user info
      await axiosInstance.put('/users/profile', {
        firstName: editedProfile.user.firstName,
        lastName: editedProfile.user.lastName,
        phoneNumber: editedProfile.user.phoneNumber
      });

      // Update lawyer profile
      await axiosInstance.put('/lawyers/profile', {
        bio: editedProfile.lawyerProfile.bio,
        yearsOfExperience: editedProfile.lawyerProfile.yearsOfExperience,
        linkedInProfile: editedProfile.lawyerProfile.linkedInProfile,
        location: typeof editedProfile.lawyerProfile.location === 'string'
          ? editedProfile.lawyerProfile.location
          : JSON.stringify(editedProfile.lawyerProfile.location)
      });

      setProfile(editedProfile);
      setIsEditing(false);
    } catch (err: any) {
      console.error('Save error:', err);
      setError(err.response?.data?.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedProfile(profile);
    setIsEditing(false);
    setError(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !profile || !editedProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <X className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {error?.includes('token') || error?.includes('Session') 
                ? 'Session Expired'
                : 'Unable to Load Profile'}
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              {error || 'There was an error loading your profile data.'}
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Add null check before destructuring to prevent crash
  if (!profile) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <p className="text-gray-500">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Ensure user object exists in profile
  if (!profile.user) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-8">
          <p className="text-red-700">Profile data incomplete. Please try logging in again.</p>
          <button 
            onClick={() => navigate('/login')}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const { user, lawyerProfile } = profile;
  
  // Additional safety check
  if (!user || !lawyerProfile) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-8">
          <p className="text-red-700">Profile data incomplete. Please try logging in again.</p>
          <button 
            onClick={() => navigate('/login')}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }
  
  const location = lawyerProfile?.location 
    ? (() => {
        if (typeof lawyerProfile.location === 'string') {
          try {
            return JSON.parse(lawyerProfile.location);
          } catch {
            return { county: lawyerProfile.location };
          }
        }
        return lawyerProfile.location;
      })()
    : {};

  const tierBadges = {
    FREE: { color: 'bg-gray-100 text-gray-700', icon: User, label: 'Free Tier' },
    LITE: { color: 'bg-blue-100 text-blue-700', icon: Shield, label: 'Lite' },
    PRO: { color: 'bg-purple-100 text-purple-700', icon: Crown, label: 'Pro' }
  };

  const tierInfo = tierBadges[lawyerProfile?.tier || 'FREE'] || tierBadges.FREE;
  const TierIcon = tierInfo.icon;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header Card */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 h-32"></div>
        <div className="px-8 pb-8">
          <div className="flex flex-col md:flex-row items-start md:items-end -mt-16 mb-4">
            <div className="relative">
              {user?.profileImageUrl ? (
                <img
                  src={user.profileImageUrl}
                  alt={`${user.firstName} ${user.lastName}`}
                  className="w-32 h-32 rounded-full border-4 border-white object-cover shadow-lg"
                />
              ) : (
                <div className="w-32 h-32 rounded-full border-4 border-white bg-gray-200 flex items-center justify-center shadow-lg">
                  <User className="h-16 w-16 text-gray-400" />
                </div>
              )}
              {lawyerProfile.isVerified && (
                <div className="absolute bottom-0 right-0 bg-green-500 rounded-full p-2 border-4 border-white">
                  <CheckCircle className="h-6 w-6 text-white" />
                </div>
              )}
            </div>
            
            <div className="mt-4 md:mt-0 md:ml-6 flex-1">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    {user?.firstName} {user?.lastName}
                  </h1>
                  <div className="flex items-center gap-3 mt-2">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${tierInfo.color}`}>
                      <TierIcon className="h-4 w-4" />
                      {tierInfo.label}
                    </span>
                    {lawyerProfile.isVerified ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">
                        <CheckCircle className="h-4 w-4" />
                        Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-amber-100 text-amber-700">
                        <Clock className="h-4 w-4" />
                        Pending Verification
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="mt-4 md:mt-0 flex gap-2">
                  {isEditing ? (
                    <>
                      <button
                        onClick={handleCancel}
                        disabled={saving}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
                      >
                        <X className="h-4 w-4" />
                        Cancel
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        {saving ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4" />
                            Save Changes
                          </>
                        )}
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                      Edit Profile
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Award className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Experience</p>
                  <p className="text-xl font-bold text-gray-900">{lawyerProfile.yearsOfExperience} Years</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="bg-amber-100 p-3 rounded-lg">
                  <Calendar className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Admitted</p>
                  <p className="text-xl font-bold text-gray-900">{lawyerProfile.yearOfAdmission}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="bg-green-100 p-3 rounded-lg">
                  <Briefcase className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Rating</p>
                  <p className="text-xl font-bold text-gray-900">
                    {lawyerProfile.rating > 0 ? `${lawyerProfile.rating}/5` : 'New'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Bio */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">About</h2>
            {isEditing && editedProfile ? (
              <textarea
                value={editedProfile.lawyerProfile?.bio || ''}
                onChange={(e) => setEditedProfile({
                  ...editedProfile,
                  lawyerProfile: { ...editedProfile.lawyerProfile, bio: e.target.value }
                })}
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe your legal expertise..."
              />
            ) : (
              <p className="text-gray-700 whitespace-pre-wrap">{lawyerProfile?.bio || 'No bio provided'}</p>
            )}
          </div>

          {/* Specializations */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Specializations</h2>
            <div className="flex flex-wrap gap-2">
              {lawyerProfile.specializations.map((spec, index) => (
                <span
                  key={index}
                  className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg font-medium"
                >
                  {spec}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contact Information */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Contact Information</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="text-gray-900 font-medium">{user?.email}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-1">Phone</p>
                  {isEditing && editedProfile ? (
                    <input
                      type="tel"
                      value={editedProfile.user?.phoneNumber || ''}
                      onChange={(e) => setEditedProfile({
                        ...editedProfile,
                        user: { ...editedProfile.user, phoneNumber: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="07XXXXXXXX"
                    />
                  ) : (
                    <p className="text-gray-900 font-medium">{user?.phoneNumber || 'Not provided'}</p>
                  )}
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-1">Office Address</p>
                  {isEditing && editedProfile ? (
                    <textarea
                      value={(() => {
                        try {
                          const loc = typeof editedProfile.lawyerProfile?.location === 'string'
                            ? JSON.parse(editedProfile.lawyerProfile.location)
                            : editedProfile.lawyerProfile?.location;
                          return loc?.address || '';
                        } catch {
                          return '';
                        }
                      })()}
                      onChange={(e) => {
                        try {
                          const currentLocation = typeof editedProfile.lawyerProfile?.location === 'string'
                            ? JSON.parse(editedProfile.lawyerProfile.location)
                            : editedProfile.lawyerProfile?.location || {};
                          setEditedProfile({
                            ...editedProfile,
                            lawyerProfile: {
                              ...editedProfile.lawyerProfile,
                              location: JSON.stringify({ ...currentLocation, address: e.target.value })
                            }
                          });
                        } catch (err) {
                          console.error('Error updating location:', err);
                        }
                      }}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., 3rd Floor, ABC Towers, Kimathi Street"
                    />
                  ) : (
                    <>
                      <p className="text-gray-900 font-medium">
                        {location?.city || 'Not provided'}, {location?.county || ''}
                      </p>
                      {location?.address && (
                        <p className="text-sm text-gray-600 mt-1">{location.address}</p>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Linkedin className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-1">LinkedIn</p>
                  {isEditing && editedProfile ? (
                    <input
                      type="url"
                      value={editedProfile.lawyerProfile?.linkedInProfile || ''}
                      onChange={(e) => setEditedProfile({
                        ...editedProfile,
                        lawyerProfile: { ...editedProfile.lawyerProfile, linkedInProfile: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="https://linkedin.com/in/yourprofile"
                    />
                  ) : lawyerProfile?.linkedInProfile ? (
                    <a
                      href={lawyerProfile.linkedInProfile}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline font-medium"
                    >
                      View Profile
                    </a>
                  ) : (
                    <p className="text-gray-500">Not provided</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Professional Details */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Professional Details</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">License Number</p>
                <p className="text-gray-900 font-medium">{lawyerProfile.licenseNumber}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">Member Since</p>
                <p className="text-gray-900 font-medium">
                  {new Date(user.createdAt).toLocaleDateString('en-US', { 
                    month: 'long', 
                    year: 'numeric' 
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LawyerProfile;
