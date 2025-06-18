import { useState, useEffect, createContext, useContext, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, subDays, subMonths, subWeeks, addDays, parseISO, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, isWithinInterval, getMonth, getYear, startOfDay, isValid, differenceInDays } from 'date-fns';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend as RechartsLegend,
  Cell,
  LabelList
} from 'recharts';
import {
  AlertCircle,
  TrendingUp,
  TrendingDown,
  MousePointerClick,
  Eye,
  ArrowUpRight,
  Calendar as CalendarIcon,
  Download,
  ChevronDown,
  Filter,
  Settings,
  ChevronLeft,
  ChevronRight,
  X,
  Share2 // Added Share2 icon
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { gscService, GSCDataPoint } from '@/lib/gscService';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from '@/components/ui/badge';
import { GSCTester } from '@/components/GSCTester';
import { ShareReportModal } from '@/components/ShareReportModal';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { GSCService } from '@/lib/gscService';
import { PROPERTY_CHANGE_EVENT } from '@/components/PropertySelector';
import { RenewalOverlay } from '@/components/RenewalOverlay';

const PERFORMANCE_TREND_GRANULARITY_OPTIONS = [
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' }
];

// Dashboard state context
interface DashboardContextType {
  dateRange: {
    startDate: string;
    endDate: string;
  };
  comparisonRange: {
    startDate: string;
    endDate: string;
  };
  selectedRange: string;
  setSelectedRange: (range: string) => void;
  chartGranularity: string;
  setChartGranularity: (granularity: string) => void;
  chartMetric: string;
  setChartMetric: (metric: string) => void;
  keywordTypeFilter: string;
  setKeywordTypeFilter: (type: string) => void;
  keywordCategoryFilter: string;
  setKeywordCategoryFilter: (category: string) => void;
  countryFilter: string;
  setCountryFilter: (country: string) => void;
  deviceFilter: string;
  setDeviceFilter: (device: string) => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
};

// Define date range options
const DATE_RANGES = [
  { label: 'Last 7 days', value: '7d', days: 7 },
  { label: 'Last 28 days', value: '28d', days: 28 },
  { label: 'Last 30 days', value: '30d', days: 30 },
  { label: 'Last 60 days', value: '60d', days: 60 },
  { label: 'Last 90 days', value: '90d', days: 90 },
  { label: 'Last 180 days', value: '180d', days: 180 },
  { label: 'Last 365 days', value: '365d', days: 365 },
  { label: 'Last 16 months', value: '16m', days: 487 },
  { label: 'Custom date range', value: 'custom' }
];

// Time granularity options for charts
const TIME_GRANULARITY = [
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' }
];

// Metric options for charts
const CHART_METRICS = [
  { label: 'All', value: 'all' },
  { label: 'Clicks', value: 'clicks' },
  { label: 'Impressions', value: 'impressions' },
  { label: 'CTR', value: 'ctr' },
  { label: 'Average Position', value: 'position' }
];

// Keyword type filter options
const KEYWORD_TYPE_OPTIONS = [
  { label: 'All Keywords', value: 'all' },
  { label: 'Branded', value: 'branded' },
  { label: 'Non-Branded', value: 'non-branded' }
];

// Keyword category filter options  
const KEYWORD_CATEGORY_OPTIONS = [
  { label: 'All Categories', value: 'all' },
  { label: 'ToFu (Top of Funnel)', value: 'tofu' },
  { label: 'MoFu (Middle of Funnel)', value: 'mofu' },
  { label: 'BoFu (Bottom of Funnel)', value: 'bofu' }
];

// Country filter options - This will be replaced with dynamic data
const COUNTRY_OPTIONS = [{ label: 'All Countries', value: 'all' }];

// Device filter options
const DEVICE_OPTIONS = [
  { label: 'All Devices', value: 'all' },
  { label: 'Desktop', value: 'desktop' },
  { label: 'Mobile', value: 'mobile' },
  { label: 'Tablet', value: 'tablet' }
];

// Process GSC data for keyword ranking distribution
const processGSCDataForKeywordRanking = (data: GSCDataPoint[], timeView: '6m' | '12m') => {
  // Initialize result objects
  const positionRanges = [
    { name: 'Top 3', min: 1, max: 3, value: 0 },
    { name: 'Position 4-10', min: 4, max: 10, value: 0 },
    { name: 'Position 11-20', min: 11, max: 20, value: 0 },
    { name: 'Position 21-50', min: 21, max: 50, value: 0 },
    { name: 'Position 50+', min: 51, max: Infinity, value: 0 }
  ];

  // Group data by month using sortable format for keys
  const monthlyData: Record<string, { data: GSCDataPoint[], displayName: string }> = {};
  data.forEach(item => {
    if (!item.date) return;
    const date = parseISO(item.date);
    const monthKey = format(date, 'yyyy-MM'); // Sortable format for key
    const monthDisplay = format(date, 'MMM yyyy'); // Display format
    
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = {
        data: [],
        displayName: monthDisplay
      };
    }
    monthlyData[monthKey].data.push(item);
  });

  // Get the latest month's data for overall distribution
  const sortedMonthKeys = Object.keys(monthlyData).sort((a, b) => b.localeCompare(a));
  const latestMonthKey = sortedMonthKeys[0];
  const latestData = latestMonthKey ? monthlyData[latestMonthKey].data : [];

  // Calculate overall distribution for the latest month
  const overall = positionRanges.map(range => {
    const count = latestData.filter(item => 
      item.position >= range.min && item.position <= range.max
    ).length;
    return { name: range.name, value: count };
  });

  // Calculate monthly breakdown for top positions and sort chronologically
  const breakdown = Object.entries(monthlyData)
    .map(([monthKey, { data, displayName }]) => ({
      monthKey,
      displayName,
      top3: data.filter(item => item.position <= 3).length,
      top4_10: data.filter(item => item.position > 3 && item.position <= 10).length
    }))
    .sort((a, b) => a.monthKey.localeCompare(b.monthKey)) // Sort chronologically
    .map(({ displayName, top3, top4_10 }) => ({
      month: displayName,
      top3,
      top4_10
    }));

  return { overall, breakdown };
};

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

