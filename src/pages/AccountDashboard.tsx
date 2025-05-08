import { Card } from '../components/ui/card';
import { Activity, User } from 'lucide-react';
import { Button } from '../components/ui/button';

const AccountDashboard = () => {
  return (
    <div className="gradient-bg min-h-screen">
      <div className="container-section">
        <h1 className="section-title">Account Dashboard</h1>
        <p className="section-subtitle">Welcome back, User</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* User Profile Card */}
          <Card className="feature-card">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gray-800 rounded-full">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">User Name</h3>
                  <p className="text-gray-400">user@example.com</p>
                  <p className="text-sm text-gray-500">Member since 01/01/2023</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Usage Statistics */}
        <Card className="feature-card mb-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-gray-800 rounded-full">
              <Activity className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold">Usage Statistics</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-gray-800/50 rounded-xl">
              <p className="text-gray-400 mb-2">Current Plan</p>
              <p className="text-2xl font-bold">Free Plan</p>
            </div>
            
            <div className="p-4 bg-gray-800/50 rounded-xl">
              <p className="text-gray-400 mb-2">API Calls</p>
              <p className="text-2xl font-bold">0</p>
              <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                <div className="bg-white h-2 rounded-full" style={{ width: '0%' }}></div>
              </div>
            </div>
          </div>
        </Card>

        <Button className="btn-secondary">Logout</Button>
      </div>
    </div>
  );
};

export default AccountDashboard;