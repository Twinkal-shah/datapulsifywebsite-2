import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Download, 
  Filter,
  Search,
  ArrowUpDown,
  Eye,
  X
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { gscService, GSCDataPoint } from '@/lib/gscService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { format, subMonths, parseISO } from 'date-fns';
import { PROPERTY_CHANGE_EVENT } from '@/components/PropertySelector';
import { RenewalOverlay } from '@/components/RenewalOverlay';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { supabase as supabaseClient } from '@/lib/supabaseClient';

// Types
interface PageAnalysis {
  url: string;
  category: string;
  clickGap: number;
  impressionGap: number;
  ctrGap: number;
  positionGap: number;
  diagnosis: string;
  actionStep: string;
  trendIcon: string;
  currentMetrics: {
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  };
  previousMetrics: {
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  };
  historicalData: Array<{
    date: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  }>;
}

// Category detection patterns
const CATEGORY_PATTERNS = [
  { pattern: /\/blog\/|\/article\/|\/post\//i, category: 'Blog' },
  { pattern: /\/product\/|\/products\/|\/pricing/i, category: 'Product Page' },
  { pattern: /^\/$|\/home/i, category: 'Homepage' },
  { pattern: /\/guide\/|\/how-to\/|\/tutorial\//i, category: 'Guide' },
  { pattern: /\/ebook\/|\/download\/|\.pdf/i, category: 'Ebook' },
  { pattern: /\/event\/|\/webinar\/|\/conference\//i, category: 'Events' },
  { pattern: /\/whitepaper\/|\/research\//i, category: 'Whitepaper' },
  { pattern: /\/press\/|\/news\/|\/announcement\//i, category: 'Press Release' },
  { pattern: /\/tip\/|\/coach\/|\/advice\//i, category: 'Coaching Tips' },
  { pattern: /\/cta\/|\/signup\/|\/register\/|\/demo\//i, category: 'CTA Pages' },
  { pattern: /\/resource\/|\/tool\/|\/template\//i, category: 'Resource' },
];

// Diagnosis logic implementation
const getDiagnosis = (clickGap: number, impressionGap: number, ctrGap: number, positionGap: number): { diagnosis: string; icon: string; action: string } => {
  const Q = clickGap;
  const T = impressionGap;
  const W = ctrGap;
  const Z = positionGap;

  if (Q > 0) {
    return { diagnosis: 'Positive trend', icon: '🚀', action: 'No changes needed' };
  }
  
  if (Q === 0) {
    return { diagnosis: 'Trend stabled', icon: '🛬', action: 'No changes needed' };
  }

  // Q < 0 cases
  if (Q < 0 && T > 0 && W > 0 && Z > 0) {
    return { diagnosis: 'Intent mismatch', icon: '❌', action: 'Update content + Build high quality internal links' };
  }
  
  if (Q < 0 && T > 0 && W < 0 && Z > 0) {
    return { diagnosis: 'Intent mismatch', icon: '❌', action: 'Update content + Build high quality internal links' };
  }
  
  if (Q < 0 && T > 0 && W < 0 && Z < 0) {
    return { diagnosis: 'Search intent + relevancy mismatch', icon: '❌', action: 'Improve meta title + Update content' };
  }
  
  if (Q < 0 && T < 0 && W < 0 && Z < 0) {
    return { diagnosis: 'Search volume + relevancy downgraded', icon: '🔻', action: 'No changes needed' };
  }
  
  if (Q < 0 && T < 0 && W > 0 && Z < 0) {
    return { diagnosis: 'Search volume decreased', icon: '🔻', action: 'No changes needed' };
  }
  
  if (Q < 0 && T < 0 && W > 0 && Z > 0) {
    return { diagnosis: 'Intent mismatch', icon: '❌', action: 'Update content + Build high quality internal links' };
  }
  
  if (Q < 0 && T < 0 && W < 0 && Z > 0) {
    return { diagnosis: 'Intent mismatch', icon: '❌', action: 'Update content + Build high quality internal links' };
  }

  // Default case
  return { diagnosis: 'Unknown pattern', icon: '❓', action: 'Manual review needed' };
};

// Category detection function
const detectCategory = (url: string): string => {
  for (const { pattern, category } of CATEGORY_PATTERNS) {
    if (pattern.test(url)) {
      return category;
    }
  }
  return 'Others';
};

export default function ClickGapIntelligence() {
  const { user, getGSCToken, getGSCProperty } = useAuth();
  const { subscriptionType } = useSubscription();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isPropertySwitching, setIsPropertySwitching] = useState(false);
  const [pageAnalyses, setPageAnalyses] = useState<PageAnalysis[]>([]);
  const [filteredAnalyses, setFilteredAnalyses] = useState<PageAnalysis[]>([]);
  const [selectedPage, setSelectedPage] = useState<PageAnalysis | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [diagnosisFilter, setDiagnosisFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'clickGap' | 'url' | 'category'>('clickGap');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [trackedPages, setTrackedPages] = useState<string[]>([]);
  const [isTabActive, setIsTabActive] = useState(true);

  // Constants for page limits
  const PAGE_LIMITS = {
    lifetime: 30,
    monthly_pro: Infinity, // Unlimited pages for monthly pro
    free: 5
  };

  // Get page limit based on subscription type
  const getPageLimit = () => {
    if (!subscriptionType) return PAGE_LIMITS.free;
    return PAGE_LIMITS[subscriptionType as keyof typeof PAGE_LIMITS] || PAGE_LIMITS.free;
  };

  // Check if can track more pages
  const canTrackMorePages = () => {
    const limit = getPageLimit();
    // If limit is unlimited (Infinity), always allow tracking
    return limit === Infinity || trackedPages.length < limit;
  };

  // Manual refresh function for testing
  const refreshTrackedPages = async () => {
    console.log('=== MANUAL REFRESH TRIGGERED ===');
    console.log('User email for refresh:', user?.email);
    
    if (!user?.email) {
      console.log('No user email for manual refresh');
      return;
    }

    try {
      // First, let's test a simple count query
      console.log('Testing simple count query...');
      const { count, error: countError } = await supabaseClient
        .from('tracked_pages')
        .select('*', { count: 'exact', head: true })
        .eq('user_email', user.email);

      console.log('Count query result:', { count, countError });

      // Now let's try the full query
      console.log('Manual refresh: Querying tracked_pages table...');
      console.log('Query: SELECT * FROM tracked_pages WHERE user_email =', user.email);
      
      const { data, error } = await supabaseClient
        .from('tracked_pages')
        .select('*')  // Select all fields for debugging
        .eq('user_email', user.email);

      console.log('Manual refresh result:');
      console.log('- Data array:', data);
      console.log('- Data length:', data?.length || 0);
      console.log('- Error:', error);
      console.log('- First item (if exists):', data?.[0]);

      if (error) {
        console.error('Manual refresh error details:', error);
        toast({
          title: "Database Query Error",
          description: `Error: ${error.message}`,
          variant: "destructive",
        });
        return;
      }

      if (!data || data.length === 0) {
        console.log('No data returned - checking if RLS is blocking the query');
        toast({
          title: "No Data Found",
          description: "No tracked pages found. This might be an RLS issue.",
          variant: "destructive",
        });
        return;
      }

      const urls = data?.map(page => page.url) || [];
      console.log('Manual refresh: Extracted URLs:', urls);
      console.log('Manual refresh: Setting tracked pages state:', urls);
      setTrackedPages(urls);
      
      toast({
        title: "Refresh Complete",
        description: `Found ${urls.length} tracked pages`,
        variant: "default",
      });
      
      console.log('=== MANUAL REFRESH COMPLETE ===');
    } catch (error) {
      console.error('Manual refresh catch error:', error);
      toast({
        title: "Error",
        description: `Refresh failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };

  // Function to track a page
  const handleTrackPage = async (url: string) => {
    console.log('=== TRACK BUTTON CLICKED ===');
    console.log('URL:', url);
    console.log('Tab is active:', isTabActive);
    console.log('User email:', user?.email);
    console.log('Can track more pages:', canTrackMorePages());
    console.log('Current tracked pages count:', trackedPages.length);
    console.log('Page limit:', getPageLimit());
    console.log('Is page already tracked?', trackedPages.includes(url));
    console.log('Document.hidden:', document.hidden);
    console.log('Window focused:', document.hasFocus());
    
    // Skip problematic Supabase session check - we have user from AuthContext
    console.log('Skipping Supabase session check, using AuthContext user');
    console.log('AuthContext user email:', user?.email);

    if (!user?.email) {
      console.error('No user email found');
      toast({
        title: "Authentication Error",
        description: "Please make sure you're logged in",
        variant: "destructive",
      });
      return;
    }

    // Check if already tracked in local state
    if (trackedPages.includes(url)) {
      console.log('Page already tracked in local state');
      toast({
        title: "Already Tracked",
        description: "This page is already being tracked",
        variant: "default",
      });
      return;
    }

    if (!canTrackMorePages()) {
      console.log('Page limit reached');
      if (subscriptionType === 'lifetime') {
        toast({
          title: "Page Limit Reached",
          description: "Upgrade to Monthly Pro Plan for unlimited page tracking.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Page Limit Reached",
          description: "Upgrade your plan to track more pages.",
          variant: "destructive",
        });
      }
      return;
    }

    // INSTANT TRACKING - Update UI immediately, save to database in background
    console.log('Adding to tracked pages instantly (UI update)');
    setTrackedPages([...trackedPages, url]);
    
    // Show immediate success feedback
    toast({
      title: "Page Tracked",
      description: "Page added to tracking",
      variant: "default",
    });

    // Smart database save - detects tab switching and handles accordingly
    const smartDatabaseSave = async (pageUrl: string, userEmail: string) => {
      console.log('🧠 Smart database save starting...');
      console.log('🧠 Page URL:', pageUrl);
      console.log('🧠 User Email:', userEmail);
      console.log('🧠 Tab was recently inactive:', !isTabActive || document.hidden);
      
      // If we suspect the client is in a bad state (after tab switching), try to refresh session first
      if (!isTabActive || document.hidden) {
        console.log('🔄 Detected potential client hang scenario - refreshing session first');
        try {
          // Force a quick session refresh to reset client state
          const sessionRefresh = await Promise.race([
            supabaseClient.auth.getUser(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Session refresh timeout')), 500))
          ]);
          console.log('🔄 Session refresh result:', sessionRefresh);
        } catch (refreshError) {
          console.log('🔄 Session refresh failed/timed out:', refreshError);
        }
      }
      
      // Now try the database save with a reasonable timeout
      try {
        console.log('💾 Attempting database insert...');
        const insertPromise = supabaseClient
          .from('tracked_pages')
          .insert({
            user_email: userEmail,
            url: pageUrl,
            created_at: new Date().toISOString()
          });
        
        // Use a longer timeout for the actual save (2 seconds)
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Database insert timeout after 2 seconds')), 2000)
        );
        
        const result = await Promise.race([insertPromise, timeoutPromise]) as any;
        console.log('🧠 Database save result:', result);
        
        if (result.error) {
          if (result.error.code === '23505') {
            console.log('🧠 Page already exists (duplicate) - success!');
            return true;
          } else {
            console.error('🧠 Database error:', result.error);
            return false;
          }
        } else {
          console.log('🧠 Database save successful!');
          return true;
        }
      } catch (error) {
        console.error('🧠 Database save failed/timed out:', error);
        
        // If it failed, queue it for the next refresh cycle
        console.log('📋 Queueing for next refresh cycle...');
        setTimeout(async () => {
          console.log('🔄 Attempting delayed sync via refresh...');
          try {
            await refreshTrackedPages();
            console.log('🔄 Delayed refresh completed');
          } catch (refreshError) {
            console.error('🔄 Delayed refresh failed:', refreshError);
          }
        }, 3000);
        
        return false;
      }
    };

    // Save to database using smart method - handles tab switching scenarios
    console.log('🚀 Starting smart database save...');
    smartDatabaseSave(url, user.email).then((success) => {
      if (success) {
        console.log('✅ Smart database save successful!');
      } else {
        console.log('⚠️ Database save failed - but queued for sync');
      }
    }).catch((error) => {
      console.error('💥 Smart save error:', error);
    });
  };

  // Fetch tracked pages on component mount
  useEffect(() => {
    const fetchTrackedPages = async () => {
      console.log('=== FETCHING TRACKED PAGES ===');
      console.log('User object:', user);
      console.log('User email:', user?.email);
      
      if (!user?.email) {
        console.log('No user email, skipping fetch tracked pages');
        return;
      }

      try {
        console.log('Querying tracked_pages table...');
        console.log('Query params:', { user_email: user.email, is_active: true });
        
        const { data, error } = await supabaseClient
          .from('tracked_pages')
          .select('url, is_active, created_at')
          .eq('user_email', user.email)
          .eq('is_active', true);

        console.log('Tracked pages query result:');
        console.log('- Data:', data);
        console.log('- Error:', error);
        console.log('- Data length:', data?.length || 0);

        if (error) {
          console.error('Query error details:', error);
          toast({
            title: "Database Error",
            description: `Error loading tracked pages: ${error.message}`,
            variant: "destructive",
          });
          return;
        }

        const urls = data?.map(page => page.url) || [];
        console.log('Extracted URLs:', urls);
        console.log('Setting tracked pages state with:', urls);
        setTrackedPages(urls);
        console.log('=== FETCH COMPLETE ===');
      } catch (error) {
        console.error('Error fetching tracked pages:', error);
        toast({
          title: "Error",
          description: `Failed to load tracked pages: ${error instanceof Error ? error.message : 'Unknown error'}`,
          variant: "destructive",
        });
      }
    };

    // Add a small delay to ensure user is fully loaded
    if (user?.email) {
      setTimeout(fetchTrackedPages, 100);
    }
  }, [user]);

  // Add tab visibility change detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      const isVisible = !document.hidden;
      setIsTabActive(isVisible);
      
      console.log('=== TAB VISIBILITY CHANGED ===');
      console.log('Tab is now:', isVisible ? 'ACTIVE' : 'INACTIVE');
      console.log('User email:', user?.email);
      console.log('Tracked pages count:', trackedPages.length);
      
      if (isVisible) {
        console.log('Tab became active - checking auth and refreshing data');
        // When tab becomes active, refresh tracked pages and check auth
        setTimeout(() => {
          console.log('Delayed refresh after tab activation');
          if (user?.email) {
            refreshTrackedPages();
          }
        }, 500);
      }
    };

    const handleFocus = () => {
      console.log('=== WINDOW FOCUS ===');
      console.log('Window gained focus');
      if (user?.email) {
        setTimeout(() => refreshTrackedPages(), 300);
      }
    };

    const handleBlur = () => {
      console.log('=== WINDOW BLUR ===');
      console.log('Window lost focus');
    };

    // Add event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, [user, trackedPages.length, refreshTrackedPages]);

  // Monitor auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange((event, session) => {
      console.log('=== AUTH STATE CHANGE ===');
      console.log('Event:', event);
      console.log('Session exists:', !!session);
      console.log('User email from session:', session?.user?.email);
      console.log('Current user email from context:', user?.email);
      
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        console.log('Auth refreshed, reloading tracked pages');
        setTimeout(() => {
          if (session?.user?.email) {
            refreshTrackedPages();
          }
        }, 1000);
      }
    });

    return () => subscription.unsubscribe();
  }, [refreshTrackedPages]);

  // Derived values from auth
  const isConnected = !!getGSCToken();
  const gscProperty = getGSCProperty();
  const token = getGSCToken();

  // Add property change listener
  useEffect(() => {
    const handlePropertyChange = async (event: CustomEvent) => {
      const { property, isInitial } = event.detail;
      
      if (isInitial) {
        // Initial property set, no need to show switching state
        return;
      }
      
      console.log('[ClickGapIntelligence] Property changed to:', property);
      setIsPropertySwitching(true);
      
      // Reset filters
      setSearchTerm('');
      setCategoryFilter('all');
      setDiagnosisFilter('all');
      setActionFilter('all');
      setSortBy('clickGap');
      setSortOrder('desc');
      setSelectedPage(null);
      
      // Small delay to ensure UI updates are visible
      await new Promise(resolve => setTimeout(resolve, 300));
    };

    window.addEventListener(PROPERTY_CHANGE_EVENT, handlePropertyChange as EventListener);
    
    return () => {
      window.removeEventListener(PROPERTY_CHANGE_EVENT, handlePropertyChange as EventListener);
    };
  }, []);

  // Get unique values for filters
  const categories = useMemo(() => {
    const cats = [...new Set(pageAnalyses.map(p => p.category))];
    return cats.sort();
  }, [pageAnalyses]);

  const diagnoses = useMemo(() => {
    const diags = [...new Set(pageAnalyses.map(p => p.diagnosis))];
    return diags.sort();
  }, [pageAnalyses]);

  const actions = useMemo(() => {
    const acts = [...new Set(pageAnalyses.map(p => p.actionStep))];
    return acts.sort();
  }, [pageAnalyses]);

  // Fetch and analyze data
  useEffect(() => {
    const fetchData = async () => {
      if (!gscProperty || !isConnected || !token) {
        setLoading(false);
        setIsPropertySwitching(false);
        return;
      }

      try {
        setLoading(true);
        
        // Calculate date ranges
        const now = new Date();
        const last3MonthsEnd = new Date(now);
        const last3MonthsStart = subMonths(last3MonthsEnd, 3);
        const previous3MonthsEnd = subMonths(last3MonthsStart, 1);
        const previous3MonthsStart = subMonths(previous3MonthsEnd, 3);
        
        // Fetch 6 months of data for historical charts
        const historicalStart = subMonths(now, 6);
        
        // Get page-level data for both periods using the correct GSC service method
        const [currentData, previousData, historicalData] = await Promise.all([
          gscService.fetchSearchAnalyticsData({
            siteUrl: gscProperty,
            startDate: format(last3MonthsStart, 'yyyy-MM-dd'),
            endDate: format(last3MonthsEnd, 'yyyy-MM-dd'),
            dimensions: ['page'],
            rowLimit: 25000
          }),
          gscService.fetchSearchAnalyticsData({
            siteUrl: gscProperty,
            startDate: format(previous3MonthsStart, 'yyyy-MM-dd'),
            endDate: format(previous3MonthsEnd, 'yyyy-MM-dd'),
            dimensions: ['page'],
            rowLimit: 25000
          }),
          gscService.fetchSearchAnalyticsData({
            siteUrl: gscProperty,
            startDate: format(historicalStart, 'yyyy-MM-dd'),
            endDate: format(now, 'yyyy-MM-dd'),
            dimensions: ['page', 'date'],
            rowLimit: 25000
          })
        ]);

        // Process and analyze data
        const analyses = processPageData(currentData, previousData, historicalData);
        setPageAnalyses(analyses);
        setIsPropertySwitching(false);
        
      } catch (error) {
        console.error('Error fetching GSC data:', error);
        toast({
          title: "Error",
          description: "Failed to fetch Google Search Console data. Please try again.",
          variant: "destructive",
        });
        setIsPropertySwitching(false);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [gscProperty, isConnected, token]);

  // Process page data and calculate gaps
  const processPageData = (
    currentData: GSCDataPoint[], 
    previousData: GSCDataPoint[], 
    historicalData: GSCDataPoint[]
  ): PageAnalysis[] => {
    // Group data by page
    const currentPages = groupByPage(currentData);
    const previousPages = groupByPage(previousData);
    const historicalPages = groupByPageWithHistory(historicalData);

    const analyses: PageAnalysis[] = [];

    // Process each page that has data in either period
    const allPages = new Set([...Object.keys(currentPages), ...Object.keys(previousPages)]);

    for (const page of allPages) {
      const current = currentPages[page] || { clicks: 0, impressions: 0, ctr: 0, position: 0 };
      const previous = previousPages[page] || { clicks: 0, impressions: 0, ctr: 0, position: 0 };
      const historical = historicalPages[page] || [];

      // Calculate gaps
      const clickGap = current.clicks - previous.clicks;
      const impressionGap = current.impressions - previous.impressions;
      const ctrGap = current.ctr - previous.ctr;
      const positionGap = current.position - previous.position;

      // Get diagnosis
      const { diagnosis, icon, action } = getDiagnosis(clickGap, impressionGap, ctrGap, positionGap);

      analyses.push({
        url: page,
        category: detectCategory(page),
        clickGap,
        impressionGap,
        ctrGap: ctrGap * 100, // Convert to percentage
        positionGap,
        diagnosis,
        actionStep: action,
        trendIcon: icon,
        currentMetrics: current,
        previousMetrics: previous,
        historicalData: historical
      });
    }

    return analyses;
  };

  // Group GSC data by page
  const groupByPage = (data: GSCDataPoint[]) => {
    const grouped: Record<string, { clicks: number; impressions: number; ctr: number; position: number; count: number }> = {};

    data.forEach(item => {
      if (!item.page) return;

      if (!grouped[item.page]) {
        grouped[item.page] = { clicks: 0, impressions: 0, ctr: 0, position: 0, count: 0 };
      }

      grouped[item.page].clicks += item.clicks || 0;
      grouped[item.page].impressions += item.impressions || 0;
      grouped[item.page].ctr += item.ctr || 0;
      grouped[item.page].position += item.position || 0;
      grouped[item.page].count += 1;
    });

    // Calculate averages
    Object.keys(grouped).forEach(page => {
      const data = grouped[page];
      if (data.count > 0) {
        data.ctr = data.ctr / data.count;
        data.position = data.position / data.count;
      }
    });

    return grouped;
  };

  // Group GSC data by page with historical data
  const groupByPageWithHistory = (data: GSCDataPoint[]) => {
    const grouped: Record<string, Array<{ date: string; clicks: number; impressions: number; ctr: number; position: number }>> = {};

    data.forEach(item => {
      if (!item.page || !item.date) return;

      if (!grouped[item.page]) {
        grouped[item.page] = [];
      }

      grouped[item.page].push({
        date: item.date,
        clicks: item.clicks || 0,
        impressions: item.impressions || 0,
        ctr: (item.ctr || 0) * 100,
        position: item.position || 0
      });
    });

    // Sort historical data by date
    Object.keys(grouped).forEach(page => {
      grouped[page].sort((a, b) => a.date.localeCompare(b.date));
    });

    return grouped;
  };

  // Apply filters and sorting
  useEffect(() => {
    let filtered = [...pageAnalyses];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(page => 
        page.url.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(page => page.category === categoryFilter);
    }

    // Apply diagnosis filter
    if (diagnosisFilter !== 'all') {
      filtered = filtered.filter(page => page.diagnosis === diagnosisFilter);
    }

    // Apply action filter
    if (actionFilter !== 'all') {
      filtered = filtered.filter(page => page.actionStep === actionFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aVal, bVal;
      
      switch (sortBy) {
        case 'clickGap':
          aVal = a.clickGap;
          bVal = b.clickGap;
          break;
        case 'url':
          aVal = a.url;
          bVal = b.url;
          break;
        case 'category':
          aVal = a.category;
          bVal = b.category;
          break;
        default:
          aVal = a.clickGap;
          bVal = b.clickGap;
      }

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      
      return sortOrder === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });

    setFilteredAnalyses(filtered);
  }, [pageAnalyses, searchTerm, categoryFilter, diagnosisFilter, actionFilter, sortBy, sortOrder]);

  // Export to CSV
  const exportToCSV = () => {
    const headers = [
      'Page URL',
      'Category',
      'Click Gap',
      'Impression Gap',
      'CTR Gap (%)',
      'Position Gap',
      'Diagnosis',
      'Action Step',
      'Trend Icon'
    ];

    const csvContent = [
      headers.join(','),
      ...filteredAnalyses.map(page => [
        `"${page.url}"`,
        page.category,
        page.clickGap,
        page.impressionGap,
        page.ctrGap.toFixed(2),
        page.positionGap.toFixed(2),
        `"${page.diagnosis}"`,
        `"${page.actionStep}"`,
        page.trendIcon
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `click-gap-intelligence-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const formatNumber = (num: number) => {
    if (Math.abs(num) >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toFixed(0);
  };

  const formatPercentage = (num: number) => {
    return (num >= 0 ? '+' : '') + num.toFixed(2) + '%';
  };

  const formatPosition = (num: number) => {
    return (num >= 0 ? '+' : '') + num.toFixed(1);
  };

  // Show property switching overlay
  if (isPropertySwitching) {
    return (
      <DashboardLayout title="Click Gap Intelligence" comparisonText="Last 3 months vs Previous 3 months">
        <div className="flex items-center justify-center h-screen bg-gradient-to-br from-gray-900 via-[#0f1115] to-gray-900">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-white mb-2">Switching Property</h2>
            <p className="text-gray-400">Loading Click Gap Intelligence for your selected property...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (loading) {
    return (
      <DashboardLayout title="Click Gap Intelligence">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-4"></div>
            <p className="text-gray-400">Analyzing page performance...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Click Gap Intelligence" fullScreen={true}>
      <RenewalOverlay>
        <div className="w-full p-6 space-y-6">
          {/* Add tracking status info */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-white">
                <span>Page Tracking Status</span>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-white">
                    {trackedPages.length}/{getPageLimit() === Infinity ? <span className="text-lg">∞</span> : getPageLimit()} Pages
                  </Badge>
                </div>
              </CardTitle>
            </CardHeader>
          </Card>

          {/* Limit Reached Card */}
          {!canTrackMorePages() && (
            <Card className="bg-gradient-to-r from-black-500/10 to-red-500/10 border-purple-500/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-orange-500/20 rounded-full flex items-center justify-center">
                      <span className="text-2xl">⚠️</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-1">
                        Page Tracking Limit Reached
                      </h3>
                      <p className="text-white text-sm">
                        {subscriptionType === 'lifetime' 
                          ? `You've reached your ${getPageLimit()} page limit. Upgrade to Monthly Pro for unlimited page tracking.`
                          : `You've reached your ${getPageLimit()} page limit. Upgrade your plan to track more pages.`
                        }
                      </p>
                    </div>
                  </div>
                  <Button 
                    className="bg-gradient-to-r from-purple-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-medium px-6"
                    onClick={() => {
                      // Navigate to Settings page subscription section
                      navigate('/settings');
                    }}
                  >
                    Upgrade Plan
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Filters and Controls */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-white">
                <span>Page Performance Analysis</span>
                <Button onClick={exportToCSV} variant="outline" size="sm" className="bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white">
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search pages..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
                  />
                </div>
                
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-gray-300">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700 text-white">
                    <SelectItem value="all" className="hover:bg-gray-700">All Categories</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category} value={category} className="hover:bg-gray-700">{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={diagnosisFilter} onValueChange={setDiagnosisFilter}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-gray-300">
                    <SelectValue placeholder="All Diagnoses" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700 text-white">
                    <SelectItem value="all" className="hover:bg-gray-700">All Diagnoses</SelectItem>
                    {diagnoses.map(diagnosis => (
                      <SelectItem key={diagnosis} value={diagnosis} className="hover:bg-gray-700">{diagnosis}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={actionFilter} onValueChange={setActionFilter}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-gray-300">
                    <SelectValue placeholder="All Actions" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700 text-white">
                    <SelectItem value="all" className="hover:bg-gray-700">All Actions</SelectItem>
                    {actions.map(action => (
                      <SelectItem key={action} value={action} className="hover:bg-gray-700">{action}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-400">Sort by:</span>
                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger className="w-40 bg-gray-700 border-gray-600 text-gray-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700 text-white">
                    <SelectItem value="clickGap" className="hover:bg-gray-700">Click Gap</SelectItem>
                    <SelectItem value="url" className="hover:bg-gray-700">Page URL</SelectItem>
                    <SelectItem value="category" className="hover:bg-gray-700">Category</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white"
                >
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Results Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-green-400">
                  {filteredAnalyses.filter(p => p.trendIcon === '🚀').length}
                </div>
                <div className="text-sm text-gray-400">Positive Trends 🚀</div>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-red-400">
                  {filteredAnalyses.filter(p => p.trendIcon === '❌').length}
                </div>
                <div className="text-sm text-gray-400">Intent Mismatches ❌</div>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-orange-400">
                  {filteredAnalyses.filter(p => p.trendIcon === '🔻').length}
                </div>
                <div className="text-sm text-gray-400">Volume Decreases 🔻</div>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-blue-400">
                  {filteredAnalyses.filter(p => p.trendIcon === '🛬').length}
                </div>
                <div className="text-sm text-gray-400">Stable Trends 🛬</div>
              </CardContent>
            </Card>
          </div>

          {/* Main Table */}
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table className="relative">
                  <TableHeader>
                    <TableRow className="border-gray-700 hover:bg-gray-700/50">
                      <TableHead className="sticky left-0 z-20 bg-gray-800 text-gray-300 min-w-[200px] max-w-[300px] whitespace-nowrap border-r border-gray-700 shadow-lg">Page URL</TableHead>
                      <TableHead className="text-gray-300 min-w-[100px] whitespace-nowrap">Category</TableHead>
                      <TableHead className="text-gray-300 min-w-[100px] whitespace-nowrap text-center">Click Gap</TableHead>
                      <TableHead className="text-gray-300 min-w-[120px] whitespace-nowrap text-center">Impression Gap</TableHead>
                      <TableHead className="text-gray-300 min-w-[90px] whitespace-nowrap text-center">CTR Gap</TableHead>
                      <TableHead className="text-gray-300 min-w-[110px] whitespace-nowrap text-center">Position Gap</TableHead>
                      <TableHead className="text-gray-300 min-w-[280px] max-w-[320px] whitespace-nowrap text-center">Diagnosis</TableHead>
                      <TableHead className="text-gray-300 min-w-[200px] max-w-[280px] whitespace-nowrap">Action Step</TableHead>
                      <TableHead className="text-gray-300 min-w-[60px] whitespace-nowrap text-center">Trend</TableHead>
                      <TableHead className="text-gray-300 min-w-[80px] whitespace-nowrap text-center">Track</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAnalyses.map((page, index) => (
                      <TableRow key={index} className="hover:bg-gray-700/50 border-gray-700">
                        <TableCell className="sticky left-0 z-10 bg-gray-800 hover:bg-gray-700/50 min-w-[200px] max-w-[300px] text-white border-r border-gray-700 shadow-lg">
                          <div className="truncate pr-2" title={page.url}>
                            {page.url}
                          </div>
                        </TableCell>
                        <TableCell className="min-w-[100px]">
                          <Badge variant="outline" className="border-gray-600 text-gray-300 whitespace-nowrap">{page.category}</Badge>
                        </TableCell>
                        <TableCell className={`min-w-[100px] font-mono text-center ${page.clickGap >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {page.clickGap >= 0 ? '+' : ''}{formatNumber(page.clickGap)}
                        </TableCell>
                        <TableCell className={`min-w-[120px] font-mono text-center ${page.impressionGap >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {page.impressionGap >= 0 ? '+' : ''}{formatNumber(page.impressionGap)}
                        </TableCell>
                        <TableCell className={`min-w-[90px] font-mono text-center ${page.ctrGap >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {formatPercentage(page.ctrGap)}
                        </TableCell>
                        <TableCell className={`min-w-[110px] font-mono text-center ${page.positionGap <= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {formatPosition(page.positionGap)}
                        </TableCell>
                        <TableCell className="min-w-[280px] max-w-[320px] text-center">
                          {trackedPages.includes(page.url) ? (
                            <Badge 
                              variant={
                                page.trendIcon === '🚀' ? 'default' :
                                page.trendIcon === '❌' ? 'destructive' :
                                page.trendIcon === '🔻' ? 'secondary' : 'outline'
                              }
                              className={`text-sm font-medium px-3 py-1 whitespace-nowrap ${
                                page.diagnosis === 'Trend stabled' ? '!text-white' :
                                page.diagnosis === 'Search volume + relevancy downgraded' ? '!text-black' : ''
                              }`}
                              title={page.diagnosis}
                            >
                              {page.diagnosis}
                            </Badge>
                          ) : (
                            <div className="text-gray-500 text-sm font-medium px-3 py-1">
                              🔒 Track to view
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="min-w-[200px] max-w-[280px] text-gray-300">
                          {trackedPages.includes(page.url) ? (
                            <div 
                              className="text-sm leading-tight pr-2"
                              style={{
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                wordBreak: 'break-word',
                                hyphens: 'auto',
                                lineHeight: '1.3'
                              }}
                              title={page.actionStep}
                            >
                              {page.actionStep}
                            </div>
                          ) : (
                            <div className="text-gray-500 text-sm">
                              🔒 Track to view action step
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-2xl text-white min-w-[60px] text-center">
                          {trackedPages.includes(page.url) ? (
                            page.trendIcon
                          ) : (
                            <div className="text-gray-500 text-sm">🔒</div>
                          )}
                        </TableCell>
                        <TableCell className="min-w-[80px] text-center">
                          {trackedPages.includes(page.url) ? (
                            <Badge variant="outline" className="bg-green-900/30 text-green-400 border-green-700">
                              Tracked
                            </Badge>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleTrackPage(page.url)}
                              disabled={!canTrackMorePages()}
                              className="bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white"
                            >
                              Track
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {filteredAnalyses.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  No pages found matching your filters.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </RenewalOverlay>
    </DashboardLayout>
  );
} 