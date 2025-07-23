import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleAuthService } from '@/lib/googleAuthService';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';

export const GoogleCallback: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('Checking authentication...');
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    const handleCallback = async () => {
      // Prevent multiple processing attempts
      if (isProcessing || hasRedirected) return;
      setIsProcessing(true);
      
      try {
        console.log('🔍 GoogleCallback: Starting authentication check...', {
          hasUser: !!user,
          userEmail: user?.email,
          loading,
          url: window.location.href,
          timestamp: new Date().toISOString()
        });

        // STEP 1: Check if user is already authenticated
        if (user && !loading) {
          console.log('✅ User already authenticated, redirecting to dashboard...', {
            email: user.email,
            from: 'existing_session'
          });
          setStatus('Already authenticated! Redirecting to dashboard...');
          setHasRedirected(true);
          
          // Small delay to show the message
          setTimeout(() => {
            navigate('/dashboard');
          }, 1000);
          return;
        }

        // STEP 2: Check for existing session in Supabase directly
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (session?.user && !sessionError) {
          console.log('✅ Found existing Supabase session, redirecting...', {
            email: session.user.email,
            from: 'supabase_session'
          });
          setStatus('Session found! Redirecting to dashboard...');
          setHasRedirected(true);
          
          setTimeout(() => {
            navigate('/dashboard');
          }, 1000);
          return;
        }

        // STEP 3: Check if this is an OAuth callback with code
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const error_param = urlParams.get('error');

        console.log('🔍 URL Analysis:', {
          hasCode: !!code,
          hasState: !!state,
          hasError: !!error_param,
          fullUrl: window.location.href
        });

        // Handle OAuth error
        if (error_param) {
          throw new Error(`OAuth error: ${error_param}`);
        }

        // STEP 4: Handle direct navigation (no OAuth code)
        if (!code) {
          console.log('⚠️ No OAuth code found - this appears to be direct navigation');
          setStatus('No authentication code found. Redirecting to login...');
          
          setTimeout(() => {
            // Redirect to marketing site for login
            window.location.href = 'https://datapulsify.com';
          }, 2000);
          return;
        }

        // STEP 5: Process OAuth callback
        console.log('🔄 Processing OAuth callback with code...');
        setStatus('Processing authentication...');

        // Check for GSC OAuth (has state parameter that starts with 'gsc-')
        if (state && state.startsWith('gsc-')) {
          console.log('🔄 Processing Google Search Console OAuth...');
          setStatus('Connecting to Google Search Console...');
          
          const authService = new GoogleAuthService();
          const result = await authService.handleCallback(code, state);

          if (!result.success) {
            console.error('❌ GSC authentication failed:', result.error);
            setError(result.error || 'Failed to authenticate with Google Search Console');
            setStatus('GSC connection failed');
            
            // Show detailed guidance to user
            if (result.guidance) {
              const guidanceLines = result.guidance.split('\n');
              const guidanceHtml = guidanceLines.map(line => 
                line.trim() ? `<p class="mb-2">${line}</p>` : '<br/>'
              ).join('');
              
              setTimeout(() => {
                const errorElement = document.querySelector('.error-guidance');
                if (errorElement) {
                  errorElement.innerHTML = guidanceHtml;
                }
              }, 100);
            }
            
            return;
          }

          console.log('✅ GSC authentication successful!');
          setStatus('GSC connection successful! Redirecting to settings...');
          setTimeout(() => {
            navigate('/settings/googlesearchconsole');
          }, 1000);
          return;
        }

        // STEP 6: Process Supabase OAuth (no state parameter)
        console.log('🔄 Processing Supabase OAuth callback...');
        setStatus('Completing sign-in...');

        // Get the code verifier from storage
        const codeVerifierKey = Object.keys(localStorage).find(key => 
          key.includes('auth-token-code-verifier')
        );
        const codeVerifier = codeVerifierKey ? localStorage.getItem(codeVerifierKey) : null;
        
        console.log('🔍 PKCE Details:', {
          hasCode: !!code,
          hasCodeVerifier: !!codeVerifier,
          codeVerifierKey: codeVerifierKey || 'not found',
          allAuthKeys: Object.keys(localStorage).filter(key => key.includes('auth')),
        });

        if (!codeVerifier) {
          throw new Error('Authentication session expired. Please try logging in again.');
        }

        // Exchange the code for a session
        const { data: authData, error: authError } = await supabase.auth.exchangeCodeForSession(code);
        
        if (authError) {
          console.error('❌ Code exchange error:', authError);
          throw new Error(`Authentication failed: ${authError.message}`);
        }
        
        if (!authData.session) {
          throw new Error('No session returned from authentication');
        }
        
        console.log('✅ Authentication successful!', { 
          user: authData.session.user.email,
          expiresAt: new Date(authData.session.expires_at! * 1000).toISOString(),
          from: 'oauth_callback'
        });

        // Clean up code verifier
        if (codeVerifierKey) {
          localStorage.removeItem(codeVerifierKey);
        }
        
        // Store success flag
        sessionStorage.setItem('auth_success', 'true');
        setStatus('Authentication successful! Redirecting to dashboard...');
        setHasRedirected(true);
        
        // Ensure we're on the app subdomain
        const currentHostname = window.location.hostname;
        const isAppDomain = currentHostname === 'app.datapulsify.com';
        
        if (!isAppDomain) {
          const appUrl = 'https://app.datapulsify.com/dashboard';
          console.log('🔄 Redirecting to app subdomain:', appUrl);
          window.location.replace(appUrl);
        } else {
          console.log('✅ Already on app subdomain, using React Router');
          setTimeout(() => {
            navigate('/dashboard');
          }, 1000);
        }

      } catch (error) {
        console.error('❌ Authentication error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
        setError(errorMessage);
        
        // Clean up any stale auth state
        const allCodeVerifierKeys = Object.keys(localStorage).filter(key => 
          key.includes('auth-token-code-verifier')
        );
        allCodeVerifierKeys.forEach(key => localStorage.removeItem(key));
        
        const allAuthTokenKeys = Object.keys(localStorage).filter(key => 
          key.includes('auth-token') && !key.includes('code-verifier')
        );
        allAuthTokenKeys.forEach(key => localStorage.removeItem(key));
        
        sessionStorage.removeItem('auth_success');
      } finally {
        setIsProcessing(false);
      }
    };

    handleCallback();
  }, [user, loading, navigate, isProcessing, hasRedirected]);

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 text-red-600">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-2.186-.833-2.956 0L3.857 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Authentication Failed
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {error}
            </p>
            
            {/* Detailed guidance section */}
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <div className="error-guidance text-left text-sm text-gray-700">
                {/* Guidance will be inserted here by JavaScript */}
              </div>
            </div>
            
            <div className="mt-6 space-y-3">
              <button
                onClick={() => {
                  // Clear auth state and try again
                  const allCodeVerifierKeys = Object.keys(localStorage).filter(key => 
                    key.includes('auth-token-code-verifier')
                  );
                  allCodeVerifierKeys.forEach(key => localStorage.removeItem(key));
                  
                  const allAuthTokenKeys = Object.keys(localStorage).filter(key => 
                    key.includes('auth-token') && !key.includes('code-verifier')
                  );
                  allAuthTokenKeys.forEach(key => localStorage.removeItem(key));
                  
                  // Clear GSC auth state
                  const gscAuthKeys = [
                    'gsc_oauth_state', 'gsc_oauth_timestamp', 'gsc_auth_in_progress',
                    'gsc_auth_pending', 'gsc_callback_processing'
                  ];
                  gscAuthKeys.forEach(key => {
                    localStorage.removeItem(key);
                    sessionStorage.removeItem(key);
                  });
                  
                  sessionStorage.clear();
                  window.location.href = '/';
                }}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Clear State & Try Again
              </button>
              
              <button
                onClick={() => {
                  window.location.href = '/settings/googlesearchconsole';
                }}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Back to Settings
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Processing Authentication
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {status}
          </p>
          <div className="mt-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          </div>
          <p className="mt-4 text-xs text-gray-500">
            Please wait while we complete your authentication...
          </p>
        </div>
      </div>
    </div>
  );
}; 