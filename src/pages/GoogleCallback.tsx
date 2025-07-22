import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleAuthService } from '@/lib/googleAuthService';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';

export const GoogleCallback: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('Processing authentication...');
  const navigate = useNavigate();
  const { user, login } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasRedirected, setHasRedirected] = useState(false);

  // Listen for auth state changes
  useEffect(() => {
    if (user && !hasRedirected && !error) {
      console.log('User authenticated via auth context, redirecting to dashboard...');
      setHasRedirected(true);
      setStatus('Authentication successful! Redirecting to dashboard...');
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
    }
  }, [user, hasRedirected, error, navigate]);

  useEffect(() => {
    const handleCallback = async () => {
      // Prevent multiple executions (React StrictMode protection)
      if (isProcessing) {
        console.log('⚠️ Callback already processing, skipping...');
        return;
      }
      
      setIsProcessing(true);
      try {
        setStatus('Verifying authentication...');
        
        // Extract query parameters from URL (for OAuth code flow)
        const urlParams = new URLSearchParams(window.location.search);
        
        // Also check URL hash (Supabase sometimes uses hash for OAuth)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        
        const code = urlParams.get('code') || hashParams.get('code');
        const state = urlParams.get('state') || hashParams.get('state');
        const oauthError = urlParams.get('error') || hashParams.get('error');
        
        console.log('OAuth callback parameters:', {
          hasCode: !!code,
          hasState: !!state,
          hasError: !!oauthError,
          url: window.location.href
        });

        // Check for OAuth errors first
        if (oauthError) {
          setError(`OAuth error: ${oauthError}`);
          return;
        }

        // Check if this is a Supabase OAuth callback (no state parameter)
        // or a GSC callback (has state parameter)
        const isSupabaseOAuth = !state;
        const isGSCAuth = !!state;

        if (isSupabaseOAuth) {
          console.log('Processing Supabase OAuth callback...');
          setStatus('Completing sign-in...');
          
          // For Supabase OAuth, let the auth context handle the authentication
          // We'll just wait and let the useEffect above handle the redirect when user is set
          console.log('Waiting for auth context to process authentication...');
          setStatus('Finalizing authentication...');
          
          // Set a timeout as fallback in case auth context doesn't update
          setTimeout(() => {
            if (!user && !hasRedirected && !error) {
              console.error('Authentication timeout - no user session established');
              setError('Authentication timed out. Please try logging in again.');
            }
          }, 10000); // 10 second timeout
        } else if (isGSCAuth) {
          console.log('Processing GSC OAuth callback...');
          setStatus('Connecting to Google Search Console...');
          
          // Validate required parameters for GSC
          if (!code || !state) {
            setError('Missing required authentication parameters. Please try connecting again.');
            return;
          }

          setStatus('Exchanging authorization code...');
          
          const authService = new GoogleAuthService();
          const result = await authService.handleCallback(code, state);

          if (!result.success) {
            setError(result.error || 'Failed to authenticate with Google');
            return;
          }

          // Check if token was stored
          const token = localStorage.getItem('gsc_token');
          if (!token) {
            setError('Authentication completed but no token was stored. Please try connecting again.');
            return;
          }

          setStatus('Authentication successful! Redirecting to settings...');
          
          // Set a flag to indicate recent authentication
          sessionStorage.setItem('gsc_auth_pending', 'true');
          
          // Wait a moment to ensure navigation is ready
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Redirect to GSC settings page
          navigate('/settings/googlesearchconsole');
        }
      } catch (error) {
        setIsProcessing(false); // Reset on error
        const errorMessage = error instanceof Error ? error.message : 'An error occurred during authentication';
        
        // Check if this is a state validation error and provide detailed guidance
        if (errorMessage.includes('Authentication state validation failed') || 
            errorMessage.includes('Invalid authentication state')) {
          setError(errorMessage);
        } else {
          // For other errors, provide basic guidance
          setError(`${errorMessage}

If this problem persists, try:
1. Clearing your browser cache and cookies
2. Disabling browser extensions temporarily
3. Using an incognito/private browsing window
4. Contacting support if the issue continues`);
        }
      }
    };

    handleCallback();
  }, [navigate, login]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Authentication Error
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {error}
            </p>
            <div className="mt-4 space-y-2">
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Go to Dashboard
              </button>
              <button
                onClick={() => navigate('/settings/googlesearchconsole')}
                className="w-full inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Go to Settings
              </button>
              <button
                onClick={() => {
                  // Clear authentication state and redirect to settings
                  const authService = new GoogleAuthService();
                  authService.clearAuthState();
                  navigate('/settings/googlesearchconsole');
                }}
                className="w-full inline-flex items-center px-4 py-2 border border-orange-300 text-sm font-medium rounded-md shadow-sm text-orange-700 bg-orange-50 hover:bg-orange-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
              >
                Clear Auth State & Try Again
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Return to Dashboard
              </button>
            </div>
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
            Processing Authentication
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