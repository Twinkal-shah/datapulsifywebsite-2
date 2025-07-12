import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useProgressiveLoading } from '@/hooks/useProgressiveLoading';
import { DataLoadingOverlay } from '../DataLoadingOverlay';
import { LoadingProgress } from '../LoadingProgress';
import { GSCService } from '@/lib/gscService';
import { useToast } from '@/hooks/use-toast';

// Import all the dashboard components from the original Dashboard page
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { TrendingUp, TrendingDown, Eye, MousePointer, Target, Search, Calendar, Download, Share2, Users, Globe, Smartphone, Monitor, Tablet } from 'lucide-react';

// Keyword classification helper
function classifyKeywordCategory(query: string): string {
  const lowerQuery = query.toLowerCase();
  
  // Product-related keywords
  if (
    lowerQuery.includes('buy') ||
    lowerQuery.includes('price') ||
    lowerQuery.includes('cost') ||
    lowerQuery.includes('purchase') ||
    lowerQuery.includes('shop') ||
    lowerQuery.includes('order')
  ) {
    return 'product';
  }
  
  // Transactional keywords
  if (
    lowerQuery.includes('how to') ||
    lowerQuery.includes('vs') ||
    lowerQuery.includes('versus') ||
    lowerQuery.includes('compare') ||
    lowerQuery.includes('best')
  ) {
    return 'transactional';
  }
  
  // Default to informational
  return 'informational';
}

interface DashboardContentProps {
  isActive: boolean;
  onNavigate?: (section: string) => void;
}

