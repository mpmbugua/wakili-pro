import React, { useState, useRef, useEffect } from 'react';
import { Upload, User, Save, Camera, X } from 'lucide-react';
import axiosInstance from '../lib/axios';
import { useNavigate } from 'react-router-dom';

export const LawyerProfileSettings: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState({
    name: '',
    bio: '',
    profileImageUrl: '',
    specializations: [] as string[],
    yearsOfExperience: 0,
    hourlyRate: 0,
  });

  const [imagePreview, setImagePreview] = useState<string>('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/lawyers/profile');
      if (response.data.success) {
        const data = response.data.data;
        const user = data.user || {};
        setProfile({
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
          bio: data.bio || '',
          profileImageUrl: data.profileImageUrl || '',
          specializations: data.specializations || [],
          yearsOfExperience: data.yearsOfExperience || 0,
          hourlyRate: data.hourlyRate || 0,
        });
        setImagePreview(data.profileImageUrl || '');
      }
    } catch (err: any) {
      console.error('Error fetching profile:', err);
      setError(err.response?.data?.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Upload image
      uploadImage(file);
    }
  };

  const uploadImage = async (file: File) => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData();
    formData.append('profileImage', file);

    try {
      // First, try to upload the image to the backend
      // Note: This endpoint needs to be created on the backend
      const response = await axiosInstance.post('/lawyers/profile/upload-photo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        const imageUrl = response.data.data.profileImageUrl;
        setProfile({ ...profile, profileImageUrl: imageUrl });
        setImagePreview(imageUrl);
        setSuccess('Profile photo updated successfully!');
      }
    } catch (err: any) {
      console.error('Error uploading image:', err);
      // If endpoint doesn't exist yet, convert to base64 and save directly
      if (err.response?.status === 404) {
        try {
          const reader = new FileReader();
          reader.onloadend = async () => {
            const base64Image = reader.result as string;
            await saveProfileWithImage(base64Image);
          };
          reader.readAsDataURL(file);
        } catch (base64Err) {
          setError('Failed to upload profile photo. Please try again.');
        }
      } else {
        setError(err.response?.data?.message || 'Failed to upload profile photo');
      }
    } finally {
      setSaving(false);
    }
  };

  const saveProfileWithImage = async (imageUrl: string) => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await axiosInstance.put('/lawyers/profile', {
        profileImageUrl: imageUrl,
        bio: profile.bio,
        yearsOfExperience: profile.yearsOfExperience,
        hourlyRate: profile.hourlyRate,
      });

      if (response.data.success) {
        setProfile({ ...profile, profileImageUrl: imageUrl });
        setSuccess('Profile updated successfully!');
      }
    } catch (err: any) {
      console.error('Error saving profile:', err);
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveProfile = async () => {
    console.log('[LawyerSettings] Save button clicked');
    console.log('[LawyerSettings] Current profile:', profile);
    
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      console.log('[LawyerSettings] Sending PUT request to /lawyers/profile');
      
      const response = await axiosInstance.put('/lawyers/profile', {
        bio: profile.bio,
        yearsOfExperience: profile.yearsOfExperience,
        hourlyRate: profile.hourlyRate,
        profileImageUrl: profile.profileImageUrl,
      });

      console.log('[LawyerSettings] Response:', response.data);

      if (response.data.success) {
        setSuccess('Profile updated successfully!');
        setTimeout(() => setSuccess(null), 3000);
        console.log('[LawyerSettings] Profile saved successfully');
      }
    } catch (err: any) {
      console.error('[LawyerSettings] Error saving profile:', err);
      console.error('[LawyerSettings] Error response:', err.response?.data);
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to update profile');
    } finally {
      setSaving(false);
      console.log('[LawyerSettings] Save operation completed');
    }
  };

  const removeImage = () => {
    setImagePreview('');
    setProfile({ ...profile, profileImageUrl: '' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile Settings</h1>
          <p className="text-gray-600">Manage your professional profile and photo</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded">
            <p className="font-medium">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 rounded">
            <p className="font-medium">Success</p>
            <p className="text-sm">{success}</p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Profile Photo Section */}
          <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Camera className="h-5 w-5 mr-2" />
              Profile Photo
            </h2>
            
            <div className="flex items-center space-x-6">
              <div className="relative">
                {imagePreview ? (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Profile"
                      className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                    />
                    <button
                      onClick={removeImage}
                      className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition"
                      title="Remove photo"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center border-4 border-white shadow-lg">
                    <User className="h-16 w-16 text-gray-400" />
                  </div>
                )}
              </div>

              <div className="flex-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                  id="profile-photo-upload"
                />
                <label
                  htmlFor="profile-photo-upload"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition cursor-pointer"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {imagePreview ? 'Change Photo' : 'Upload Photo'}
                </label>
                <p className="text-sm text-gray-600 mt-2">
                  JPG, PNG or GIF. Max size 5MB. Recommended: 400x400px
                </p>
                {saving && (
                  <p className="text-sm text-blue-600 mt-2 flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                    Uploading...
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Profile Information Section */}
          <div className="p-6 space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <User className="h-5 w-5 mr-2" />
              Profile Information
            </h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={profile.name}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">Contact support to change your name</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Professional Bio
              </label>
              <textarea
                value={profile.bio}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Tell clients about your experience and expertise..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Years of Experience
                </label>
                <input
                  type="number"
                  min="0"
                  value={profile.yearsOfExperience}
                  onChange={(e) => setProfile({ ...profile, yearsOfExperience: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hourly Rate (KES)
                </label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={profile.hourlyRate}
                  onChange={(e) => setProfile({ ...profile, hourlyRate: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {profile.specializations.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Specializations
                </label>
                <div className="flex flex-wrap gap-2">
                  {profile.specializations.map((spec, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full"
                    >
                      {spec}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="px-6 py-4 bg-gray-50 border-t flex justify-between items-center">
            <button
              onClick={() => navigate(-1)}
              className="px-6 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-100 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveProfile}
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
