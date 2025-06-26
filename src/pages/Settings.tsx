import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useTrackedKeywords } from '@/hooks/useTrackedKeywords';
import { useDataExports } from '@/hooks/useDataExports';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { AlertCircle, Check, Copy, Globe, RefreshCw, Save, ShieldCheck, User, Activity, Crown, FileText, Settings as SettingsIcon, Calendar, Key, Plus, Trash2, Tag, CheckCircle, Star, Zap, Infinity, Bell as AlertTriangle, X } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { gscService } from '@/lib/gscService';
import { useToast } from '@/hooks/use-toast';
import { GoogleAuthService } from '@/lib/googleAuthService';
import { supabase } from '@/lib/supabaseClient';
import { lemonSqueezyService } from '@/lib/lemonSqueezyService';
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
  const { user, login, disconnectGSC } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const subscription = useSubscription();
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

  // Use the tracked keywords hook
  const { stats: keywordStats } = useTrackedKeywords();
  
  // Use the data exports hook
  const { stats: exportStats } = useDataExports();

  // Notification settings
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    weeklyReports: false,
    rankingAlerts: true,
    systemUpdates: true
  });

  // Account settings state
  const [accountSettings, setAccountSettings] = useState({
    name: '',
    email: '',
    marketingEmails: true
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

  // Get the current tab from the URL or default to subscription
  const getCurrentTab = () => {
    const path = location.pathname;
    if (path.includes('googlesearchconsole')) return 'gsc';
    if (path.includes('accountsettings')) return 'account';
    if (path.includes('notifications')) return 'notifications';
    if (path.includes('keywordstype')) return 'keywords-type';
    if (path.includes('keywordscategory')) return 'keywords-category';
    return 'subscription'; // Default tab
  };

  // Handle tab changes
  const handleTabChange = (value: string) => {
    switch (value) {
      case 'subscription':
        navigate('/settings');
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
    }
  };

  // Existing utility functions
  const calculateDaysLeft = (endDate: string | null) => {
    if (!endDate) return null;
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  // Fetch user installation data
  const fetchUserInstallation = async () => {
    if (!user?.email) {
      console.log('❌ No user email for fetching installation');
      return;
    }

    console.log('🔍 Fetching user installation for:', user.email);

    try {
      const { data, error } = await supabase
        .from('user_installations')
        .select('*')
        .eq('email', user.email)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows found - this is expected for new users
          console.log('ℹ️ No user installation record found (new user)');
          setUserInstallation(null);
          return;
        }
        throw error;
      }
      
      console.log('✅ User installation fetched:', data);
      setUserInstallation(data);
    } catch (error) {
      console.error('❌ Error fetching user installation:', error);
      setUserInstallation(null);
    }
  };

  // Update formData when userInstallation data is loaded
  useEffect(() => {
    if (userInstallation) {
      setFormData({
        business_type: userInstallation.business_type || '',
        business_size: userInstallation.business_size || ''
      });
    }
  }, [userInstallation]);

  // Update account settings when user data is loaded
  useEffect(() => {
    if (user) {
      setAccountSettings({
        name: user.name || '',
        email: user.email || '',
        marketingEmails: true // You can load this from localStorage or database
      });
    }
  }, [user]);

  // Fetch settings on load
  useEffect(() => {
    fetchUserInstallation();
    
    // Load other settings from localStorage
    const savedNotifications = localStorage.getItem('notification_settings');
    if (savedNotifications) {
      setNotifications(JSON.parse(savedNotifications));
    }
    
    // Load GSC properties and settings
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
  }, [user?.email]);

  // Save settings handlers
  const handleSaveProfile = async () => {
    console.log('🔄 handleSaveProfile called');
    console.log('📧 User email:', user?.email);
    console.log('📝 Form data:', formData);
    console.log('👤 User installation:', userInstallation);

    if (!user?.email) {
      console.log('❌ No user email found');
      toast({
        title: 'Error',
        description: 'User email not found. Please log in again.',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.business_type || !formData.business_size) {
      console.log('❌ Missing form data:', { business_type: formData.business_type, business_size: formData.business_size });
      toast({
        title: 'Error',
        description: 'Please fill in both business type and size.',
        variant: 'destructive',
      });
      return;
    }

    try {
      console.log('💾 Starting save operation...');
      let updateError;
      let result;
      
      if (userInstallation) {
        console.log('📤 Updating existing record with ID:', userInstallation.id);
        const updateData = {
          business_type: formData.business_type,
          business_size: formData.business_size,
          last_active_date: new Date().toISOString()
        };
        console.log('📤 Update data:', updateData);
        
        result = await supabase
          .from('user_installations')
          .update(updateData)
          .eq('id', userInstallation.id)
          .select();
        
        updateError = result.error;
        console.log('📤 Update result:', result);
      } else {
        console.log('📥 Creating new record');
        const insertData = {
          user_id: user.id || user.email,
          email: user.email,
          business_type: formData.business_type,
          business_size: formData.business_size,
          install_date: new Date().toISOString(),
          last_active_date: new Date().toISOString(),
          subscription_type: 'free',
          usage_count: 0,
          lifetime_deal_status: 'none'
        };
        console.log('📥 Insert data:', insertData);
        
        result = await supabase
          .from('user_installations')
          .insert(insertData)
          .select();
        
        updateError = result.error;
        console.log('📥 Insert result:', result);
      }

      if (updateError) {
        console.log('❌ Database error:', updateError);
        throw updateError;
      }

      console.log('✅ Database operation successful');

      // Update local state
      if (userInstallation) {
        console.log('🔄 Updating local state');
        setUserInstallation({
          ...userInstallation,
          business_type: formData.business_type,
          business_size: formData.business_size
        });
      } else {
        console.log('🔄 Refreshing data from database');
        await fetchUserInstallation();
      }
      
      setIsEditing(false);
      
      toast({
        title: 'Success',
        description: 'Account settings updated successfully.',
      });

      console.log('✅ Save operation completed successfully');

    } catch (error) {
      console.error('❌ Error updating profile:', error);
      toast({
        title: 'Error',
        description: `Failed to update account settings: ${error.message || 'Please try again.'}`,
        variant: 'destructive'
      });
    }
  };

  const handleSaveNotifications = () => {
    localStorage.setItem('notification_settings', JSON.stringify(notifications));
    toast({
      title: 'Success',
      description: 'Notification settings saved successfully.',
    });
  };

  // Save account settings
  const handleSaveAccountSettings = async () => {
    console.log('🔄 handleSaveAccountSettings called');
    console.log('📝 Account settings data:', accountSettings);

    if (!user?.email) {
      toast({
        title: 'Error',
        description: 'User not found. Please log in again.',
        variant: 'destructive',
      });
      return;
    }

    if (!accountSettings.name.trim()) {
      toast({
        title: 'Error',
        description: 'Name is required.',
        variant: 'destructive',
      });
      return;
    }

    try {
      console.log('💾 Starting account settings save...');

      // Update the user's name in the auth context (this depends on your auth implementation)
      // You might need to call an API to update the user's profile
      const updatedUser = {
        ...user,
        name: accountSettings.name
      };

      // Update auth context
      // Assuming useAuth.login is called elsewhere in the component

      // Save marketing email preference to localStorage
      localStorage.setItem('marketing_emails', JSON.stringify(accountSettings.marketingEmails));

      // If you have a users table in Supabase, update it here
      try {
        const { error: userUpdateError } = await supabase
          .from('users')
          .update({
            name: accountSettings.name,
            updated_at: new Date().toISOString()
          })
          .eq('email', user.email);

        if (userUpdateError) {
          console.log('ℹ️ No users table or user record found, skipping user table update');
        } else {
          console.log('✅ User table updated successfully');
        }
      } catch (userError) {
        console.log('ℹ️ User table update failed (table might not exist):', userError);
      }

      // Also update the user_installations table if it exists
      if (userInstallation) {
        const { error: installationUpdateError } = await supabase
          .from('user_installations')
          .update({
            last_active_date: new Date().toISOString()
          })
          .eq('id', userInstallation.id);

        if (installationUpdateError) {
          console.log('⚠️ Failed to update user installation:', installationUpdateError);
        }
      }

      toast({
        title: 'Success',
        description: 'Account settings updated successfully.',
      });

      console.log('✅ Account settings save completed');

    } catch (error) {
      console.error('❌ Error updating account settings:', error);
      toast({
        title: 'Error',
        description: `Failed to update account settings: ${error.message || 'Please try again.'}`,
        variant: 'destructive'
      });
    }
  };

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
    if (user) {
      const updatedUser = {
        ...user,
        gscProperty: value
      };
      // Assuming useAuth.login is called elsewhere in the component
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
  const handleDisconnectGSC = async () => {
    try {
      const googleAuth = new GoogleAuthService();
      await disconnectGSC();
      googleAuth.clearAuth();
      setGscProperties([]);
      toast({
        title: "Success",
        description: "Successfully disconnected from Google Search Console",
      });
    } catch (error) {
      console.error('Error disconnecting GSC:', error);
      toast({
        title: "Error",
        description: "Failed to disconnect from Google Search Console",
        variant: "destructive",
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

  // Usage statistics (derived from real-time data)
  const getUsageStats = () => {
    const apiCalls = userInstallation?.usage_count || 0;
    const maxApiCalls = subscription.isSubscriptionActive ? 10000 : 1000;
    
    return {
      apiCalls: { current: apiCalls, max: maxApiCalls },
      keywordsTracked: { 
        current: keywordStats.totalTracked, 
        max: keywordStats.limit 
      },
      // Temporarily commenting out reports stats
      // reports: { 
      //   current: 5, 
      //   max: subscription.isSubscriptionActive ? 100 : 10 
      // },
      exports: { 
        current: exportStats.totalExports, 
        max: exportStats.limit 
      }
    };
  };

  const usageStats = getUsageStats();

  // Plan configuration
  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      // billing: 'forever',
      icon: Star,
      features: [
        '3 days full access to all features',
        'Dashboard',  
        'Rank Tracker',
        'Click Gap Intelligence'
        // '10 keywords tracked',
        // '1,000 API calls per month',
        // '10 reports per month',
        // '5 exports per month',
        // 'Community support'
      ],
      limitations: [
        'Limited integrations',
        'Basic analytics only'
      ],
      isCurrent: !subscription.isSubscriptionActive && subscription.subscriptionType !== 'lifetime'
    },
    {
      id: 'pro',
      name: 'Monthly Pro',
      price: 9,
      billing: 'month',
      icon: Crown,
      features: [
        'Dashboard - Unlimited access to all dashboard features',
        'Rank Tracker - Unlimited keyword tracking',
        'Click Gap Intelligence - Unlimited page tracking',
        'Custom AI Reports - Generate up to 5 reports per month'
      ],
      popular: true,
      isCurrent: subscription.subscriptionType === 'monthly_pro'
    },
    {
      id: 'lifetime',
      name: 'Lifetime',
      price: 49.99,
      billing: 'one-time',
      icon: Infinity,
      features: [
        'Dashboard - Full unlimited access to all dashboard features without any restrictions',
        'Rank Tracker - Users can track up to 100 keywords',
        'Click Gap Intelligence - Full unlimited access to all Click Gap Intelligence features',
        'Custom AI Reports - Users can generate up to 2 reports per month'
      ],
      badge: 'Best Value',
      isCurrent: subscription.subscriptionType === 'lifetime'
    }
  ];

  const handleUpgradeClick = async () => {
    if (!user?.email) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to continue with your purchase",
        variant: "destructive",
      });
      return;
    }

    try {
      // For Lifetime Plan users, create a new checkout session instead of using quick checkout
      if (subscription.subscriptionType === 'lifetime') {
        const checkoutData = await lemonSqueezyService.createCheckoutSession('monthly', user.email);
        if (checkoutData?.checkoutUrl) {
          window.location.href = checkoutData.checkoutUrl;
        } else {
          throw new Error('No checkout URL received');
        }
      } else {
        // For other users, use the quick checkout URL
        const checkoutUrl = lemonSqueezyService.getQuickCheckoutUrl('monthly', user.email);
        window.location.href = checkoutUrl;
      }
    } catch (error) {
      console.error('Error initiating checkout:', error);
      toast({
        title: "Checkout Error",
        description: error instanceof Error ? error.message : 'Failed to initiate checkout',
        variant: "destructive",
      });
    }
  };

  return (
    <DashboardLayout title="Settings" fullScreen={true}>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-[#0f1115] to-gray-900">
        <div className="container mx-auto px-6 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Settings</h1>
            <p className="text-gray-400 text-lg">
              Manage your account settings and preferences
            </p>
          </div>

          {/* Tabs */}
          <Tabs value={getCurrentTab()} onValueChange={handleTabChange} className="space-y-6">
            <div className="flex justify-center">
              <TabsList className="bg-gray-800 border-gray-700">
                <TabsTrigger 
                  value="subscription" 
                  className="data-[state=active]:bg-blue-900/30 data-[state=active]:text-blue-400 text-gray-300 flex items-center gap-2"
                >
                  <Crown className="w-4 h-4" />
                  Subscription
                </TabsTrigger>
                <TabsTrigger 
                  value="gsc" 
                  className="data-[state=active]:bg-blue-900/30 data-[state=active]:text-blue-400 text-gray-300 flex items-center gap-2"
                >
                  <Globe className="w-4 h-4" />
                  Google Search Console
                </TabsTrigger>
                <TabsTrigger 
                  value="account" 
                  className="data-[state=active]:bg-blue-900/30 data-[state=active]:text-blue-400 text-gray-300 flex items-center gap-2"
                >
                  <SettingsIcon className="w-4 h-4" />
                  Account Settings
                </TabsTrigger>
                <TabsTrigger 
                  value="notifications" 
                  className="data-[state=active]:bg-blue-900/30 data-[state=active]:text-blue-400 text-gray-300 flex items-center gap-2"
                >
                  <AlertTriangle className="w-4 h-4" />
                  Notifications
                </TabsTrigger>
                <TabsTrigger 
                  value="keywords-type" 
                  className="data-[state=active]:bg-blue-900/30 data-[state=active]:text-blue-400 text-gray-300 flex items-center gap-2"
                >
                  <Tag className="w-4 h-4" />
                  Keywords Type
                </TabsTrigger>
                <TabsTrigger 
                  value="keywords-category" 
                  className="data-[state=active]:bg-blue-900/30 data-[state=active]:text-blue-400 text-gray-300 flex items-center gap-2"
                >
                  <Activity className="w-4 h-4" />
                  Keywords Category
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Subscription Tab */}
            <TabsContent value="subscription" className="space-y-8">
              {/* Current Plan & Usage Section */}
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <Activity className="w-6 h-6 text-blue-400" />
                  <h2 className="text-2xl font-bold text-white">Current Plan & Usage</h2>
                </div>

                {/* Current Plan Card */}
                <Card className="bg-[#1a1d23] border-0 shadow-xl">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Star className="w-5 h-5 text-yellow-500" />
                          <div>
                            <h3 className="text-xl font-semibold text-white">
                              {plans.find(p => p.isCurrent)?.name || 'Free Plan'}
                            </h3>
                            <Badge className="bg-blue-900/30 text-blue-400 border-blue-700 mt-1">
                              active
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <Button
                        className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-xl hover:opacity-90 transition-all"
                        onClick={handleUpgradeClick}
                      >
                        Upgrade Plan
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Usage Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="bg-[#1a1d23] border-0">
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Keywords Tracked</span>
                          <span className="text-white">{usageStats.keywordsTracked.current}/{usageStats.keywordsTracked.max}</span>
                        </div>
                        <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"
                            style={{ width: `${(usageStats.keywordsTracked.current / usageStats.keywordsTracked.max) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-[#1a1d23] border-0">
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Data Exports</span>
                          <span className="text-white">{usageStats.exports.current}/{usageStats.exports.max}</span>
                        </div>
                        <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-purple-500 to-pink-600 rounded-full"
                            style={{ width: `${(usageStats.exports.current / usageStats.exports.max) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

                             {/* Plan Cards */}
               <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {plans.map((plan) => {
                  const IconComponent = plan.icon;
                  return (
                    <Card 
                      key={plan.id} 
                      className={`relative flex flex-col h-full ${
                        plan.isCurrent 
                          ? 'bg-[#1a1d23] border-2 border-blue-500 shadow-lg shadow-blue-500/20' 
                          : 'bg-[#1a1d23] border-gray-700 hover:border-gray-600'
                      } transition-all duration-300`}
                    >
                      {plan.isCurrent && (
                        <div className="absolute -top-3 left-4">
                          <Badge className="bg-blue-600 text-white">Current Plan</Badge>
                        </div>
                      )}
                      {plan.popular && !plan.isCurrent && (
                        <div className="absolute -top-3 left-4">
                          <Badge className="bg-gradient-to-r from-purple-500 to-pink-600 text-white">Popular</Badge>
                        </div>
                      )}
                      {plan.badge && !plan.isCurrent && !plan.popular && (
                        <div className="absolute -top-3 left-4">
                          <Badge className="bg-gradient-to-r from-yellow-500 to-orange-600 text-white">{plan.badge}</Badge>
                        </div>
                      )}

                      <CardHeader className="text-center pb-4">
                        <div className="flex items-center justify-center mb-4">
                          <div className={`p-3 rounded-full ${
                            plan.id === 'free' ? 'bg-gradient-to-br from-gray-500 to-gray-600' :
                            plan.id === 'pro' ? 'bg-gradient-to-br from-blue-500 to-purple-600' :
                            plan.id === 'agency' ? 'bg-gradient-to-br from-purple-500 to-pink-600' :
                            'bg-gradient-to-br from-yellow-500 to-orange-600'
                          }`}>
                            <IconComponent className="w-8 h-8 text-white" />
                          </div>
                        </div>
                        <CardTitle className="text-2xl text-white">{plan.name}</CardTitle>
                        <div className="flex items-center justify-center mt-4">
                          <span className="text-4xl font-bold text-white">${plan.price}</span>
                          <span className="text-gray-400 ml-2">/{plan.billing}</span>
                        </div>
                      </CardHeader>

                      <CardContent className="px-6 pb-6 flex flex-col flex-grow">
                        <ul className="space-y-3 mb-6 flex-grow">
                          {plan.features.map((feature, index) => (
                            <li key={index} className="flex items-center gap-3 text-sm text-gray-300">
                              <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                              {feature}
                            </li>
                          ))}
                          {plan.limitations?.map((limitation, index) => (
                            <li key={index} className="flex items-center gap-3 text-sm text-gray-400">
                              <X className="w-4 h-4 text-red-400 flex-shrink-0" />
                              {limitation}
                            </li>
                          ))}
                        </ul>

                        <div className="mt-auto">
                          {!plan.isCurrent && (
                            <Button 
                              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:opacity-90"
                              onClick={handleUpgradeClick}
                            >
                              {plan.id === 'free' ? 'Upgrade' : 'Upgrade'}
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Subscription Details and Account Settings - Compact */}
              <div className="grid grid-cols-1 gap-6 mt-8">
                {/* Subscription Details Section - Compact */}
                <Card className="bg-[#1a1d23] border-0 shadow-lg">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                          <Crown className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-white text-lg">Subscription Details</CardTitle>
                          <CardDescription className="text-gray-400 text-sm">
                            Started: {userInstallation?.subscription_start_date 
                              ? new Date(userInstallation.subscription_start_date).toLocaleDateString()
                              : new Date().toLocaleDateString()}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-yellow-400 font-semibold text-sm">
                          {subscription.subscriptionType === 'lifetime' 
                            ? 'Lifetime Access' 
                            : subscription.isSubscriptionActive 
                              ? `${subscription.subscriptionType?.toUpperCase()} Plan Active`
                              : 'Free trial ends in 30 days'}
                        </p>
                        {subscription.subscriptionType !== 'lifetime' && subscription.isSubscriptionActive && (
                          <p className="text-gray-400 text-xs mt-1">
                            Next billing: {userInstallation?.subscription_end_date 
                              ? new Date(userInstallation.subscription_end_date).toLocaleDateString()
                              : 'N/A'}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </Card>

                {/* Account Settings Section - Compact */}
                <Card className="bg-[#1a1d23] border-0 shadow-lg">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                          <SettingsIcon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-white text-lg">Account Settings</CardTitle>
                          <CardDescription className="text-gray-400 text-sm">
                            Manage your business information
                          </CardDescription>
                        </div>
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
                            size="sm"
                            className="text-gray-400 hover:text-white border-gray-600 text-xs"
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleSaveProfile}
                            size="sm"
                            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-xs"
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
                          size="sm"
                          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-xs"
                        >
                          Edit Settings
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-4">
                    <div className="space-y-3">
                      <div>
                        <Label className="text-gray-400 text-xs font-medium">Business Type</Label>
                        {isEditing ? (
                          <Select
                            value={formData.business_type}
                            onValueChange={(value) => setFormData(prev => ({ ...prev, business_type: value }))}
                          >
                            <SelectTrigger className="bg-gray-800 border-gray-700 text-white focus:ring-blue-500 focus:border-blue-500 h-9 text-sm">
                              <SelectValue placeholder="Select business type" />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-800 border-gray-700">
                              <SelectItem value="Marketing agency" className="text-white focus:bg-gray-700">Marketing agency</SelectItem>
                              <SelectItem value="B2B SaaS" className="text-white focus:bg-gray-700">B2B SaaS</SelectItem>
                              <SelectItem value="Freelancer" className="text-white focus:bg-gray-700">Freelancer</SelectItem>
                              <SelectItem value="Consultant" className="text-white focus:bg-gray-700">Consultant</SelectItem>
                              <SelectItem value="E-commerce" className="text-white focus:bg-gray-700">E-commerce</SelectItem>
                              <SelectItem value="B2B retail" className="text-white focus:bg-gray-700">B2B retail</SelectItem>
                              <SelectItem value="Others" className="text-white focus:bg-gray-700">Others</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 mt-1">
                            <p className="text-white text-sm font-medium">
                              {userInstallation?.business_type || 'Consultant'}
                            </p>
                          </div>
                        )}
                      </div>

                      <div>
                        <Label className="text-gray-400 text-xs font-medium">Business Size</Label>
                        {isEditing ? (
                          <Select
                            value={formData.business_size}
                            onValueChange={(value) => setFormData(prev => ({ ...prev, business_size: value }))}
                          >
                            <SelectTrigger className="bg-gray-800 border-gray-700 text-white focus:ring-blue-500 focus:border-blue-500 h-9 text-sm">
                              <SelectValue placeholder="Select business size" />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-800 border-gray-700">
                              <SelectItem value="1" className="text-white focus:bg-gray-700">1</SelectItem>
                              <SelectItem value="2–10" className="text-white focus:bg-gray-700">2–10</SelectItem>
                              <SelectItem value="11–50" className="text-white focus:bg-gray-700">11–50</SelectItem>
                              <SelectItem value="51–200" className="text-white focus:bg-gray-700">51–200</SelectItem>
                              <SelectItem value="200+" className="text-white focus:bg-gray-700">200+</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 mt-1">
                            <p className="text-white text-sm font-medium">
                              {userInstallation?.business_size || '11-50'}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Google Search Console Tab */}
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
                      onClick={handleDisconnectGSC}
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

            {/* Account Settings Tab */}
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
                    <Label htmlFor="account-name" className="text-gray-300">Name</Label>
                    <Input 
                      id="account-name" 
                      value={accountSettings.name}
                      onChange={(e) => setAccountSettings(prev => ({ ...prev, name: e.target.value }))}
                      className="bg-gray-700 border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500" 
                      placeholder="Enter your name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="account-email" className="text-gray-300">Email</Label>
                    <Input 
                      id="account-email" 
                      value={accountSettings.email}
                      readOnly 
                      className="bg-gray-700 border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500 opacity-50 cursor-not-allowed" 
                    />
                    <p className="text-xs text-gray-500">Email cannot be changed</p>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div className="space-y-0.5">
                      <Label htmlFor="account-marketing" className="text-gray-300">Marketing Emails</Label>
                      <p className="text-sm text-gray-400">
                        Receive product updates and offers
                      </p>
                    </div>
                    <Switch 
                      id="account-marketing" 
                      checked={accountSettings.marketingEmails}
                      onCheckedChange={(checked) => setAccountSettings(prev => ({ ...prev, marketingEmails: checked }))}
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    onClick={handleSaveAccountSettings}
                    className="ml-auto bg-blue-600 hover:bg-blue-700"
                  >
                    Save Changes
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            {/* Notifications Tab */}
            <TabsContent value="notifications" className="space-y-4">
              <Card className="bg-gray-800 border-gray-700 relative">
                {/* Coming Soon Overlay */}
                <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm rounded-lg flex items-center justify-center z-10">
                  <div className="text-center p-8">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <AlertTriangle className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">Coming Soon</h3>
                    <p className="text-gray-400 text-lg">
                      Notification settings are currently under development
                    </p>
                    <p className="text-gray-500 text-sm mt-2">
                      This feature will be available in a future update
                    </p>
                  </div>
                </div>

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
                    <Switch id="rank-changes" defaultChecked disabled />
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div className="space-y-0.5">
                      <Label htmlFor="new-keywords" className="text-gray-300">New Keywords</Label>
                      <p className="text-sm text-gray-400">
                        Get notified when new keywords are found
                      </p>
                    </div>
                    <Switch id="new-keywords" defaultChecked disabled />
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div className="space-y-0.5">
                      <Label htmlFor="weekly-report" className="text-gray-300">Weekly Report</Label>
                      <p className="text-sm text-gray-400">
                        Receive a weekly summary of your performance
                      </p>
                    </div>
                    <Switch id="weekly-report" defaultChecked disabled />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="ml-auto bg-blue-600 hover:bg-blue-700" disabled>Save Preferences</Button>
                </CardFooter>
              </Card>
            </TabsContent>

            {/* Keywords Type Tab */}
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

            {/* Keywords Category Tab */}
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
        </div>
      </div>
    </DashboardLayout>
  );
} 