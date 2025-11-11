import React from 'react';

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

    detectDevice();
    window.addEventListener('resize', detectDevice);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

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
    isDesktop: deviceType === 'desktop',
    supportsTouch: 'ontouchstart' in window,
    supportsVibration: 'vibrate' in navigator,
    isStandalone: window.matchMedia('(display-mode: standalone)').matches
  };
};