import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/ui/card';
import { Activity, User, Key, Zap, Crown } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

const AccountDashboard = () => {
  const navigate = useNavigate();
  const auth = useAuth();
  const [licenseKey, setLicenseKey] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (auth.loading) {
    return (
      <div className="gradient-bg min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-[#0f1115] to-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Header Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-white mb-2">Account Dashboard</h1>
            <p className="text-gray-400 text-lg">Welcome back, {auth.user?.name || 'User'}</p>
          </div>

          {/* Main Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* User Profile Card - Spans 1 column */}
            <Card className="bg-[#1a1d23] border-0 shadow-xl p-6 rounded-2xl">
              <div className="flex items-start gap-6">
                <div className="p-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl">
                  <User className="w-8 h-8 text-white" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-white">{auth.user?.name || 'Demo User'}</h3>
                  <p className="text-gray-400">{auth.user?.email || 'demo@example.com'}</p>
                  <p className="text-sm text-gray-500">
                    Member since {auth.user?.member_since ? new Date(auth.user.member_since).toLocaleDateString() : 'Jan 1, 2024'}
                  </p>
                </div>
              </div>
            </Card>

            {/* Current Plan Card - Spans 2 columns */}
            <Card className="bg-[#1a1d23] border-0 shadow-xl p-6 rounded-2xl lg:col-span-2">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl">
                    <Crown className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">Current Plan</h3>
                    <p className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                      {auth.user?.current_plan || 'Free Plan'}
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

            {/* Usage Statistics Card */}
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
                    <span className="text-white">0 / 1000</span>
                  </div>
                  <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-green-500 to-emerald-600 rounded-full" 
                      style={{ width: '0%' }}
                    ></div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Storage Used</span>
                    <span className="text-white">0 GB / 10 GB</span>
                  </div>
                  <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-green-500 to-emerald-600 rounded-full" 
                      style={{ width: '0%' }}
                    ></div>
                  </div>
                </div>
              </div>
            </Card>

            {/* License Key Section - Spans 2 columns */}
            <Card className="bg-[#1a1d23] border-0 shadow-xl p-6 rounded-2xl lg:col-span-2">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-4 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl">
                  <Key className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">License Key</h3>
                  <p className="text-gray-400">Activate additional features with your license key</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <Input
                  type="text"
                  value={licenseKey}
                  onChange={(e) => setLicenseKey(e.target.value)}
                  placeholder="Enter your license key"
                  className="flex-1 bg-gray-800 border-gray-700 text-white placeholder-gray-500 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <Button 
                  onClick={() => {
                    setIsSubmitting(true);
                    setTimeout(() => setIsSubmitting(false), 1000);
                  }}
                  disabled={isSubmitting || !licenseKey}
                  className="bg-gradient-to-r from-purple-500 to-pink-600 text-white px-6 py-3 rounded-xl hover:opacity-90 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Activating...' : 'Activate License'}
                </Button>
              </div>
            </Card>
          </div>

          {/* Logout Button */}
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