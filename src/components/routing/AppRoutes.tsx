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
import ThankYou from '@/pages/ThankYou';
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
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [oauthUrl, setOauthUrl] = useState<string | null>(null);

  useEffect(() => {
    const initiateOAuth = async () => {
      try {
        console.log('🚀 AppLogin: Starting OAuth initiation...', {
          hostname: window.location.hostname,
          pathname: window.location.pathname,
          timestamp: new Date().toISOString()
        });

        setStatus('Connecting to Google...');

        // Add debug information
        const envDebug = {
          supabaseUrl: !!import.meta.env.VITE_SUPABASE_URL,
          supabaseKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
          isDev: import.meta.env.DEV,
          mode: import.meta.env.MODE
        };
        
        console.log('🔍 Environment debug:', envDebug);
        setDebugInfo(envDebug);

        // Validate required environment variables
        if (!import.meta.env.VITE_SUPABASE_URL) {
          throw new Error('VITE_SUPABASE_URL is not configured');
        }
        if (!import.meta.env.VITE_SUPABASE_ANON_KEY) {
          throw new Error('VITE_SUPABASE_ANON_KEY is not configured');
        }

        // Check if Supabase is properly initialized
        const { data: session, error: sessionError } = await supabase.auth.getSession();
        console.log('📊 Current session status:', {
          hasSession: !!session?.session,
          sessionError: sessionError?.message,
          user: session?.session?.user?.email
        });

        if (sessionError) {
          console.warn('⚠️ Session check error:', sessionError);
        }

        setStatus('Redirecting to Google for authentication...');

        // Try the OAuth initiation with enhanced error handling
        console.log('📤 Attempting OAuth initiation...');
        
        // Check if localStorage is available and working
        try {
          localStorage.setItem('test_storage', 'test');
          localStorage.removeItem('test_storage');
          console.log('✅ localStorage is working');
        } catch (storageError) {
          console.error('❌ localStorage error:', storageError);
          throw new Error('Browser storage is not available. Please check your browser settings and try again.');
        }

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

        console.log('📤 OAuth response:', {
          hasData: !!data,
          hasError: !!error,
          dataUrl: data?.url,
          errorMessage: error?.message,
          errorCode: error?.status
        });

        // Store the OAuth URL for debugging
        if (data?.url) {
          setOauthUrl(data.url);
          console.log('🔗 Full OAuth URL:', data.url);
        }

        // Check if code verifier was stored (important for PKCE flow)
        setTimeout(() => {
          const codeVerifierKeys = Object.keys(localStorage).filter(key => 
            key.includes('auth-token-code-verifier')
          );
          console.log('🔍 PKCE code verifier check:', {
            found: codeVerifierKeys.length > 0,
            keys: codeVerifierKeys
          });
          
          if (codeVerifierKeys.length === 0) {
            console.warn('⚠️ No PKCE code verifier found in localStorage - this may cause callback issues');
          }
        }, 100);

        if (error) {
          console.error('❌ OAuth initiation error:', error);
          
          // Provide more specific error messages based on error type
          let userFriendlyMessage = `OAuth initiation failed: ${error.message}`;
          
          if (error.message.includes('Invalid login credentials')) {
            userFriendlyMessage = 'Google OAuth configuration error. Please check that your Google Client ID is correctly configured.';
          } else if (error.message.includes('redirect_uri_mismatch')) {
            userFriendlyMessage = 'Redirect URI mismatch. Please ensure https://app.datapulsify.com/auth/google/callback is added to your Google OAuth configuration.';
          } else if (error.message.includes('access_denied')) {
            userFriendlyMessage = 'Access was denied. Please try again and grant the necessary permissions.';
          } else if (error.message.includes('invalid_client')) {
            userFriendlyMessage = 'Invalid Google Client configuration. Please check your Google OAuth client settings.';
          }
          
          throw new Error(userFriendlyMessage);
        }

        if (!data?.url) {
          console.error('❌ No OAuth URL returned from Supabase');
          throw new Error('No authentication URL received. This usually indicates a configuration issue with Supabase or Google OAuth. Please check your environment variables.');
        }

        setStatus('Redirecting to Google...');
        console.log('✅ OAuth URL received, redirecting...', {
          url: data.url.substring(0, 100) + '...'
        });

        setIsRedirecting(true);

        // Log the exact redirect attempt
        console.log('🌐 About to redirect to Google OAuth URL');
        
        // Add a listener to detect if the redirect fails
        const beforeUnloadHandler = () => {
          console.log('🔄 Page is unloading - redirect should be happening');
        };
        
        window.addEventListener('beforeunload', beforeUnloadHandler);
        
        // Try to detect if redirect fails by checking if we're still here after a delay
        const redirectTimeout = setTimeout(() => {
          window.removeEventListener('beforeunload', beforeUnloadHandler);
          
          if (window.location.href.includes('/auth/login')) {
            console.error('❌ Redirect failed - still on login page after 3 seconds');
            console.log('🔍 Checking for redirect failure reasons:', {
              currentUrl: window.location.href,
              oauthUrl: data.url,
              userAgent: navigator.userAgent.substring(0, 100),
              cookies: document.cookie ? 'Present' : 'None',
              localStorage: Object.keys(localStorage).length,
              sessionStorage: Object.keys(sessionStorage).length
            });
            
            setError('Redirect to Google failed. This may be due to:\n• Browser blocking the redirect\n• Popup blocker enabled\n• Invalid OAuth configuration\n• Network connectivity issues\n\nPlease check the browser console for more details.');
            setIsRedirecting(false);
          }
        }, 3000);

        // Give a moment for the redirect to happen, but don't auto-redirect on error
        setTimeout(() => {
          clearTimeout(redirectTimeout);
          window.removeEventListener('beforeunload', beforeUnloadHandler);
          
          if (!isRedirecting && window.location.href.includes('/auth/login')) {
            console.warn('⚠️ Still on login page after redirect attempt');
            setError('Redirect to Google failed. This may be due to popup blockers or browser security settings.');
          }
        }, 5000);

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
        console.error('💥 OAuth error:', {
          error,
          message: errorMessage,
          stack: error instanceof Error ? error.stack : 'No stack trace'
        });
        
        setError(errorMessage);
        setIsRedirecting(false);
        
        // Don't auto-redirect on error - let user see the error and choose
        console.log('🛑 Not auto-redirecting due to error. User can manually return to homepage.');
      }
    };

    initiateOAuth();
  }, []);

  const copyOAuthUrl = () => {
    if (oauthUrl) {
      navigator.clipboard.writeText(oauthUrl);
      alert('OAuth URL copied to clipboard! You can paste it in a new tab to test manually.');
    }
  };

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
              Google Login Error
            </h2>
            <p className="mt-2 text-sm text-gray-600 whitespace-pre-line">
              {error}
            </p>
            {debugInfo && (
              <div className="mt-4 p-3 bg-gray-100 rounded text-xs text-left">
                <strong>Debug info:</strong>
                <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
              </div>
            )}
            {oauthUrl && (
              <div className="mt-4 p-3 bg-blue-50 rounded text-xs">
                <strong>OAuth URL generated:</strong>
                <div className="mt-1 break-all text-blue-800">
                  {oauthUrl.substring(0, 100)}...
                </div>
                <button 
                  onClick={copyOAuthUrl}
                  className="mt-2 px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                >
                  Copy Full URL for Manual Testing
                </button>
              </div>
            )}
            <div className="mt-6 space-y-3">
              <button 
                onClick={() => window.location.reload()}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Try Again
              </button>
              <button 
                onClick={() => window.location.href = 'https://datapulsify.com'}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Return to Homepage
              </button>
            </div>
            <p className="mt-4 text-xs text-gray-500">
              Press Ctrl+Shift+D on the homepage to run diagnostics
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
          {debugInfo && (
            <div className="mt-4 p-3 bg-gray-100 rounded text-xs text-left">
              <strong>Environment:</strong>
              <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
            </div>
          )}
          <p className="mt-4 text-xs text-gray-500">
            If this takes more than 10 seconds, there may be a configuration issue.
          </p>
          <button 
            onClick={() => window.location.href = 'https://datapulsify.com'}
            className="mt-2 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm"
          >
            Cancel and Return Home
          </button>
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
      
      {/* Thank you page - for payment completion */}
      <Route path="/thank-you" element={<ThankYou />} />
      
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