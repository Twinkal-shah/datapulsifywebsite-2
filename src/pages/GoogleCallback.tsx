import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleAuthService } from '@/lib/googleAuthService';
import { useAuth } from '@/contexts/AuthContext';

export const GoogleCallback: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('Connecting to Google Search Console...');
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        setStatus('Verifying authentication...');
        
        // Extract query parameters from URL
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const oauthError = urlParams.get('error');

        console.log('Google callback parameters:', { 
          code: code ? 'present' : 'missing', 
          state: state ? state.substring(0, 10) + '...' : 'missing', 
          error: oauthError || 'none',
          fullUrl: window.location.href
        });

        // Check for OAuth errors first
        if (oauthError) {
          setError(`OAuth error: ${oauthError}`);
          return;
        }

        // Validate required parameters
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

        setStatus('Authentication successful! Redirecting to settings...');
        
        // Set a flag to indicate recent authentication
        sessionStorage.setItem('gsc_auth_pending', 'true');
        
        // Wait a moment to ensure tokens are properly stored
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Redirect to GSC settings page instead of dashboard
        // This allows users to immediately select their property
        navigate('/settings/googlesearchconsole');
      } catch (error) {
        console.error('Authentication error:', error);
        const errorMessage = error instanceof Error ? error.message : 'An error occurred during authentication';
        
        // Check if this is a state validation error
        if (errorMessage.includes('Invalid authentication state')) {
          setError(`Authentication state validation failed. This usually happens when:
• The authentication was started in a different browser tab
• The browser storage was cleared during authentication
• Multiple authentication attempts were made simultaneously

Please try connecting to Google Search Console again from the settings page.`);
        } else {
          setError(errorMessage);
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
                onClick={() => navigate('/settings/googlesearchconsole')}
                className="w-full inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Go to Settings
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
            Connecting to Google Search Console
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