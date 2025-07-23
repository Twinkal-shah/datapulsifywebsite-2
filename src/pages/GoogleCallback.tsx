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

  useEffect(() => {
    const handleCallback = async () => {
      if (isProcessing) return;
      setIsProcessing(true);
      
      try {
        setStatus('Verifying authentication...');
        
        // Get the code from URL
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        
        if (!code) {
          throw new Error('No code found in URL');
        }

        // Get the code verifier from storage
        const codeVerifier = localStorage.getItem('supabase.auth.token.code_verifier');
        console.log('🔍 Auth parameters:', {
          hasCode: !!code,
          hasCodeVerifier: !!codeVerifier,
          url: window.location.href
        });

        if (!codeVerifier) {
          throw new Error('No code verifier found. Please try logging in again.');
        }

        // Exchange the code for a session
        const { data: authData, error: authError } = await supabase.auth.exchangeCodeForSession(code);
        
        if (authError) {
          throw new Error(`Failed to exchange code for session: ${authError.message}`);
        }
        
        if (!authData.session) {
          throw new Error('No session returned from code exchange');
        }
        
        console.log('✅ Session established:', { 
          user: authData.session.user.email,
          expiresAt: new Date(authData.session.expires_at! * 1000).toISOString()
        });

        // Clear the code verifier
        localStorage.removeItem('supabase.auth.token.code_verifier');
        
        // Store success flag
        sessionStorage.setItem('auth_success', 'true');
        
        // Redirect to app subdomain if needed
        const currentHostname = window.location.hostname;
        const isAppDomain = currentHostname === 'app.datapulsify.com';
        
        if (!isAppDomain) {
          const appUrl = 'https://app.datapulsify.com/dashboard';
          console.log('🔄 Redirecting to app subdomain:', appUrl);
          window.location.replace(appUrl);
        } else {
          console.log('✅ Already on app subdomain, using React Router');
          navigate('/dashboard');
        }
      } catch (error) {
        console.error('❌ Authentication error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
        setError(`${errorMessage}. Please try logging in again.`);
        
        // Clear any stale auth state
        localStorage.removeItem('supabase.auth.token.code_verifier');
        localStorage.removeItem('supabase.auth.token');
        sessionStorage.clear();
      }
    };

    handleCallback();
  }, [navigate]);

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
                onClick={() => {
                  // Clear auth state and try again
                  localStorage.removeItem('supabase.auth.token.code_verifier');
                  localStorage.removeItem('supabase.auth.token');
                  sessionStorage.clear();
                  window.location.href = '/';
                }}
                className="w-full inline-flex items-center px-4 py-2 border border-orange-300 text-sm font-medium rounded-md shadow-sm text-orange-700 bg-orange-50 hover:bg-orange-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
              >
                Clear Auth State & Try Again
              </button>
              <button
                onClick={() => navigate('/')}
                className="w-full inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Return to Home
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