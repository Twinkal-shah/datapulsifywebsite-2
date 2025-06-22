import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export const useTabVisibility = () => {
  const [isVisible, setIsVisible] = useState(!document.hidden);
  const [lastVisibilityChange, setLastVisibilityChange] = useState(Date.now());

  useEffect(() => {
    const handleVisibilityChange = async () => {
      const wasHidden = !isVisible;
      const nowVisible = !document.hidden;
      
      setIsVisible(nowVisible);
      setLastVisibilityChange(Date.now());

      // If tab became visible after being hidden, refresh session
      if (wasHidden && nowVisible) {
        console.log('Tab became visible, refreshing session...');
        try {
          // Non-blocking session refresh
          await supabase.auth.getSession();
          console.log('Session refreshed successfully');
        } catch (error) {
          console.warn('Session refresh failed:', error);
        }
      }
    };

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
  }, [isVisible]);

  return {
    isVisible,
    lastVisibilityChange,
    wasRecentlyHidden: Date.now() - lastVisibilityChange < 5000 // 5 seconds
  };
}; 