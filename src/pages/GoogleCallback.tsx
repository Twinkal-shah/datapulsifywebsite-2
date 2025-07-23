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
      console.log('🔐 User authenticated via auth context:', { email: user.email });
      setHasRedirected(true);
      setStatus('Authentication successful! Redirecting to dashboard...');
      
      // Store a flag to prevent redirect loops
      sessionStorage.setItem('auth_success', 'true');
      
      // Use window.location.replace for a clean redirect
      const appUrl = window.location.hostname === 'app.datapulsify.com'
        ? '/dashboard'
        : 'https://app.datapulsify.com/dashboard';
      
      console.log('🔄 Redirecting to:', appUrl);
      
      if (appUrl.startsWith('http')) {
        window.location.replace(appUrl);
      } else {
        navigate(appUrl);
      }
    }
  }, [user, hasRedirected, error, navigate]);

  // Add logging for debugging
  useEffect(() => {
    console.log('GoogleCallback component state:', {
      user: !!user,
      hasRedirected,
      error: !!error,
      isProcessing,
      status,
      url: window.location.href
    });
  }, [user, hasRedirected, error, isProcessing, status]);

  // Add direct Supabase auth listener for debugging
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('GoogleCallback: Supabase auth state change:', event, {
        hasSession: !!session,
        hasUser: !!session?.user,
        userEmail: session?.user?.email
      });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const handleCallback = async () => {
      if (isProcessing) return;
      setIsProcessing(true);
      
      try {
        setStatus('Verifying authentication...');
        
        // Extract query parameters
        const urlParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const code = urlParams.get('code') || hashParams.get('code');
        const state = urlParams.get('state') || hashParams.get('state');
        const oauthError = urlParams.get('error') || hashParams.get('error');
        
        console.log('🔍 OAuth callback parameters:', {
          hasCode: !!code,
          hasState: !!state,
          hasError: !!oauthError,
          url: window.location.href
        });

        if (oauthError) {
          throw new Error(`OAuth error: ${oauthError}`);
        }

        // Check if this is a Supabase OAuth callback
        const isSupabaseOAuth = !state;
        
        if (isSupabaseOAuth) {
          console.log('🔄 Processing Supabase OAuth callback...');
          setStatus('Completing sign-in...');
          
          // Get current session
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session?.user) {
            console.log('✅ Session found immediately:', { email: session.user.email });
            // The useEffect above will handle the redirect
          } else {
            // Wait a bit longer for session to be established
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Check session again
            const { data: { session: retrySession } } = await supabase.auth.getSession();
            
            if (!retrySession?.user) {
              throw new Error('No session established after waiting');
            }
          }
        } else if (state) {
          // Handle GSC auth as before...
          console.log('🔄 Processing GSC OAuth callback...');
          setStatus('Connecting to Google Search Console...');
          
          if (!code) {
            throw new Error('Missing authorization code');
          }

          const authService = new GoogleAuthService();
          const result = await authService.handleCallback(code, state);

          if (!result.success) {
            throw new Error(result.error || 'Failed to authenticate with Google');
          }

          setStatus('GSC connection successful! Redirecting...');
          navigate('/settings/googlesearchconsole');
        }
      } catch (error) {
        console.error('❌ Authentication error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
        setError(`${errorMessage}. Please try logging in again.`);
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