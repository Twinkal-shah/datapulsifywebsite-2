import { Card } from '../components/ui/card';
import { Activity, User } from 'lucide-react';
import { Button } from '../components/ui/button';

const AccountDashboard = () => {
  return (
    <div className="gradient-bg min-h-screen font-sora">
      <div className="container-section">
        <h1 className="section-title text-primary">Account Dashboard</h1>
        <p className="section-subtitle text-muted-foreground">Welcome back, User</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* User Profile Card */}
          <Card className="feature-card bg-card text-card-foreground shadow-lg">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-secondary rounded-full">
                  <User className="w-6 h-6 text-secondary-foreground" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">User Name</h3>
                  <p className="text-muted-foreground">user@example.com</p>
                  <p className="text-sm text-muted-foreground">Member since 01/01/2023</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Usage Statistics */}
        <Card className="feature-card mb-8 bg-card text-card-foreground shadow-lg">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-accent rounded-full">
              <Activity className="w-6 h-6 text-accent-foreground" />
            </div>
            <h3 className="text-xl font-semibold">Usage Statistics</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-muted rounded-xl">
              <p className="text-muted-foreground mb-2">Current Plan</p>
              <p className="text-2xl font-bold">Free Plan</p>
            </div>
            
            <div className="p-4 bg-muted rounded-xl">
              <p className="text-muted-foreground mb-2">API Calls</p>
              <p className="text-2xl font-bold">0</p>
              <div className="w-full bg-muted-foreground rounded-full h-2 mt-2">
                <div className="bg-primary h-2 rounded-full" style={{ width: '0%' }}></div>
              </div>
            </div>
          </div>
        </Card>

        <Button className="btn-secondary bg-primary text-primary-foreground hover:bg-primary/90">Logout</Button>
      </div>
    </div>
  );
};

export default AccountDashboard;