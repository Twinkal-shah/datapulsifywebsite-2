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
  const [status, setStatus] = useState('Initializing login...');
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);

  const addDebugLog = (message: string) => {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}`;
    console.log('🐛 DEBUG:', logEntry);
    setDebugLogs(prev => [...prev, logEntry]);
    
    // Also store in localStorage for persistence
    const existingLogs = JSON.parse(localStorage.getItem('oauth_debug_logs') || '[]');
    existingLogs.push(logEntry);
    localStorage.setItem('oauth_debug_logs', JSON.stringify(existingLogs.slice(-20))); // Keep last 20 logs
  };

  useEffect(() => {
    // Clear previous debug logs
    localStorage.removeItem('oauth_debug_logs');
    setDebugLogs([]);

    const initiateOAuth = async () => {
      try {
        addDebugLog('🚀 AppLogin: Starting OAuth initiation process');
        addDebugLog(`Current hostname: ${window.location.hostname}`);
        addDebugLog(`Current pathname: ${window.location.pathname}`);
        addDebugLog(`Current URL: ${window.location.href}`);

        setStatus('Checking environment configuration...');

        // Check environment variables with detailed logging
        const envVars = {
          VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
          VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
          VITE_GOOGLE_CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID
        };

        addDebugLog('Environment variables check:');
        Object.entries(envVars).forEach(([key, value]) => {
          addDebugLog(`  ${key}: ${value ? 'SET ✅' : 'MISSING ❌'}`);
        });

        const missingVars = Object.entries(envVars)
          .filter(([key, value]) => !value)
          .map(([key]) => key);

        if (missingVars.length > 0) {
          const errorMsg = `Missing environment variables: ${missingVars.join(', ')}`;
          addDebugLog(`❌ ${errorMsg}`);
          throw new Error(errorMsg);
        }

        addDebugLog('✅ All environment variables present');
        setStatus('Preparing OAuth configuration...');

        const redirectUrl = 'https://app.datapulsify.com/auth/google/callback';
        addDebugLog(`OAuth redirect URL: ${redirectUrl}`);
        addDebugLog(`Current origin: ${window.location.origin}`);

        const configInfo = {
          hostname: window.location.hostname,
          redirectUrl,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent.substring(0, 100) + '...',
          supabaseUrl: envVars.VITE_SUPABASE_URL,
          hasGoogleClientId: !!envVars.VITE_GOOGLE_CLIENT_ID
        };

        setDebugInfo(configInfo);
        addDebugLog('Debug info set successfully');

        setStatus('Initiating OAuth with Supabase...');
        addDebugLog('📞 About to call supabase.auth.signInWithOAuth');

        // Add a small delay to ensure logs are visible
        await new Promise(resolve => setTimeout(resolve, 1000));

                 const oauthParams = {
           provider: 'google' as const,
           options: {
             redirectTo: redirectUrl,
             queryParams: {
               access_type: 'offline',
               prompt: 'consent'
             },
             skipBrowserRedirect: false
           }
         };

         addDebugLog(`OAuth parameters: ${JSON.stringify(oauthParams, null, 2)}`);

         const { data, error } = await supabase.auth.signInWithOAuth(oauthParams);

        addDebugLog('📥 OAuth response received');
        addDebugLog(`Has data: ${!!data}`);
        addDebugLog(`Has error: ${!!error}`);
        
        if (error) {
          addDebugLog(`Error message: ${error.message}`);
          addDebugLog(`Error code: ${error.status || 'no code'}`);
          addDebugLog(`Full error: ${JSON.stringify(error, null, 2)}`);
        }

        if (data) {
          addDebugLog(`Data keys: ${Object.keys(data).join(', ')}`);
        }

        if (error) {
          const errorMsg = `OAuth initiation failed: ${error.message}`;
          addDebugLog(`❌ ${errorMsg}`);
          throw new Error(errorMsg);
        }

        addDebugLog('✅ OAuth initiation successful - should redirect to Google');
        setStatus('OAuth initiated successfully! Should redirect to Google...');

        // Extended timeout for redirect detection
        setTimeout(() => {
          addDebugLog('⚠️ Still on same page after 10 seconds - possible redirect issue');
          setError('OAuth redirect did not occur. This might indicate a configuration issue.');
        }, 10000);

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        addDebugLog(`💥 CAUGHT ERROR: ${errorMessage}`);
        
        if (error instanceof Error) {
          addDebugLog(`Error stack: ${error.stack}`);
        }
        
        setError(errorMessage);
        setStatus('Authentication failed - see debug information below');

        // Store comprehensive error info
        const errorInfo = {
          error: errorMessage,
          timestamp: new Date().toISOString(),
          location: 'AppLogin',
          debugLogs: debugLogs,
          url: window.location.href,
          userAgent: navigator.userAgent
        };

        sessionStorage.setItem('oauth_error', JSON.stringify(errorInfo));
        localStorage.setItem('oauth_error_persistent', JSON.stringify(errorInfo));

        // Much longer delay before redirect (30 seconds) to allow debugging
        setTimeout(() => {
          addDebugLog('🔄 Redirecting back to marketing site due to error...');
          window.location.href = 'https://datapulsify.com?login_error=' + encodeURIComponent(errorMessage);
        }, 30000);
      }
    };

    initiateOAuth();
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-4xl w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto h-16 w-16 text-red-600">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-2.186-.833-2.956 0L3.857 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              OAuth Login Error - DEBUG MODE
            </h2>
            <p className="mt-2 text-lg text-red-600 font-semibold">
              {error}
            </p>
            
            {/* Debug Information */}
            <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Configuration Info */}
              {debugInfo && (
                <div className="p-4 bg-blue-50 rounded-md text-left">
                  <h3 className="text-sm font-bold text-blue-900 mb-2">Configuration:</h3>
                  <pre className="text-xs text-blue-800 whitespace-pre-wrap overflow-auto">
                    {JSON.stringify(debugInfo, null, 2)}
                  </pre>
                </div>
              )}

              {/* Debug Logs */}
              <div className="p-4 bg-gray-50 rounded-md text-left">
                <h3 className="text-sm font-bold text-gray-900 mb-2">Debug Logs:</h3>
                <div className="text-xs text-gray-700 max-h-64 overflow-auto">
                  {debugLogs.map((log, index) => (
                    <div key={index} className="mb-1 font-mono">
                      {log}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="mt-6 p-4 bg-yellow-50 rounded-md">
              <h3 className="text-sm font-bold text-yellow-900 mb-2">🚨 DEBUG INSTRUCTIONS:</h3>
              <div className="text-sm text-yellow-800 text-left space-y-2">
                <p><strong>1. Take a screenshot of this entire page</strong></p>
                <p><strong>2. Copy the error message and debug logs</strong></p>
                <p><strong>3. Check your browser's Network tab for failed requests</strong></p>
                <p><strong>4. Verify your production environment variables are set</strong></p>
                <p><strong>5. Check Google Cloud Console OAuth configuration</strong></p>
              </div>
            </div>

            <div className="mt-4 p-4 bg-red-50 rounded-md">
              <p className="text-sm text-red-700">
                <strong>This page will redirect back to the homepage in 30 seconds.</strong>
                <br />
                Use this time to capture the debug information above.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-2xl w-full space-y-8 p-6">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Initiating Google Login
          </h2>
          <p className="mt-2 text-lg text-gray-600">
            {status}
          </p>
          <div className="mt-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          </div>
          
          {/* Show debug info during processing */}
          {debugInfo && (
            <div className="mt-6 p-4 bg-gray-100 rounded-md text-left">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Configuration:</h3>
              <pre className="text-xs text-gray-600 whitespace-pre-wrap">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </div>
          )}

          {/* Live debug logs */}
          {debugLogs.length > 0 && (
            <div className="mt-6 p-4 bg-green-50 rounded-md text-left">
              <h3 className="text-sm font-medium text-green-900 mb-2">Live Debug Logs:</h3>
              <div className="text-xs text-green-800 max-h-40 overflow-auto">
                {debugLogs.map((log, index) => (
                  <div key={index} className="mb-1 font-mono">
                    {log}
                  </div>
                ))}
              </div>
            </div>
          )}
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