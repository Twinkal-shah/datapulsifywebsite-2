import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { useTabVisibility } from './useTabVisibility';

export const useRouterRefresh = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isNavigating, setIsNavigating] = useState(false);
  const navigationTimeoutRef = useRef<NodeJS.Timeout>();
  const lastLocationRef = useRef(location.pathname);

  // Monitor navigation state
  useEffect(() => {
    // Clear any existing timeout
    if (navigationTimeoutRef.current) {
      clearTimeout(navigationTimeoutRef.current);
    }

    // If location changed, we're done navigating
    if (location.pathname !== lastLocationRef.current) {
      setIsNavigating(false);
      lastLocationRef.current = location.pathname;
    }

    // Set timeout to detect stuck navigation
    navigationTimeoutRef.current = setTimeout(() => {
      if (isNavigating) {
        console.warn('Navigation appears to be stuck, attempting to refresh router state');
        setIsNavigating(false);
        // Force a re-render by updating location state
        navigate(location.pathname, { replace: true, state: { refresh: Date.now() } });
      }
    }, 5000); // 5 second timeout

    return () => {
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
      }
    };
  }, [location.pathname, isNavigating, navigate]);

  // Handle tab visibility changes
  const handleTabVisible = () => {
    // If we were navigating when tab became hidden, reset navigation state
    if (isNavigating) {
      console.log('Tab became visible during navigation - resetting router state');
      setIsNavigating(false);
      // Refresh current route
      navigate(location.pathname, { replace: true, state: { refresh: Date.now() } });
    }
  };

  useTabVisibility({
    onVisible: handleTabVisible
  });

  // Override navigate to track navigation state
  const enhancedNavigate = (to: any, options?: any) => {
    if (typeof to === 'string') {
      setIsNavigating(true);
      lastLocationRef.current = to;
    }
    return navigate(to, options);
  };

  // Provide a manual refresh function
  const refreshRouter = () => {
    console.log('Manually refreshing router state');
    navigate(location.pathname, { replace: true, state: { refresh: Date.now() } });
  };

  return {
    navigate: enhancedNavigate,
    refreshRouter,
    isNavigating,
    location
  };
}; 