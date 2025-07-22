import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { GoogleAuthService } from '@/lib/googleAuthService';
import { getAppUrl } from '@/lib/supabaseClient';

const GoogleCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const authService = new GoogleAuthService();
        const urlParams = new URLSearchParams(location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        
        if (!code) {
          throw new Error('No authorization code received');
        }

        // Exchange code for tokens
        await authService.handleCallback(code, state);
        
        setStatus('success');
        setMessage('Successfully connected to Google Search Console!');
        
        // Redirect to dashboard after a short delay
        setTimeout(() => {
          window.location.href = `${getAppUrl()}/dashboard`;
        }, 2000);
        
      } catch (error) {
        console.error('Google Auth callback error:', error);
        setStatus('error');
        setMessage(error instanceof Error ? error.message : 'Authentication failed');
      }
    };

    handleCallback();
  }, [location.search]);

  const handleDashboardRedirect = () => {
    window.location.href = `${getAppUrl()}/dashboard`;
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <h1 className="text-xl font-semibold text-white mb-2">Processing Authentication...</h1>
          <p className="text-gray-400">Please wait while we connect your Google Search Console.</p>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="max-w-md w-full space-y-8 p-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h2 className="mt-6 text-3xl font-extrabold text-white">Success!</h2>
            <p className="mt-2 text-sm text-gray-400">{message}</p>
            <p className="mt-2 text-xs text-gray-500">Redirecting to dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-white">Authentication Error</h2>
          <p className="mt-2 text-sm text-gray-400">{message}</p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => {
              const authService = new GoogleAuthService();
              authService.clearAuthState();
              navigate('/settings/googlesearchconsole');
            }}
            className="w-full inline-flex items-center px-4 py-2 border border-orange-300 text-sm font-medium rounded-md shadow-sm text-orange-700 bg-orange-50 hover:bg-orange-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
          >
            Clear Auth State & Try Again
          </button>
          <button
            onClick={handleDashboardRedirect}
            className="w-full inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default GoogleCallback; 