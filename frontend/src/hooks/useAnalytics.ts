import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import axiosInstance from '../services/api';
import { useAuthStore } from '../store/authStore';

// Generate or retrieve session ID from localStorage
const getSessionId = (): string => {
  let sessionId = localStorage.getItem('analytics_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('analytics_session_id', sessionId);
  }
  return sessionId;
};

// Get device and browser info
const getDeviceInfo = () => {
  const ua = navigator.userAgent;
  
  // Detect device type
  let deviceType = 'desktop';
  if (/mobile/i.test(ua)) deviceType = 'mobile';
  else if (/tablet|ipad/i.test(ua)) deviceType = 'tablet';
  
  // Detect browser
  let browser = 'unknown';
  if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Chrome')) browser = 'Chrome';
  else if (ua.includes('Safari')) browser = 'Safari';
  else if (ua.includes('Edge')) browser = 'Edge';
  
  // Detect OS
  let os = 'unknown';
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iOS')) os = 'iOS';
  
  return {
    deviceType,
    browser,
    os,
    userAgent: ua,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height
  };
};

// Get referrer and UTM parameters
const getReferralInfo = () => {
  const urlParams = new URLSearchParams(window.location.search);
  
  return {
    referrer: document.referrer || null,
    referralSource: urlParams.get('utm_source') || null,
    referralCampaign: urlParams.get('utm_campaign') || null,
    referralMedium: urlParams.get('utm_medium') || null
  };
};

/**
 * Hook to automatically track page views
 * Call this in your main App component or layout
 */
export const usePageTracking = () => {
  const location = useLocation();
  const { user } = useAuthStore();
  const pageStartTime = useRef<number>(Date.now());
  const previousPage = useRef<string>('');

  useEffect(() => {
    const sessionId = getSessionId();
    const deviceInfo = getDeviceInfo();
    const referralInfo = getReferralInfo();
    const currentPage = location.pathname;

    // Track page view
    const trackPageView = async () => {
      try {
        await axiosInstance.post('/analytics-tracking/track-page', {
          sessionId,
          page: currentPage,
          pageName: getPageName(currentPage),
          referrer: previousPage.current || referralInfo.referrer,
          ...deviceInfo
        });

        // Initialize session on first page view
        if (!previousPage.current) {
          await axiosInstance.post('/analytics-tracking/track-session', {
            sessionId,
            landingPage: currentPage,
            ...referralInfo,
            ...deviceInfo
          });
        }
      } catch (error) {
        // Silently fail - analytics shouldn't break the app
        console.debug('[Analytics] Page tracking failed:', error);
      }
    };

    trackPageView();
    pageStartTime.current = Date.now();

    // Update previous page for next navigation
    return () => {
      previousPage.current = currentPage;
      
      // Track time spent on page when leaving
      const duration = Math.floor((Date.now() - pageStartTime.current) / 1000);
      if (duration > 0) {
        axiosInstance.post('/analytics-tracking/track-page', {
          sessionId,
          page: currentPage,
          duration,
          exitPage: true
        }).catch(() => {});
      }
    };
  }, [location.pathname, user]);

  // Track session end on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      const sessionId = getSessionId();
      const duration = Math.floor((Date.now() - pageStartTime.current) / 1000);
      
      // Use sendBeacon for reliable tracking on page close
      const data = JSON.stringify({
        sessionId,
        page: location.pathname,
        duration,
        exitPage: true
      });
      
      navigator.sendBeacon('/api/analytics-tracking/track-page', data);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [location.pathname]);
};

/**
 * Hook to track user events (clicks, searches, interactions)
 */
