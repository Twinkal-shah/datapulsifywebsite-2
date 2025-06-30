import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { DashboardLayout } from './DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';

// Import content components (we'll create these next)
import { DashboardContent } from './dashboard/DashboardContent';
import { ClickGapContent } from './dashboard/ClickGapContent';
import { RankTrackerContent } from './dashboard/RankTrackerContent';
import { SettingsContent } from './dashboard/SettingsContent';
import { CustomAIContent } from './dashboard/CustomAIContent';

// Dashboard section definitions
export const DASHBOARD_SECTIONS = {
  overview: {
    key: 'overview',
    title: 'Dashboard',
    component: DashboardContent,
    path: '/dashboard'
  },
  'click-gap-intelligence': {
    key: 'click-gap-intelligence',
    title: 'Click Gap Intelligence',
    component: ClickGapContent,
    path: '/dashboard/click-gap-intelligence'
  },
  'rank-tracker': {
    key: 'rank-tracker',
    title: 'Rank Tracker',
    component: RankTrackerContent,
    path: '/dashboard/rank-tracker'
  },
  'custom-ai-dashboard': {
    key: 'custom-ai-dashboard',
    title: 'Custom AI Dashboard',
    component: CustomAIContent,
    path: '/dashboard/custom-ai-dashboard'
  },
  settings: {
    key: 'settings',
    title: 'Settings',
    component: SettingsContent,
    path: '/dashboard/settings'
  }
} as const;

export type DashboardSectionKey = keyof typeof DASHBOARD_SECTIONS;

interface DashboardShellProps {
  initialSection?: DashboardSectionKey;
}

export function DashboardShell({ initialSection = 'overview' }: DashboardShellProps) {
  const { section: urlSection } = useParams<{ section?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { isSubscriptionActive } = useSubscription();

  // Determine current section from URL or default
  const getCurrentSection = (): DashboardSectionKey => {
    if (urlSection && urlSection in DASHBOARD_SECTIONS) {
      return urlSection as DashboardSectionKey;
    }
    return initialSection;
  };

  const [activeSection, setActiveSection] = useState<DashboardSectionKey>(getCurrentSection());

  // Update active section when URL changes
  useEffect(() => {
    const newSection = getCurrentSection();
    if (newSection !== activeSection) {
      setActiveSection(newSection);
    }
  }, [urlSection, activeSection]);

  // Handle section navigation - optimized for instant transitions
  const handleSectionChange = async (sectionKey: DashboardSectionKey) => {
    if (sectionKey === activeSection) return;

    // Update URL without full page reload
    const sectionConfig = DASHBOARD_SECTIONS[sectionKey];
    navigate(sectionConfig.path, { replace: false });
    
    // Update state immediately for instant navigation
    setActiveSection(sectionKey);
  };

  // Get current section configuration
  const currentSectionConfig = DASHBOARD_SECTIONS[activeSection];
  const CurrentComponent = currentSectionConfig.component;

  // Handle legacy routes by redirecting to new dashboard structure
  useEffect(() => {
    const currentPath = location.pathname;
    
    // Map legacy routes to new dashboard sections
    const legacyRouteMap: Record<string, DashboardSectionKey> = {
      '/click-gap-intelligence': 'click-gap-intelligence',
      '/rank-tracker': 'rank-tracker',
      '/custom-ai-dashboard': 'custom-ai-dashboard',
      '/settings': 'settings'
    };

    const mappedSection = legacyRouteMap[currentPath];
    if (mappedSection) {
      handleSectionChange(mappedSection);
    }
  }, [location.pathname]);

  // Enhanced navigation items for DashboardLayout
  const navigationItems = Object.values(DASHBOARD_SECTIONS).map(section => ({
    title: section.title,
    href: section.path,
    active: section.key === activeSection,
    onClick: () => handleSectionChange(section.key)
  }));

  return (
    <DashboardLayout 
      title={currentSectionConfig.title}
      fullScreen={activeSection === 'click-gap-intelligence'}
      navigationItems={navigationItems}
      onNavigate={handleSectionChange}
    >
      <React.Suspense 
        fallback={
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-4"></div>
              <p className="text-gray-400">Loading {currentSectionConfig.title}...</p>
            </div>
          </div>
        }
      >
        <CurrentComponent 
          isActive={true}
          onNavigate={handleSectionChange}
        />
      </React.Suspense>
    </DashboardLayout>
  );
}

export default DashboardShell; 