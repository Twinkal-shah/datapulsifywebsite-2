import React, { useState, useCallback } from 'react';
import { DashboardLayout } from './DashboardLayout';
import { useNavigate, useLocation } from 'react-router-dom';

interface DashboardLayoutEnhancedProps {
  children: React.ReactNode;
  title: string;
  fullScreen?: boolean;
  comparisonText?: string;
}

export function DashboardLayoutEnhanced({ 
  children, 
  title, 
  fullScreen = false, 
  comparisonText 
}: DashboardLayoutEnhancedProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isNavigating, setIsNavigating] = useState(false);

  // Enhanced navigation with loading state
  const handleNavigation = useCallback((href: string) => {
    if (location.pathname === href) return;
    
    setIsNavigating(true);
    
    // Small delay to show loading state, then navigate
    setTimeout(() => {
      navigate(href);
      setIsNavigating(false);
    }, 150);
  }, [navigate, location.pathname]);

  // Create enhanced navigation items
  const navigationItems = [
    {
      title: 'Dashboard',
      href: '/dashboard',
      active: location.pathname === '/dashboard',
      onClick: () => handleNavigation('/dashboard')
    },
    {
      title: 'Click Gap Intelligence',
      href: '/click-gap-intelligence',
      active: location.pathname === '/click-gap-intelligence',
      onClick: () => handleNavigation('/click-gap-intelligence')
    },
    {
      title: 'Top Gainers Report',
      href: '/top-gainers-report',
      active: location.pathname === '/top-gainers-report',
      onClick: () => handleNavigation('/top-gainers-report')
    },
    {
      title: 'Custom AI Dashboard',
      href: '/custom-ai-dashboard',
      active: location.pathname === '/custom-ai-dashboard',
      onClick: () => handleNavigation('/custom-ai-dashboard')
    },
    {
      title: 'Rank Tracker',
      href: '/rank-tracker',
      active: location.pathname === '/rank-tracker',
      onClick: () => handleNavigation('/rank-tracker')
    },
    {
      title: 'Settings',
      href: '/settings',
      active: location.pathname === '/settings',
      onClick: () => handleNavigation('/settings')
    }
  ];

  return (
    <DashboardLayout
      title={title}
      fullScreen={fullScreen}
      comparisonText={comparisonText}
      navigationItems={navigationItems}
    >
      {isNavigating ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading...</p>
          </div>
        </div>
      ) : (
        children
      )}
    </DashboardLayout>
  );
}

export default DashboardLayoutEnhanced; 