// Classify keyword category
const classifyKeywordCategory = (keyword: string) => {
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

// Add this helper function before the Dashboard component
const formatDomainForTitle = (gscProperty: string): string => {
  if (!gscProperty) return '';
  // Extract domain name from sc-domain: prefix and remove .com
  const domain = gscProperty.replace('sc-domain:', '').replace('.com', '');
  // Capitalize first letter
  return domain.charAt(0).toUpperCase() + domain.slice(1);
};

// Add helper function to get metric color
const getMetricColor = (metric: string): string => {
  switch (metric) {
    case 'clicks':
      return '#1f77b4';
    case 'impressions':
      return '#2ca02c';
    case 'ctr':
      return '#ff7f0e';
    case 'position':
      return '#d62728';
    default:
      return '#000000';
  }
};

const getMetricAxis = (metric: string): 'left' | 'right' => {
  switch (metric) {
    case 'clicks':
    case 'impressions':
      return 'left';
    case 'ctr':
    case 'position':
      return 'right';
    default:
      return 'left';
  }
};

interface AggregatedMetrics {
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

interface AggregatedDataPoint {
  sum: AggregatedMetrics;
  count: number;
  dateObject: Date;
}

interface ProcessedDataPoint {
  name: string;
  sortDate: number;
  dateObject: Date;
  clicks?: number;
  impressions?: number;
  ctr?: number;
  position?: number;
  clicksPrev?: number;
  impressionsPrev?: number;
  ctrPrev?: number;
  positionPrev?: number;
  [key: string]: string | number | Date | undefined;
}

interface ProcessedDataReturn {
  name: string;
  [key: string]: string | number;
}

const getPerformanceTrendDateRangeInternal = (granularity: string) => {
  if (granularity === 'daily') {
    const endDate = new Date();
    const startDate = subDays(endDate, 11); // 12 days total (11 days back + current day)
    return { 
      startDate: format(startOfDay(startDate), 'yyyy-MM-dd'), 
      endDate: format(endDate, 'yyyy-MM-dd') 
    };
  } else if (granularity === 'weekly') {
    const endDate = new Date();
    const startDate = subWeeks(endDate, 11); // 12 weeks total
    return { 
      startDate: format(startDate, 'yyyy-MM-dd'), 
      endDate: format(endDate, 'yyyy-MM-dd') 
    };
  } else { // monthly
    const endDate = new Date();
    const startDate = subMonths(endDate, 24); // Get 25 months of data for comparison
    return { 
      startDate: format(startDate, 'yyyy-MM-dd'), 
      endDate: format(endDate, 'yyyy-MM-dd') 
    };
  }
};

const processGSCDataForPerformanceTrends = (
  rawData: GSCDataPoint[], 
  granularity: string, 
  metric: string
): Array<ProcessedDataReturn> => {
  if (!rawData || rawData.length === 0) {
    console.warn('No raw data provided to process');
    return [];
  }

  console.log('Processing data with params:', { granularity, metric });

  const aggregatedData: Record<string, AggregatedDataPoint> = {};
  
  // First, aggregate the data by date
  rawData.forEach(item => {
    if (!item.date) {
      console.warn('Item missing date:', item);
      return;
    }

    const date = parseISO(item.date);
    if (!isValid(date)) {
      console.warn('Invalid date:', item.date);
      return;
    }
    
    let key = '';
    if (granularity === 'daily') {
      key = format(date, 'yyyy-MM-dd');
    } else if (granularity === 'weekly') {
      key = format(startOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    } else { // monthly
      key = format(date, 'yyyy-MM');
    }

    if (!aggregatedData[key]) {
      aggregatedData[key] = {
        sum: { clicks: 0, impressions: 0, ctr: 0, position: 0 },
        count: 0,
        dateObject: date
      };
    }
    
    aggregatedData[key].sum.clicks += item.clicks || 0;
    aggregatedData[key].sum.impressions += item.impressions || 0;
    aggregatedData[key].sum.ctr += item.ctr || 0;
    aggregatedData[key].sum.position += item.position || 0;
    aggregatedData[key].count++;
  });

  console.log('Aggregated data points:', Object.keys(aggregatedData).length);

  // Convert aggregated data to array and sort by date
  let processedData = Object.entries(aggregatedData)
    .map(([key, values]): ProcessedDataPoint => {
      const baseData = {
        name: granularity === 'daily' ? format(values.dateObject, 'MMM dd') :
              granularity === 'weekly' ? `W/${format(values.dateObject, 'MMM dd')}` :
              format(values.dateObject, 'MMM yyyy'),
        sortDate: values.dateObject.getTime(),
        dateObject: values.dateObject
      };

      if (metric === 'all') {
        return {
          ...baseData,
          clicks: values.sum.clicks,
          impressions: values.sum.impressions,
          ctr: values.count > 0 ? (values.sum.ctr / values.count) * 100 : 0,
          position: values.count > 0 ? values.sum.position / values.count : 0
        };
      } else {
        const metricKey = metric as keyof AggregatedMetrics;
        let value = values.sum[metricKey];
        if (metric === 'ctr' || metric === 'position') {
          value = values.count > 0 ? value / values.count : 0;
        }
        if (metric === 'ctr') value *= 100;
        return {
          ...baseData,
          [metric]: value
        };
      }
    })
    .sort((a, b) => a.sortDate - b.sortDate);

  console.log('Initial processed data length:', processedData.length);

  if (granularity === 'monthly') {
    // Get the current date and calculate ranges
    const now = new Date();
    const twelveMonthsAgo = subMonths(now, 12); // Changed from 11 to 12 to get full 12 months
    const twentyFourMonthsAgo = subMonths(now, 24); // Changed from 23 to 24 to get full 12 months for comparison

    // Filter for current year's data (last 12 months)
    const currentYearData = processedData.filter(d => 
      d.dateObject >= twelveMonthsAgo && d.dateObject <= now
    );

    // Filter for previous year's data (12 months before the current range)
    const previousYearData = processedData.filter(d => 
      d.dateObject >= twentyFourMonthsAgo && d.dateObject < twelveMonthsAgo
    );

    // Add previous period data as comparison by matching month
    currentYearData.forEach((data) => {
      // Find matching month from previous year
      const currentMonth = format(data.dateObject, 'MM');
      const previousYearMatch = previousYearData.find(prev => 
        format(prev.dateObject, 'MM') === currentMonth
      );

      if (previousYearMatch) {
        if (metric === 'all') {
          data.clicksPrev = previousYearMatch.clicks;
          data.impressionsPrev = previousYearMatch.impressions;
          data.ctrPrev = previousYearMatch.ctr;
          data.positionPrev = previousYearMatch.position;
        } else {
          data[`${metric}Prev`] = previousYearMatch[metric];
        }
      }
    });

    processedData = currentYearData;
  } else if (granularity === 'weekly' && metric !== 'all') {
    // Keep existing logic for weekly comparison
    for (let i = 1; i < processedData.length; i++) {
      processedData[i][`${metric}Prev`] = processedData[i - 1][metric];
    }
  }

  // Remove the dateObject and sortDate from final output
  const finalData = processedData.map(({ dateObject, sortDate, ...rest }) => {
    const result: ProcessedDataReturn = { name: rest.name };
    Object.entries(rest).forEach(([key, value]) => {
      if (typeof value === 'string' || typeof value === 'number') {
        result[key] = value;
      }
    });
    return result;
  });

  console.log('Final processed data:', finalData);
  return finalData;
};

// Add at the top of the file, after imports
const getRankingDistributionDateRangeInternal = (timeView: '6m' | '12m') => {
  const endDate = new Date();
  const startDate = timeView === '6m' ? 
    subMonths(endDate, 5) : // For 6 months view
    subMonths(endDate, 11); // For 12 months view
  return { 
    startDate: format(startDate, 'yyyy-MM-dd'), 
    endDate: format(endDate, 'yyyy-MM-dd') 
  };
};

// Add utility functions at the top of the file
const getDateRangeFromPreset = (preset: string): { startDate: string; endDate: string } => {
  const endDate = new Date();
  let startDate: Date;

  switch (preset) {
    case '7d':
      startDate = subDays(endDate, 6);
      break;
    case '28d':
      startDate = subDays(endDate, 27);
      break;
    case '30d':
      startDate = subDays(endDate, 29);
      break;
    case '60d':
      startDate = subDays(endDate, 59);
      break;
    case '90d':
      startDate = subDays(endDate, 89);
      break;
    case '180d':
      startDate = subDays(endDate, 179);
      break;
    case '365d':
      startDate = subDays(endDate, 364);
      break;
    case '16m':
      startDate = subMonths(endDate, 16);
      break;
    default:
      startDate = subDays(endDate, 27); // Default to 28 days
  }

  return {
    startDate: format(startDate, 'yyyy-MM-dd'),
    endDate: format(endDate, 'yyyy-MM-dd')
  };
};

const getComparisonDateRange = (currentRange: { startDate: string; endDate: string }): { startDate: string; endDate: string } => {
  const currentStartDate = parseISO(currentRange.startDate);
  const currentEndDate = parseISO(currentRange.endDate);
  const daysDiff = differenceInDays(currentEndDate, currentStartDate);

  const comparisonEndDate = subDays(currentStartDate, 1);
  const comparisonStartDate = subDays(comparisonEndDate, daysDiff);

  return {
    startDate: format(comparisonStartDate, 'yyyy-MM-dd'),
    endDate: format(comparisonEndDate, 'yyyy-MM-dd')
  };
};

export default function Dashboard() {
  const { user, getGSCToken, getGSCProperty } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false); // State for modal visibility
  const [isPropertySwitching, setIsPropertySwitching] = useState(false); // New state for property switching

  // Add state for available countries
  const [availableCountries, setAvailableCountries] = useState<Array<{ label: string; value: string }>>([
    { label: 'All Countries', value: 'all' }
  ]);

  // Derived values from auth
  const isConnected = !!getGSCToken();
  const gscProperty = getGSCProperty();
  const token = getGSCToken();

  // Add new state for selected URL filter
  const [selectedUrlFilter, setSelectedUrlFilter] = useState<string | null>(null);

  // Global Filters State
  const [dateRange, setDateRange] = useState(() => {
    const savedDateRange = localStorage.getItem('dashboard_date_range');
    if (savedDateRange) {
      return JSON.parse(savedDateRange);
    }
    const endDate = new Date();
    const startDate = subDays(endDate, 27); // Default to Last 28 days
    return {
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd'),
    };
  });

  const [selectedRange, setSelectedRange] = useState(() => {
    return localStorage.getItem('dashboard_selected_range') || '28d';
  });

  const [keywordTypeFilter, setKeywordTypeFilter] = useState(() => {
    return localStorage.getItem('dashboard_keyword_type_filter') || 'all';
  });

  const [keywordCategoryFilter, setKeywordCategoryFilter] = useState(() => {
    return localStorage.getItem('dashboard_keyword_category_filter') || 'all';
  });

  const [countryFilter, setCountryFilter] = useState(() => {
    return localStorage.getItem('dashboard_country_filter') || 'all';
  });

  const [deviceFilter, setDeviceFilter] = useState(() => {
    return localStorage.getItem('dashboard_device_filter') || 'all';
  });

  // Save filters to localStorage when they change
  useEffect(() => {
    localStorage.setItem('dashboard_date_range', JSON.stringify(dateRange));
    localStorage.setItem('dashboard_selected_range', selectedRange);
    localStorage.setItem('dashboard_keyword_type_filter', keywordTypeFilter);
    localStorage.setItem('dashboard_keyword_category_filter', keywordCategoryFilter);
    localStorage.setItem('dashboard_country_filter', countryFilter);
    localStorage.setItem('dashboard_device_filter', deviceFilter);
  }, [dateRange, selectedRange, keywordTypeFilter, keywordCategoryFilter, countryFilter, deviceFilter]);

  // Update the date range handler to work with localStorage
  const handleDateRangeChange = (value: string) => {
    setSelectedRange(value);
    if (value !== 'custom') {
      const range = getDateRangeFromPreset(value);
      setDateRange(range);
      setComparisonRange(getComparisonDateRange(range));
      // Reset to first page when changing date range
      setCurrentKeywordPage(1);
    }
  };

  const [comparisonRange, setComparisonRange] = useState(() => {
    const currentEndDate = parseISO(dateRange.endDate);
    const currentStartDate = parseISO(dateRange.startDate);
    const diffDays = (currentEndDate.getTime() - currentStartDate.getTime()) / (1000 * 3600 * 24) + 1;
    return {
      startDate: format(subDays(currentStartDate, diffDays), 'yyyy-MM-dd'),
      endDate: format(subDays(currentEndDate, diffDays), 'yyyy-MM-dd'),
    };
  });
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calendarDate, setCalendarDate] = useState<Date | undefined>(new Date());

  // Data states for global filters
  const [metrics, setMetrics] = useState({ totalClicks: 0, totalImpressions: 0, avgCtr: 0, avgPosition: 0, clicksChange: 0, impressionsChange: 0, ctrChange: 0, positionChange: 0 });
  const [topQueries, setTopQueries] = useState<any[]>([]);
  const [topPages, setTopPages] = useState<any[]>([]);

  // State for Performance Trends (independent of global date filter)
  const [performanceTrendGranularity, setPerformanceTrendGranularity] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [chartMetric, setChartMetric] = useState('clicks'); // Reusing existing state
  const [performanceTrendData, setPerformanceTrendData] = useState<Array<{ name: string;[key: string]: number | string }>>([]);
  const [isPerformanceTrendLoading, setIsPerformanceTrendLoading] = useState(false);
  const [performanceTrendError, setPerformanceTrendError] = useState<string | null>(null);

  // State for New Keyword Ranking Distribution Section
  const [rankingTimeView, setRankingTimeView] = useState<'6m' | '12m'>('6m');
  const [overallRankingData, setOverallRankingData] = useState<Array<{ name: string; value: number }>>([]);
  const [positionBreakdownData, setPositionBreakdownData] = useState<Array<{ month: string; top3: number; top4_10: number }>>([]);
  const [isRankingDataLoading, setIsRankingDataLoading] = useState(false);
  const [rankingDataError, setRankingDataError] = useState<string | null>(null);

  // Add pagination state for Top Keywords
  const [currentKeywordPage, setCurrentKeywordPage] = useState(1);
  const keywordsPerPage = 10;

  // URL Analysis State
  const [urlAnalysisInput, setUrlAnalysisInput] = useState('');
  const [analyzedUrls, setAnalyzedUrls] = useState<string[]>([]);
  const [urlAnalysisData, setUrlAnalysisData] = useState<any[]>([]);
  const [isUrlAnalysisLoading, setIsUrlAnalysisLoading] = useState(false);
  const [urlAnalysisError, setUrlAnalysisError] = useState<string | null>(null);

  // Add property change listener
  useEffect(() => {
    const handlePropertyChange = async (event: CustomEvent) => {
      const { property, isInitial } = event.detail;
      
      if (isInitial) {
        // Initial property set, no need to show switching state
        return;
      }
      
      console.log('[Dashboard] Property changed to:', property);
      setIsPropertySwitching(true);
      
      // Reset filters that might not be valid for the new property
      setCountryFilter('all');
      setDeviceFilter('all');
      setSelectedUrlFilter(null);
      setUrlAnalysisInput('');
      setAnalyzedUrls([]);
      setUrlAnalysisData([]);
      
      // Small delay to ensure UI updates are visible
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // The main data fetching useEffect will handle the actual data refresh
      // since gscProperty will be updated via getGSCProperty()
    };

    window.addEventListener(PROPERTY_CHANGE_EVENT, handlePropertyChange as EventListener);
    
    return () => {
      window.removeEventListener(PROPERTY_CHANGE_EVENT, handlePropertyChange as EventListener);
    };
  }, []);

  // Consolidated useEffect for data fetching
  useEffect(() => {
    let mounted = true;
    
    const fetchAllDashboardData = async () => {
      if (!gscProperty || !isConnected || !token) {
        setLoading(false);
        setIsPropertySwitching(false);
        return;
      }

      // Set loading states
      setLoading(true);
      setIsPerformanceTrendLoading(true);
      setIsRankingDataLoading(true);
      setError(null);
      setPerformanceTrendError(null);
      setRankingDataError(null);

      try {
        // Fetch available countries first
        console.log('[Dashboard] useEffect: Attempting to fetch available countries.');
        console.log('[Dashboard] useEffect: GSC Property:', gscProperty, 'Token available:', !!token);
        console.log('[Dashboard] useEffect: Date range for country fetch:', dateRange.startDate, 'to', dateRange.endDate);

        if (!gscProperty || !token || !dateRange.startDate || !dateRange.endDate) {
          console.warn('[Dashboard] useEffect: Missing gscProperty, token, or valid dateRange for fetching countries. Setting default countries.');
          if (mounted) setAvailableCountries([{ label: 'All Countries', value: 'all' }]);
        } else {
          const countries = await gscService.getAvailableCountries(gscProperty, dateRange.startDate, dateRange.endDate);
          console.log('[Dashboard] useEffect: Fetched countries raw response from gscService:', JSON.parse(JSON.stringify(countries)));
          if (mounted) {
            if (countries && countries.length > 0) {
              setAvailableCountries(countries);
              console.log('[Dashboard] useEffect: Successfully updated availableCountries state.');
            } else {
              setAvailableCountries([{ label: 'All Countries', value: 'all' }]);
              console.warn('[Dashboard] useEffect: Fetched countries list from gscService was empty or invalid. Defaulting to \"All Countries\".');
            }
          }
        }
        // End of country fetching logic

        // Prepare common filters for main data fetching
        const filters = [];
        if (selectedUrlFilter) {
          const urlFilterExpression = selectedUrlFilter.startsWith('http') ? selectedUrlFilter : `https://${gscProperty}${selectedUrlFilter.startsWith('/') ? selectedUrlFilter : '/' + selectedUrlFilter}`;
          const urlFilter = {
            dimension: 'page',
            operator: 'equals',
            expression: urlFilterExpression
          };
          console.log('[Dashboard] Adding URL filter:', urlFilter);
          filters.push(urlFilter);
        }
        if (countryFilter !== 'all') {
          filters.push({
            dimension: 'country',
            operator: 'equals',
            expression: countryFilter.toUpperCase()
          });
        }
        if (deviceFilter !== 'all') {
          filters.push({
            dimension: 'device',
            operator: 'equals',
            expression: deviceFilter.toLowerCase()
          });
        }

        console.log('[Dashboard] Combined filters for main data fetch:', filters);
        const dimensionFilterGroups = filters.length > 0 ? [{ filters }] : undefined;

        // Fetch all data in parallel with proper date ranges
        const [
          queryDataForCurrentPeriod,
          queryDataForComparisonPeriod,
          trendData,
          rankingData,
          pageDataForCurrentPeriod,
          pageDataForComparisonPeriod
        ] = await Promise.all([
          gscService.fetchSearchAnalyticsData({
            siteUrl: gscProperty,
            startDate: dateRange.startDate,
            endDate: dateRange.endDate,
            dimensions: ['query', 'page'],
            rowLimit: 25000,
            dimensionFilterGroups
          }),
          gscService.fetchSearchAnalyticsData({
            siteUrl: gscProperty,
            startDate: comparisonRange.startDate,
            endDate: comparisonRange.endDate,
            dimensions: ['query', 'page'],
            rowLimit: 25000,
            dimensionFilterGroups
          }),
          gscService.fetchSearchAnalyticsData({
            siteUrl: gscProperty,
            ...getPerformanceTrendDateRangeInternal(performanceTrendGranularity),
            dimensions: ['date'],
            rowLimit: 25000,
            dimensionFilterGroups // Apply global filters
          }),
          gscService.fetchSearchAnalyticsData({
            siteUrl: gscProperty,
            ...getRankingDistributionDateRangeInternal(rankingTimeView),
            dimensions: ['query', 'date', 'page', 'country', 'device'],
            rowLimit: 25000,
            dimensionFilterGroups // Apply global filters
          }),
          gscService.fetchSearchAnalyticsData({
            siteUrl: gscProperty,
            startDate: dateRange.startDate,
            endDate: dateRange.endDate,
            dimensions: ['page'],
            rowLimit: 25000,
            dimensionFilterGroups
          }),
          gscService.fetchSearchAnalyticsData({
            siteUrl: gscProperty,
            startDate: comparisonRange.startDate,
            endDate: comparisonRange.endDate,
            dimensions: ['page'],
            rowLimit: 25000,
            dimensionFilterGroups
          })
        ]);

        if (!mounted) return;

        const processAndFilterQueries = (data: GSCDataPoint[]) => {
          return data
            .filter(item => item.query)
            .map(item => ({
              ...item,
              type: classifyKeywordType(item.query || ''),
              intent: classifyKeywordCategory(item.query || '')
            }))
            .filter(item => {
              const matchesType = keywordTypeFilter === 'all' || item.type === keywordTypeFilter;
              const matchesCategory = keywordCategoryFilter === 'all' || item.intent === keywordCategoryFilter;
              return matchesType && matchesCategory;
            });
        };

        const processedPageTableData = pageDataForCurrentPeriod
          .filter(item => item.page)
          .sort((a, b) => (b.clicks || 0) - (a.clicks || 0))
          .slice(0, 10);
        setTopPages(processedPageTableData);

        const filteredQueries = processAndFilterQueries(queryDataForCurrentPeriod)
          .sort((a, b) => (b.clicks || 0) - (a.clicks || 0));
        setTopQueries(filteredQueries);
        setCurrentKeywordPage(1);

        let currentMetricsForDisplay: AggregatedMetrics;
        let comparisonMetricsForDisplay: AggregatedMetrics;
        const calculateChange = (current: number, previous: number) => {
          if (previous === 0) return current > 0 ? 100 : 0; 
          if (current === 0 && previous === 0) return 0; 
          return ((current - previous) / previous) * 100;
        };
        
        const defaultMetrics: AggregatedMetrics = { clicks: 0, impressions: 0, ctr: 0, position: 0 };

        if (selectedUrlFilter) {
          const targetUrl = selectedUrlFilter.startsWith('http') ? selectedUrlFilter : `https://${gscProperty}${selectedUrlFilter}`;
          const currentFilteredPageData = pageDataForCurrentPeriod.find(p => p.page === targetUrl);
          const comparisonFilteredPageData = pageDataForComparisonPeriod.find(p => p.page === targetUrl);

          currentMetricsForDisplay = currentFilteredPageData ? 
            { clicks: currentFilteredPageData.clicks, impressions: currentFilteredPageData.impressions, ctr: currentFilteredPageData.ctr, position: currentFilteredPageData.position } 
            : defaultMetrics;
          
          comparisonMetricsForDisplay = comparisonFilteredPageData ? 
            { clicks: comparisonFilteredPageData.clicks, impressions: comparisonFilteredPageData.impressions, ctr: comparisonFilteredPageData.ctr, position: comparisonFilteredPageData.position } 
            : defaultMetrics;
          
          console.log("Using PAGE-LEVEL data for metrics due to selectedUrlFilter:", { currentMetricsForDisplay, comparisonMetricsForDisplay });

        } else {
          const aggregatedCurrentQueries = processAndFilterQueries(queryDataForCurrentPeriod);
          currentMetricsForDisplay = {
            clicks: aggregatedCurrentQueries.reduce((sum, item) => sum + (item.clicks || 0), 0),
            impressions: aggregatedCurrentQueries.reduce((sum, item) => sum + (item.impressions || 0), 0),
            ctr: aggregatedCurrentQueries.length > 0 ? aggregatedCurrentQueries.reduce((sum, item) => sum + (item.ctr || 0), 0) / aggregatedCurrentQueries.length : 0,
            position: aggregatedCurrentQueries.length > 0 ? aggregatedCurrentQueries.reduce((sum, item) => sum + (item.position || 0), 0) / aggregatedCurrentQueries.length : 0
          };

          const aggregatedComparisonQueries = processAndFilterQueries(queryDataForComparisonPeriod);
          comparisonMetricsForDisplay = {
            clicks: aggregatedComparisonQueries.reduce((sum, item) => sum + (item.clicks || 0), 0),
            impressions: aggregatedComparisonQueries.reduce((sum, item) => sum + (item.impressions || 0), 0),
            ctr: aggregatedComparisonQueries.length > 0 ? aggregatedComparisonQueries.reduce((sum, item) => sum + (item.ctr || 0), 0) / aggregatedComparisonQueries.length : 0,
            position: aggregatedComparisonQueries.length > 0 ? aggregatedComparisonQueries.reduce((sum, item) => sum + (item.position || 0), 0) / aggregatedComparisonQueries.length : 0
          };
          console.log("Using QUERY-LEVEL aggregated data for metrics (no URL filter):", { currentMetricsForDisplay, comparisonMetricsForDisplay });
        }

        setMetrics({
          totalClicks: currentMetricsForDisplay.clicks,
          totalImpressions: currentMetricsForDisplay.impressions,
          avgCtr: currentMetricsForDisplay.ctr,
          avgPosition: currentMetricsForDisplay.position,
          clicksChange: calculateChange(currentMetricsForDisplay.clicks, comparisonMetricsForDisplay.clicks),
          impressionsChange: calculateChange(currentMetricsForDisplay.impressions, comparisonMetricsForDisplay.impressions),
          ctrChange: calculateChange(currentMetricsForDisplay.ctr, comparisonMetricsForDisplay.ctr),
          positionChange: calculateChange(currentMetricsForDisplay.position, comparisonMetricsForDisplay.position)
        });

        // Process performance trend data
        const processedTrendData = processGSCDataForPerformanceTrends(trendData, performanceTrendGranularity, chartMetric);
        setPerformanceTrendData(processedTrendData);

        // Process ranking data
        const { overall, breakdown } = processGSCDataForKeywordRanking(rankingData, rankingTimeView);
        setOverallRankingData(overall);
        setPositionBreakdownData(breakdown);

        // At the end of successful data fetch - clear all loading states
        if (mounted) {
          setLoading(false);
          setIsPerformanceTrendLoading(false);
          setIsRankingDataLoading(false);
          setIsPropertySwitching(false);
        }
        
      } catch (error: any) {
        console.error('[Dashboard] Error fetching dashboard data:', error);
        if (mounted) {
          setError(error.message || 'Failed to load dashboard data');
          setLoading(false);
          setIsPerformanceTrendLoading(false);
          setIsRankingDataLoading(false);
          setIsPropertySwitching(false);
        }
      }
    };

    fetchAllDashboardData();
    
    return () => {
      mounted = false;
    };
  }, [
    gscProperty,
    isConnected,
    token,
    dateRange.startDate,
    dateRange.endDate,
    comparisonRange.startDate,
    comparisonRange.endDate,
    selectedUrlFilter,
    countryFilter,
    deviceFilter,
    keywordTypeFilter,
    keywordCategoryFilter,
    performanceTrendGranularity,
    chartMetric,
    rankingTimeView
  ]);

  const exportCSV = () => {
    console.log("Exporting CSV for global filters data...");
    const headers = ['Keyword', 'Intent', 'Type', 'Clicks', 'Impressions', 'CTR', 'Position'];
    const rows = topQueries.map(q => [
      q.query,
      q.intent,
      q.type,
      q.clicks,
      q.impressions,
      (q.ctr * 100).toFixed(1) + '%',
      q.position.toFixed(1)
    ]);
    let csvContent = "data:text/csv;charset=utf-8,"
      + headers.join(",") + "\\n"
      + rows.map(e => e.join(",")).join("\\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `top_keywords_${format(new Date(), 'yyyyMMdd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleGenerateShareLink = async (selectedComponents: string[]) => {
    if (!gscProperty) {
      toast({
        title: "Error: GSC Property Missing",
        description: "Cannot generate a share link without an active GSC Property.",
        variant: "destructive",
      });
      return;
    }

    try {
      // First, fetch the GSC data that needs to be included in the share
      const gscService = new GSCService();
      
      // Fetch metrics data
      const currentData = await gscService.fetchSearchAnalyticsData({
        siteUrl: gscProperty,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        dimensions: ['query'],
      });

      const comparisonData = await gscService.fetchSearchAnalyticsData({
        siteUrl: gscProperty,
        startDate: comparisonRange.startDate,
        endDate: comparisonRange.endDate,
        dimensions: ['query'],
      });

      // Calculate metrics
      const calculateMetrics = (data: any[]) => ({
        clicks: data.reduce((sum, item) => sum + (item.clicks || 0), 0),
        impressions: data.reduce((sum, item) => sum + (item.impressions || 0), 0),
        ctr: data.reduce((sum, item) => sum + (item.ctr || 0), 0) / (data.length || 1),
        position: data.reduce((sum, item) => sum + (item.position || 0), 0) / (data.length || 1)
      });

      const currentMetrics = calculateMetrics(currentData);
      const comparisonMetrics = calculateMetrics(comparisonData);

      // Calculate changes
      const calculateChange = (current: number, previous: number) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        if (current === 0 && previous === 0) return 0;
        return ((current - previous) / previous) * 100;
      };

      // Fetch trend data
      const trendData = await gscService.fetchSearchAnalyticsData({
        siteUrl: gscProperty,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        dimensions: ['date'],
      });

      // Process trend data
      const processedTrendData = trendData.reduce((acc, item) => {
        const date = new Date(item.date!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        acc.labels.push(date);
        acc.clicks.push(item.clicks);
        acc.impressions.push(item.impressions);
        acc.ctr.push(item.ctr * 100);
        acc.position.push(item.position);
        return acc;
      }, {
        labels: [] as string[],
        clicks: [] as number[],
        impressions: [] as number[],
        ctr: [] as number[],
        position: [] as number[]
      });

      const gscData = {
        metrics: {
          totalClicks: currentMetrics.clicks,
          totalImpressions: currentMetrics.impressions,
          avgCtr: currentMetrics.ctr,
          avgPosition: currentMetrics.position,
          clicksChange: calculateChange(currentMetrics.clicks, comparisonMetrics.clicks),
          impressionsChange: calculateChange(currentMetrics.impressions, comparisonMetrics.impressions),
          ctrChange: calculateChange(currentMetrics.ctr, comparisonMetrics.ctr),
          positionChange: calculateChange(comparisonMetrics.position, currentMetrics.position)
        },
        performanceTrend: processedTrendData
      };

      const currentFilters = {
        dateRange,
        comparisonRange,
        selectedRange,
        keywordTypeFilter,
        keywordCategoryFilter,
        countryFilter,
        deviceFilter,
        selectedUrlFilter,
      };

      const edgeFunctionUrl = 'https://yevkfoxoefssdgsodtzd.supabase.co/functions/v1/create-share-link';

      console.log('Calling Edge Function to create share link:', edgeFunctionUrl);
      console.log('Sending payload:', { gscProperty, selectedComponents, filters: currentFilters, gscData });

      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      const response = await fetch(edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          gscProperty,
          selectedComponents,
          filters: currentFilters,
          gscData
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to parse error response from server.' }));
        console.error('Error response from create-share-link function:', errorData, 'Status:', response.status);
        throw new Error(errorData.error || errorData.message || `Failed to generate share link. Server responded with status: ${response.status}`);
      }

      const responseData = await response.json();
      const generatedShareUrl = responseData.shareUrl;

      // Copy to clipboard and show success message
      await navigator.clipboard.writeText(generatedShareUrl);
      toast({
        title: "Share Link Generated",
        description: "The link has been copied to your clipboard.",
      });

    } catch (error: any) {
      console.error('Error generating share link:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate share link.",
        variant: "destructive",
      });
    }
  };

  // Update URL analysis handler
  const handleUrlAnalysis = async () => {
    if (!gscProperty || !isConnected || !token || !urlAnalysisInput.trim()) return;
    
    setIsUrlAnalysisLoading(true);
    setUrlAnalysisError(null);
    
    try {
      const urlToAnalyze = urlAnalysisInput.trim();
      const fullUrl = urlToAnalyze.startsWith('http') ? urlToAnalyze : `https://${gscProperty}${urlToAnalyze}`;
      
      console.log('Analyzing URL:', fullUrl);
      
      const data = await gscService.fetchSearchAnalyticsData({
        siteUrl: gscProperty,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        dimensions: ['page'],
        rowLimit: 25000,
        dimensionFilterGroups: [{
          filters: [{
            dimension: 'page',
            operator: 'equals',
            expression: fullUrl
          }]
        }]
      });

      console.log('URL analysis data:', data);

      const processedData = data.map(item => ({
        url: item.page || '',
        clicks: item.clicks || 0,
        impressions: item.impressions || 0,
        ctr: item.ctr || 0,
        position: item.position || 0
      }));

      // If no data found for the exact URL, set zero values
      if (processedData.length === 0) {
        processedData.push({
          url: fullUrl,
          clicks: 0,
          impressions: 0,
          ctr: 0,
          position: 0
        });
      }

      setUrlAnalysisData(processedData);
      setSelectedUrlFilter(urlToAnalyze);
    } catch (error: any) {
      console.error('Error analyzing URL:', error);
      setUrlAnalysisError(error.message || 'Failed to analyze URL');
    } finally {
      setIsUrlAnalysisLoading(false);
    }
  };

  // Show property switching overlay
  if (isPropertySwitching) {
    return (
      <DashboardLayout
        title={gscProperty ? `${formatDomainForTitle(gscProperty)} Performance Dashboard` : "Performance Dashboard"}
        fullScreen={true}
        comparisonText={`Comparing ${format(parseISO(dateRange.startDate), 'MMM dd')} – ${format(parseISO(dateRange.endDate), 'MMM dd')} vs ${format(parseISO(comparisonRange.startDate), 'MMM dd')} – ${format(parseISO(comparisonRange.endDate), 'MMM dd')}`}
      >
        <div className="flex items-center justify-center h-screen bg-gradient-to-br from-gray-900 via-[#0f1115] to-gray-900">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-white mb-2">Switching Property</h2>
            <p className="text-gray-400">Loading data for your selected property...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (loading && !token) { // Initial load check or if token disappears
    return (
      <DashboardLayout title="Search Performance Dashboard" fullScreen={true}>
        <div className="flex items-center justify-center h-screen">
          <p className="text-xl text-gray-400">Authenticating and loading initial data...</p>
        </div>
      </DashboardLayout>
    );
  }

  // Main dashboard view with GSC Property selector at the top
  // The GSC Property selector (e.g., "sc-domain:heyhomie.co") allows users to:
  // 1. View the currently selected Google Search Console property
  // 2. See how many properties are available (e.g., "3 properties available")
  // 3. Switch between different properties to view their respective analytics
  return (
    <DashboardLayout
      title="Performance Dashboard"
      fullScreen={true}
      comparisonText={`Comparing ${format(parseISO(dateRange.startDate), 'MMM dd')} – ${format(parseISO(dateRange.endDate), 'MMM dd')} vs ${format(parseISO(comparisonRange.startDate), 'MMM dd')} – ${format(parseISO(comparisonRange.endDate), 'MMM dd')}`}
    >
      <RenewalOverlay>
        <div className="w-full p-6 space-y-6">
          {/* Global Error Alert */}
          {error && !loading && (
            <Card className="border-red-700 bg-red-900/20 mb-6">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-red-400">
                  <AlertCircle className="h-5 w-5" />
                  <p>{error}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Filters Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
            <Select
              value={selectedRange}
              onValueChange={handleDateRangeChange}
            >
              <SelectTrigger className="w-full bg-gray-800 border-gray-700 text-gray-300">
                <SelectValue placeholder="Select date range" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700 text-white">
                {DATE_RANGES.map((option) => (
                  <SelectItem key={option.value} value={option.value} className="hover:bg-gray-700">
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={keywordTypeFilter} onValueChange={setKeywordTypeFilter}>
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

            <Select value={keywordCategoryFilter} onValueChange={setKeywordCategoryFilter}>
              <SelectTrigger className="w-full bg-gray-800 border-gray-700 text-gray-300">
                <SelectValue placeholder="Keyword category" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700 text-white">
                {KEYWORD_CATEGORY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value} className="hover:bg-gray-700">
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Remove Temporary debug output for availableCountries */}
            {/* <div className="text-white text-xs mt-2">
              <p>Debug: availableCountries count: {availableCountries.length}</p>
              <pre>{JSON.stringify(availableCountries.slice(0, 5), null, 2)}</pre> 
            </div> */}

            <Select value={countryFilter} onValueChange={setCountryFilter}>
              <SelectTrigger className="w-full bg-gray-800 border-gray-700 text-gray-300">
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700 text-white">
                {availableCountries.map((option, index) => (
                  <SelectItem 
                    key={`${option.value}-${index}`} // More robust key
                    value={option.value} 
                    className="hover:bg-gray-700"
                  >
                    {option.label} {/* Reverted to original label */}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={deviceFilter} onValueChange={setDeviceFilter}>
              <SelectTrigger className="w-full bg-gray-800 border-gray-700 text-gray-300">
                <SelectValue placeholder="Select device" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700 text-white">
                {DEVICE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value} className="hover:bg-gray-700">
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={exportCSV} className="w-full bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-blue-300">
              <Download className="h-4 w-4 mr-2" /> Export
            </Button>
            {/* Temporarily commented out Share Report Button
            <Button 
              variant="outline" 
              onClick={() => setIsShareModalOpen(true)}
              className="w-full bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-green-300"
            >
              <Share2 className="h-4 w-4 mr-2" /> Share Report
            </Button>
            */}
          </div>

          {/* URL Analysis Section */}
          <Card className="bg-gray-800 border-gray-700 mb-6">
            <CardHeader>
              <CardTitle className="text-white">URL Performance Analysis</CardTitle>
              <CardDescription className="text-gray-400">
                Enter URLs to analyze their performance metrics.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <Input
                      value={urlAnalysisInput}
                      onChange={(e) => {
                        setUrlAnalysisInput(e.target.value);
                        if (!e.target.value.trim()) {
                          setSelectedUrlFilter(null);
                        }
                      }}
                      placeholder="Enter URL to analyze... (e.g., /blog/post-1)"
                      className="flex-1 bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
                    />
                    <Button
                      onClick={() => {
                        const url = urlAnalysisInput.trim();
                        setSelectedUrlFilter(url || null);
                      }}
                      disabled={!urlAnalysisInput.trim()}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Apply Filter
                    </Button>
                    {selectedUrlFilter && (
                      <Button
                        onClick={() => {
                          setSelectedUrlFilter(null);
                          setUrlAnalysisInput('');
                        }}
                        variant="outline"
                        className="bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"
                      >
                        Clear Filter
                      </Button>
                    )}
                  </div>
                  {selectedUrlFilter && (
                    <p className="text-sm text-blue-400">
                      Currently filtering data for: {selectedUrlFilter}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Custom Date Range Calendar */}
          {selectedRange === 'custom' && (
            <div className="mb-6">
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    <span>{format(parseISO(dateRange.startDate), 'MMM dd')} - {format(parseISO(dateRange.endDate), 'MMM dd')}</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-gray-800 border-gray-700">
                  <Calendar
                    mode="range"
                    defaultMonth={calendarDate}
                    selected={{ from: parseISO(dateRange.startDate), to: parseISO(dateRange.endDate) }}
                    onSelect={(range) => {
                      if (range?.from && range?.to) {
                        setDateRange({ startDate: format(range.from, 'yyyy-MM-dd'), endDate: format(range.to, 'yyyy-MM-dd') });
                        setCalendarDate(range.from);
                        setIsCalendarOpen(false);
                      }
                    }}
                    className="bg-gray-800 text-white"
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}

          {/* Active Filters Display */}
          {(keywordTypeFilter !== 'all' || keywordCategoryFilter !== 'all' || countryFilter !== 'all' || deviceFilter !== 'all' || selectedUrlFilter) && (
            <div className="flex items-center flex-wrap gap-2 mb-6">
              <Filter className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-400">Active filters:</span>
              
              {selectedUrlFilter && (
                <Badge 
                  variant="secondary" 
                  className="bg-blue-900/30 text-blue-400 border-blue-700 flex items-center gap-1 cursor-pointer hover:bg-blue-900/40"
                  onClick={() => { setSelectedUrlFilter(null); setUrlAnalysisInput(''); }}
                >
                  URL: {selectedUrlFilter} <X className="h-3 w-3" />
                </Badge>
              )}

              {keywordTypeFilter !== 'all' && (
                <Badge 
                  variant="secondary" 
                  className="bg-blue-900/30 text-blue-400 border-blue-700 flex items-center gap-1 cursor-pointer hover:bg-blue-900/40"
                  onClick={() => setKeywordTypeFilter('all')}
                >
                  {KEYWORD_TYPE_OPTIONS.find(opt => opt.value === keywordTypeFilter)?.label} <X className="h-3 w-3" />
                </Badge>
              )}

              {keywordCategoryFilter !== 'all' && (
                <Badge 
                  variant="secondary" 
                  className="bg-purple-900/30 text-purple-400 border-purple-700 flex items-center gap-1 cursor-pointer hover:bg-purple-900/40"
                  onClick={() => setKeywordCategoryFilter('all')}
                >
                  {KEYWORD_CATEGORY_OPTIONS.find(opt => opt.value === keywordCategoryFilter)?.label} <X className="h-3 w-3" />
                </Badge>
              )}

              {countryFilter !== 'all' && (() => {
                const countryLabel = availableCountries.find(opt => opt.value === countryFilter)?.label || countryFilter.toUpperCase();
                return (
                  <Badge 
                    variant="secondary" 
                    className="bg-teal-900/30 text-teal-400 border-teal-700 flex items-center gap-1 cursor-pointer hover:bg-teal-900/40"
                    onClick={() => setCountryFilter('all')}
                  >
                    {countryLabel} <X className="h-3 w-3" />
                  </Badge>
                );
              })()}

              {deviceFilter !== 'all' && (
                <Badge 
                  variant="secondary" 
                  className="bg-orange-900/30 text-orange-400 border-orange-700 flex items-center gap-1 cursor-pointer hover:bg-orange-900/40"
                  onClick={() => setDeviceFilter('all')}
                >
                  {DEVICE_OPTIONS.find(opt => opt.value === deviceFilter)?.label} <X className="h-3 w-3" />
                </Badge>
              )}
            </div>
          )}

          {/* Metric Cards Grid */}
          {loading && !error ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array(4).fill(0).map((_, idx) => (
                <Card key={idx} className="bg-gray-800 border-gray-700 animate-pulse">
                  <CardHeader className="pb-2"><div className="h-4 bg-gray-700 rounded w-3/4"></div></CardHeader>
                  <CardContent className="pt-2"><div className="h-8 bg-gray-700 rounded w-1/2 mb-2"></div><div className="h-4 bg-gray-700 rounded w-1/4"></div></CardContent>
                </Card>
              ))}
            </div>
          ) : !error ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-400 text-center">Total Clicks</CardTitle></CardHeader>
                <CardContent className="pt-2">
                  <div className="text-2xl font-bold text-white text-center">{metrics.totalClicks.toLocaleString()}</div>
                  <div className={cn("flex items-center gap-1 text-sm mt-1 justify-center", metrics.clicksChange >= 0 ? "text-green-500" : "text-red-500")}>
                    {metrics.clicksChange >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    <span>{Math.abs(metrics.clicksChange).toFixed(1)}%</span>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-400 text-center">Impressions</CardTitle></CardHeader>
                <CardContent className="pt-2">
                  <div className="text-2xl font-bold text-white text-center">{metrics.totalImpressions.toLocaleString()}</div>
                  <div className={cn("flex items-center gap-1 text-sm mt-1 justify-center", metrics.impressionsChange >= 0 ? "text-green-500" : "text-red-500")}>
                    {metrics.impressionsChange >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    <span>{Math.abs(metrics.impressionsChange).toFixed(1)}%</span>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-400 text-center">Average CTR</CardTitle></CardHeader>
                <CardContent className="pt-2">
                  <div className="text-2xl font-bold text-white text-center">{(metrics.avgCtr * 100).toFixed(1)}%</div>
                  <div className={cn("flex items-center gap-1 text-sm mt-1 justify-center", metrics.ctrChange >= 0 ? "text-green-500" : "text-red-500")}>
                    {metrics.ctrChange >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    <span>{Math.abs(metrics.ctrChange).toFixed(1)}%</span>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-400 text-center">Average Position</CardTitle></CardHeader>
                <CardContent className="pt-2">
                  <div className="text-2xl font-bold text-white text-center">{metrics.avgPosition.toFixed(1)}</div>
                  <div className={cn("flex items-center gap-1 text-sm mt-1 justify-center", metrics.positionChange <= 0 ? "text-green-500" : "text-red-500")}> {/* Lower position is better */}
                    {metrics.positionChange <= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    <span>{Math.abs(metrics.positionChange).toFixed(1)}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : null}

          {/* Performance Trends Section - Full Width */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <CardTitle className="text-white">Performance Trends</CardTitle>
                  <CardDescription className="text-gray-400">
                    Key metrics over selected time periods.
                  </CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Select value={performanceTrendGranularity} onValueChange={(val) => setPerformanceTrendGranularity(val as 'daily' | 'weekly' | 'monthly')}>
                    <SelectTrigger className="w-full sm:w-[120px] bg-gray-700 border-gray-600 text-gray-300">
                      <SelectValue placeholder="View by" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700 text-white">
                      {PERFORMANCE_TREND_GRANULARITY_OPTIONS.map(opt =>
                        <SelectItem key={opt.value} value={opt.value} className="hover:bg-gray-700">{opt.label}</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <Select value={chartMetric} onValueChange={(val) => setChartMetric(val)}>
                    <SelectTrigger className="w-full sm:w-[160px] bg-gray-700 border-gray-600 text-gray-300">
                      <SelectValue placeholder="Metric" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700 text-white">
                      {CHART_METRICS.map(opt =>
                        <SelectItem key={opt.value} value={opt.value} className="hover:bg-gray-700">{opt.label}</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isPerformanceTrendLoading ? (
                <div className="h-[400px] flex items-center justify-center text-gray-400"><p>Loading trend data...</p></div>
              ) : performanceTrendError ? (
                <div className="h-[400px] flex items-center justify-center text-red-400"><p>{performanceTrendError}</p></div>
              ) : performanceTrendData.length === 0 && !isPerformanceTrendLoading ? (
                <div className="h-[400px] flex items-center justify-center text-gray-400"><p>No trend data available for the selected parameters.</p></div>
              ) : (
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={performanceTrendData} margin={{ top: 20, right: 30, bottom: 40, left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                      <XAxis 
                        dataKey="name" 
                        tick={{ 
                          fill: 'rgba(255, 255, 255, 0.7)', 
                          fontSize: 12 
                        }} 
                        axisLine={{ stroke: 'rgba(255, 255, 255, 0.3)' }} 
                        height={40}
                        interval={0}
                      />
                      {chartMetric === 'all' ? (
                        <>
                          <YAxis 
                            yAxisId="clicks"
                            orientation="left"
                            tick={{ fill: 'rgba(255, 255, 255, 0.7)', fontSize: 12 }} 
                            axisLine={{ stroke: 'rgba(255, 255, 255, 0.3)' }}
                            label={{ value: 'Clicks & Impressions', angle: -90, position: 'insideLeft', fill: 'rgba(255, 255, 255, 0.7)' }}
                          />
                          <YAxis 
                            yAxisId="percentage"
                            orientation="right"
                            tick={{ fill: 'rgba(255, 255, 255, 0.7)', fontSize: 12 }} 
                            axisLine={{ stroke: 'rgba(255, 255, 255, 0.3)' }}
                            label={{ value: 'CTR (%)', angle: 90, position: 'insideRight', fill: 'rgba(255, 255, 255, 0.7)' }}
                          />
                          <YAxis 
                            yAxisId="position"
                            orientation="right"
                            tick={{ fill: 'rgba(255, 255, 255, 0.7)', fontSize: 12 }} 
                            axisLine={{ stroke: 'rgba(255, 255, 255, 0.3)' }}
                            label={{ value: 'Position', angle: 90, position: 'insideRight', fill: 'rgba(255, 255, 255, 0.7)' }}
                            tickCount={5}
                            reversed={true}
                          />
                        </>
                      ) : (
                        <YAxis 
                          tick={{ fill: 'rgba(255, 255, 255, 0.7)', fontSize: 12 }} 
                          axisLine={{ stroke: 'rgba(255, 255, 255, 0.3)' }} 
                          reversed={chartMetric === 'position'} 
                          domain={chartMetric === 'position' ? [dataMin => Math.max(1, dataMin - 5), dataMax => dataMax + 5] : undefined} 
                        />
                      )}
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: 'white', borderRadius: '8px' }} 
                        formatter={(value: number, name: string) => {
                          if (chartMetric === 'all') {
                            const metricName = name.replace('Prev', '');
                            const isCurrentPeriod = !name.endsWith('Prev');
                            const label = isCurrentPeriod ? 'Current' : 'Previous';
                            if (metricName === 'ctr') {
                              return [`${value.toFixed(2)}%`, `${label} CTR`];
                            } else if (metricName === 'position') {
                              return [value.toFixed(1), `${label} Position`];
                            } else {
                              return [value.toLocaleString(), `${label} ${metricName.charAt(0).toUpperCase() + metricName.slice(1)}`];
                            }
                          }
                          return [
                            chartMetric === 'ctr' ? `${value.toFixed(2)}%` : value.toLocaleString(),
                            performanceTrendGranularity === 'daily' ? chartMetric : 
                            (!name.endsWith('Prev') ? 'Current' : 'Previous')
                          ];
                        }}
                      />
                      {chartMetric === 'all' ? (
                        <RechartsLegend 
                          formatter={(value: string) => {
                            const metricName = value.replace('Prev', '');
                            return metricName.charAt(0).toUpperCase() + metricName.slice(1);
                          }}
                        />
                      ) : performanceTrendGranularity !== 'daily' && (
                        <RechartsLegend 
                          formatter={(value: string) => {
                            const isCurrentPeriod = !value.endsWith('Prev');
                            return performanceTrendGranularity === 'weekly'
                              ? (isCurrentPeriod ? 'Current Week' : 'Previous Week')
                              : (isCurrentPeriod ? 'Current Year' : 'Previous Year');
                          }}
                        />
                      )}
                      {chartMetric === 'all' ? (
                        <>
                          <Line 
                            type="monotone" 
                            dataKey="clicks" 
                            stroke={getMetricColor('clicks')}
                            strokeWidth={2}
                            yAxisId="clicks"
                            dot={{ fill: 'white', strokeWidth: 1, r: 3 }}
                            activeDot={{ r: 5, stroke: 'white', strokeWidth: 2 }}
                            name="Clicks"
                          />
                          <Line 
                            type="monotone" 
                            dataKey="impressions" 
                            stroke={getMetricColor('impressions')}
                            strokeWidth={2}
                            yAxisId="clicks"
                            dot={{ fill: 'white', strokeWidth: 1, r: 3 }}
                            activeDot={{ r: 5, stroke: 'white', strokeWidth: 2 }}
                            name="Impressions"
                          />
                          <Line 
                            type="monotone" 
                            dataKey="ctr" 
                            stroke={getMetricColor('ctr')}
                            strokeWidth={2}
                            yAxisId="percentage"
                            dot={{ fill: 'white', strokeWidth: 1, r: 3 }}
                            activeDot={{ r: 5, stroke: 'white', strokeWidth: 2 }}
                            name="CTR"
                          />
                          <Line 
                            type="monotone" 
                            dataKey="position" 
                            stroke={getMetricColor('position')}
                            strokeWidth={2}
                            yAxisId="position"
                            dot={{ fill: 'white', strokeWidth: 1, r: 3 }}
                            activeDot={{ r: 5, stroke: 'white', strokeWidth: 2 }}
                            name="Position"
                          />
                        </>
                      ) : (
                        <>
                          <Line 
                            type="monotone" 
                            dataKey={chartMetric} 
                            stroke={getMetricColor(chartMetric)}
                            strokeWidth={2} 
                            dot={{ fill: 'white', strokeWidth: 1, r: 3 }} 
                            activeDot={{ r: 5, stroke: 'white', strokeWidth: 2 }} 
                          />
                          {performanceTrendGranularity !== 'daily' && (
                            <Line 
                              type="monotone" 
                              dataKey={`${chartMetric}Prev`} 
                              stroke={getMetricColor(chartMetric)}
                              strokeWidth={2} 
                              strokeDasharray="5 5"
                              dot={{ fill: 'white', strokeWidth: 1, r: 2 }} 
                              activeDot={{ r: 4, stroke: 'white', strokeWidth: 2 }} 
                            />
                          )}
                        </>
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Keyword Ranking Distribution Section - Full Width */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <CardTitle className="text-white">Keyword Ranking Distribution</CardTitle>
                  <CardDescription className="text-gray-400">
                    Analysis of keyword positioning. (Not affected by global filters)
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant={rankingTimeView === '6m' ? 'default' : 'outline'} onClick={() => setRankingTimeView('6m')} className={cn("text-white bg-gray-700 hover:bg-gray-600 border-gray-600 hover:text-white", rankingTimeView === '6m' && "bg-blue-600 hover:bg-blue-500 border-blue-500 text-white")}>Last 6 Months</Button>
                  <Button variant={rankingTimeView === '12m' ? 'default' : 'outline'} onClick={() => setRankingTimeView('12m')} className={cn("text-white bg-gray-700 hover:bg-gray-600 border-gray-600 hover:text-white", rankingTimeView === '12m' && "bg-blue-600 hover:bg-blue-500 border-blue-500 text-white")}>Last 12 Months</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isRankingDataLoading ? (
                <div className="h-[400px] flex items-center justify-center text-gray-400"><p>Loading ranking data...</p></div>
              ) : rankingDataError ? (
                <div className="h-[400px] flex items-center justify-center text-red-400"><p>{rankingDataError}</p></div>
              ) : (overallRankingData.every(d => d.value === 0) && positionBreakdownData.length === 0 && !isRankingDataLoading) ? (
                <div className="h-[400px] flex items-center justify-center text-gray-400"><p>No ranking data available for the selected parameters.</p></div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
                  {/* Column 1: Total # of Keywords (Overall) - Snapshot of latest month */}
                  <div className="bg-gray-850 p-4 rounded-lg border border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-200 mb-3">Total # of Keywords (Latest Month)</h3>
                    <div className="h-[350px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={overallRankingData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                          <XAxis type="number" tick={{ fill: 'rgba(255, 255, 255, 0.7)', fontSize: 12 }} axisLine={{ stroke: 'rgba(255, 255, 255, 0.3)' }} allowDecimals={false} />
                          <YAxis type="category" dataKey="name" tick={{ fill: 'rgba(255, 255, 255, 0.7)', fontSize: 12 }} axisLine={{ stroke: 'rgba(255, 255, 255, 0.3)' }} width={60} />
                          <RechartsTooltip
                            contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', borderRadius: '8px' }}
                            labelStyle={{ color: 'white', fontSize: 13 }}
                            itemStyle={{ color: 'white', fontSize: 13 }}
                            formatter={(value: number) => [value.toLocaleString(), 'Keywords']}
                          />
                          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                            {overallRankingData.map((entry, index) => {
                              const colors = ['#3b82f6', '#60a5fa', '#818cf8', '#a78bfa', '#c4b5fd']; // Top3, 4-10, 11-20, 21-50, >50
                              return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                            })}
                            <LabelList dataKey="value" position="right" fill="rgba(255, 255, 255, 0.8)" fontSize={12} formatter={(value: number) => value > 0 ? value.toLocaleString() : ''} />
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Column 2: Top 3 & 4–10 Position Breakdown - Time Series */}
                  <div className="bg-gray-850 p-4 rounded-lg border border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-200 mb-3">Top Positions Trend ({rankingTimeView === '6m' ? 'Last 6 Months' : 'Last 12 Months'})</h3>
                    <div className="h-[350px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={positionBreakdownData} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                          <XAxis 
                            dataKey="month" 
                            tick={{ fill: 'rgba(255, 255, 255, 0.7)', fontSize: 12 }} 
                            axisLine={{ stroke: 'rgba(255, 255, 255, 0.3)' }}
                            interval={0}
                            angle={-45}
                            textAnchor="end"
                            height={60}
                          />
                          <YAxis tick={{ fill: 'rgba(255, 255, 255, 0.7)', fontSize: 12 }} axisLine={{ stroke: 'rgba(255, 255, 255, 0.3)' }} allowDecimals={false} />
                          <RechartsTooltip
                            contentStyle={{
                              backgroundColor: '#1f2937',
                              borderColor: '#374151',
                              borderRadius: '8px',
                            }}
                            labelStyle={{ color: 'white', fontSize: 13 }}
                            itemStyle={{ color: '#93c5fd', fontSize: 13 }} // Light blue for keywords
                            formatter={(value: number, name: string) => {
                              const customName = name === 'top3' ? 'Top 3' : name === 'top4_10' ? 'Position 4–10' : name;
                              return [value, customName];
                            }}
                          />
                          <RechartsLegend wrapperStyle={{ color: 'white', paddingTop: '10px' }} formatter={(value) => <span style={{ color: 'rgba(255,255,255,0.8)' }}>{value}</span>} />
                          <Bar dataKey="top3" name="Top 3" stackId="a" fill="#1e3a8a" radius={[4, 4, 0, 0]}>
                            <LabelList dataKey="top3" position="center" fill="#fff" fontSize={10} formatter={(value: number) => value > 0 ? value : ''} />
                          </Bar>
                          <Bar dataKey="top4_10" name="Position 4-10" stackId="a" fill="#60a5fa" radius={[4, 4, 0, 0]}>
                            <LabelList dataKey="top4_10" position="center" fill="#fff" fontSize={10} formatter={(value: number) => value > 0 ? value : ''} />
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Performing Keywords Table (uses global filters) */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Top Performing Keywords</CardTitle>
              <CardDescription className="text-gray-400">
                Keywords with the highest clicks, based on global filters.
                {(keywordTypeFilter !== 'all' || keywordCategoryFilter !== 'all') && topQueries.length > 0 && (
                  <span className="ml-2 text-xs text-gray-500">
                    (Filtered from a larger dataset)
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="rounded-md border border-gray-700 animate-pulse"><div className="h-60 bg-gray-700"></div></div>
              ) : error ? (
                <p className="text-red-400">Error loading keywords: {error}</p>
              ) : (
                <>
                  <div className="rounded-md border border-gray-700 overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-gray-700 hover:bg-gray-700/50">
                          <TableHead className="text-gray-300 w-[30%] px-4 py-3">Keyword</TableHead>
                          <TableHead className="text-gray-300 w-[15%] px-4 py-3">Intent</TableHead>
                          <TableHead className="text-gray-300 w-[15%] px-4 py-3">Type</TableHead>
                          <TableHead className="text-right text-gray-300 w-[10%] px-4 py-3">Clicks</TableHead>
                          <TableHead className="text-right text-gray-300 w-[10%] px-4 py-3">Impressions</TableHead>
                          <TableHead className="text-right text-gray-300 w-[10%] px-4 py-3">CTR</TableHead>
                          <TableHead className="text-right text-gray-300 w-[10%] px-4 py-3">Position</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {topQueries.length > 0 ? (
                          topQueries
                            .slice(
                              (currentKeywordPage - 1) * keywordsPerPage,
                              currentKeywordPage * keywordsPerPage
                            )
                            .map((query, index) => (
                              <TableRow key={index} className="border-gray-700 hover:bg-gray-700/50">
                                <TableCell className="font-medium text-left text-white px-4 py-3">{query.query}</TableCell>
                                <TableCell className="px-4 py-3">
                                  <Badge variant="outline" className={cn("text-xs font-semibold px-2 py-0.5 rounded-full", query.intent === 'tofu' ? "border-green-700 bg-green-900/30 text-green-400" : query.intent === 'mofu' ? "border-yellow-700 bg-yellow-900/30 text-yellow-400" : query.intent === 'bofu' ? "border-red-700 bg-red-900/30 text-red-400" : "border-gray-600 bg-gray-700/30 text-gray-400")}>
                                        {query.intent === 'tofu' ? 'ToFu' : query.intent === 'mofu' ? 'MoFu' : query.intent === 'bofu' ? 'BoFu' : query.intent || 'N/A'}
                                      </Badge>
                                </TableCell>
                                <TableCell className="px-4 py-3">
                                  <Badge variant="outline" className={cn("text-xs font-semibold px-2 py-0.5 rounded-full", query.type === 'branded' ? "border-blue-700 bg-blue-900/30 text-blue-400" : "border-purple-700 bg-purple-900/30 text-purple-400")}>
                                        {query.type === 'branded' ? 'Branded' : 'Non-Branded'}
                                      </Badge>
                                </TableCell>
                                <TableCell className="text-right text-gray-300 px-4 py-3">{query.clicks.toLocaleString()}</TableCell>
                                <TableCell className="text-right text-gray-300 px-4 py-3">{query.impressions.toLocaleString()}</TableCell>
                                <TableCell className="text-right text-gray-300 px-4 py-3">{(query.ctr * 100).toFixed(1)}%</TableCell>
                                <TableCell className="text-right text-gray-300 px-4 py-3">{query.position.toFixed(1)}</TableCell>
                              </TableRow>
                            ))
                        ) : (
                          <TableRow className="border-gray-700">
                            <TableCell colSpan={7} className="text-center py-10 text-gray-400">
                              {loading ? "Loading keywords..." : (topQueries.length === 0 && (keywordTypeFilter !== 'all' || keywordCategoryFilter !== 'all')) ? "No keywords match the current global filters." : "No keyword data available for the selected global date range."}
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination Controls */}
                  {topQueries.length > 0 && (
                    <div className="mt-4 flex items-center justify-between px-2">
                      <div className="text-sm text-gray-400">
                        Showing {Math.min((currentKeywordPage - 1) * keywordsPerPage + 1, topQueries.length)} to{' '}
                        {Math.min(currentKeywordPage * keywordsPerPage, topQueries.length)} of{' '}
                        {topQueries.length} keywords
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentKeywordPage(prev => Math.max(1, prev - 1))}
                          disabled={currentKeywordPage === 1}
                          className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="text-sm text-gray-400">
                          Page {currentKeywordPage} of {Math.ceil(topQueries.length / keywordsPerPage)}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentKeywordPage(prev => Math.min(Math.ceil(topQueries.length / keywordsPerPage), prev + 1))}
                          disabled={currentKeywordPage >= Math.ceil(topQueries.length / keywordsPerPage)}
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

          {/* Top Performing Pages Table (uses global filters) */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Top Performing Pages</CardTitle>
              <CardDescription className="text-gray-400">Pages with the highest clicks, based on global filters.</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="rounded-md border border-gray-700 animate-pulse"><div className="h-60 bg-gray-700"></div></div>
              ) : error ? (
                <p className="text-red-400">Error loading pages: {error}</p>
              ) : (
                <div className="rounded-md border border-gray-700 overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-700 hover:bg-gray-700/50">
                        <TableHead className="text-left text-gray-300 w-[60%] px-4 py-3">Page URL</TableHead>
                        <TableHead className="text-right text-gray-300 w-[10%] px-4 py-3">Clicks</TableHead>
                        <TableHead className="text-right text-gray-300 w-[10%] px-4 py-3">Impressions</TableHead>
                        <TableHead className="text-right text-gray-300 w-[10%] px-4 py-3">CTR</TableHead>
                        <TableHead className="text-right text-gray-300 w-[10%] px-4 py-3">Position</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topPages.length > 0 ? (
                        topPages.map((page, index) => (
                          <TableRow key={index} className="border-gray-700 hover:bg-gray-700/50">
                            <TableCell className="font-medium text-left text-white px-4 py-3 truncate max-w-xs sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl" title={page.page}>{page.page}</TableCell>
                            <TableCell className="text-right text-gray-300 px-4 py-3">{page.clicks.toLocaleString()}</TableCell>
                            <TableCell className="text-right text-gray-300 px-4 py-3">{page.impressions.toLocaleString()}</TableCell>
                            <TableCell className="text-right text-gray-300 px-4 py-3">{(page.ctr * 100).toFixed(1)}%</TableCell>
                            <TableCell className="text-right text-gray-300 px-4 py-3">{page.position.toFixed(1)}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow className="border-gray-700">
                          <TableCell colSpan={5} className="text-center py-10 text-gray-400">
                            {loading ? "Loading pages..." : "No page data available for the selected global date range."}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </RenewalOverlay>
      {/* Correct placement of ShareReportModal */}
      <ShareReportModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        onGenerateLink={handleGenerateShareLink}
      />
    </DashboardLayout>
  );
} 