import { useEffect } from 'react';
import { usePageTracking, useScrollTracking } from '../hooks/useAnalytics';

/**
 * Analytics Tracker Component
 * Add this to your App component to automatically track all page views and user behavior
 */
export const AnalyticsTracker = () => {
  usePageTracking(); // Auto-track page views on route changes
  useScrollTracking(); // Auto-track scroll depth
  
  return null; // This component doesn't render anything
};
