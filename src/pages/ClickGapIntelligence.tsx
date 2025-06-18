import { useState, useEffect, useMemo } from 'react';
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
import { supabase } from '@/lib/supabase';

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

  // Constants for page limits
  const PAGE_LIMITS = {
    lifetime: 30,
    monthly_pro: 100,
    free: 5
  };

  // Get page limit based on subscription type
  const getPageLimit = () => {
    if (!subscriptionType) return PAGE_LIMITS.free;
    return PAGE_LIMITS[subscriptionType as keyof typeof PAGE_LIMITS] || PAGE_LIMITS.free;
  };

  // Check if can track more pages
  const canTrackMorePages = () => {
    return trackedPages.length < getPageLimit();
  };

  // Function to track a page
  const handleTrackPage = async (url: string) => {
    if (!user?.email) return;

    if (!canTrackMorePages()) {
      if (subscriptionType === 'lifetime') {
        toast({
          title: "Page Limit Reached",
          description: "Upgrade to Monthly Pro Plan to track more than 30 pages.",
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

    try {
      const { data, error } = await supabase
        .from('tracked_pages')
        .insert([
          {
            user_email: user.email,
            url: url,
            created_at: new Date().toISOString()
          }
        ]);

      if (error) throw error;

      setTrackedPages([...trackedPages, url]);
      toast({
        title: "Success",
        description: "Page added to tracking",
        variant: "default",
      });
    } catch (error) {
      console.error('Error tracking page:', error);
      toast({
        title: "Error",
        description: "Failed to track page",
        variant: "destructive",
      });
    }
  };

  // Fetch tracked pages on component mount
  useEffect(() => {
    const fetchTrackedPages = async () => {
      if (!user?.email) return;

      try {
        const { data, error } = await supabase
          .from('tracked_pages')
          .select('url')
          .eq('user_email', user.email);

        if (error) throw error;

        setTrackedPages(data.map(page => page.url));
      } catch (error) {
        console.error('Error fetching tracked pages:', error);
      }
    };

    fetchTrackedPages();
  }, [user]);

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
                <Badge variant="outline" className="ml-2 text-white">
                  {trackedPages.length}/{getPageLimit()} Pages
                </Badge>
              </CardTitle>
            </CardHeader>
          </Card>

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
                        </TableCell>
                        <TableCell className="min-w-[200px] max-w-[280px] text-gray-300">
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
                        </TableCell>
                        <TableCell className="text-2xl text-white min-w-[60px] text-center">
                          {page.trendIcon}
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