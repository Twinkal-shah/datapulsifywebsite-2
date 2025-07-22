import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getAppUrl } from '@/lib/supabaseClient';

export default function AddonRedirect() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAddonAuth = async () => {
      try {
        const params = new URLSearchParams(location.search);
        const email = params.get('email');
        const property = params.get('property');
        const accessToken = params.get('accessToken');

        if (!email || !property || !accessToken) {
          throw new Error('Missing required parameters');
        }

        // Store GSC token and property in localStorage
        localStorage.setItem('gsc_token', accessToken);
        localStorage.setItem('gsc_property', property);

        // Log in the user with addon data
        await login({
          id: `addon-${email}`,
          name: email.split('@')[0],
          email: email,
          member_since: new Date().toISOString(),
          current_plan: "GSC Plan",
          gscProperty: property,
          isAddonUser: true
        });

        // Redirect to app subdomain dashboard
        window.location.href = `${getAppUrl()}/dashboard`;
      } catch (error) {
        console.error('Authentication failed:', error);
        setError('Authentication failed. Please try again: ' + (error instanceof Error ? error.message : 'Unknown error'));
      }
    };

    handleAddonAuth();
  }, [location, login, navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-400 mb-4">Authentication Error</h1>
          <p className="text-gray-300 mb-4">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
        <h1 className="text-xl font-semibold text-white mb-2">Authenticating...</h1>
        <p className="text-gray-400">Please wait while we set up your account.</p>
      </div>
    </div>
  );
} 