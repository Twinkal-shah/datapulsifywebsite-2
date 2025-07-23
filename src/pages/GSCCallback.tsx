import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const GSCCallback: React.FC = () => {
  const [status, setStatus] = useState<string>('Processing GSC authentication...');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const processGSCCallback = async () => {
      try {
        console.log('🔄 GSC Callback: Starting processing...');
        
        // Get OAuth parameters from URL
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const scope = urlParams.get('scope');
        const error_param = urlParams.get('error');

        console.log('🔍 GSC OAuth Parameters:', {
          hasCode: !!code,
          hasState: !!state,
          scope: scope,
          hasError: !!error_param,
          url: window.location.href
        });

        // Handle OAuth error
        if (error_param) {
          throw new Error(`OAuth error: ${error_param}`);
        }

        // Validate this is a GSC OAuth callback
        if (!code) {
          throw new Error('No authorization code found in URL');
        }

        if (!scope || !scope.includes('webmasters')) {
          throw new Error('Invalid scope - this does not appear to be a GSC OAuth callback');
        }

        setStatus('Exchanging authorization code for access token...');

        // Get Google OAuth credentials from environment
        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
        const clientSecret = import.meta.env.VITE_GOOGLE_CLIENT_SECRET;
        const redirectUri = 'https://app.datapulsify.com/auth/gsc/callback';

        if (!clientId || !clientSecret) {
          throw new Error('Google OAuth credentials not configured');
        }

        console.log('🔄 Exchanging code for token...', {
          clientId: clientId.substring(0, 20) + '...',
          redirectUri,
          hasCode: !!code
        });

        // Exchange code for tokens
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            code,
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: redirectUri,
            grant_type: 'authorization_code',
          }),
        });

        if (!tokenResponse.ok) {
          const errorData = await tokenResponse.json().catch(() => ({}));
          console.error('❌ Token exchange failed:', errorData);
          
          let errorMessage = 'Failed to exchange authorization code for access token';
          if (errorData.error_description) {
            errorMessage += `: ${errorData.error_description}`;
          } else if (errorData.error) {
            errorMessage += `: ${errorData.error}`;
          }
          
          throw new Error(errorMessage);
        }

        const tokens = await tokenResponse.json();
        console.log('✅ Token exchange successful:', {
          hasAccessToken: !!tokens.access_token,
          hasRefreshToken: !!tokens.refresh_token
        });

        if (!tokens.access_token) {
          throw new Error('No access token received from Google');
        }

        // Store tokens in localStorage
        localStorage.setItem('gsc_token', tokens.access_token);
        if (tokens.refresh_token) {
          localStorage.setItem('gsc_refresh_token', tokens.refresh_token);
        }

        // Clear any auth state
        const authKeys = [
          'gsc_oauth_state', 'gsc_oauth_timestamp', 'gsc_auth_in_progress',
          'gsc_auth_pending', 'gsc_callback_processing'
        ];
        authKeys.forEach(key => {
          localStorage.removeItem(key);
          sessionStorage.removeItem(key);
        });

        console.log('✅ GSC authentication completed successfully!');
        setStatus('GSC connected successfully! Redirecting to settings...');

        // Redirect to settings after a short delay
        setTimeout(() => {
          navigate('/settings/googlesearchconsole');
        }, 2000);

      } catch (error) {
        console.error('❌ GSC callback error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        setError(errorMessage);
        setStatus('GSC authentication failed');
      }
    };

    processGSCCallback();
  }, [navigate]);

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
              GSC Authentication Failed
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {error}
            </p>
            <div className="mt-6 space-y-3">
              <button
                onClick={() => {
                  // Clear all auth state
                  const authKeys = [
                    'gsc_oauth_state', 'gsc_oauth_timestamp', 'gsc_auth_in_progress',
                    'gsc_auth_pending', 'gsc_callback_processing'
                  ];
                  authKeys.forEach(key => {
                    localStorage.removeItem(key);
                    sessionStorage.removeItem(key);
                  });
                  navigate('/settings/googlesearchconsole');
                }}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Back to Settings
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
          <div className="mx-auto h-12 w-12 text-indigo-600">
            <svg className="animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Connecting to Google Search Console
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {status}
          </p>
          <div className="mt-4">
            <div className="bg-indigo-50 border border-indigo-200 rounded-md p-4">
              <p className="text-sm text-indigo-700">
                Please wait while we complete the authentication process...
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 