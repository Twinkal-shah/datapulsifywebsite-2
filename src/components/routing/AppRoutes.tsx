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
import { GSCCallback } from '@/pages/GSCCallback';
import { lazy, useEffect, useState } from 'react';
import { LazyComponentWrapper } from '@/components/LazyComponentWrapper';
import NotFound from "@/pages/NotFound";
import { supabase } from "@/lib/supabaseClient";

// Login component for app subdomain OAuth initiation
const AppLogin = () => {
  const [status, setStatus] = useState('Initiating login...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initiateOAuth = async () => {
      try {
        setStatus('Redirecting to Google for authentication...');

        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google' as const,
          options: {
            redirectTo: 'https://app.datapulsify.com/auth/google/callback',
            queryParams: {
              access_type: 'offline',
              prompt: 'consent'
            },
            skipBrowserRedirect: false
          }
        });

        if (error) {
          throw new Error(`Authentication failed: ${error.message}`);
        }

        setStatus('Redirecting to Google...');

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
        console.error('OAuth error:', error);
        setError(errorMessage);
        
        // Redirect back to marketing site after error
        setTimeout(() => {
          window.location.href = 'https://datapulsify.com?error=login_failed';
        }, 3000);
      }
    };

    initiateOAuth();
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-6">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 text-red-600">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-2.186-.833-2.956 0L3.857 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Login Error
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {error}
            </p>
            <p className="mt-4 text-xs text-gray-500">
              Redirecting back to homepage...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Connecting to Google
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {status}
          </p>
          <div className="mt-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

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
    const checkSession = async () => {
      // Skip if we're already loading or have a user
      if (loading || user || isRefreshing) return;
      
      // Check if we just completed authentication
      const authSuccess = sessionStorage.getItem('auth_success');
      if (authSuccess) {
        console.log('🔐 Recent authentication detected, waiting for session...');
        // Give more time for session to establish
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      // If no user and not loading, try refreshing session
      if (!user && !refreshAttempted && !hasCheckedSession) {
        console.log('🔄 ProtectedRoute: Attempting session refresh...');
        setRefreshAttempted(true);
        setIsRefreshing(true);
        
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            console.log('✅ Session found:', { email: session.user.email });
            // AuthContext will handle setting the user
          } else {
            const success = await refreshSession();
            console.log('🔄 Session refresh result:', success ? 'SUCCESS' : 'FAILED');
          }
        } catch (error) {
          console.error('❌ Session refresh error:', error);
        } finally {
          setIsRefreshing(false);
          setHasCheckedSession(true);
        }
      }
    };
    
    checkSession();
  }, [user, loading, refreshAttempted, refreshSession, hasCheckedSession, isRefreshing]);
  
  // Show loading while checking authentication
  if (loading || isRefreshing || (!hasCheckedSession && !user)) {
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
    console.log('❌ ProtectedRoute: No user after all checks');
    
    // Clear any stale auth data
    sessionStorage.removeItem('auth_success');
    localStorage.removeItem('user');
    sessionStorage.clear();
    
    // Redirect to marketing site
    const redirectUrl = window.location.hostname === 'app.datapulsify.com'
      ? 'https://datapulsify.com'
      : '/';
    
    console.log('🔄 Redirecting to:', redirectUrl);
    window.location.replace(redirectUrl);
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-[#0f1115] to-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Redirecting to login...</div>
      </div>
    );
  }
  
  console.log('✅ ProtectedRoute: User authenticated, rendering content');
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
      <Route path="/auth/gsc/callback" element={<GSCCallback />} />
      
      {/* Login route for app subdomain OAuth initiation */}
      <Route path="/auth/login" element={<AppLogin />} />
      
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