export function DashboardContent({ isActive, onNavigate }: DashboardContentProps) {
  const { user, getGSCToken, getGSCProperty } = useAuth();
  const { toast } = useToast();
  const gscService = new GSCService();
  
  // State for dashboard data
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [keywordType, setKeywordType] = useState<'all' | 'branded' | 'non-branded'>('all');
  const [category, setCategory] = useState<string>('all');

  // Progressive loading setup
  const progressiveLoading = useProgressiveLoading({
    stages: [
      { id: 'metrics', name: 'Loading Key Metrics', weight: 2 },
      { id: 'trends', name: 'Loading Trend Data', weight: 2 },
      { id: 'rankings', name: 'Loading Ranking Data', weight: 2 },
      { id: 'pages', name: 'Loading Page Data', weight: 1 },
      { id: 'processing', name: 'Processing Data', weight: 1 }
    ],
    onComplete: () => {
      setLoading(false);
      toast({
        title: "Dashboard Updated",
        description: "Your dashboard data has been refreshed successfully.",
      });
    },
    onError: (error) => {
      setError(error);
      setLoading(false);
      toast({
        title: "Loading Error",
        description: "Some data couldn't be loaded. Please try refreshing.",
        variant: "destructive",
      });
    }
  });

  // Load dashboard data
  const loadDashboardData = async () => {
    // Add a small delay to allow auth context to fully load after callback
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const gscProperty = getGSCProperty();
    const token = getGSCToken();
    
    if (!gscProperty || !token) {
      // Check if we're coming from auth callback by looking at referrer or recent navigation
      const isRecentCallback = document.referrer.includes('accounts.google.com') || 
                              sessionStorage.getItem('gsc_auth_pending') === 'true';
      
      if (isRecentCallback) {
        // If we just came from auth, wait a bit longer and try again
        sessionStorage.removeItem('gsc_auth_pending');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const retryProperty = getGSCProperty();
        const retryToken = getGSCToken();
        
        if (!retryProperty || !retryToken) {
          setError('Google Search Console not connected');
          setLoading(false);
          return;
        }
      } else {
        setError('Google Search Console not connected');
        setLoading(false);
        return;
      }
    }

    try {
      const operations = {
        metrics: async (updateProgress: (progress: number, message?: string) => void) => {
          updateProgress(0, 'Fetching key metrics...');
          const endDate = new Date();
          const startDate = new Date();
          startDate.setMonth(startDate.getMonth() - 3);
          
          console.log(`[Dashboard] Current keywordType state: "${keywordType}"`);
          console.log(`[Dashboard] keywordType parameter being passed: ${keywordType === 'all' ? undefined : keywordType}`);
          
          // Fetch all data with query dimension to apply filters
          const data = await gscService.fetchSearchAnalyticsData({
            siteUrl: gscProperty,
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0],
            dimensions: ['query'], // Need query dimension to filter by type
            keywordType: keywordType === 'all' ? undefined : keywordType,
            rowLimit: 25000
          });

          console.log(`[Dashboard] Data received from GSC service: ${data.length} items`);
          
          // Filter by category if needed
          const filteredData = category === 'all' 
            ? data 
            : data.filter(item => classifyKeywordCategory(item.query) === category);

          console.log(`[Dashboard] Data after category filtering: ${filteredData.length} items`);
          
          // Calculate metrics from filtered data
          const metrics = {
            totalClicks: filteredData.reduce((sum, item) => sum + item.clicks, 0),
            totalImpressions: filteredData.reduce((sum, item) => sum + item.impressions, 0),
            avgCtr: 0,
            avgPosition: 0
          };

          metrics.avgCtr = metrics.totalImpressions > 0 ? 
            metrics.totalClicks / metrics.totalImpressions : 0;

          const totalImpressions = metrics.totalImpressions;
          metrics.avgPosition = totalImpressions > 0 ?
            filteredData.reduce((sum, item) => sum + (item.position * item.impressions), 0) / totalImpressions :
            0;

          updateProgress(100, 'Metrics loaded');
          return metrics;
        },
        trends: async (updateProgress: (progress: number, message?: string) => void) => {
          updateProgress(0, 'Fetching trend data...');
          const endDate = new Date();
          const startDate = new Date();
          startDate.setMonth(startDate.getMonth() - 6);
          
          console.log(`[Dashboard] Trends - keywordType parameter: ${keywordType === 'all' ? undefined : keywordType}`);
          
          // Fetch data with both date and query dimensions
          const data = await gscService.fetchSearchAnalyticsData({
            siteUrl: gscProperty,
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0],
            dimensions: ['date', 'query'], // Need both to filter and group by date
            keywordType: keywordType === 'all' ? undefined : keywordType,
            rowLimit: 25000
          });

          console.log(`[Dashboard] Trends - Data received: ${data.length} items`);

          // Filter by category if needed
          const filteredData = category === 'all'
            ? data
            : data.filter(item => classifyKeywordCategory(item.query) === category);

          console.log(`[Dashboard] Trends - Data after category filtering: ${filteredData.length} items`);

          // Group by date and aggregate metrics
          const dateGroups = new Map();
          filteredData.forEach(item => {
            const date = item.date || '';
            const group = dateGroups.get(date) || {
              date,
              clicks: 0,
              impressions: 0,
              ctr: 0,
              position: 0,
              count: 0
            };
            
            group.clicks += item.clicks;
            group.impressions += item.impressions;
            group.position += item.position * item.impressions; // Weighted position
            group.count += item.impressions;
            dateGroups.set(date, group);
          });

          // Convert to array and calculate averages
          const trendData = Array.from(dateGroups.values())
            .map(group => ({
              date: group.date,
              clicks: group.clicks,
              impressions: group.impressions,
              ctr: group.impressions > 0 ? group.clicks / group.impressions : 0,
              position: group.count > 0 ? group.position / group.count : 0
            }))
            .sort((a, b) => a.date.localeCompare(b.date));

          updateProgress(100, 'Trends loaded');
          return {
            labels: trendData.map(item => item.date),
            clicks: trendData.map(item => item.clicks),
            impressions: trendData.map(item => item.impressions),
            ctr: trendData.map(item => item.ctr),
            position: trendData.map(item => item.position)
          };
        },
        rankings: async (updateProgress: (progress: number, message?: string) => void) => {
          updateProgress(0, 'Fetching ranking data...');
          const endDate = new Date();
          const startDate = new Date();
          startDate.setMonth(startDate.getMonth() - 3);
          
          console.log(`[Dashboard] Rankings - keywordType parameter: ${keywordType === 'all' ? undefined : keywordType}`);
          
          // Fetch data with query dimension for filtering
          const data = await gscService.fetchSearchAnalyticsData({
            siteUrl: gscProperty,
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0],
            dimensions: ['query'],
            keywordType: keywordType === 'all' ? undefined : keywordType,
            rowLimit: 25000
          });

          console.log(`[Dashboard] Rankings - Data received: ${data.length} items`);

          // Filter by category if needed
          const filteredData = category === 'all'
            ? data
            : data.filter(item => classifyKeywordCategory(item.query) === category);

          console.log(`[Dashboard] Rankings - Data after category filtering: ${filteredData.length} items`);

          // Calculate distribution from filtered data
          const rankings = {
            top3: filteredData.filter(item => item.position <= 3).length,
            top10: filteredData.filter(item => item.position > 3 && item.position <= 10).length,
            top20: filteredData.filter(item => item.position > 10 && item.position <= 20).length,
            top50: filteredData.filter(item => item.position > 20 && item.position <= 50).length,
            below50: filteredData.filter(item => item.position > 50).length
          };

          updateProgress(100, 'Rankings loaded');
          return rankings;
        },
        pages: async (updateProgress: (progress: number, message?: string) => void) => {
          updateProgress(0, 'Fetching top pages...');
          const endDate = new Date();
          const startDate = new Date();
          startDate.setMonth(startDate.getMonth() - 1);
          
          // Don't filter pages by keyword type or category
          const data = await gscService.getTopPages(
            gscProperty,
            startDate.toISOString().split('T')[0],
            endDate.toISOString().split('T')[0],
            10
          );
          updateProgress(100, 'Pages loaded');
          return data;
        },
        processing: async (updateProgress: (progress: number, message?: string) => void) => {
          updateProgress(0, 'Processing data...');
          // Simulate processing time
          await new Promise(resolve => setTimeout(resolve, 500));
          updateProgress(100, 'Processing complete');
          return true;
        }
      };

      const results = await progressiveLoading.executeAllStages(operations);
      
      if (results) {
        setDashboardData(results);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  // Load data when component becomes active or filters change
  useEffect(() => {
    if (isActive) {
      loadDashboardData();
    }
  }, [isActive, keywordType, category]);

  // Add filter UI
  const renderFilters = () => (
    <div className="flex gap-4 mb-6">
      <Select
        value={keywordType}
        onValueChange={(value: 'all' | 'branded' | 'non-branded') => setKeywordType(value)}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Keyword Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Keywords</SelectItem>
          <SelectItem value="branded">Branded</SelectItem>
          <SelectItem value="non-branded">Non-Branded</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={category}
        onValueChange={setCategory}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          <SelectItem value="product">Product</SelectItem>
          <SelectItem value="informational">Informational</SelectItem>
          <SelectItem value="transactional">Transactional</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );

  // Show loading overlay
  if (loading) {
    return (
      <>
        <DataLoadingOverlay
          progress={progressiveLoading.progress}
          onCancel={() => {
            progressiveLoading.cancelLoading();
            setLoading(false);
          }}
          isVisible={true}
        />
        <div className="flex items-center justify-center h-64">
          <LoadingProgress 
            progress={progressiveLoading.progress}
            compact={true}
          />
        </div>
      </>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-400 mb-4">
            <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-white mb-2">Error Loading Dashboard</h3>
          <p className="text-gray-400 mb-4">{error}</p>
          <Button onClick={() => {
            setError(null);
            setLoading(true);
            loadDashboardData();
          }}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-6 space-y-6">
      {renderFilters()}
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Total Clicks</CardTitle>
            <MousePointer className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {dashboardData?.metrics?.totalClicks?.toLocaleString() || '0'}
            </div>
            <p className="text-xs text-gray-400">
              Last 3 months
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Total Impressions</CardTitle>
            <Eye className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {dashboardData?.metrics?.totalImpressions?.toLocaleString() || '0'}
            </div>
            <p className="text-xs text-gray-400">
              Last 3 months
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Average CTR</CardTitle>
            <Target className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {dashboardData?.metrics?.avgCtr ? (dashboardData.metrics.avgCtr * 100).toFixed(2) + '%' : '0%'}
            </div>
            <p className="text-xs text-gray-400">
              Last 3 months
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Average Position</CardTitle>
            <Search className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {dashboardData?.metrics?.avgPosition?.toFixed(1) || '0'}
            </div>
            <p className="text-xs text-gray-400">
              Last 3 months
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Performance Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dashboardData?.trends?.labels?.map((label: string, index: number) => ({
                  date: label,
                  clicks: dashboardData.trends.clicks[index],
                  impressions: dashboardData.trends.impressions[index] / 10 // Scale down for visibility
                })) || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151',
                      borderRadius: '6px',
                      color: '#F9FAFB'
                    }} 
                  />
                  <Line type="monotone" dataKey="clicks" stroke="#3B82F6" strokeWidth={2} />
                  <Line type="monotone" dataKey="impressions" stroke="#10B981" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Ranking Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Top 3', value: dashboardData?.rankings?.top3 || 0, fill: '#10B981' },
                      { name: 'Top 10', value: dashboardData?.rankings?.top10 || 0, fill: '#3B82F6' },
                      { name: 'Top 20', value: dashboardData?.rankings?.top20 || 0, fill: '#F59E0B' },
                      { name: 'Top 50', value: dashboardData?.rankings?.top50 || 0, fill: '#EF4444' },
                      { name: 'Below 50', value: dashboardData?.rankings?.below50 || 0, fill: '#6B7280' }
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151',
                      borderRadius: '6px',
                      color: '#F9FAFB'
                    }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gray-800 border-gray-700 cursor-pointer hover:bg-gray-700/50 transition-colors"
              onClick={() => onNavigate?.('click-gap-intelligence')}>
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-400" />
              Click Gap Intelligence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-400 text-sm">
              Identify pages with high impressions but low clicks to optimize your content strategy.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700 cursor-pointer hover:bg-gray-700/50 transition-colors"
              onClick={() => onNavigate?.('rank-tracker')}>
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-400" />
              Rank Tracker
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-400 text-sm">
              Monitor your keyword rankings over time and track your SEO progress.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700 cursor-pointer hover:bg-gray-700/50 transition-colors"
              onClick={() => onNavigate?.('custom-ai-dashboard')}>
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-400" />
              Custom AI Dashboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-400 text-sm">
              Get AI-powered insights and recommendations for your SEO strategy.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default DashboardContent; 