export const useEventTracking = () => {
  const trackEvent = async (
    eventType: 'CLICK' | 'SEARCH' | 'FORM_START' | 'FORM_SUBMIT' | 'DOWNLOAD' | 'VIEW' | 'SCROLL',
    eventName: string,
    metadata?: {
      targetElement?: string;
      eventValue?: number;
      searchQuery?: string;
      lawyerId?: string;
      serviceType?: string;
      documentId?: string;
      [key: string]: any;
    }
  ) => {
    try {
      const sessionId = getSessionId();
      
      await axiosInstance.post('/analytics-tracking/track-event', {
        sessionId,
        eventType,
        eventCategory: getEventCategory(eventType),
        eventName,
        page: window.location.pathname,
        ...metadata
      });
    } catch (error) {
      console.debug('[Analytics] Event tracking failed:', error);
    }
  };

  const trackClick = (elementName: string, metadata?: any) => {
    trackEvent('CLICK', `clicked_${elementName}`, { targetElement: elementName, ...metadata });
  };

  const trackSearch = (query: string, metadata?: any) => {
    trackEvent('SEARCH', 'user_search', { searchQuery: query, ...metadata });
  };

  const trackFormStart = (formName: string) => {
    trackEvent('FORM_START', `started_${formName}`, { targetElement: formName });
  };

  const trackFormSubmit = (formName: string, metadata?: any) => {
    trackEvent('FORM_SUBMIT', `submitted_${formName}`, { targetElement: formName, ...metadata });
  };

  const trackLawyerView = (lawyerId: string, lawyerName: string) => {
    trackEvent('VIEW', 'viewed_lawyer_profile', { lawyerId, targetElement: lawyerName });
  };

  const trackServiceView = (serviceType: string, serviceName: string) => {
    trackEvent('VIEW', 'viewed_service', { serviceType, targetElement: serviceName });
  };

  const trackDocumentView = (documentId: string, documentName: string) => {
    trackEvent('VIEW', 'viewed_document', { documentId, targetElement: documentName });
  };

  const trackDownload = (fileName: string, fileType: string) => {
    trackEvent('DOWNLOAD', 'downloaded_file', { targetElement: fileName, metadata: { fileType } });
  };

  return {
    trackEvent,
    trackClick,
    trackSearch,
    trackFormStart,
    trackFormSubmit,
    trackLawyerView,
    trackServiceView,
    trackDocumentView,
    trackDownload
  };
};

/**
 * Hook to track conversions (signup, booking, purchase)
 */
export const useConversionTracking = () => {
  const trackConversion = async (
    conversionType: 'SIGNUP' | 'BOOKING' | 'PURCHASE' | 'SUBSCRIPTION' | 'SERVICE_REQUEST',
    value?: number
  ) => {
    try {
      const sessionId = getSessionId();
      
      await axiosInstance.post('/analytics-tracking/track-conversion', {
        sessionId,
        conversionType,
        conversionValue: value
      });
    } catch (error) {
      console.debug('[Analytics] Conversion tracking failed:', error);
    }
  };

  return { trackConversion };
};

/**
 * Hook to track scroll depth
 */
export const useScrollTracking = () => {
  const location = useLocation();
  const maxScrollDepth = useRef(0);
  const trackingTimeout = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = Math.round((scrollTop / docHeight) * 100);
      
      if (scrollPercent > maxScrollDepth.current) {
        maxScrollDepth.current = scrollPercent;
        
        // Debounce tracking
        if (trackingTimeout.current) clearTimeout(trackingTimeout.current);
        
        trackingTimeout.current = setTimeout(() => {
          const sessionId = getSessionId();
          axiosInstance.post('/analytics-tracking/track-page', {
            sessionId,
            page: location.pathname,
            scrollDepth: scrollPercent
          }).catch(() => {});
        }, 1000);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (trackingTimeout.current) clearTimeout(trackingTimeout.current);
    };
  }, [location.pathname]);
};

// Helper functions
const getPageName = (path: string): string => {
  const routes: Record<string, string> = {
    '/': 'Landing Page',
    '/login': 'Login',
    '/register': 'Register',
    '/dashboard': 'Dashboard',
    '/lawyers': 'Browse Lawyers',
    '/marketplace': 'Document Marketplace',
    '/documents': 'My Documents',
    '/consultations': 'My Consultations',
    '/service-request': 'Service Request',
    '/ai': 'AI Legal Assistant',
    '/blog': 'Blog',
    '/about': 'About Us',
    '/contact': 'Contact',
    '/pricing': 'Pricing'
  };

  // Check exact match
  if (routes[path]) return routes[path];
  
  // Check dynamic routes
  if (path.startsWith('/booking/')) return 'Booking Page';
  if (path.startsWith('/lawyers/')) return 'Lawyer Profile';
  if (path.startsWith('/blog/')) return 'Blog Article';
  
  return path;
};

const getEventCategory = (eventType: string): string => {
  const categories: Record<string, string> = {
    'CLICK': 'USER_ACTION',
    'SEARCH': 'ENGAGEMENT',
    'FORM_START': 'ENGAGEMENT',
    'FORM_SUBMIT': 'CONVERSION',
    'DOWNLOAD': 'CONVERSION',
    'VIEW': 'ENGAGEMENT',
    'SCROLL': 'ENGAGEMENT'
  };
  
  return categories[eventType] || 'USER_ACTION';
};
