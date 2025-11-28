import React, { useState } from 'react';
import { GlobalLayout } from '../components/layout';
import { useAuthStore } from '../store/authStore';
import { User, Bell, Lock, Globe, CreditCard, Shield } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('profile');

  const tabs = [
    { id: 'profile', name: 'Profile', icon: User },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'security', name: 'Security', icon: Lock },
    { id: 'privacy', name: 'Privacy', icon: Shield },
    { id: 'language', name: 'Language', icon: Globe },
    { id: 'billing', name: 'Billing', icon: CreditCard },
  ];

  return (
    <GlobalLayout>
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
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
                      <input
                        type="text"
                        defaultValue={`${user?.firstName} ${user?.lastName}`}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                      <input
                        type="email"
                        defaultValue={user?.email}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Phone Number</label>
                      <input
                        type="tel"
                        placeholder="+254 700 000 000"
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                      Save Changes
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div>
                  <h2 className="text-xl font-semibold text-slate-900 mb-6">Notification Preferences</h2>
                  <div className="space-y-4">
                    {[
                      { label: 'Email notifications', description: 'Receive email updates about your account' },
                      { label: 'SMS notifications', description: 'Get SMS alerts for important updates' },
                      { label: 'Push notifications', description: 'Receive push notifications on your device' },
                      { label: 'Consultation reminders', description: 'Get reminders before scheduled consultations' },
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
    </GlobalLayout>
  );
};

export default SettingsPage;
