import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/ui/card';
import { Activity, User, Key, Zap, Crown, Globe } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { supabase } from '@/lib/supabaseClient';

// Add interface for user installation data
interface UserInstallation {
  id: string;
  user_id: string;
  email: string;
  install_date: string;
  business_type: string;
  business_size: string;
  subscription_type: string;
  usage_count: number;
  last_active_date: string;
}

const AccountDashboard = () => {
  const navigate = useNavigate();
  const auth = useAuth();
  const [licenseKey, setLicenseKey] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [installationData, setInstallationData] = useState<UserInstallation | null>(null);

  useEffect(() => {
    // Fetch user installation data
    const fetchInstallationData = async () => {
      if (auth.user?.email) {
        const { data, error } = await supabase
          .from('user_installations')
          .select('*')
          .eq('email', auth.user.email)
          .single();

        if (data && !error) {
          setInstallationData(data);
        }
      }
    };

    fetchInstallationData();
  }, [auth.user?.email]);

  // Your existing useEffect for auth check
  useEffect(() => {
    if (!auth.user && !auth.loading) {
      navigate('/');
    }
  }, [auth.user, auth.loading, navigate]);

  if (auth.loading) {
    return (
      <div className="gradient-bg min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  // Calculate API usage percentage
  const apiUsagePercentage = installationData ? (installationData.usage_count / 1000) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-[#0f1115] to-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Header Section - Updated with business info */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-white mb-2">Account Dashboard</h1>
            <p className="text-gray-400 text-lg">
              Welcome back, {auth.user?.name || 'User'}
              {installationData && ` • ${installationData.business_type} • ${installationData.business_size}`}
            </p>
          </div>

          {/* Main Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* User Profile Card - Updated with installation date */}
            <Card className="bg-[#1a1d23] border-0 shadow-xl p-6 rounded-2xl">
              <div className="flex items-start gap-6">
                <div className="p-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl">
                  <User className="w-8 h-8 text-white" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-white">{auth.user?.name || 'Demo User'}</h3>
                  <p className="text-gray-400">{auth.user?.email || 'demo@example.com'}</p>
                  <p className="text-sm text-gray-500">
                    Member since {installationData ? new Date(installationData.install_date).toLocaleDateString() : 'Jan 1, 2024'}
                  </p>
                </div>
              </div>
            </Card>

            {/* GSC Property Card - Keep existing */}
            {auth.user?.isAddonUser && (
              <Card className="bg-[#1a1d23] border-0 shadow-xl p-6 rounded-2xl">
                {/* ... existing GSC Property Card content ... */}
              </Card>
            )}

            {/* Current Plan Card - Updated with subscription type */}
            <Card className="bg-[#1a1d23] border-0 shadow-xl p-6 rounded-2xl lg:col-span-2">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl">
                    <Crown className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">Current Plan</h3>
                    <p className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                      {installationData?.subscription_type || 'Free Plan'}
                    </p>
                  </div>
                </div>
                <Button 
                  className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-xl hover:opacity-90 transition-all"
                  onClick={() => navigate('/upgrade')}
                >
                  Upgrade Plan
                </Button>
              </div>
            </Card>

            {/* Usage Statistics Card - Updated with actual usage */}
            <Card className="bg-[#1a1d23] border-0 shadow-xl p-6 rounded-2xl">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl">
                  <Activity className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white">Usage Statistics</h3>
              </div>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">API Calls</span>
                    <span className="text-white">{installationData?.usage_count || 0} / 1000</span>
                  </div>
                  <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-green-500 to-emerald-600 rounded-full" 
                      style={{ width: `${Math.min(apiUsagePercentage, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </Card>

            {/* License Key Section - Keep existing */}
            <Card className="bg-[#1a1d23] border-0 shadow-xl p-6 rounded-2xl lg:col-span-2">
              {/* ... existing License Key Section content ... */}
            </Card>
          </div>

          {/* Logout Button - Keep existing */}
          <div className="flex justify-center mt-8">
            <Button 
              onClick={auth.logout}
              className="bg-gray-800 text-gray-300 px-6 py-2 rounded-xl hover:bg-gray-700 transition-all"
            >
              Logout
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountDashboard;