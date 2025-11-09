import React, { useState, useEffect } from 'react';
import {
  Settings,
  Shield,
  Mail,
  Bell,
  Globe,
  Zap,
  Server,
  Lock,
  AlertTriangle,
  CheckCircle,
  Save,
  RefreshCw,
  Download
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';

interface SystemSettings {
  platform: {
    maintenanceMode: boolean;
    allowNewRegistrations: boolean;
    requireEmailVerification: boolean;
    maxUploadSize: number;
    sessionTimeout: number;
  };
  features: {
    aiAssistantEnabled: boolean;
    videoConsultationEnabled: boolean;
    paymentProcessingEnabled: boolean;
    multiLanguageEnabled: boolean;
    mobileAppEnabled: boolean;
  };
  security: {
    passwordMinLength: number;
    requireTwoFactor: boolean;
    maxLoginAttempts: number;
    sessionSecurityLevel: 'low' | 'medium' | 'high';
    ipWhitelistEnabled: boolean;
  };
  communications: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    pushNotifications: boolean;
    marketingEmails: boolean;
  };
  integrations: {
    mpesaEnabled: boolean;
    firebaseEnabled: boolean;
    cloudinaryEnabled: boolean;
    twilioEnabled: boolean;
  };
}

export const SystemAdministration: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'platform' | 'features' | 'security' | 'communications' | 'integrations'>('platform');
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      
      // Mock data - will integrate with backend API
      const mockSettings: SystemSettings = {
        platform: {
          maintenanceMode: false,
          allowNewRegistrations: true,
          requireEmailVerification: true,
          maxUploadSize: 10,
          sessionTimeout: 30
        },
        features: {
          aiAssistantEnabled: true,
          videoConsultationEnabled: true,
          paymentProcessingEnabled: true,
          multiLanguageEnabled: true,
          mobileAppEnabled: false
        },
        security: {
          passwordMinLength: 8,
          requireTwoFactor: false,
          maxLoginAttempts: 5,
          sessionSecurityLevel: 'medium',
          ipWhitelistEnabled: false
        },
        communications: {
          emailNotifications: true,
          smsNotifications: true,
          pushNotifications: true,
          marketingEmails: false
        },
        integrations: {
          mpesaEnabled: true,
          firebaseEnabled: true,
          cloudinaryEnabled: true,
          twilioEnabled: false
        }
      };
      
      setSettings(mockSettings);
    } catch (err) {
      console.error('Load settings error:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = (category: keyof SystemSettings, key: string, value: any) => {
    if (!settings) return;
    
    setSettings(prev => ({
      ...prev!,
      [category]: {
        ...prev![category],
        [key]: value
      }
    }));
    setHasChanges(true);
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      
      // Mock API call - will integrate with backend
      console.log('Saving settings:', settings);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setHasChanges(false);
    } catch (err) {
      console.error('Save settings error:', err);
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = async () => {
    if (confirm('Are you sure you want to reset all settings to defaults? This action cannot be undone.')) {
      await loadSettings();
      setHasChanges(false);
    }
  };

  const exportSettings = () => {
    if (!settings) return;
    
    const dataStr = JSON.stringify(settings, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `wakili-pro-settings-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading system settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <Settings className="w-6 h-6 mr-2 text-indigo-600" />
                System Administration
              </h1>
              <p className="text-gray-600 mt-1">
                Configure platform settings, features, and security options
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              {hasChanges && (
                <div className="flex items-center text-sm text-yellow-600 bg-yellow-50 px-3 py-1 rounded-md">
                  <AlertTriangle className="w-4 h-4 mr-1" />
                  Unsaved changes
                </div>
              )}
              
              <Button variant="outline" onClick={exportSettings}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              
              <Button variant="outline" onClick={resetToDefaults}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Reset
              </Button>
              
              <Button onClick={saveSettings} disabled={!hasChanges || saving}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { key: 'platform', label: 'Platform', icon: Server },
                { key: 'features', label: 'Features', icon: Zap },
                { key: 'security', label: 'Security', icon: Shield },
                { key: 'communications', label: 'Communications', icon: Bell },
                { key: 'integrations', label: 'Integrations', icon: Globe }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                    activeTab === tab.key
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="w-4 h-4 mr-2" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Platform Settings */}
        {activeTab === 'platform' && settings && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Platform Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-900">Maintenance Mode</label>
                    <p className="text-sm text-gray-600">Temporarily disable platform access for maintenance</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.platform.maintenanceMode}
                      onChange={(e) => updateSetting('platform', 'maintenanceMode', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-900">Allow New Registrations</label>
                    <p className="text-sm text-gray-600">Enable or disable new user registrations</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.platform.allowNewRegistrations}
                      onChange={(e) => updateSetting('platform', 'allowNewRegistrations', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-900">Require Email Verification</label>
                    <p className="text-sm text-gray-600">New users must verify their email addresses</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.platform.requireEmailVerification}
                      onChange={(e) => updateSetting('platform', 'requireEmailVerification', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Upload Size (MB)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={settings.platform.maxUploadSize}
                      onChange={(e) => updateSetting('platform', 'maxUploadSize', parseInt(e.target.value))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Session Timeout (minutes)
                    </label>
                    <input
                      type="number"
                      min="5"
                      max="480"
                      value={settings.platform.sessionTimeout}
                      onChange={(e) => updateSetting('platform', 'sessionTimeout', parseInt(e.target.value))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Features Tab */}
        {activeTab === 'features' && settings && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Feature Controls</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {Object.entries(settings.features).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-900 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').replace('Enabled', '')}
                      </label>
                      <p className="text-sm text-gray-600">
                        {key === 'aiAssistantEnabled' && 'AI-powered legal assistance feature'}
                        {key === 'videoConsultationEnabled' && 'Video consultation functionality'}
                        {key === 'paymentProcessingEnabled' && 'Online payment processing'}
                        {key === 'multiLanguageEnabled' && 'Multi-language support'}
                        {key === 'mobileAppEnabled' && 'Mobile application access'}
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={(e) => updateSetting('features', key, e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && settings && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Lock className="w-5 h-5 mr-2" />
                  Security Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password Minimum Length
                    </label>
                    <input
                      type="number"
                      min="6"
                      max="32"
                      value={settings.security.passwordMinLength}
                      onChange={(e) => updateSetting('security', 'passwordMinLength', parseInt(e.target.value))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Login Attempts
                    </label>
                    <input
                      type="number"
                      min="3"
                      max="10"
                      value={settings.security.maxLoginAttempts}
                      onChange={(e) => updateSetting('security', 'maxLoginAttempts', parseInt(e.target.value))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Session Security Level
                  </label>
                  <select
                    value={settings.security.sessionSecurityLevel}
                    onChange={(e) => updateSetting('security', 'sessionSecurityLevel', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="low">Low - Basic session validation</option>
                    <option value="medium">Medium - Enhanced session tracking</option>
                    <option value="high">High - Strict session security</option>
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-900">Require Two-Factor Authentication</label>
                    <p className="text-sm text-gray-600">Mandate 2FA for all user accounts</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.security.requireTwoFactor}
                      onChange={(e) => updateSetting('security', 'requireTwoFactor', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-900">IP Whitelist</label>
                    <p className="text-sm text-gray-600">Enable IP-based access restrictions</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.security.ipWhitelistEnabled}
                      onChange={(e) => updateSetting('security', 'ipWhitelistEnabled', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Communications Tab */}
        {activeTab === 'communications' && settings && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Mail className="w-5 h-5 mr-2" />
                  Communication Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {Object.entries(settings.communications).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-900 capitalize">
                        {key.replace(/([A-Z])/g, ' $1')}
                      </label>
                      <p className="text-sm text-gray-600">
                        {key === 'emailNotifications' && 'Send system notifications via email'}
                        {key === 'smsNotifications' && 'Send SMS notifications for urgent matters'}
                        {key === 'pushNotifications' && 'Send push notifications to mobile devices'}
                        {key === 'marketingEmails' && 'Allow marketing and promotional emails'}
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={(e) => updateSetting('communications', key, e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Integrations Tab */}
        {activeTab === 'integrations' && settings && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Third-Party Integrations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {Object.entries(settings.integrations).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-4 ${
                        value ? 'bg-green-100' : 'bg-gray-100'
                      }`}>
                        {value ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <AlertTriangle className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-900 capitalize">
                          {key.replace('Enabled', '')}
                        </label>
                        <p className="text-sm text-gray-600">
                          {key === 'mpesaEnabled' && 'M-Pesa mobile payment integration'}
                          {key === 'firebaseEnabled' && 'Firebase Cloud Messaging for notifications'}
                          {key === 'cloudinaryEnabled' && 'Cloudinary media storage and processing'}
                          {key === 'twilioEnabled' && 'Twilio SMS and voice services'}
                        </p>
                        <div className="flex items-center mt-1">
                          <div className={`w-2 h-2 rounded-full mr-2 ${
                            value ? 'bg-green-500' : 'bg-gray-400'
                          }`} />
                          <span className="text-xs text-gray-500">
                            {value ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={(e) => updateSetting('integrations', key, e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default SystemAdministration;