import React, { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { User, Bell, Lock, Globe, CreditCard, Shield, Camera, Loader } from 'lucide-react';
import axiosInstance from '../lib/axios';

export const SettingsPage: React.FC = () => {
  const { user, setUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState('profile');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Profile form state
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phoneNumber || '');

  // Notification preferences state
  const [notifications, setNotifications] = useState({
    email: true,
    sms: true,
    push: true,
    consultationReminders: true,
  });
  const [savingNotifications, setSavingNotifications] = useState(false);

  // Load notification preferences from user profile
  useEffect(() => {
    const loadNotificationPreferences = async () => {
      try {
        const response = await axiosInstance.get('/users/profile');
        const profile = response.data?.data?.profile;
        
        if (profile) {
          setNotifications({
            email: profile.emailNotifications ?? true,
            sms: profile.smsNotifications ?? true,
            push: profile.pushNotifications ?? true,
            consultationReminders: profile.consultationReminders ?? true,
          });
        }
      } catch (error) {
        console.error('Error loading notification preferences:', error);
      }
    };

    loadNotificationPreferences();
  }, []);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    try {
      setUploadingPhoto(true);
      const formData = new FormData();
      formData.append('photo', file);

      const response = await axiosInstance.post('/users/upload-photo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        // Update user in store
        if (user) {
          setUser({
            ...user,
            profileImageUrl: response.data.data.url
          });
        }
        alert('Profile photo updated successfully');
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert('Failed to upload profile photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleNotificationToggle = async (key: keyof typeof notifications) => {
    try {
      const newValue = !notifications[key];
      
      // Optimistically update UI
      setNotifications(prev => ({ ...prev, [key]: newValue }));
      setSavingNotifications(true);

      // Save to backend
      const response = await axiosInstance.put('/users/notification-preferences', {
        [key]: newValue,
      });

      if (!response.data.success) {
        // Revert on failure
        setNotifications(prev => ({ ...prev, [key]: !newValue }));
        alert('Failed to update notification preference');
      }
    } catch (error: any) {
      console.error('Error updating notification:', error);
      // Revert on error
      setNotifications(prev => ({ ...prev, [key]: !notifications[key] }));
      alert(error.response?.data?.message || 'Failed to update notification preference');
    } finally {
      setSavingNotifications(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      console.log('Saving profile:', { firstName, lastName, email, phone });

      const response = await axiosInstance.put('/users/profile', {
        firstName,
        lastName,
        email,
        phoneNumber: phone,
      });

      if (response.data.success) {
        // Update user in store
        if (user) {
          setUser({
            ...user,
            firstName: response.data.data.firstName,
            lastName: response.data.data.lastName,
            email: response.data.data.email,
            phoneNumber: response.data.data.phoneNumber,
          });
        }
        alert('Profile updated successfully');
      }
    } catch (error: any) {
      console.error('Error saving profile:', error);
      alert(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'profile', name: 'Profile', icon: User },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'security', name: 'Security', icon: Lock },
    { id: 'privacy', name: 'Privacy', icon: Shield },
    { id: 'language', name: 'Language', icon: Globe },
    { id: 'billing', name: 'Billing', icon: CreditCard },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
          <p className="text-slate-600 mt-2">Manage your account settings and preferences</p>
        </div>

        <div className="grid md:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="md:col-span-1">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition ${
                    activeTab === tab.id
                      ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <tab.icon className="h-5 w-5" />
                  <span>{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="md:col-span-3">
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              {activeTab === 'profile' && (
                <div>
                  <h2 className="text-xl font-semibold text-slate-900 mb-6">Profile Information</h2>
                  
                  {/* Profile Photo Upload */}
                  <div className="mb-8 flex items-center space-x-6">
                    <div className="relative">
                      <div className="h-24 w-24 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden border-4 border-white shadow-sm">
                        {user?.profileImageUrl ? (
                          <img 
                            src={user.profileImageUrl} 
                            alt="Profile" 
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <User className="h-12 w-12 text-slate-400" />
                        )}
                        {uploadingPhoto && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <Loader className="h-8 w-8 text-white animate-spin" />
                          </div>
                        )}
                      </div>
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingPhoto}
                        className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition shadow-md disabled:opacity-70"
                        title="Change photo"
                      >
                        <Camera className="h-4 w-4" />
                      </button>
                      <input 
                        ref={fileInputRef}
                        type="file" 
                        accept="image/*" 
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-slate-900">Profile Photo</h3>
                      <p className="text-sm text-slate-500">Update your profile picture (Max 5MB)</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">First Name</label>
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Last Name</label>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <p className="text-xs text-slate-500 mt-1">Make sure you have access to this email for verification</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Phone Number</label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+254 700 000 000"
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <button 
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    >
                      {saving && <Loader className="w-4 h-4 animate-spin" />}
                      <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div>
                  <h2 className="text-xl font-semibold text-slate-900 mb-6">Notification Preferences</h2>
                  <div className="space-y-4">
                    {[
                      { key: 'email' as const, label: 'Email notifications', description: 'Receive email updates about your account' },
                      { key: 'sms' as const, label: 'SMS notifications', description: 'Get SMS alerts for important updates' },
                      { key: 'push' as const, label: 'Push notifications', description: 'Receive push notifications on your device' },
                      { key: 'consultationReminders' as const, label: 'Consultation reminders', description: 'Get reminders before scheduled consultations' },
                    ].map((item) => (
                      <div key={item.key} className="flex items-center justify-between py-3 border-b border-slate-200">
                        <div>
                          <p className="font-medium text-slate-900">{item.label}</p>
                          <p className="text-sm text-slate-600">{item.description}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="sr-only peer" 
                            checked={notifications[item.key]}
                            onChange={() => handleNotificationToggle(item.key)}
                            disabled={savingNotifications}
                          />
                          <div className={`w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 ${
                            savingNotifications ? 'opacity-50 cursor-not-allowed' : ''
                          }`}></div>
                        </label>
                      </div>
                    ))}
                  </div>
                  {savingNotifications && (
                    <p className="text-sm text-slate-500 mt-2 flex items-center gap-2">
                      <Loader className="w-4 h-4 animate-spin" />
                      Saving preferences...
                    </p>
                  )}
                </div>
              )}

              {activeTab === 'security' && (
                <div>
                  <h2 className="text-xl font-semibold text-slate-900 mb-6">Security Settings</h2>
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-medium text-slate-900 mb-4">Change Password</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Current Password</label>
                          <input
                            type="password"
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">New Password</label>
                          <input
                            type="password"
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Confirm New Password</label>
                          <input
                            type="password"
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                          Update Password
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'privacy' && (
                <div>
                  <h2 className="text-xl font-semibold text-slate-900 mb-6">Privacy Settings</h2>
                  <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-blue-800">
                        Your privacy is important to us. We never share your personal information without your consent.
                      </p>
                    </div>
                    <div className="space-y-4">
                      {[
                        { label: 'Profile visibility', description: 'Make your profile visible to other users' },
                        { label: 'Show activity status', description: 'Let others see when you\'re online' },
                        { label: 'Data analytics', description: 'Allow us to use your data to improve our services' },
                      ].map((item) => (
                        <div key={item.label} className="flex items-center justify-between py-3 border-b border-slate-200">
                          <div>
                            <p className="font-medium text-slate-900">{item.label}</p>
                            <p className="text-sm text-slate-600">{item.description}</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" defaultChecked />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'language' && (
                <div>
                  <h2 className="text-xl font-semibold text-slate-900 mb-6">Language & Region</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Language</label>
                      <select className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        <option>English</option>
                        <option>Swahili</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Timezone</label>
                      <select className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        <option>East Africa Time (EAT)</option>
                        <option>UTC</option>
                      </select>
                    </div>
                    <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                      Save Changes
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'billing' && (
                <div>
                  <h2 className="text-xl font-semibold text-slate-900 mb-6">Billing & Payments</h2>
                  <div className="space-y-6">
                    <div className="bg-slate-50 rounded-lg p-4">
                      <h3 className="font-medium text-slate-900 mb-2">Payment Methods</h3>
                      <p className="text-sm text-slate-600 mb-4">Manage your payment methods for faster checkout</p>
                      <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm">
                        Add Payment Method
                      </button>
                    </div>
                    <div>
                      <h3 className="font-medium text-slate-900 mb-4">Transaction History</h3>
                      <p className="text-sm text-slate-600">No transactions yet</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
  );
};

export default SettingsPage;
