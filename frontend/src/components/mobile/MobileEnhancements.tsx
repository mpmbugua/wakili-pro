import React from 'react';
import { Bell, Shield, Wifi, WifiOff, Download, Smartphone, Tablet, Monitor } from 'lucide-react';

interface MobileEnhancementsProps {
  className?: string;
}

const MobileEnhancements: React.FC<MobileEnhancementsProps> = ({ className = '' }) => {
  
  // Mock state - in real implementation, these would come from context/store
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);
  const [notifications, setNotifications] = React.useState(true);
  const [deviceType, setDeviceType] = React.useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  const [pwaInstalled, setPwaInstalled] = React.useState(false);

  React.useEffect(() => {
    // Detect device type
    const detectDevice = () => {
      const width = window.innerWidth;
      if (width < 768) setDeviceType('mobile');
      else if (width < 1024) setDeviceType('tablet');
      else setDeviceType('desktop');
    };

    // Network status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    // PWA install detection
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setPwaInstalled(false);
    };

    // Event listeners
    window.addEventListener('resize', detectDevice);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    detectDevice();

    return () => {
      window.removeEventListener('resize', detectDevice);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setNotifications(true);
        // Show test notification
        new Notification('Wakili Pro', {
          body: 'Notifications enabled successfully!',
          icon: '/favicon.ico',
          badge: '/favicon.ico',
        });
      }
    }
  };

  const installPWA = async () => {
    // In a real implementation, this would trigger PWA install
    console.log('Installing PWA...');
    setPwaInstalled(true);
  };

  const getDeviceIcon = () => {
    switch (deviceType) {
      case 'mobile': return <Smartphone className="h-5 w-5" />;
      case 'tablet': return <Tablet className="h-5 w-5" />;
      default: return <Monitor className="h-5 w-5" />;
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Mobile Enhancements</h3>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          {getDeviceIcon()}
          <span className="capitalize">{deviceType}</span>
        </div>
      </div>

      <div className="space-y-4">
        {/* Network Status */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center">
            {isOnline ? (
              <Wifi className="h-5 w-5 text-green-600 mr-3" />
            ) : (
              <WifiOff className="h-5 w-5 text-red-600 mr-3" />
            )}
            <div>
              <p className="font-medium text-gray-900">
                {isOnline ? 'Online' : 'Offline'}
              </p>
              <p className="text-sm text-gray-600">
                {isOnline 
                  ? 'All features available' 
                  : 'Limited functionality - cached data only'
                }
              </p>
            </div>
          </div>
          {!isOnline && (
            <button
              onClick={() => window.location.reload()}
              className="px-3 py-1 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              Retry
            </button>
          )}
        </div>

        {/* Push Notifications */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center">
            <Bell className={`h-5 w-5 mr-3 ${notifications ? 'text-green-600' : 'text-gray-400'}`} />
            <div>
              <p className="font-medium text-gray-900">Push Notifications</p>
              <p className="text-sm text-gray-600">
                {notifications 
                  ? 'Receiving consultation updates' 
                  : 'Enable for important updates'
                }
              </p>
            </div>
          </div>
          {!notifications && (
            <button
              onClick={requestNotificationPermission}
              className="px-3 py-1 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              Enable
            </button>
          )}
        </div>

        {/* PWA Installation */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center">
            <Download className={`h-5 w-5 mr-3 ${pwaInstalled ? 'text-green-600' : 'text-gray-400'}`} />
            <div>
              <p className="font-medium text-gray-900">Install App</p>
              <p className="text-sm text-gray-600">
                {pwaInstalled 
                  ? 'App installed successfully' 
                  : 'Install for better mobile experience'
                }
              </p>
            </div>
          </div>
          {!pwaInstalled && (
            <button
              onClick={installPWA}
              className="px-3 py-1 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              Install
            </button>
          )}
        </div>

        {/* Security Features */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center">
            <Shield className="h-5 w-5 text-green-600 mr-3" />
            <div>
              <p className="font-medium text-gray-900">Security</p>
              <p className="text-sm text-gray-600">
                End-to-end encryption, biometric login ready
              </p>
            </div>
          </div>
          <span className="text-sm text-green-600 font-medium">Active</span>
        </div>
      </div>

      {/* Mobile-Specific Features */}
      {(deviceType === 'mobile' || deviceType === 'tablet') && (
        <div className="mt-6 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
          <h4 className="font-medium text-indigo-900 mb-2">Mobile Features</h4>
          <ul className="text-sm text-indigo-700 space-y-1">
            <li>• Touch-optimized interface</li>
            <li>• Voice recording for consultations</li>
            <li>• Camera document scanning</li>
            <li>• Location-based lawyer search</li>
            <li>• Offline case notes sync</li>
          </ul>
        </div>
      )}

      {/* Development Info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-6 p-3 bg-yellow-50 rounded border border-yellow-200">
          <p className="text-sm text-yellow-800">
            <strong>Dev Mode:</strong> Screen: {window.innerWidth}x{window.innerHeight}, 
            Device: {deviceType}, PWA: {pwaInstalled ? 'Yes' : 'No'}
          </p>
        </div>
      )}
    </div>
  );
};

// Hook for mobile enhancements
export const useMobileEnhancements = () => {
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);
  const [deviceType, setDeviceType] = React.useState<'mobile' | 'tablet' | 'desktop'>('desktop');

  React.useEffect(() => {
    const detectDevice = () => {
      const width = window.innerWidth;
      if (width < 768) setDeviceType('mobile');
      else if (width < 1024) setDeviceType('tablet');
      else setDeviceType('desktop');
    };

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('resize', detectDevice);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    detectDevice();

    return () => {
      window.removeEventListener('resize', detectDevice);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    isOnline,
    deviceType,
    isMobile: deviceType === 'mobile',
    isTablet: deviceType === 'tablet',
    isDesktop: deviceType === 'desktop'
  };
};

export default MobileEnhancements;