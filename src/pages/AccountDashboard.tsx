import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/ui/card';
import { Activity, User, Crown, AlertCircle, Settings, FileText, Calendar, Key } from 'lucide-react';
import { Button } from '../components/ui/button';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';

// Interface for user installation data
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
  subscription_start_date: string | null;
  subscription_end_date: string | null;
  document_info: string | null;
  lifetime_deal_status: string;
  license_key: string | null;
  full_name: string;
}

const AccountDashboard = () => {
  const navigate = useNavigate();
  const auth = useAuth();
  const { toast } = useToast();
  const [installationData, setInstallationData] = useState<UserInstallation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [licenseKey, setLicenseKey] = useState('');
  const [formData, setFormData] = useState({
    business_type: '',
    business_size: ''
  });

  useEffect(() => {
    console.log('Dashboard mount - Auth state:', { user: auth.user, loading: auth.loading });

    if (!auth.loading && !auth.user) {
      console.log('No user found after auth loaded, redirecting to home');
      navigate('/');
      return;
    }

    const fetchInstallationData = async () => {
      try {
        console.log('Fetching installation data for:', auth.user?.email);
        if (!auth.user?.email) {
          console.log('No user email available');
          return;
        }

        const { data, error } = await supabase
          .from('user_installations')
          .select('*')
          .eq('email', auth.user.email)
          .single();

        if (error) {
          console.error('Error fetching installation data:', error);
          throw error;
        }

        if (data) {
          console.log('Installation data fetched:', data);
          setInstallationData(data);
          setFormData({
            business_type: data.business_type,
            business_size: data.business_size
          });

          // Update last active date
          const { error: updateError } = await supabase
            .from('user_installations')
            .update({ last_active_date: new Date().toISOString() })
            .eq('email', auth.user.email);

          if (updateError) {
            console.warn('Failed to update last active date:', updateError);
          }
        } else {
          console.log('No installation data found');
        }
      } catch (err) {
        console.error('Error in fetchInstallationData:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch installation data';
        setError(errorMessage);
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        console.log('Setting loading to false');
        setLoading(false);
      }
    };

    if (auth.user) {
      fetchInstallationData();
    }
  }, [auth.user, auth.loading, navigate, toast]);

  const handleLogout = async () => {
    try {
      await auth.logout();
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSaveSettings = async () => {
    try {
      if (!auth.user?.email) {
        throw new Error('User email not found');
      }

      // Validate input
      if (!formData.business_type || !formData.business_size) {
        toast({
          title: "Validation Error",
          description: "Please select both business type and size",
          variant: "destructive",
        });
        return;
      }

      // Update ONLY the business_type and business_size columns
      const { error: updateError } = await supabase
        .from('user_installations')
        .update({
          business_type: formData.business_type,
          business_size: formData.business_size
        })
        .eq('email', auth.user.email);

      if (updateError) throw updateError;

      // Re-fetch the updated data from the database
      const { data, error } = await supabase
        .from('user_installations')
        .select('*')
        .eq('email', auth.user.email)
        .single();

      if (error) throw error;

      setInstallationData(data);
      setIsEditing(false);
      toast({
        title: "Settings Updated",
        description: "Your account settings have been updated successfully.",
      });
    } catch (error) {
      console.error('Error updating settings:', error);
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update settings. Please try again.",
        variant: "destructive",
      });
    }
  };

  const calculateDaysLeft = (endDate: string | null) => {
    if (!endDate) return null;
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const calculateTrialDaysLeft = () => {
    if (!installationData?.subscription_start_date || !installationData?.subscription_end_date) {
      return null;
    }

    const end = new Date(installationData.subscription_end_date);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const handleActivateLicense = async () => {
    try {
      if (!licenseKey.trim()) {
        toast({
          title: "Error",
          description: "Please enter a license key",
          variant: "destructive",
        });
        return;
      }

      // Check if license key is already used
      const { data: existingLicense, error: licenseError } = await supabase
        .from('user_installations')
        .select('id')
        .eq('license_key', licenseKey)
        .single();

      if (existingLicense) {
        toast({
          title: "Error",
          description: "This license key has already been used",
          variant: "destructive",
        });
        return;
      }

      // Activate the license
      const { error: updateError } = await supabase
        .from('user_installations')
        .update({
          lifetime_deal_status: 'active',
          license_key: licenseKey
        })
        .eq('email', auth.user?.email);

      if (updateError) throw updateError;

      setInstallationData(prev => prev ? {
        ...prev,
        lifetime_deal_status: 'active',
        license_key: licenseKey
      } : null);

      setLicenseKey('');
      toast({
        title: "Success",
        description: "License key activated successfully!",
      });
    } catch (error) {
      console.error('Error activating license:', error);
      toast({
        title: "Error",
        description: "Failed to activate license key. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (auth.loading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-[#0f1115] to-gray-900 flex items-center justify-center">
        <div className="text-white text-xl flex items-center gap-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
          Loading...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-[#0f1115] to-gray-900 flex items-center justify-center">
        <div className="bg-[#1a1d23] p-8 rounded-2xl max-w-md w-full mx-4">
          <div className="flex items-center gap-3 text-red-400 mb-4">
            <AlertCircle className="h-6 w-6" />
            <h2 className="text-xl font-semibold">Error</h2>
          </div>
          <p className="text-gray-400 mb-6">{error}</p>
          <div className="flex gap-4">
            <Button
              onClick={() => window.location.reload()}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              Try Again
            </Button>
            <Button
              onClick={() => navigate('/')}
              variant="outline"
              className="flex-1"
            >
              Go Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!auth.user) {
    return null;
  }

  // Calculate API usage percentage
  const apiUsagePercentage = installationData ? (installationData.usage_count / 1000) * 100 : 0;
  const daysLeft = installationData?.subscription_end_date ?
    calculateDaysLeft(installationData.subscription_end_date) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-[#0f1115] to-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Header Section */}
          <div className="flex items-center justify-between mb-12">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Account Dashboard</h1>
              <p className="text-gray-400 text-lg">
                Welcome back, {auth.user.name}
              </p>
            </div>
            <Avatar className="h-16 w-16">
              <AvatarImage src={auth.user.avatar_url || `https://avatar.vercel.sh/${auth.user.email}`} />
              <AvatarFallback>{auth.user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
          </div>

          {/* Main Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* User Profile Card */}
            <Card className="bg-[#1a1d23] border-0 shadow-xl p-6 rounded-2xl">
              <div className="flex items-start gap-6">
                <div className="p-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl">
                  <User className="w-8 h-8 text-white" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-white">{auth.user.name}</h3>
                  <p className="text-gray-400">{auth.user.email}</p>
                  <p className="text-sm text-gray-500">
                    Member since {installationData?.install_date
                      ? new Date(installationData.install_date).toLocaleDateString()
                      : new Date().toLocaleDateString()}
                  </p>
                </div>
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

            {/* Subscription Card */}
            {(installationData?.subscription_type !== 'Free Plan' || daysLeft !== null) && (
              <Card className="bg-[#1a1d23] border-0 shadow-xl p-6 rounded-2xl">
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
                      {daysLeft !== null && (
                        <p className="text-sm text-gray-400 mt-1">
                          Subscription expires in {daysLeft} days
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-xl hover:opacity-90 transition-all"
                    onClick={() => window.location.href = '/pricing'}
                  >
                    Upgrade Plan
                  </Button>
                </div>
              </Card>
            )}

            {/* Document Info Card */}
            {/* <Card className="bg-[#1a1d23] border-0 shadow-xl p-6 rounded-2xl">
              <div className="flex items-start gap-6">
                <div className="p-4 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl">
                  <FileText className="w-8 h-8 text-white" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-white">Working Sheet</h3>
                  {(() => {
                    let docInfo: any = installationData?.document_info;
                    if (typeof docInfo === 'string') {
                      try {
                        docInfo = JSON.parse(docInfo);
                      } catch {
                        docInfo = null;
                      }
                    }
                    if (docInfo && typeof docInfo === 'object') {
                      return (
                        <div className="text-gray-400">
                          <div>Document Name: {docInfo && docInfo.documentName ? docInfo.documentName : 'N/A'}</div>
                          <div>
                            Document URL: {docInfo && docInfo.documentUrl ? (
                              <a href={docInfo.documentUrl} target="_blank" rel="noopener noreferrer">{docInfo.documentUrl}</a>
                            ) : 'N/A'}
                          </div>
                          <div>Document ID: {docInfo && docInfo.documentId ? docInfo.documentId : 'N/A'}</div>
                        </div>
                      );
                    }
                    return <p className="text-gray-400">No document connected</p>;
                  })()}
                </div>
              </div>
            </Card> */}

            {/* Lifetime Deal Card */}
            <Card className="bg-[#1a1d23] border-0 shadow-xl p-6 rounded-2xl">
              <div className="flex items-start gap-6">
                <div className="p-4 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl">
                  <Key className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1 space-y-4">
                  <div>
                    <h3 className="text-xl font-semibold text-white">Lifetime Deal</h3>
                    <p className="text-gray-400">
                      {installationData?.lifetime_deal_status === 'active'
                        ? 'Activated'
                        : 'Not Activated'}
                    </p>
                  </div>

                  {installationData?.lifetime_deal_status !== 'active' && (
                    <div className="space-y-4">
                      <div className="flex gap-4">
                        <Input
                          type="text"
                          placeholder="Enter license key"
                          value={licenseKey}
                          onChange={(e) => setLicenseKey(e.target.value)}
                          className="flex-1 bg-gray-800 border-gray-700 text-white"
                        />
                        <Button
                          onClick={handleActivateLicense}
                          className="bg-gradient-to-r from-blue-500 to-purple-600"
                        >
                          Activate
                        </Button>
                      </div>
                      <Button
                        onClick={() => window.location.href = '/lifetimedeal'}
                        className="w-full bg-gradient-to-r from-yellow-500 to-orange-600"
                      >
                        Get Lifetime Deal
                      </Button>
                      <p className="text-yellow-400 text-sm">Ends in 3 days</p>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Last Active Card */}
            <Card className="bg-[#1a1d23] border-0 shadow-xl p-6 rounded-2xl">
              <div className="flex items-start gap-6">
                <div className="p-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl">
                  <Calendar className="w-8 h-8 text-white" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-white">Last Active</h3>
                  <p className="text-gray-400">
                    {installationData?.last_active_date
                      ? new Date(installationData.last_active_date).toLocaleDateString()
                      : 'Never'}
                  </p>
                </div>
              </div>
            </Card>

            {/* Subscription Info Card */}
            <Card className="bg-[#1a1d23] border-0 shadow-xl p-6 rounded-2xl">
              <div className="flex items-start gap-6">
                <div className="p-4 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl">
                  <Crown className="w-8 h-8 text-white" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-white">Subscription Details</h3>
                  {installationData?.subscription_start_date && (
                    <p className="text-gray-400">
                      Started: {new Date(installationData.subscription_start_date).toLocaleDateString()}
                    </p>
                  )}
                  {installationData?.subscription_type !== 'monthly_pro' && calculateTrialDaysLeft() !== null && (
                    <p className="text-yellow-400">
                      Free trial ends in {calculateTrialDaysLeft()} days
                    </p>
                  )}
                </div>
              </div>
            </Card>
          </div>

          {/* Side-by-side Working Sheet and Account Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Working Sheet Card */}
            <Card className="bg-[#1a1d23] border-0 shadow-xl p-6 rounded-2xl overflow-x-auto">
              <div className="flex items-start gap-6">
                <div className="p-4 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl">
                  <FileText className="w-8 h-8 text-white" />
                </div>
                <div className="space-y-2 w-full">
                  <h3 className="text-xl font-semibold text-white">Working Sheet</h3>
                  {(() => {
                    let docInfo: any = installationData?.document_info;
                    if (typeof docInfo === 'string') {
                      try {
                        docInfo = JSON.parse(docInfo);
                      } catch {
                        docInfo = null;
                      }
                    }
                    if (docInfo && typeof docInfo === 'object') {
                      return (
                        <div className="text-gray-400 break-words mb-3">
                          <div className="mb-3">
                            <span className="font-bold">Document Name:</span> <span className="text-blue-500 font-medium">{docInfo && docInfo.documentName ? docInfo.documentName : 'N/A'}</span>
                          </div>
                          <div className="mb-3">
                            <span className="font-bold">Document URL:</span> {docInfo && docInfo.documentUrl ? (
                              <a href={docInfo.documentUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 font-medium underline break-all">{docInfo.documentUrl}</a>
                            ) : <span className="text-blue-500 font-medium">N/A</span>}
                          </div>
                          <div>
                            <span className="font-bold">Document ID:</span> <span className="text-blue-500 font-medium">{docInfo && docInfo.documentId ? docInfo.documentId : 'N/A'}</span>
                          </div>
                        </div>
                      );
                    }
                    return <p className="text-gray-400">No document connected</p>;
                  })()}
                </div>
              </div>
            </Card>

            {/* Account Settings Card */}
            <Card className="bg-[#1a1d23] border-0 shadow-xl p-6 rounded-2xl">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl">
                    <Settings className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-white">Account Settings</h3>
                </div>
                {isEditing ? (
                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        setIsEditing(false);
                        setFormData({
                          business_type: installationData?.business_type || '',
                          business_size: installationData?.business_size || ''
                        });
                      }}
                      variant="outline"
                      className="text-gray-400 hover:text-white"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSaveSettings}
                      className="bg-gradient-to-r from-blue-500 to-purple-600"
                    >
                      Save Changes
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={() => setIsEditing(true)}
                    className="bg-gradient-to-r from-blue-500 to-purple-600"
                  >
                    Edit Settings
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Business Type</label>
                  {isEditing ? (
                    <select
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                      value={formData.business_type}
                      onChange={(e) => setFormData(prev => ({ ...prev, business_type: e.target.value }))}
                    >
                      <option value="Marketing agency">Marketing agency</option>
                      <option value="B2B SaaS">B2B SaaS</option>
                      <option value="Freelancer">Freelancer</option>
                      <option value="Consultant">Consultant</option>
                      <option value="E-commerce">E-commerce</option>
                      <option value="B2B retail">B2B retail</option>
                      <option value="Others">Others</option>
                    </select>
                  ) : (
                    <p className="text-white text-lg">{installationData?.business_type || 'N/A'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Business Size</label>
                  {isEditing ? (
                    <select
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                      value={formData.business_size}
                      onChange={(e) => setFormData(prev => ({ ...prev, business_size: e.target.value }))}
                    >
                      <option value="1">1</option>
                      <option value="2–10">2–10</option>
                      <option value="11–50">11–50</option>
                      <option value="51–200">51–200</option>
                      <option value="200+">200+</option>
                    </select>
                  ) : (
                    <p className="text-white text-lg">{installationData?.business_size || 'N/A'}</p>
                  )}
                </div>
              </div>
            </Card>
          </div>

          {/* Logout Button */}
          <div className="flex justify-center pt-8">
            <Button
              onClick={handleLogout}
              variant="outline"
              className="text-red-400 hover:text-red-300 hover:bg-red-950/30"
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