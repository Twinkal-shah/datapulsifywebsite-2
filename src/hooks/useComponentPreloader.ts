import { useEffect } from 'react';
import { useTabVisibility } from './useTabVisibility';

// Preload functions for lazy components
const preloadComponents = {
  dashboard: () => import('../pages/Dashboard'),
  settings: () => import('../pages/Settings'),
  rankTracker: () => import('../pages/RankTracker'),
  clickGapIntelligence: () => import('../pages/ClickGapIntelligence'),
  customAIDashboard: () => import('../pages/CustomAIDashboard'),
};

export const useComponentPreloader = () => {
  const { isVisible } = useTabVisibility();

  useEffect(() => {
    // Preload components when tab becomes visible to speed up navigation
    if (isVisible) {
      const preloadDelay = setTimeout(() => {
        console.log('Preloading components for faster navigation...');
        
        // Preload all main components in the background
        Object.entries(preloadComponents).forEach(([name, loader]) => {
          loader().catch(error => {
            console.warn(`Failed to preload ${name}:`, error);
          });
        });
      }, 2000); // 2 second delay to not interfere with current page

      return () => clearTimeout(preloadDelay);
    }
  }, [isVisible]);
}; 