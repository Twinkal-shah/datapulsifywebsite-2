import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const AddonRedirect = () => {
  const navigate = useNavigate();
  const auth = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAddonAuth = async () => {
      try {
        // Get all parameters from URL
        const params = new URLSearchParams(window.location.search);
        const email = params.get('email');
        const property = params.get('property');
        const accessToken = params.get('accessToken');

        if (!email || !property || !accessToken) {
          throw new Error('Missing required authentication parameters');
        }

        // Store GSC data
        localStorage.setItem('gsc_token', accessToken);
        localStorage.setItem('gsc_property', property);

        // Update user data in auth context
        auth.login({
          name: email.split('@')[0], // Use email username as display name
          email: email,
          member_since: new Date().toISOString(),
          current_plan: "GSC Plan",
          gscProperty: property,
          isAddonUser: true
        });

        // Redirect to dashboard
        navigate('/dashboard');
      } catch (error) {
        console.error('Authentication failed:', error);
        setError('Authentication failed. Please try again: ' + (error instanceof Error ? error.message : 'Unknown error'));
      }
    };

    handleAddonAuth();
  }, [navigate, auth]);

  if (error) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="bg-[#1a1d23] p-6 rounded-2xl text-center">
          <h2 className="text-xl text-white mb-4">Authentication Error</h2>
          <p className="text-red-400">{error}</p>
          <button 
            onClick={() => navigate('/')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center">
      <div className="text-white text-xl">Authenticating...</div>
    </div>
  );
};

export default AddonRedirect; 