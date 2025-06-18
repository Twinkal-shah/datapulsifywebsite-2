import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { AlertCircle, Check, Copy, Globe, RefreshCw, Save, ShieldCheck, User, Activity, Crown, FileText, Settings as SettingsIcon, Calendar, Key, Plus, Trash2, Tag } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { gscService } from '@/lib/gscService';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { GoogleAuthService } from '@/lib/googleAuthService';
import { supabase } from '@/lib/supabaseClient';
import { useNavigate, useLocation } from 'react-router-dom';

interface BrandedKeywordRule {
  id: string;
  type: 'contains' | 'starts_with' | 'ends_with' | 'exact_match';
  value: string;
}

interface KeywordCategoryPatterns {
  tofu: string[];
  mofu: string[];
  bofu: string[];
}

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
}

export default function Settings() {
  const auth = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [gscProperties, setGscProperties] = useState<string[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<string>('');
  const [syncFrequency, setSyncFrequency] = useState('daily');
  const [lastSyncDate, setLastSyncDate] = useState<string | null>(null);
  const [autoSync, setAutoSync] = useState(true);
  const [userInstallation, setUserInstallation] = useState<UserInstallation | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    business_type: '',
    business_size: ''
  });

  // Branded keyword rules state
  const [brandedRules, setBrandedRules] = useState<BrandedKeywordRule[]>([]);
  const [newRule, setNewRule] = useState<Partial<BrandedKeywordRule>>({
    type: 'contains',
    value: ''
  });

  // Keyword category patterns state
  const [categoryPatterns, setCategoryPatterns] = useState<KeywordCategoryPatterns>({
    tofu: [],
    mofu: [],
    bofu: []
  });
  const [newPatterns, setNewPatterns] = useState({
    tofu: '',
    mofu: '',
    bofu: ''
  });

  // Get the current tab from the URL
  const getCurrentTab = () => {
    const path = location.pathname;
    if (path === '/settings/accountdashboard') return 'account-dashboard';
    if (path === '/settings/googlesearchconsole') return 'gsc';
    if (path === '/settings/accountsettings') return 'account';
    if (path === '/settings/notifications') return 'notifications';
    if (path === '/settings/keywordstype') return 'keywords-type';
    if (path === '/settings/keywordscategory') return 'keywords-category';
    return 'account-dashboard'; // Default tab
  };

  // Handle tab changes
  const handleTabChange = (value: string) => {
    switch (value) {
      case 'account-dashboard':
        navigate('/settings/accountdashboard');
        break;
      case 'gsc':
        navigate('/settings/googlesearchconsole');
        break;
      case 'account':
        navigate('/settings/accountsettings');
        break;
      case 'notifications':
        navigate('/settings/notifications');
        break;
      case 'keywords-type':
        navigate('/settings/keywordstype');
        break;
      case 'keywords-category':
        navigate('/settings/keywordscategory');
        break;
      default:
        navigate('/settings/accountdashboard');
    }
  };

  // Redirect to the default tab if on /settings
  useEffect(() => {
    if (location.pathname === '/settings') {
      navigate('/settings/accountdashboard');
    }
  }, [location.pathname, navigate]);

  // Update formData when userInstallation data is loaded
  useEffect(() => {
    if (userInstallation) {
      setFormData({
        business_type: userInstallation.business_type || '',
        business_size: userInstallation.business_size || ''
      });
    }
  }, [userInstallation]);

  // Fetch GSC properties and settings on load
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);

        // Check if we have a token
        const token = localStorage.getItem('gsc_token');
        if (!token) {
          setLoading(false);
          return;
        }

        // Get current property if set
        const currentProperty = localStorage.getItem('gsc_property');
        if (currentProperty) {
          setSelectedProperty(currentProperty);
        }

        // Fetch actual GSC properties
        const googleAuth = new GoogleAuthService();
        const properties = await googleAuth.fetchGSCProperties(token);
        setGscProperties(properties.map(p => p.siteUrl));

        // Get last sync date from localStorage
        const lastSync = localStorage.getItem('last_gsc_sync');
        if (lastSync) {
          setLastSyncDate(lastSync);
        }

        // Load branded keyword rules
        const savedRules = localStorage.getItem('branded_keyword_rules');
        if (savedRules) {
          setBrandedRules(JSON.parse(savedRules));
        }

        // Load keyword category patterns
        const savedPatterns = localStorage.getItem('keyword_category_patterns');
        if (savedPatterns) {
          setCategoryPatterns(JSON.parse(savedPatterns));
        }

        setLoading(false);
      } catch (error) {
        console.error('Error fetching GSC properties:', error);
        toast({
          title: 'Error',
          description: 'Failed to load GSC properties. Please try again.',
          variant: 'destructive'
        });
        setLoading(false);
      }
    };

    fetchSettings();
  }, [toast]);

  // Add useEffect for fetching user installation data
  useEffect(() => {
    const fetchUserInstallation = async () => {
      try {
        if (!auth.user?.email) return;

        const { data, error } = await supabase
          .from('user_installations')
          .select('*')
          .eq('email', auth.user.email)
          .single();

        if (error) throw error;
        setUserInstallation(data);
      } catch (error) {
        console.error('Error fetching user installation:', error);
        toast({
          title: 'Error',
          description: 'Failed to load user data',
          variant: 'destructive'
        });
      }
    };

    fetchUserInstallation();
  }, [auth.user?.email]);

  // Handle OAuth with Google
  const handleGoogleAuth = async () => {
    try {
      setLoading(true);
      const googleAuth = new GoogleAuthService();
      await googleAuth.initiateGSCAuth();
    } catch (error) {
      console.error('Error connecting to GSC:', error);
      toast({
        title: 'Error',
        description: 'Failed to connect to Google Search Console',
        variant: 'destructive'
      });
      setLoading(false);
    }
  };

  // Handle property selection
  const handlePropertySelect = (value: string) => {
    setSelectedProperty(value);
    localStorage.setItem('gsc_property', value);
    
    // Update user state with new property
    if (auth.user) {
      const updatedUser = {
        ...auth.user,
        gscProperty: value
      };
      auth.login(updatedUser);
    }

    // Force reload the dashboard to reflect the new property
    if (location.pathname === '/dashboard') {
      window.location.reload();
    }

    toast({
      title: 'Property Updated',
      description: `Now using ${value} as your GSC property`,
      variant: 'default'
    });
  };

  // Handle manual sync
  const handleSync = async () => {
    if (!selectedProperty) {
      toast({
        title: 'Error',
        description: 'Please select a GSC property first',
        variant: 'destructive'
      });
      return;
    }

    try {
      setSyncLoading(true);

      // Calculate date range (last 30 days)
      const endDate = format(new Date(), 'yyyy-MM-dd');
      const startDate = format(subDays(new Date(), 30), 'yyyy-MM-dd');

      // Sync GSC data
      await gscService.syncGSCData(startDate, endDate);

      // Update last sync date
      const now = new Date().toISOString();
      localStorage.setItem('last_gsc_sync', now);
      setLastSyncDate(now);

      toast({
        title: 'Success',
        description: 'Successfully synced GSC data',
        variant: 'default'
      });
    } catch (error) {
      console.error('Error syncing GSC data:', error);
      toast({
        title: 'Error',
        description: 'Failed to sync GSC data. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setSyncLoading(false);
    }
  };

  // Handle disconnect from GSC
  const handleDisconnect = async () => {
    try {
      const googleAuth = new GoogleAuthService();
      await auth.disconnectGSC();
      googleAuth.clearAuth();
      setGscProperties([]);
      setSelectedProperty('');

      toast({
        title: 'Success',
        description: 'Disconnected from Google Search Console',
        variant: 'default'
      });
    } catch (error) {
      console.error('Error disconnecting from GSC:', error);
      toast({
        title: 'Error',
        description: 'Failed to disconnect from Google Search Console',
        variant: 'destructive'
      });
    }
  };

  const isConnected = !!localStorage.getItem('gsc_token');

  // Branded keyword rules functions
  const addBrandedRule = () => {
    if (!newRule.value || !newRule.type) {
      toast({
        title: 'Error',
        description: 'Please provide both rule type and value',
        variant: 'destructive'
      });
      return;
    }

    const rule: BrandedKeywordRule = {
      id: Date.now().toString(),
      type: newRule.type as BrandedKeywordRule['type'],
      value: newRule.value
    };

    const updatedRules = [...brandedRules, rule];
    setBrandedRules(updatedRules);
    localStorage.setItem('branded_keyword_rules', JSON.stringify(updatedRules));

    setNewRule({ type: 'contains', value: '' });

    toast({
      title: 'Success',
      description: 'Branded keyword rule added successfully',
      variant: 'default'
    });
  };

  const removeBrandedRule = (id: string) => {
    const updatedRules = brandedRules.filter(rule => rule.id !== id);
    setBrandedRules(updatedRules);
    localStorage.setItem('branded_keyword_rules', JSON.stringify(updatedRules));

    toast({
      title: 'Success',
      description: 'Branded keyword rule removed',
      variant: 'default'
    });
  };

  // Keyword category pattern functions
  const saveCategoryPatterns = () => {
    try {
      const patterns = {
        tofu: newPatterns.tofu.split('\n').filter(p => p.trim() !== ''),
        mofu: newPatterns.mofu.split('\n').filter(p => p.trim() !== ''),
        bofu: newPatterns.bofu.split('\n').filter(p => p.trim() !== '')
      };

      // Validate regex patterns
      for (const category of ['tofu', 'mofu', 'bofu'] as const) {
        for (const pattern of patterns[category]) {
          try {
            new RegExp(pattern);
          } catch (e) {
            toast({
              title: 'Invalid Regex',
              description: `Invalid regex pattern in ${category.toUpperCase()}: ${pattern}`,
              variant: 'destructive'
            });
            return;
          }
        }
      }

      setCategoryPatterns(patterns);
      localStorage.setItem('keyword_category_patterns', JSON.stringify(patterns));

      toast({
        title: 'Success',
        description: 'Keyword category patterns saved successfully',
        variant: 'default'
      });
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description: 'Failed to save category patterns',
        variant: 'destructive'
      });
    }
  };

  const loadPatternsToEditor = () => {
    setNewPatterns({
      tofu: categoryPatterns.tofu.join('\n'),
      mofu: categoryPatterns.mofu.join('\n'),
      bofu: categoryPatterns.bofu.join('\n')
    });
  };

  // Load patterns to editor when component mounts or patterns change
  useEffect(() => {
    loadPatternsToEditor();
  }, [categoryPatterns]);

  const calculateDaysLeft = (endDate: string | null) => {
    if (!endDate) return 0;
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const handleSaveSettings = async () => {
    try {
      if (!auth.user?.email) {
        throw new Error('User email not found');
      }

      // Create an update object only with the fields that have changed
      const updates: { business_type?: string; business_size?: string } = {};
      
      // Only include fields that have values and have actually changed
      if (formData.business_type && formData.business_type !== userInstallation?.business_type) {
        updates.business_type = formData.business_type;
      }
      
      if (formData.business_size && formData.business_size !== userInstallation?.business_size) {
        updates.business_size = formData.business_size;
      }

      // Only proceed if there are changes to save
      if (Object.keys(updates).length === 0) {
        setIsEditing(false);
        return;
      }

      console.log('Saving updates:', updates); // Debug log

      const { error: updateError } = await supabase
        .from('user_installations')
        .update(updates)
        .eq('email', auth.user.email);

      if (updateError) throw updateError;

      // Update local state with the new values
      setUserInstallation(prev => prev ? {
        ...prev,
        ...updates
      } : null);
      
      setIsEditing(false);
      toast({
        title: "Success",
        description: "Account settings updated successfully",
      });
    } catch (error) {
      console.error('Error updating settings:', error);
      toast({
        title: "Error",
        description: "Failed to update settings. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <DashboardLayout title="Settings" fullScreen={true}>
      <Tabs value={getCurrentTab()} onValueChange={handleTabChange} className="space-y-4">
        <div className="flex justify-center">
          <TabsList className="bg-gray-800 border-gray-700 mt-4">
            <TabsTrigger value="account-dashboard" className="data-[state=active]:bg-blue-900/30 data-[state=active]:text-blue-400 text-gray-300">Account Dashboard</TabsTrigger>
            <TabsTrigger value="gsc" className="data-[state=active]:bg-blue-900/30 data-[state=active]:text-blue-400 text-gray-300">Google Search Console</TabsTrigger>
            <TabsTrigger value="account" className="data-[state=active]:bg-blue-900/30 data-[state=active]:text-blue-400 text-gray-300">Account Settings</TabsTrigger>
            <TabsTrigger value="notifications" className="data-[state=active]:bg-blue-900/30 data-[state=active]:text-blue-400 text-gray-300">Notifications</TabsTrigger>
            <TabsTrigger value="keywords-type" className="data-[state=active]:bg-blue-900/30 data-[state=active]:text-blue-400 text-gray-300">Keywords Type</TabsTrigger>
            <TabsTrigger value="keywords-category" className="data-[state=active]:bg-blue-900/30 data-[state=active]:text-blue-400 text-gray-300">Keywords Category</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="account-dashboard" className="p-0 m-0">
          <div className="bg-gradient-to-br from-gray-900 via-[#0f1115] to-gray-900">
            <div className="p-8">
              <div className="space-y-8">
                {/* Header Section */}
                <div className="flex items-center justify-between mb-12">
                  <div>
                    <h1 className="text-4xl font-bold text-white mb-2">Account Dashboard</h1>
                    <p className="text-gray-400 text-lg">
                      Welcome back, {auth.user?.name}
                    </p>
                  </div>
                  <div className="h-16 w-16 bg-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-semibold">
                    {auth.user?.name?.charAt(0).toUpperCase() || 'H'}
                  </div>
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
                        <h3 className="text-xl font-semibold text-white">{auth.user?.name}</h3>
                        <p className="text-gray-400">{auth.user?.email}</p>
                        <p className="text-sm text-gray-500">
                          Member since {userInstallation?.install_date 
                            ? new Date(userInstallation.install_date).toLocaleDateString()
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
                          <span className="text-white">{userInstallation?.usage_count || 0}/1000</span>
                        </div>
                        <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-green-500 to-emerald-600 rounded-full"
                            style={{ width: `${((userInstallation?.usage_count || 0) / 1000) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* Current Plan Card */}
                  <Card className="bg-[#1a1d23] border-0 shadow-xl p-6 rounded-2xl">
                    <div className="flex items-start gap-4">
                      <div className="p-4 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl flex items-center justify-center">
                        <Crown className="w-8 h-8 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-xl font-semibold text-white">Current Plan</h3>
                          <span className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent ml-2">
                            {userInstallation?.subscription_type || 'Free'}
                          </span>
                        </div>
                        {userInstallation?.subscription_end_date && (
                          <p className="text-sm text-gray-400 mt-2">
                            Subscription expires in {calculateDaysLeft(userInstallation.subscription_end_date)} days
                          </p>
                        )}
                        <Button
                          className="mt-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-xl hover:opacity-90 transition-all"
                          onClick={() => window.location.href = '/upgrade'}
                        >
                          Upgrade Plan
                        </Button>
                      </div>
                    </div>
                  </Card>

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
                            {userInstallation?.lifetime_deal_status === 'active' ? 'Activated' : 'Not Activated'}
                          </p>
                        </div>

                        {userInstallation?.lifetime_deal_status !== 'active' && (
                          <div className="space-y-4">
                            <div className="flex gap-4">
                              <Input
                                type="text"
                                placeholder="Enter license key"
                                className="flex-1 bg-gray-800 border-gray-700 text-white"
                              />
                              <Button
                                className="bg-gradient-to-r from-blue-500 to-purple-600"
                                onClick={() => {}}
                              >
                                Activate
                              </Button>
                            </div>
                            <Button
                              className="w-full bg-gradient-to-r from-yellow-500 to-orange-600"
                              onClick={() => window.location.href = '/lifetimedeal'}
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
                          {userInstallation?.last_active_date
                            ? new Date(userInstallation.last_active_date).toLocaleDateString()
                            : 'Never'}
                        </p>
                      </div>
                    </div>
                  </Card>

                  {/* Subscription Details Card */}
                  <Card className="bg-[#1a1d23] border-0 shadow-xl p-6 rounded-2xl">
                    <div className="flex items-start gap-6">
                      <div className="p-4 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl">
                        <Crown className="w-8 h-8 text-white" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-xl font-semibold text-white">Subscription Details</h3>
                        {userInstallation?.subscription_start_date && (
                          <p className="text-gray-400">
                            Started: {new Date(userInstallation.subscription_start_date).toLocaleDateString()}
                          </p>
                        )}
                        {calculateDaysLeft(userInstallation?.subscription_end_date) !== null && (
                          <p className="text-yellow-400">
                            Free trial ends in {calculateDaysLeft(userInstallation?.subscription_end_date)} days
                          </p>
                        )}
                      </div>
                    </div>
                  </Card>

                  {/* Account Settings Card */}
                  {/* <Card className="bg-[#1a1d23] border-0 shadow-xl p-6 rounded-2xl">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div className="p-4 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl">
                          <SettingsIcon className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-xl font-semibold text-white">Account Settings</h3>
                      </div>
                      {isEditing ? (
                        <div className="flex gap-2">
                          <Button
                            onClick={() => {
                              setIsEditing(false);
                              setFormData({
                                business_type: userInstallation?.business_type || '',
                                business_size: userInstallation?.business_size || ''
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
                          onClick={() => {
                            setIsEditing(true);
                            setFormData({
                              business_type: userInstallation?.business_type || '',
                              business_size: userInstallation?.business_size || ''
                            });
                          }}
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
                          <p className="text-white text-lg">{userInstallation?.business_type || 'N/A'}</p>
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
                          <p className="text-white text-lg">{userInstallation?.business_size || 'N/A'}</p>
                        )}
                      </div>
                    </div>
                  </Card> */}
                </div>

                {/* Side-by-side Working Sheet and Account Settings */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Working Sheet Card */}
                  {/* <Card className="bg-[#1a1d23] border-0 shadow-xl p-6 rounded-2xl">
                    <div className="flex items-start gap-6">
                      <div className="p-4 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl">
                        <FileText className="w-8 h-8 text-white" />
                      </div>
                      <div className="space-y-2 w-full break-words whitespace-normal">
                        <h3 className="text-xl font-semibold text-white">Working Sheet</h3>
                        <div className="text-gray-400 mb-3">
                          <div className="mb-3">
                            <span className="font-bold">Document Name:</span>{' '}
                            <span className="text-blue-500 font-medium">🔥 KG SaaS | Website Performance Dashboard</span>
                          </div>
                          <div className="mb-3">
                            <span className="font-bold">Document URL:</span>{' '}
                            <a
                              href="https://docs.google.com/spreadsheets/d/1VRxXWbI2zdDds1hOEvNTgjcI4EDJaREN_yCzTgjfShQ/edit"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-500 font-medium underline break-all"
                            >
                              https://docs.google.com/spreadsheets/d/1VRxXWbI2zdDds1hOEvNTgjcI4EDJaREN_yCzTgjfShQ/edit
                            </a>
                          </div>
                          <div>
                            <span className="font-bold">Document ID:</span>{' '}
                            <span className="text-blue-500 font-medium break-all">
                              1VRxXWbI2zdDds1hOEvNTgjcI4EDJaREN_yCzTgjfShQ
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card> */}

                  {/* Account Settings Card */}
                  <Card className="bg-[#1a1d23] border-0 shadow-xl p-6 rounded-2xl">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div className="p-4 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl">
                          <SettingsIcon className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-xl font-semibold text-white">Account Settings</h3>
                      </div>
                      {isEditing ? (
                        <div className="flex gap-2">
                          <Button
                            onClick={() => {
                              setIsEditing(false);
                              setFormData({
                                business_type: userInstallation?.business_type || '',
                                business_size: userInstallation?.business_size || ''
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
                          onClick={() => {
                            setIsEditing(true);
                            setFormData({
                              business_type: userInstallation?.business_type || '',
                              business_size: userInstallation?.business_size || ''
                            });
                          }}
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
                          <p className="text-white text-lg">{userInstallation?.business_type || 'N/A'}</p>
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
                          <p className="text-white text-lg">{userInstallation?.business_size || 'N/A'}</p>
                        )}
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Logout Button */}
                <div className="flex justify-center pt-4 pb-8">
                  <Button
                    variant="outline"
                    className="text-red-400 hover:text-red-300 hover:bg-red-950/30"
                    onClick={() => auth.logout()}
                  >
                    Logout
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="gsc" className="space-y-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Google Search Console Integration</CardTitle>
              <CardDescription className="text-gray-400">
                Connect your GSC account to fetch performance data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isConnected ? (
                <>
                  <div className="flex items-center gap-2 text-green-500">
                    <Check className="h-5 w-5" />
                    <span>Connected to Google Search Console</span>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="property" className="text-gray-300">Select GSC Property</Label>
                    <Select
                      value={selectedProperty}
                      onValueChange={handlePropertySelect}
                    >
                      <SelectTrigger id="property" className="bg-gray-700 border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500">
                        <SelectValue placeholder="Select a property" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-700 border-gray-600 text-white">
                        {gscProperties.map((property, index) => (
                          <SelectItem key={index} value={property} className="text-white focus:bg-gray-600 focus:text-white">
                            {property}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sync-frequency" className="text-gray-300">Sync Frequency</Label>
                    <Select
                      value={syncFrequency}
                      onValueChange={setSyncFrequency}
                    >
                      <SelectTrigger id="sync-frequency" className="bg-gray-700 border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500">
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-700 border-gray-600 text-white">
                        <SelectItem value="hourly" className="text-white focus:bg-gray-600 focus:text-white">Hourly</SelectItem>
                        <SelectItem value="daily" className="text-white focus:bg-gray-600 focus:text-white">Daily</SelectItem>
                        <SelectItem value="weekly" className="text-white focus:bg-gray-600 focus:text-white">Weekly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <div className="space-y-0.5">
                      <Label htmlFor="auto-sync" className="text-gray-300">Auto Sync</Label>
                      <p className="text-sm text-gray-400">
                        Automatically sync new GSC data
                      </p>
                    </div>
                    <Switch
                      id="auto-sync"
                      checked={autoSync}
                      onCheckedChange={setAutoSync}
                    />
                  </div>

                  {lastSyncDate && (
                    <p className="text-sm text-gray-400">
                      Last synced: {new Date(lastSyncDate).toLocaleString()}
                    </p>
                  )}
                </>
              ) : (
                <div className="text-center py-6">
                  <Globe className="h-12 w-12 mx-auto mb-4 text-blue-400 opacity-80" />
                  <h3 className="text-lg font-medium mb-2 text-white">Connect to Google Search Console</h3>
                  <p className="text-gray-400 mb-4 max-w-md mx-auto">
                    Connect your Google Search Console account to import your website's performance data and keyword rankings.
                  </p>
                  <Button
                    onClick={handleGoogleAuth}
                    disabled={loading}
                    className="w-full max-w-sm bg-blue-600 hover:bg-blue-700"
                  >
                    {loading ? 'Connecting...' : 'Connect GSC Account'}
                  </Button>
                </div>
              )}
            </CardContent>
            {isConnected && (
              <CardFooter className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={handleDisconnect}
                  className="bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white"
                >
                  Disconnect
                </Button>
                <Button
                  onClick={handleSync}
                  disabled={syncLoading || !selectedProperty}
                  className="flex gap-2 bg-blue-600 hover:bg-blue-700"
                >
                  <RefreshCw className={`h-4 w-4 ${syncLoading ? 'animate-spin' : ''}`} />
                  {syncLoading ? 'Syncing...' : 'Sync Now'}
                </Button>
              </CardFooter>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="account" className="space-y-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Account Settings</CardTitle>
              <CardDescription className="text-gray-400">
                Manage your account preferences and personal information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-gray-300">Name</Label>
                <Input id="name" defaultValue={auth.user?.name} className="bg-gray-700 border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-300">Email</Label>
                <Input id="email" defaultValue={auth.user?.email} readOnly className="bg-gray-700 border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div className="flex items-center justify-between py-2">
                <div className="space-y-0.5">
                  <Label htmlFor="marketing" className="text-gray-300">Marketing Emails</Label>
                  <p className="text-sm text-gray-400">
                    Receive product updates and offers
                  </p>
                </div>
                <Switch id="marketing" defaultChecked />
              </div>
            </CardContent>
            <CardFooter>
              <Button className="ml-auto bg-blue-600 hover:bg-blue-700">Save Changes</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Notification Settings</CardTitle>
              <CardDescription className="text-gray-400">
                Configure how and when you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div className="space-y-0.5">
                  <Label htmlFor="rank-changes" className="text-gray-300">Ranking Changes</Label>
                  <p className="text-sm text-gray-400">
                    Get notified when your keywords change positions
                  </p>
                </div>
                <Switch id="rank-changes" defaultChecked />
              </div>
              <div className="flex items-center justify-between py-2">
                <div className="space-y-0.5">
                  <Label htmlFor="new-keywords" className="text-gray-300">New Keywords</Label>
                  <p className="text-sm text-gray-400">
                    Get notified when new keywords are found
                  </p>
                </div>
                <Switch id="new-keywords" defaultChecked />
              </div>
              <div className="flex items-center justify-between py-2">
                <div className="space-y-0.5">
                  <Label htmlFor="weekly-report" className="text-gray-300">Weekly Report</Label>
                  <p className="text-sm text-gray-400">
                    Receive a weekly summary of your performance
                  </p>
                </div>
                <Switch id="weekly-report" defaultChecked />
              </div>
            </CardContent>
            <CardFooter>
              <Button className="ml-auto bg-blue-600 hover:bg-blue-700">Save Preferences</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="keywords-type" className="space-y-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Tag className="h-5 w-5" />
                Branded Keywords Classification
              </CardTitle>
              <CardDescription className="text-gray-400">
                Define rules to automatically classify keywords as branded or non-branded. Keywords are evaluated in order and the first matching rule applies.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Add New Rule Section */}
              <div className="space-y-4 p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                <h3 className="text-lg font-medium text-white">Add New Rule</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="rule-type" className="text-gray-300">Rule Type</Label>
                    <Select
                      value={newRule.type}
                      onValueChange={(value) => setNewRule(prev => ({ ...prev, type: value as BrandedKeywordRule['type'] }))}
                    >
                      <SelectTrigger id="rule-type" className="bg-gray-700 border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500">
                        <SelectValue placeholder="Select rule type" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-700 border-gray-600 text-white">
                        <SelectItem value="contains" className="text-white focus:bg-gray-600 focus:text-white">Contains</SelectItem>
                        <SelectItem value="starts_with" className="text-white focus:bg-gray-600 focus:text-white">Starts with</SelectItem>
                        <SelectItem value="ends_with" className="text-white focus:bg-gray-600 focus:text-white">Ends with</SelectItem>
                        <SelectItem value="exact_match" className="text-white focus:bg-gray-600 focus:text-white">Exact match</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="rule-value" className="text-gray-300">Value</Label>
                    <Input
                      id="rule-value"
                      value={newRule.value || ''}
                      onChange={(e) => setNewRule(prev => ({ ...prev, value: e.target.value }))}
                      placeholder="Enter keyword or phrase"
                      className="bg-gray-700 border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="flex items-end">
                    <Button
                      onClick={addBrandedRule}
                      className="w-full bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add Rule
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 p-3 bg-gray-800 rounded border border-gray-600">
                  <div>
                    <h4 className="text-sm font-medium text-gray-300 mb-2">Rule Types Explained:</h4>
                    <ul className="text-xs text-gray-400 space-y-1">
                      <li><strong>Contains:</strong> Keyword contains the specified text</li>
                      <li><strong>Starts with:</strong> Keyword begins with the specified text</li>
                      <li><strong>Ends with:</strong> Keyword ends with the specified text</li>
                      <li><strong>Exact match:</strong> Keyword matches exactly</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-300 mb-2">Examples:</h4>
                    <ul className="text-xs text-gray-400 space-y-1">
                      <li><strong>Contains "datapulsify":</strong> "datapulsify dashboard", "best datapulsify"</li>
                      <li><strong>Starts with "your brand":</strong> "your brand features"</li>
                      <li><strong>Ends with "login":</strong> "datapulsify login"</li>
                      <li><strong>Exact "brand name":</strong> only "brand name"</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Current Rules */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-white flex items-center justify-between">
                  Current Rules
                  <Badge variant="outline" className="text-gray-300 border-gray-600">
                    {brandedRules.length} rules
                  </Badge>
                </h3>

                {brandedRules.length === 0 ? (
                  <div className="p-6 text-center bg-gray-900/50 rounded-lg border border-gray-700">
                    <Tag className="h-12 w-12 mx-auto mb-3 text-gray-500" />
                    <p className="text-gray-400">No branded keyword rules defined yet.</p>
                    <p className="text-sm text-gray-500 mt-1">Add rules above to automatically classify keywords as branded.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {brandedRules.map((rule, index) => (
                      <div key={rule.id} className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg border border-gray-700">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="text-xs bg-blue-900/30 text-blue-400 border-blue-700">
                            #{index + 1}
                          </Badge>
                          <div className="text-sm">
                            <span className="text-gray-300">If keyword </span>
                            <Badge variant="secondary" className="mx-1 bg-purple-900/30 text-purple-400 border-purple-700">
                              {rule.type.replace('_', ' ')}
                            </Badge>
                            <span className="text-gray-300">" "</span>
                            <span className="text-white font-medium">{rule.value}</span>
                            <span className="text-gray-300">" → </span>
                            <span className="text-blue-400 font-medium">Branded</span>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeBrandedRule(rule.id)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-950/30 border-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="keywords-category" className="space-y-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Keyword Funnel Classification
              </CardTitle>
              <CardDescription className="text-gray-400">
                Define regex patterns to automatically classify keywords by funnel stage: ToFu (Top of Funnel), MoFu (Middle of Funnel), and BoFu (Bottom of Funnel). Each pattern should be on a new line.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Pattern Editors */}
              <div className="grid gap-6">
                {/* ToFu Patterns */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="tofu-patterns" className="text-lg font-medium text-green-400 flex items-center gap-2">
                      <Badge variant="outline" className="bg-green-900/30 text-green-400 border-green-700">ToFu</Badge>
                      Top of Funnel Patterns
                    </Label>
                    <Badge variant="outline" className="text-gray-300 border-gray-600">
                      {categoryPatterns.tofu.length} patterns
                    </Badge>
                  </div>
                  <Textarea
                    id="tofu-patterns"
                    value={newPatterns.tofu}
                    onChange={(e) => setNewPatterns(prev => ({ ...prev, tofu: e.target.value }))}
                    placeholder="Enter regex patterns, one per line&#10;Examples:&#10;^what.*is&#10;.*tutorial.*&#10;how.*to.*&#10;.*guide.*"
                    className="bg-gray-700 border-gray-600 text-white focus:ring-green-500 focus:border-green-500 min-h-[120px] font-mono text-sm"
                  />
                  <p className="text-xs text-gray-400">
                    ToFu keywords indicate awareness stage - users learning about problems/solutions.
                  </p>
                </div>

                {/* MoFu Patterns */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="mofu-patterns" className="text-lg font-medium text-yellow-400 flex items-center gap-2">
                      <Badge variant="outline" className="bg-yellow-900/30 text-yellow-400 border-yellow-700">MoFu</Badge>
                      Middle of Funnel Patterns
                    </Label>
                    <Badge variant="outline" className="text-gray-300 border-gray-600">
                      {categoryPatterns.mofu.length} patterns
                    </Badge>
                  </div>
                  <Textarea
                    id="mofu-patterns"
                    value={newPatterns.mofu}
                    onChange={(e) => setNewPatterns(prev => ({ ...prev, mofu: e.target.value }))}
                    placeholder="Enter regex patterns, one per line&#10;Examples:&#10;.*comparison.*&#10;.*vs.*&#10;.*review.*&#10;.*features.*"
                    className="bg-gray-700 border-gray-600 text-white focus:ring-yellow-500 focus:border-yellow-500 min-h-[120px] font-mono text-sm"
                  />
                  <p className="text-xs text-gray-400">
                    MoFu keywords indicate consideration stage - users evaluating options.
                  </p>
                </div>

                {/* BoFu Patterns */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="bofu-patterns" className="text-lg font-medium text-red-400 flex items-center gap-2">
                      <Badge variant="outline" className="bg-red-900/30 text-red-400 border-red-700">BoFu</Badge>
                      Bottom of Funnel Patterns
                    </Label>
                    <Badge variant="outline" className="text-gray-300 border-gray-600">
                      {categoryPatterns.bofu.length} patterns
                    </Badge>
                  </div>
                  <Textarea
                    id="bofu-patterns"
                    value={newPatterns.bofu}
                    onChange={(e) => setNewPatterns(prev => ({ ...prev, bofu: e.target.value }))}
                    placeholder="Enter regex patterns, one per line&#10;Examples:&#10;.*buy.*&#10;.*price.*&#10;.*pricing.*&#10;.*purchase.*&#10;.*order.*"
                    className="bg-gray-700 border-gray-600 text-white focus:ring-red-500 focus:border-red-500 min-h-[120px] font-mono text-sm"
                  />
                  <p className="text-xs text-gray-400">
                    BoFu keywords indicate decision stage - users ready to purchase/convert.
                  </p>
                </div>
              </div>

              {/* Pattern Examples and Tips */}
              <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                <h4 className="text-sm font-medium text-gray-300 mb-3">Regex Pattern Examples:</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <h5 className="font-medium text-green-400 mb-2">ToFu Examples:</h5>
                    <ul className="text-gray-400 space-y-1 font-mono">
                      <li>^what.*is</li>
                      <li>.*tutorial.*</li>
                      <li>how.*to.*</li>
                      <li>.*guide.*</li>
                      <li>.*tips.*</li>
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-medium text-yellow-400 mb-2">MoFu Examples:</h5>
                    <ul className="text-gray-400 space-y-1 font-mono">
                      <li>.*comparison.*</li>
                      <li>.*vs.*</li>
                      <li>.*review.*</li>
                      <li>.*features.*</li>
                      <li>.*alternative.*</li>
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-medium text-red-400 mb-2">BoFu Examples:</h5>
                    <ul className="text-gray-400 space-y-1 font-mono">
                      <li>.*buy.*</li>
                      <li>.*price.*</li>
                      <li>.*pricing.*</li>
                      <li>.*purchase.*</li>
                      <li>.*discount.*</li>
                    </ul>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-blue-900/20 border border-blue-700 rounded text-xs">
                  <p className="text-blue-300">
                    <strong>Tip:</strong> Use <code>.*</code> to match any characters, <code>^</code> for start of string, <code>$</code> for end of string.
                    Keywords are matched case-insensitively. Test your patterns carefully!
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={saveCategoryPatterns}
                  className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  Save Patterns
                </Button>
                <Button
                  variant="outline"
                  onClick={loadPatternsToEditor}
                  className="bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white"
                >
                  <RefreshCw className="h-4 w-4" />
                  Reset to Saved
                </Button>
              </div>

              {/* Current Patterns Summary */}
              {(categoryPatterns.tofu.length > 0 || categoryPatterns.mofu.length > 0 || categoryPatterns.bofu.length > 0) && (
                <div className="space-y-3">
                  <h3 className="text-lg font-medium text-white">Active Patterns Summary</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-3 bg-green-900/20 border border-green-700 rounded">
                      <h4 className="text-green-400 font-medium mb-2 flex items-center gap-2">
                        <Badge variant="outline" className="bg-green-900/30 text-green-400 border-green-700 text-xs">ToFu</Badge>
                        {categoryPatterns.tofu.length} patterns
                      </h4>
                      {categoryPatterns.tofu.slice(0, 3).map((pattern, index) => (
                        <code key={index} className="block text-xs text-green-300 font-mono mb-1 truncate">
                          {pattern}
                        </code>
                      ))}
                      {categoryPatterns.tofu.length > 3 && (
                        <p className="text-xs text-green-400">+{categoryPatterns.tofu.length - 3} more...</p>
                      )}
                    </div>

                    <div className="p-3 bg-yellow-900/20 border border-yellow-700 rounded">
                      <h4 className="text-yellow-400 font-medium mb-2 flex items-center gap-2">
                        <Badge variant="outline" className="bg-yellow-900/30 text-yellow-400 border-yellow-700 text-xs">MoFu</Badge>
                        {categoryPatterns.mofu.length} patterns
                      </h4>
                      {categoryPatterns.mofu.slice(0, 3).map((pattern, index) => (
                        <code key={index} className="block text-xs text-yellow-300 font-mono mb-1 truncate">
                          {pattern}
                        </code>
                      ))}
                      {categoryPatterns.mofu.length > 3 && (
                        <p className="text-xs text-yellow-400">+{categoryPatterns.mofu.length - 3} more...</p>
                      )}
                    </div>

                    <div className="p-3 bg-red-900/20 border border-red-700 rounded">
                      <h4 className="text-red-400 font-medium mb-2 flex items-center gap-2">
                        <Badge variant="outline" className="bg-red-900/30 text-red-400 border-red-700 text-xs">BoFu</Badge>
                        {categoryPatterns.bofu.length} patterns
                      </h4>
                      {categoryPatterns.bofu.slice(0, 3).map((pattern, index) => (
                        <code key={index} className="block text-xs text-red-300 font-mono mb-1 truncate">
                          {pattern}
                        </code>
                      ))}
                      {categoryPatterns.bofu.length > 3 && (
                        <p className="text-xs text-red-400">+{categoryPatterns.bofu.length - 3} more...</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
} 