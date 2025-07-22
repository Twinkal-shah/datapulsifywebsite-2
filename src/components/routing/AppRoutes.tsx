import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { subdomainService } from "@/config/subdomainConfig";
import AccountDashboard from "@/pages/AccountDashboard";
import Dashboard from '@/pages/Dashboard';
import ClickGapIntelligence from '@/pages/ClickGapIntelligence';
import RankTracker from '@/pages/RankTracker';
import Settings from '@/pages/Settings';
import CustomAIDashboard from '@/pages/CustomAIDashboard';
import TopGainersReport from '@/pages/TopGainersReport';
import TestGSC from '@/pages/TestGSC';
import { GoogleCallback } from '@/pages/GoogleCallback';
import { lazy, useEffect, useState } from 'react';
import { LazyComponentWrapper } from '@/components/LazyComponentWrapper';
import NotFound from "@/pages/NotFound";

// Enhanced lazy loading with retry on tab visibility
const createLazyComponent = (importFn: () => Promise<any>) => {
  const LazyComponent = lazy(importFn);
  return (props: any) => (
    <LazyComponentWrapper>
      <LazyComponent {...props} />
    </LazyComponentWrapper>
  );
};

// Lazy load less critical components
const SharedReportPage = createLazyComponent(() => import('@/pages/SharedReportPage'));

// Protected Route wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, refreshSession } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshAttempted, setRefreshAttempted] = useState(false);
  const [hasCheckedSession, setHasCheckedSession] = useState(false);
  
  useEffect(() => {
    // If no user and not loading, try refreshing session once
    if (!user && !loading && !refreshAttempted && !hasCheckedSession) {
      console.log('🔄 ProtectedRoute: No user found, attempting session refresh...');
      setRefreshAttempted(true);
      setIsRefreshing(true);
      
      refreshSession()
        .then((success) => {
          console.log('🔄 ProtectedRoute session refresh:', success ? 'SUCCESS' : 'FAILED');
          setHasCheckedSession(true);
        })
        .catch((error) => {
          console.error('❌ ProtectedRoute session refresh error:', error);
          setHasCheckedSession(true);
        })
        .finally(() => {
          setIsRefreshing(false);
        });
    }
  }, [user, loading, refreshAttempted, refreshSession, hasCheckedSession]);
  
  // Show loading while checking authentication
  if (loading || isRefreshing || !hasCheckedSession) {
    console.log('⏳ ProtectedRoute: Loading state', { loading, isRefreshing, hasCheckedSession, hasUser: !!user });
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-[#0f1115] to-gray-900 flex items-center justify-center">
        <div className="text-white text-xl flex items-center gap-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
          {isRefreshing ? 'Refreshing session...' : 'Loading...'}
        </div>
      </div>
    );
  }
  
  // Only redirect if we've completed all checks and still no user
  if (!user && hasCheckedSession) {
    console.log('❌ ProtectedRoute: No user after all checks, redirecting to marketing site...');
    
    // Give a small delay to prevent immediate redirects during auth flow
    setTimeout(() => {
      const config = subdomainService.getConfig();
      if (config.hostname.includes('datapulsify.com')) {
        // Clear any stale data before redirecting
        localStorage.removeItem('user');
        sessionStorage.clear();
        console.log('🔄 Redirecting to marketing site:', subdomainService.getMarketingUrl('/'));
        window.location.href = subdomainService.getMarketingUrl('/');
      } else {
        window.location.href = '/';
      }
    }, 100); // Small delay to prevent race conditions
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-[#0f1115] to-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Redirecting to login...</div>
      </div>
    );
  }
  
  console.log('✅ ProtectedRoute: User authenticated, rendering protected content');
  return <>{children}</>;
};

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Redirect root to dashboard */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      
      {/* Protected App Routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
      
      <Route path="/account" element={
        <ProtectedRoute>
          <AccountDashboard />
        </ProtectedRoute>
      } />
      
      <Route path="/account-dashboard" element={
        <ProtectedRoute>
          <AccountDashboard />
        </ProtectedRoute>
      } />
      
      <Route path="/click-gap-intelligence" element={
        <ProtectedRoute>
          <ClickGapIntelligence />
        </ProtectedRoute>
      } />
      
      <Route path="/rank-tracker" element={
        <ProtectedRoute>
          <RankTracker />
        </ProtectedRoute>
      } />
      
      <Route path="/custom-ai-dashboard" element={
        <ProtectedRoute>
          <CustomAIDashboard />
        </ProtectedRoute>
      } />
      
      <Route path="/top-gainers-report" element={
        <ProtectedRoute>
          <TopGainersReport />
        </ProtectedRoute>
      } />
      
      {/* App-specific routes that redirect to dashboard */}
      <Route path="/keyword-analysis" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
      
      <Route path="/gap-analysis" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
      
      <Route path="/keyword-clustering" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
      
      <Route path="/reports" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
      
      <Route path="/settings" element={
        <ProtectedRoute>
          <Settings />
        </ProtectedRoute>
      } />
      
      <Route path="/settings/accountdashboard" element={
        <ProtectedRoute>
          <Settings />
        </ProtectedRoute>
      } />
      
      <Route path="/settings/googlesearchconsole" element={
        <ProtectedRoute>
          <Settings />
        </ProtectedRoute>
      } />
      
      <Route path="/settings/accountsettings" element={
        <ProtectedRoute>
          <Settings />
        </ProtectedRoute>
      } />
      
      <Route path="/settings/notifications" element={
        <ProtectedRoute>
          <Settings />
        </ProtectedRoute>
      } />
      
      <Route path="/settings/keywordstype" element={
        <ProtectedRoute>
          <Settings />
        </ProtectedRoute>
      } />
      
      <Route path="/settings/keywordscategory" element={
        <ProtectedRoute>
          <Settings />
        </ProtectedRoute>
      } />
      
      {/* Authentication callback - available on both subdomains */}
      <Route path="/auth/google/callback" element={<GoogleCallback />} />
      <Route path="/auth/callback" element={<GoogleCallback />} />
      
      {/* Shared reports - available on both subdomains */}
      <Route path="/share/:token" element={<SharedReportPage />} />
      
      {/* Development/Testing routes */}
      <Route path="/test-gsc" element={
        <ProtectedRoute>
          <TestGSC />
        </ProtectedRoute>
      } />
      
      {/* Catch-all for 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}; 