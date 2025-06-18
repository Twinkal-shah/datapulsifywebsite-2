import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, subDays, subMonths, subWeeks, eachWeekOfInterval, eachMonthOfInterval, startOfWeek, endOfWeek, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { Line } from 'react-chartjs-2';
import { AlertCircle, CalendarIcon, Search, ArrowUp, ArrowDown, Minus, Download, Upload, Filter, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { gscService, GSCDataPoint } from '@/lib/gscService';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { SubscriptionOverlay } from '@/components/SubscriptionOverlay';
import { RenewalOverlay } from '@/components/RenewalOverlay';
import { supabase } from '@/lib/supabase';

// Keyword history type
interface KeywordHistory {
  date: string;
  position: number;
  clicks: number;
  impressions: number;
}

// Keywords with history type
interface KeywordWithHistory {
  query: string;
  currentPosition: number;
  previousPosition: number;
  positionChange: number;
  clicks: number;
  impressions: number;
  history: KeywordHistory[];
}

// Modify the interfaces section
interface BaseKeyword {
  query: string;
  type: 'branded' | 'non-branded';
  intent: 'tofu' | 'mofu' | 'bofu';
  lastUpdated: string;
}

interface RankTrackerKeyword extends BaseKeyword {
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

interface WeeklyKeywordData extends BaseKeyword {
  weeklyPositions: { [key: string]: number | 'Not found' };
}

interface MonthlyKeywordData extends BaseKeyword {
  monthlyPositions: { [key: string]: number | 'Not found' };
}

type KeywordData = RankTrackerKeyword | WeeklyKeywordData | MonthlyKeywordData;

// Date range options
const DATE_RANGE_OPTIONS = [
  { label: 'Last 30 days', value: '30d' },
  { label: 'Last 60 days', value: '60d' },
  { label: 'Last 6 weeks', value: '6w' },
  { label: 'Last 12 weeks', value: '12w' },
  { label: 'Last 6 months', value: '6m' },
  { label: 'Last 12 months', value: '12m' }
];

// Keyword type options
const KEYWORD_TYPE_OPTIONS = [
  { label: 'All Keywords', value: 'all' },
  { label: 'Branded', value: 'branded' },
  { label: 'Non-Branded', value: 'non-branded' }
];

// Keyword intent options
const KEYWORD_INTENT_OPTIONS = [
  { label: 'All Intent', value: 'all' },
  { label: 'Top of Funnel (ToFu)', value: 'tofu' },
  { label: 'Middle of Funnel (MoFu)', value: 'mofu' },
  { label: 'Bottom of Funnel (BoFu)', value: 'bofu' }
];

// Country filter options
const COUNTRY_FILTER_OPTIONS = [
  { label: 'All Countries', value: 'all' }
  // Future-proofing: Add specific countries here if needed
  // { label: 'United States', value: 'USA' },
  // { label: 'United Kingdom', value: 'GBR' },
];

export default function RankTracker() {
  const { user, getGSCToken, getGSCProperty } = useAuth();
  const { subscriptionType, canTrackMoreKeywords, keywordLimit } = useSubscription();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState('30d');
  const [keywords, setKeywords] = useState<KeywordData[]>([]);
  const [selectedKeyword, setSelectedKeyword] = useState<RankTrackerKeyword | null>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calendarDate, setCalendarDate] = useState<Date | undefined>(new Date());
  const [newKeyword, setNewKeyword] = useState('');
  
  // Add view mode toggle state
  const [viewMode, setViewMode] = useState<'weekly' | 'monthly'>('weekly');
  
  // Filters
  const [keywordType, setKeywordType] = useState('all');
  const [keywordIntent, setKeywordIntent] = useState('all');
  const [countryFilter, setCountryFilter] = useState('all');
  const [availableCountries, setAvailableCountries] = useState<Array<{ label: string; value: string }>>([
    { label: 'All Countries', value: 'all' }
  ]);
  
  // Add pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Add new state for keyword count
  const [totalKeywords, setTotalKeywords] = useState(0);
  
  // Get branded keyword rules from localStorage
  const getBrandedKeywordRules = () => {
    const rules = localStorage.getItem('branded_keyword_rules');
    if (rules) {
      return JSON.parse(rules);
    }
    return [];
  };

  // Get keyword category regex patterns from localStorage
  const getKeywordCategoryPatterns = () => {
    const patterns = localStorage.getItem('keyword_category_patterns');
    if (patterns) {
      return JSON.parse(patterns);
    }
    return {
      tofu: [],
      mofu: [],
      bofu: []
    };
  };

  // Classify keyword as branded/non-branded
  const classifyKeywordType = (keyword: string) => {
    const rules = getBrandedKeywordRules();
    const lowerKeyword = keyword.toLowerCase();

    for (const rule of rules) {
      const value = rule.value.toLowerCase();
      switch (rule.type) {
        case 'contains':
          if (lowerKeyword.includes(value)) return 'branded';
          break;
        case 'starts_with':
          if (lowerKeyword.startsWith(value)) return 'branded';
          break;
        case 'exact_match':
          if (lowerKeyword === value) return 'branded';
          break;
        case 'ends_with':
          if (lowerKeyword.endsWith(value)) return 'branded';
          break;
      }
    }
    return 'non-branded';
  };

  // Classify keyword intent
  const classifyKeywordIntent = (keyword: string) => {
    const patterns = getKeywordCategoryPatterns();
    const lowerKeyword = keyword.toLowerCase();

    // Check ToFu patterns first
    for (const pattern of patterns.tofu) {
      try {
        const regex = new RegExp(pattern, 'i');
        if (regex.test(keyword)) return 'tofu';
      } catch (e) {
        // Invalid regex, skip
      }
    }

    // Check MoFu patterns
    for (const pattern of patterns.mofu) {
      try {
        const regex = new RegExp(pattern, 'i');
        if (regex.test(keyword)) return 'mofu';
      } catch (e) {
        // Invalid regex, skip
      }
    }

    // Check BoFu patterns
    for (const pattern of patterns.bofu) {
      try {
        const regex = new RegExp(pattern, 'i');
        if (regex.test(keyword)) return 'bofu';
      } catch (e) {
        // Invalid regex, skip
      }
    }

    return 'unknown';
  };

  // Get date range based on selected option
  const getDateRange = (option: string) => {
    const endDate = new Date();
    let startDate;

    switch (option) {
      case '30d':
        startDate = subDays(endDate, 29);
        break;
      case '60d':
        startDate = subDays(endDate, 59);
        break;
      case '6w':
        startDate = subWeeks(endDate, 6);
        break;
      case '12w':
        startDate = subWeeks(endDate, 12);
        break;
      case '6m':
        startDate = subMonths(endDate, 6);
        break;
      case '12m':
        startDate = subMonths(endDate, 12);
        break;
      default:
        startDate = subDays(endDate, 29);
    }

    return {
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd')
    };
  };

  // Fetch keyword data from GSC
  const fetchKeywordData = async () => {
    if (!getGSCProperty() || !getGSCToken()) {
      setError('Google Search Console not connected');
          setLoading(false);
          return;
        }
        
    try {
      setLoading(true);
      setError(null);
      const { startDate, endDate } = getDateRange(dateRange);
      const gscProperty = getGSCProperty()!;
      const token = getGSCToken()!;

      // Fetch available countries first
      try {
        const countries = await gscService.getAvailableCountries(gscProperty, startDate, endDate);
        if (countries && countries.length > 0) {
          setAvailableCountries([{ label: 'All Countries', value: 'all' }, ...countries.filter(c => c.value !== 'all')]);
        } else {
          setAvailableCountries([{ label: 'All Countries', value: 'all' }]);
        }
      } catch (countryError) {
        console.error('Failed to fetch available countries:', countryError);
        setAvailableCountries([{ label: 'All Countries', value: 'all' }]); // Default on error
      }

      const startDateObj = new Date(startDate);
      const endDateObj = new Date(endDate);

      // Common parameters for GSC API calls
      const gscApiParamsBase: any = {
        siteUrl: gscProperty,
        dimensions: ['query'],
        rowLimit: 25000,
      };

      if (countryFilter !== 'all') {
        gscApiParamsBase.searchType = 'web' as 'web'; 
        gscApiParamsBase.dataState = 'all';
        gscApiParamsBase.dimensionFilterGroups = [
          {
            filters: [
              {
                dimension: 'country',
                operator: 'equals',
                expression: countryFilter.toUpperCase(), // Use toUpperCase() as in Dashboard
              },
            ],
          },
        ];
      }

      // Use viewMode toggle instead of date range to determine data structure
      if (viewMode === 'monthly') {
        // Monthly intervals
        const months = eachMonthOfInterval({ start: startDateObj, end: endDateObj });
        
        const monthlyDataPromises = months.map(monthStart => {
          const monthEnd = endOfMonth(monthStart);
          return gscService.fetchSearchAnalyticsData({
            ...gscApiParamsBase,
            startDate: format(monthStart, 'yyyy-MM-dd'),
            endDate: format(monthEnd > endDateObj ? endDateObj : monthEnd, 'yyyy-MM-dd'),
          });
        });

        const monthlyDataResults = await Promise.all(monthlyDataPromises);
        const keywordMap = new Map<string, MonthlyKeywordData>();

        months.forEach((monthStart, monthIndex) => {
          const monthData = monthlyDataResults[monthIndex];
          const monthLabel = format(monthStart, 'MMM yyyy');

          monthData.forEach(item => {
            if (!item.query) return;

            if (!keywordMap.has(item.query)) {
              keywordMap.set(item.query, {
                query: item.query,
                type: classifyKeywordType(item.query) as 'branded' | 'non-branded',
                intent: classifyKeywordIntent(item.query) as 'tofu' | 'mofu' | 'bofu',
                monthlyPositions: {},
                lastUpdated: format(new Date(), 'yyyy-MM-dd')
              });
            }

            const keywordData = keywordMap.get(item.query)!;
            keywordData.monthlyPositions[monthLabel] = item.position;
          });

          // Mark missing keywords as "Not found" for this month
          keywordMap.forEach(keywordData => {
            if (!keywordData.monthlyPositions[monthLabel]) {
              keywordData.monthlyPositions[monthLabel] = 'Not found';
            }
          });
        });

        setKeywords(Array.from(keywordMap.values()));
      } else {
        // Weekly intervals
        const weeks = eachWeekOfInterval(
          { start: startDateObj, end: endDateObj },
          { weekStartsOn: 1 }
        );

        const weeklyDataPromises = weeks.map(weekStart => {
          const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
          return gscService.fetchSearchAnalyticsData({
            ...gscApiParamsBase,
            startDate: format(weekStart, 'yyyy-MM-dd'),
            endDate: format(weekEnd > endDateObj ? endDateObj : weekEnd, 'yyyy-MM-dd'),
          });
        });

        const weeklyDataResults = await Promise.all(weeklyDataPromises);
        const keywordMap = new Map<string, WeeklyKeywordData>();

        weeks.forEach((weekStart, weekIndex) => {
          const weekData = weeklyDataResults[weekIndex];
          const weekLabel = `${format(weekStart, 'MMM d')} - ${format(
            endOfWeek(weekStart, { weekStartsOn: 1 }),
            'MMM d'
          )}`;

          weekData.forEach(item => {
            if (!item.query) return;

            if (!keywordMap.has(item.query)) {
              keywordMap.set(item.query, {
                query: item.query,
                type: classifyKeywordType(item.query) as 'branded' | 'non-branded',
                intent: classifyKeywordIntent(item.query) as 'tofu' | 'mofu' | 'bofu',
                weeklyPositions: {},
                lastUpdated: format(new Date(), 'yyyy-MM-dd')
              });
            }

            const keywordData = keywordMap.get(item.query)!;
            keywordData.weeklyPositions[weekLabel] = item.position;
          });

          // Mark missing keywords as "Not found" for this week
          keywordMap.forEach(keywordData => {
            if (!keywordData.weeklyPositions[weekLabel]) {
              keywordData.weeklyPositions[weekLabel] = 'Not found';
            }
          });
        });

        setKeywords(Array.from(keywordMap.values()));
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch keyword data');
    } finally {
      setLoading(false);
    }
  };

  // Add new keyword
  const handleAddKeyword = async () => {
    if (!newKeyword.trim()) return;

    // Check if adding this keyword would exceed the limit
    if (!canTrackMoreKeywords(totalKeywords)) {
      if (subscriptionType === 'lifetime') {
        toast({
          title: "Keyword Limit Reached",
          description: "Upgrade to Monthly Pro Plan to track more than 100 keywords.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Keyword Limit Reached",
          description: "Upgrade your plan to track more keywords.",
          variant: "destructive",
        });
      }
      return;
    }

    try {
      const newKeywordObj: RankTrackerKeyword = {
        query: newKeyword.trim(),
        type: classifyKeywordType(newKeyword) as 'branded' | 'non-branded',
        intent: classifyKeywordIntent(newKeyword) as 'tofu' | 'mofu' | 'bofu',
        clicks: 0,
        impressions: 0,
        ctr: 0,
        position: 0,
        lastUpdated: format(new Date(), 'yyyy-MM-dd')
      };

      setKeywords(prev => [...prev, newKeywordObj]);
      setNewKeyword('');
      
      // Update total keywords count after successful addition
      setTotalKeywords(prev => prev + 1);
    } catch (error) {
      console.error('Error adding keyword:', error);
      toast({
        title: "Error",
        description: "Failed to add keyword",
        variant: "destructive",
      });
    }
  };

  // Handle CSV upload
  const handleCSVUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n');
      
      const newKeywords = lines
        .map(line => line.trim())
        .filter(line => line) // Remove empty lines
        .map(keyword => ({
          query: keyword,
          type: classifyKeywordType(keyword) as 'branded' | 'non-branded',
          intent: classifyKeywordIntent(keyword) as 'tofu' | 'mofu' | 'bofu',
          clicks: 0,
          impressions: 0,
          ctr: 0,
          position: 0,
          lastUpdated: format(new Date(), 'yyyy-MM-dd')
        }));

      setKeywords(prev => [...prev, ...newKeywords]);
    };
    reader.readAsText(file);
  };

  // Export keywords to CSV
  const exportCSV = () => {
    try {
      if (viewMode === 'monthly') {
        // Export monthly data
        const monthlyKeywords = keywords as MonthlyKeywordData[];
        if (!monthlyKeywords.length) {
          toast({
            title: "No data to export",
            description: "There are no keywords to export.",
            variant: "destructive",
          });
          return;
        }

        const monthLabels = 'monthlyPositions' in monthlyKeywords[0] ? Object.keys(monthlyKeywords[0].monthlyPositions) : [];
        const headers = ['Keyword', 'Type', 'Intent', ...monthLabels];
        const rows = monthlyKeywords.map(k => [
          k.query,
          k.type,
          k.intent,
          ...monthLabels.map(month => {
            const position = k.monthlyPositions[month];
            return position === 'Not found' ? 'Not found' : Number(position).toFixed(1);
          })
        ]);

        const csvContent = "data:text/csv;charset=utf-8,"
          + headers.join(",") + "\n"
          + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `rank_tracker_monthly_${format(new Date(), 'yyyyMMdd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

        toast({
          title: "Export successful",
          description: "Monthly ranking data has been exported to CSV.",
        });
      } else {
        // Export weekly data
        const weeklyKeywords = keywords as WeeklyKeywordData[];
        if (!weeklyKeywords.length) {
          toast({
            title: "No data to export",
            description: "There are no keywords to export.",
            variant: "destructive",
          });
          return;
        }

        const weekLabels = 'weeklyPositions' in weeklyKeywords[0] ? Object.keys(weeklyKeywords[0].weeklyPositions) : [];
        const headers = ['Keyword', 'Type', 'Intent', ...weekLabels];
        const rows = weeklyKeywords.map(k => [
          k.query,
          k.type,
          k.intent,
          ...weekLabels.map(week => {
            const position = k.weeklyPositions[week];
            return position === 'Not found' ? 'Not found' : Number(position).toFixed(1);
          })
        ]);

        const csvContent = "data:text/csv;charset=utf-8,"
          + headers.join(",") + "\n"
          + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `rank_tracker_weekly_${format(new Date(), 'yyyyMMdd')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast({
          title: "Export successful",
          description: "Weekly ranking data has been exported to CSV.",
        });
      }
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export failed",
        description: "There was an error exporting the data. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Filter keywords based on selected filters
  const filteredKeywords = keywords.filter(keyword => {
    // Type filter
    if (keywordType !== 'all' && keyword.type !== keywordType) return false;
    
    // Intent filter
    if (keywordIntent !== 'all' && keyword.intent !== keywordIntent) return false;
    
    // Search term filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return keyword.query.toLowerCase().includes(search);
    }
    
    return true;
  });

  // Initial data fetch
  useEffect(() => {
    fetchKeywordData();
  }, [dateRange, countryFilter, viewMode]);
  
  return (
    <DashboardLayout title="Rank Tracker" fullScreen={true}>
      <RenewalOverlay>
        <div className="w-full p-6 space-y-6">
          {/* Error Alert */}
          {error && (
            <Card className="border-red-700 bg-red-900/20">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-red-400">
                  <AlertCircle className="h-5 w-5" />
                  <p>{error}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Filters Row */}
          <SubscriptionOverlay featureName="rank_tracker_filters">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              <Select value={dateRange} onValueChange={(value) => { setDateRange(value); setCurrentPage(1); }}>
                <SelectTrigger className="w-full bg-gray-800 border-gray-700 text-gray-300">
                  <SelectValue placeholder="Select date range" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700 text-white">
                  {DATE_RANGE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value} className="hover:bg-gray-700">
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={countryFilter} onValueChange={(value) => { setCountryFilter(value); setCurrentPage(1); }}>
                <SelectTrigger className="w-full bg-gray-800 border-gray-700 text-gray-300">
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700 text-white">
                  {availableCountries.map((option, index) => (
                    <SelectItem key={`${option.value}-${index}`} value={option.value} className="hover:bg-gray-700">
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={keywordType} onValueChange={(value) => { setKeywordType(value); setCurrentPage(1); }}>
                <SelectTrigger className="w-full bg-gray-800 border-gray-700 text-gray-300">
                  <SelectValue placeholder="Keyword type" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700 text-white">
                  {KEYWORD_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value} className="hover:bg-gray-700">
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={keywordIntent} onValueChange={(value) => { setKeywordIntent(value); setCurrentPage(1); }}>
                <SelectTrigger className="w-full bg-gray-800 border-gray-700 text-gray-300">
                  <SelectValue placeholder="Keyword intent" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700 text-white">
                  {KEYWORD_INTENT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value} className="hover:bg-gray-700">
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </SubscriptionOverlay>
            
          {/* Active Filters Display */}
          <SubscriptionOverlay featureName="rank_tracker_filters">
            {(keywordType !== 'all' || keywordIntent !== 'all' || searchTerm || countryFilter !== 'all') && (
              <div className="mt-4 mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Filter className="h-4 w-4" />
                    <span className="text-sm">Active filters:</span>
                  </div>
                  
                  {/* Keyword Type Filter Tag */}
                  {keywordType !== 'all' && (
                    <Badge 
                      variant="outline" 
                      className="bg-blue-900/30 text-blue-400 border-blue-700 pl-2 pr-1 py-1 flex items-center gap-1"
                    >
                      {keywordType === 'branded' ? 'Branded' : 'Non-Branded'}
                      <button
                        onClick={() => setKeywordType('all')}
                        className="hover:bg-blue-800/50 rounded p-0.5 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  
                  {/* Keyword Intent Filter Tag */}
                  {keywordIntent !== 'all' && (
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "pl-2 pr-1 py-1 flex items-center gap-1",
                        keywordIntent === 'tofu' 
                          ? "bg-green-900/30 text-green-400 border-green-700"
                          : keywordIntent === 'mofu'
                          ? "bg-yellow-900/30 text-yellow-400 border-yellow-700"
                          : "bg-purple-900/30 text-purple-400 border-purple-700"
                      )}
                    >
                      {keywordIntent === 'tofu' 
                        ? 'Top of Funnel (ToFu)'
                        : keywordIntent === 'mofu'
                        ? 'Middle of Funnel (MoFu)'
                        : 'Bottom of Funnel (BoFu)'}
                      <button
                        onClick={() => setKeywordIntent('all')}
                        className={cn(
                          "hover:bg-opacity-50 rounded p-0.5 transition-colors",
                          keywordIntent === 'tofu'
                            ? "hover:bg-green-800/50"
                            : keywordIntent === 'mofu'
                            ? "hover:bg-yellow-800/50"
                            : "hover:bg-purple-800/50"
                        )}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  
                  {/* Country Filter Tag */}
                  {countryFilter !== 'all' && (
                    <Badge
                      variant="outline"
                      className="bg-indigo-900/30 text-indigo-400 border-indigo-700 pl-2 pr-1 py-1 flex items-center gap-1"
                    >
                      {availableCountries.find(opt => opt.value === countryFilter)?.label || countryFilter.toUpperCase()}
                      <button
                        onClick={() => { setCountryFilter('all'); setCurrentPage(1); }}
                        className="hover:bg-indigo-800/50 rounded p-0.5 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  
                  {/* Search Term Filter Tag */}
                  {searchTerm && (
                    <Badge 
                      variant="outline" 
                      className="bg-gray-800 text-gray-300 border-gray-600 pl-2 pr-1 py-1 flex items-center gap-1"
                    >
                      Search: "{searchTerm}"
                      <button
                        onClick={() => setSearchTerm('')}
                        className="hover:bg-gray-700/50 rounded p-0.5 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  
                  {/* Clear All Filters Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setKeywordType('all');
                      setKeywordIntent('all');
                      setSearchTerm('');
                      setCountryFilter('all');
                      setCurrentPage(1);
                    }}
                    className="ml-2 h-7 bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white"
                  >
                    Clear all
                  </Button>
                </div>
              </div>
            )}
          </SubscriptionOverlay>
            
          {/* Add Keyword Section */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Filter Keywords</CardTitle>
              <CardDescription className="text-gray-400">
                Search for specific keywords or add new ones
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Search Input */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search keywords..."
                      className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 pl-10"
                    />
                  </div>
                  {searchTerm && (
                    <Button
                      variant="outline"
                      onClick={() => setSearchTerm('')}
                      className="bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Keywords Table */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white">Tracked Keywords</CardTitle>
                  <CardDescription className="text-gray-400">
                    {viewMode === 'monthly' 
                      ? 'Monthly position tracking for your keywords'
                      : 'Weekly position tracking for your keywords'}
                  </CardDescription>
                </div>
                <SubscriptionOverlay featureName="rank_tracker_analytics">
                  <div className="flex items-center space-x-3">
                    <Label htmlFor="view-mode-toggle" className="text-sm text-gray-300">
                      Weekly
                    </Label>
                    <Switch
                      id="view-mode-toggle"
                      checked={viewMode === 'monthly'}
                      onCheckedChange={(checked) => {
                        setViewMode(checked ? 'monthly' : 'weekly');
                        setCurrentPage(1);
                      }}
                      className="data-[state=checked]:bg-blue-600"
                    />
                    <Label htmlFor="view-mode-toggle" className="text-sm text-gray-300">
                      Monthly
                    </Label>
                  </div>
                </SubscriptionOverlay>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="rounded-md border border-gray-700 animate-pulse">
                  <div className="h-60 bg-gray-700"></div>
                </div>
              ) : (
                <>
                  <div className="rounded-md border border-gray-700 overflow-hidden">
                    <div className="overflow-x-auto relative" style={{ WebkitOverflowScrolling: 'touch' }}>
                      <div className="min-w-full inline-block align-middle">
                        <div className="min-w-full">
                          <Table className="relative">
                            <TableHeader>
                                <TableRow className="border-gray-700">
                                  <TableHead 
                                    className="bg-gray-800 text-gray-300 w-[250px] min-w-[250px] sticky left-0 z-30 border-r border-gray-700 shadow-[2px_0_4px_rgba(0,0,0,0.3)]"
                                    style={{ position: 'sticky', left: 0 }}
                                  >
                                    Keyword
                                  </TableHead>
                                  {viewMode === 'monthly' ? (
                                    // Monthly view headers
                                    'monthlyPositions' in keywords[0] ? 
                                      Object.keys(keywords[0].monthlyPositions).map((monthLabel) => (
                                        <TableHead 
                                          key={monthLabel} 
                                          className="text-right text-gray-300 w-[120px] min-w-[120px] px-4 bg-gray-800"
                                        >
                                          <div className="flex flex-col items-center justify-center">
                                            <span>{monthLabel.split(' ')[0]}</span>
                                            <span>{monthLabel.split(' ')[1]}</span>
                                          </div>
                                        </TableHead>
                                      )) : []
                                  ) : (
                                    // Weekly view headers
                                    'weeklyPositions' in keywords[0] ? 
                                      Object.keys(keywords[0].weeklyPositions).map((weekLabel) => (
                                        <TableHead 
                                          key={weekLabel} 
                                          className="text-right text-gray-300 w-[150px] min-w-[150px] px-4 bg-gray-800"
                                        >
                                          <div className="flex flex-col items-center justify-center">
                                            <span>{weekLabel.split(' - ')[0]}</span>
                                            <span>{weekLabel.split(' - ')[1]}</span>
                                          </div>
                                        </TableHead>
                                      )) : []
                                  )}
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredKeywords.length > 0 ? (
                                  filteredKeywords
                                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                                    .map((keyword, index) => (
                                      <TableRow key={index} className="border-gray-700">
                                        <TableCell 
                                          className="bg-gray-800 font-medium text-white sticky left-0 z-20 border-r border-gray-700 shadow-[2px_0_4px_rgba(0,0,0,0.3)] max-w-[250px] w-[250px] min-w-[250px]"
                                          style={{ position: 'sticky', left: 0 }}
                                          title={keyword.query}
                                        >
                                          <div className="truncate pr-2">
                                            {keyword.query}
                                          </div>
                                        </TableCell>
                                        {viewMode === 'monthly' ? (
                                          // Monthly view cells
                                          'monthlyPositions' in keyword ?
                                            Object.entries(keyword.monthlyPositions).map(([monthLabel, position]) => (
                                              <TableCell 
                                                key={monthLabel} 
                                                className={cn(
                                                  "text-center w-[120px] min-w-[120px] px-4 bg-gray-900",
                                                  position === 'Not found' ? 'text-gray-500' : 
                                                  typeof position === 'number' && position <= 3 ? 'text-green-400' :
                                                  typeof position === 'number' && position <= 10 ? 'text-blue-400' :
                                                  'text-gray-300'
                                                )}
                                              >
                                                {position === 'Not found' ? '–' : Number(position).toFixed(1)}
                                              </TableCell>
                                            )) : null
                                        ) : (
                                          // Weekly view cells
                                          'weeklyPositions' in keyword ?
                                            Object.entries(keyword.weeklyPositions).map(([weekLabel, position]) => (
                                              <TableCell 
                                                key={weekLabel} 
                                                className={cn(
                                                  "text-center w-[150px] min-w-[150px] px-4 bg-gray-900",
                                                  position === 'Not found' ? 'text-gray-500' : 
                                                  typeof position === 'number' && position <= 3 ? 'text-green-400' :
                                                  typeof position === 'number' && position <= 10 ? 'text-blue-400' :
                                                  'text-gray-300'
                                                )}
                                              >
                                                {position === 'Not found' ? '–' : Number(position).toFixed(1)}
                                              </TableCell>
                                            )) : null
                                        )}
                                      </TableRow>
                                    ))
                                ) : (
                                  <TableRow>
                                    <TableCell 
                                      className="bg-gray-800 text-center py-10 text-gray-400 sticky left-0 z-20 border-r border-gray-700 shadow-[2px_0_4px_rgba(0,0,0,0.3)] w-[250px] min-w-[250px]"
                                      style={{ position: 'sticky', left: 0 }}
                                    >
                                      {loading ? "Loading..." : "No keywords"}
                                    </TableCell>
                                    <TableCell 
                                      colSpan={
                                        viewMode === 'monthly'
                                          ? (keywords.length > 0 && 'monthlyPositions' in keywords[0] ? Object.keys(keywords[0].monthlyPositions).length : 6)
                                          : (keywords.length > 0 && 'weeklyPositions' in keywords[0] ? Object.keys(keywords[0].weeklyPositions).length : 4)
                                      } 
                                      className="text-center py-10 text-gray-400 bg-gray-900"
                                    >
                                      {loading ? "Loading keywords..." : "No keywords found. Add some keywords to start tracking."}
                                    </TableCell>
                                </TableRow>
                                )}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Export/Import Buttons */}
                  <SubscriptionOverlay featureName="rank_tracker_export">
                    <div className="flex gap-2 xl:col-start-5 mt-4">
                      <Button
                        variant="outline"
                        onClick={exportCSV}
                        className="flex-1 bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-blue-300"
                      >
                        <Download className="h-4 w-4 mr-2" /> Export
                      </Button>
                      <div className="relative">
                        <input
                          type="file"
                          accept=".csv"
                          onChange={handleCSVUpload}
                          className="hidden"
                          id="csv-upload"
                        />
                        <Button
                          variant="outline"
                          onClick={() => document.getElementById('csv-upload')?.click()}
                          className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-green-300"
                        >
                          <Upload className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </SubscriptionOverlay>

                  {/* Pagination Controls */}
                  {filteredKeywords.length > 0 && (
                    <div className="mt-4 flex items-center justify-between px-2">
                      <div className="text-sm text-gray-400">
                        Showing {Math.min((currentPage - 1) * itemsPerPage + 1, filteredKeywords.length)} to{' '}
                        {Math.min(currentPage * itemsPerPage, filteredKeywords.length)} of{' '}
                        {filteredKeywords.length} keywords
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                          className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="text-sm text-gray-400">
                          Page {currentPage} of {Math.ceil(filteredKeywords.length / itemsPerPage)}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.min(Math.ceil(filteredKeywords.length / itemsPerPage), prev + 1))}
                          disabled={currentPage >= Math.ceil(filteredKeywords.length / itemsPerPage)}
                          className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </RenewalOverlay>
    </DashboardLayout>
  );
} 