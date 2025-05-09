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
        // Get the token from URL parameters
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');
        const state = params.get('state');

        if (!token) {
          throw new Error('No authentication token provided');
        }

        // Store the token in localStorage
        localStorage.setItem('addon_token', token);
        if (state) {
          localStorage.setItem('addon_state', state);
        }

        // Update user data in auth context
        auth.login({
          name: "Add-on User", // This will be updated with real data from your backend
          email: "addon@example.com", // This will be updated with real data from your backend
          member_since: new Date().toISOString(),
          current_plan: "Add-on Plan"
        });

        // Redirect to dashboard
        navigate('/dashboard');
      } catch (error) {
        console.error('Authentication failed:', error);
        setError('Authentication failed. Please try again.');
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