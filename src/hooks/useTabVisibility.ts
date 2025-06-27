import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface UseTabVisibilityOptions {
  onVisible?: () => void | Promise<void>;
}

export const useTabVisibility = (options?: UseTabVisibilityOptions) => {
  const [isVisible, setIsVisible] = useState(!document.hidden);
  const [lastVisibilityChange, setLastVisibilityChange] = useState(Date.now());

  const handleVisibilityChange = useCallback(async () => {
    const wasHidden = !isVisible;
    const nowVisible = !document.hidden;
    
    setIsVisible(nowVisible);
    setLastVisibilityChange(Date.now());

    // If tab became visible after being hidden, refresh session and data
    if (wasHidden && nowVisible) {
      try {
        // Very lightweight session check - don't trigger full refresh
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.warn('Session check error:', error);
        }
        
        // Delay data refresh to avoid interfering with navigation
        setTimeout(async () => {
          if (options?.onVisible && document.visibilityState === 'visible') {
            await options.onVisible();
          }
        }, 1000); // 1 second delay to let navigation complete first
        
      } catch (error) {
        console.warn('Session check failed:', error);
      }
    }
  }, [isVisible, options?.onVisible]);

  useEffect(() => {
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Also listen for focus events as backup
    window.addEventListener('focus', handleVisibilityChange);
    window.addEventListener('blur', () => {
      setIsVisible(false);
      setLastVisibilityChange(Date.now());
    });

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
      window.removeEventListener('blur', handleVisibilityChange);
    };
  }, [handleVisibilityChange]);

  return {
    isVisible,
    lastVisibilityChange,
    wasRecentlyHidden: Date.now() - lastVisibilityChange < 5000 // 5 seconds
  };
}; 