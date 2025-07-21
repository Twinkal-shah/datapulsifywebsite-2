import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useDataExports } from '@/hooks/useDataExports';
import { useToast } from '@/hooks/use-toast';
import { GSCService, GSCDataPoint } from '@/lib/gscService';
import { OpenAIService } from '@/lib/openAIService';
import { ExportService } from '@/lib/exportService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  TrendingUp, 
  TrendingDown, 
  Eye, 
  MousePointer, 
  Target, 
  Search, 
  Download, 
  Share2, 
  ExternalLink,
  Loader2,
  AlertCircle,
  CheckCircle,
  FileText,
  Bot
} from 'lucide-react';
import { DataLoadingOverlay } from '../DataLoadingOverlay';

interface TopGainersPage {
  url: string;
  bestQuery: string;
  otherQueries: string[];
  clickGap: number;
  totalClicks: number;
  impressions: number;
  ctr: number;
  position: number;
  selected: boolean;
  seoRecommendation?: string;
  aeoRecommendation?: string;
  loadingRecommendations?: boolean;
}

interface TopGainersContentProps {
  isActive: boolean;
  onNavigate?: (section: string) => void;
}

export function TopGainersContent({ isActive, onNavigate }: TopGainersContentProps) {
  const { user, getGSCToken, getGSCProperty } = useAuth();
  const { subscriptionType } = useSubscription();
  const { trackExport } = useDataExports();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [pages, setPages] = useState<TopGainersPage[]>([]);
  const [totalIndexedPages, setTotalIndexedPages] = useState(0);
  const [showAllPages, setShowAllPages] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatingRecommendations, setGeneratingRecommendations] = useState<Set<string>>(new Set());

  const gscService = new GSCService();
  const openAIService = new OpenAIService();

  // Calculate filtered pages based on settings
  const filteredPages = useMemo(() => {
    if (showAllPages) {
      return pages.filter(page => page.clickGap > 0);
    }
    
    if (totalIndexedPages < 100) {
      return pages.filter(page => page.clickGap > 0);
    } else {
      return pages.filter(page => page.clickGap > 10);
    }
  }, [pages, totalIndexedPages, showAllPages]);

  // Get selected pages
  const selectedPages = filteredPages.filter(page => page.selected);

  // Load Top Gainers data
  const loadTopGainersData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const gscProperty = getGSCProperty();
      const token = getGSCToken();
      
      if (!gscProperty || !token) {
        throw new Error('Google Search Console not connected');
      }

      // Calculate date ranges
      const endDate = new Date();
      const currentStart = new Date();
      currentStart.setMonth(currentStart.getMonth() - 3);
      
      const previousStart = new Date();
      previousStart.setMonth(previousStart.getMonth() - 6);
      const previousEnd = new Date();
      previousEnd.setMonth(previousEnd.getMonth() - 3);

      // Fetch current period data (last 3 months)
      const currentData = await gscService.fetchSearchAnalyticsData({
        siteUrl: gscProperty,
        startDate: currentStart.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        dimensions: ['page', 'query'],
        rowLimit: 25000
      });

      // Fetch previous period data (3-6 months ago)
      const previousData = await gscService.fetchSearchAnalyticsData({
        siteUrl: gscProperty,
        startDate: previousStart.toISOString().split('T')[0],
        endDate: previousEnd.toISOString().split('T')[0],
        dimensions: ['page', 'query'],
        rowLimit: 25000
      });

      // Get total indexed pages count
      const totalPagesData = await gscService.fetchSearchAnalyticsData({
        siteUrl: gscProperty,
        startDate: currentStart.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        dimensions: ['page'],
        rowLimit: 25000
      });
      
      setTotalIndexedPages(totalPagesData.length);

      // Process data to calculate click gaps
      const processedPages = processTopGainersData(currentData, previousData);
      
      setPages(processedPages);
    } catch (error) {
      console.error('Error loading Top Gainers data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Process raw GSC data into Top Gainers format
  const processTopGainersData = (currentData: GSCDataPoint[], previousData: GSCDataPoint[]): TopGainersPage[] => {
    // Group current data by page
    const currentPageData = new Map<string, {
      clicks: number;
      impressions: number;
      queries: Array<{ query: string; position: number; clicks: number; impressions: number; ctr: number }>;
    }>();

    currentData.forEach(item => {
      if (!item.page) return;
      
      const existing = currentPageData.get(item.page) || {
        clicks: 0,
        impressions: 0,
        queries: []
      };
      
      existing.clicks += item.clicks;
      existing.impressions += item.impressions;
      existing.queries.push({
        query: item.query,
        position: item.position,
        clicks: item.clicks,
        impressions: item.impressions,
        ctr: item.ctr
      });
      
      currentPageData.set(item.page, existing);
    });

    // Group previous data by page
    const previousPageData = new Map<string, number>();
    previousData.forEach(item => {
      if (!item.page) return;
      const existing = previousPageData.get(item.page) || 0;
      previousPageData.set(item.page, existing + item.clicks);
    });

    // Calculate click gaps and create TopGainersPage objects
    const topGainersPages: TopGainersPage[] = [];

    currentPageData.forEach((current, url) => {
      const previousClicks = previousPageData.get(url) || 0;
      const clickGap = current.clicks - previousClicks;
      
      // Find best query (highest position)
      const bestQuery = current.queries.reduce((best, query) => 
        query.position < best.position ? query : best
      );

      // Get other top queries
      const otherQueries = current.queries
        .filter(q => q.query !== bestQuery.query)
        .sort((a, b) => b.clicks - a.clicks)
        .slice(0, 5)
        .map(q => q.query);

      const ctr = current.impressions > 0 ? current.clicks / current.impressions : 0;

      topGainersPages.push({
        url,
        bestQuery: bestQuery.query,
        otherQueries,
        clickGap,
        totalClicks: current.clicks,
        impressions: current.impressions,
        ctr,
        position: bestQuery.position,
        selected: false
      });
    });

    // Sort by click gap (descending)
    return topGainersPages.sort((a, b) => b.clickGap - a.clickGap);
  };

  // Generate AI recommendations for a page
  const generateRecommendations = async (page: TopGainersPage) => {
    if (generatingRecommendations.has(page.url)) return;
    
    setGeneratingRecommendations(prev => new Set(prev).add(page.url));
    
    try {
      const prompt = `You are an Answer Engine Optimization (AEO) expert. Audit the page: ${page.url} for its visibility in LLMs using query '${page.bestQuery}' and optionally other queries: ${page.otherQueries.join(', ')}. 

Current performance:
- Clicks: ${page.totalClicks}
- CTR: ${(page.ctr * 100).toFixed(2)}%
- Position: ${page.position.toFixed(1)}
- Click Gap: +${page.clickGap} clicks vs previous 3 months

Provide specific, actionable recommendations in this JSON format:
{
  "seo_recommendation": "Specific SEO action (e.g., 'Optimize title tag to include primary keyword', 'Improve meta description CTR')",
  "aeo_recommendation": "Specific AEO action focusing on: Add direct answers, FAQ section, schema markup, trusted directories, credibility markers"
}`;

      const response = await openAIService.generateText(prompt);
      
      try {
        const recommendations = JSON.parse(response);
        
        // Update the page with recommendations
        setPages(prev => prev.map(p => 
          p.url === page.url 
            ? { 
                ...p, 
                seoRecommendation: recommendations.seo_recommendation,
                aeoRecommendation: recommendations.aeo_recommendation,
                loadingRecommendations: false
              }
            : p
        ));
      } catch (parseError) {
        console.error('Error parsing AI recommendations:', parseError);
        
        // Fallback recommendations
        setPages(prev => prev.map(p => 
          p.url === page.url 
            ? { 
                ...p, 
                seoRecommendation: "Optimize title and meta description for better CTR",
                aeoRecommendation: "Add FAQ section with direct answers and structured data markup",
                loadingRecommendations: false
              }
            : p
        ));
      }
    } catch (error) {
      console.error('Error generating recommendations:', error);
      toast({
        title: "Recommendation Error",
        description: "Failed to generate AI recommendations. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGeneratingRecommendations(prev => {
        const newSet = new Set(prev);
        newSet.delete(page.url);
        return newSet;
      });
    }
  };

  // Handle page selection
  const handlePageSelection = (url: string, selected: boolean) => {
    setPages(prev => prev.map(page => 
      page.url === url ? { ...page, selected } : page
    ));
    
    // Auto-generate recommendations when page is selected
    if (selected) {
      const page = pages.find(p => p.url === url);
      if (page && !page.seoRecommendation) {
        generateRecommendations(page);
      }
    }
  };

  // Export functions
  const exportToCSV = async () => {
    if (!await trackExport('top_gainers_csv')) return;
    
    try {
      const exportService = new ExportService(user?.id || '', subscriptionType || 'free');
      
      // Create mock report object for export
      const mockReport = {
        id: 'top-gainers-' + Date.now(),
        reportType: 'top_gainers' as const,
        createdAt: new Date().toISOString(),
        data: {
          top_pages: filteredPages.map(page => ({
            url: page.url,
            clicks: page.totalClicks,
            impressions: page.impressions,
            ctr: page.ctr,
            position: page.position,
            seo_recommendation: page.seoRecommendation || 'Generate recommendations first',
            aeo_recommendation: page.aeoRecommendation || 'Generate recommendations first'
          }))
        }
      };
      
      const csvContent = await exportService.exportToCSV(mockReport as any);
      const filename = `top_gainers_report_${new Date().toISOString().split('T')[0]}.csv`;
      
      exportService.downloadCSV(csvContent, filename);
      
      toast({
        title: "Export Successful",
        description: "Top Gainers report exported to CSV",
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export report. Please try again.",
        variant: "destructive",
      });
    }
  };

  const exportToGoogleSheets = async () => {
    if (!await trackExport('top_gainers_sheets')) return;
    
    toast({
      title: "Google Sheets Export",
      description: "Google Sheets integration coming soon. Using CSV export instead.",
    });
    
    // Fallback to CSV for now
    exportToCSV();
  };

  // Load data when component becomes active
  useEffect(() => {
    if (isActive) {
      loadTopGainersData();
    }
  }, [isActive]);

  if (loading) {
    return (
      <DataLoadingOverlay
        progress={50}
        title="Loading Top Gainers Report"
        subtitle="Analyzing your page performance data..."
        isVisible={true}
      />
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Error Loading Report</h3>
          <p className="text-gray-400 mb-4">{error}</p>
          <Button onClick={loadTopGainersData}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Top Gainers Report</h1>
          <p className="text-gray-400 mt-1">
            Pages with positive click growth (last 3 months vs previous 3 months)
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="show-all"
              checked={showAllPages}
              onCheckedChange={setShowAllPages}
            />
            <Label htmlFor="show-all" className="text-sm text-gray-300">
              Show All Pages
            </Label>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportToCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button variant="outline" onClick={exportToGoogleSheets}>
              <Share2 className="h-4 w-4 mr-2" />
              Google Sheets
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Pages</p>
                <p className="text-2xl font-bold text-white">{totalIndexedPages}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Gaining Pages</p>
                <p className="text-2xl font-bold text-green-400">{filteredPages.length}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Selected Pages</p>
                <p className="text-2xl font-bold text-purple-400">{selectedPages.length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Filter Threshold</p>
                <p className="text-2xl font-bold text-yellow-400">
                  {totalIndexedPages < 100 ? 'Any+' : '10+'}
                </p>
              </div>
              <Target className="h-8 w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Top Gaining Pages</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">✅</TableHead>
                  <TableHead>🔗 Page URL</TableHead>
                  <TableHead>🔍 Best Query</TableHead>
                  <TableHead>🔼 Click Gap</TableHead>
                  <TableHead>🖱️ Total Clicks</TableHead>
                  <TableHead>👁️ Impressions</TableHead>
                  <TableHead>📈 CTR</TableHead>
                  <TableHead>📍 Avg Position</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPages.map((page, index) => (
                  <TableRow key={page.url}>
                    <TableCell>
                      <Checkbox
                        checked={page.selected}
                        onCheckedChange={(checked) => 
                          handlePageSelection(page.url, checked as boolean)
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <a
                        href={page.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 flex items-center gap-1"
                      >
                        <span className="truncate max-w-[200px]">{page.url}</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </TableCell>
                    <TableCell className="max-w-[150px] truncate">
                      {page.bestQuery}
                    </TableCell>
                    <TableCell>
                      <Badge variant={page.clickGap > 0 ? "default" : "destructive"}>
                        {page.clickGap > 0 ? '+' : ''}{page.clickGap}
                      </Badge>
                    </TableCell>
                    <TableCell>{page.totalClicks.toLocaleString()}</TableCell>
                    <TableCell>{page.impressions.toLocaleString()}</TableCell>
                    <TableCell>{(page.ctr * 100).toFixed(2)}%</TableCell>
                    <TableCell>{page.position.toFixed(1)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Recommendation Summary Cards */}
      {selectedPages.length > 0 && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">
              Recommendations for Selected Pages ({selectedPages.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="multiple" className="w-full">
              {selectedPages.map((page, index) => (
                <AccordionItem key={page.url} value={`page-${index}`}>
                  <AccordionTrigger className="text-left">
                    <div className="flex items-center justify-between w-full mr-4">
                      <div>
                        <p className="font-medium text-white">
                          {index + 1}. {page.url}
                        </p>
                        <p className="text-sm text-gray-400">
                          {page.totalClicks} clicks • {(page.ctr * 100).toFixed(2)}% CTR • 
                          Position {page.position.toFixed(1)}
                        </p>
                      </div>
                      {generatingRecommendations.has(page.url) && (
                        <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pt-4">
                      {/* SEO Recommendation */}
                      <div>
                        <h4 className="font-medium text-white mb-2 flex items-center gap-2">
                          <Search className="h-4 w-4 text-blue-400" />
                          SEO Recommendation
                        </h4>
                        <div className="bg-gray-700 p-3 rounded-lg">
                          {page.seoRecommendation ? (
                            <p className="text-gray-300">{page.seoRecommendation}</p>
                          ) : (
                            <div className="flex items-center gap-2 text-gray-400">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Generating SEO recommendations...
                            </div>
                          )}
                        </div>
                      </div>

                      {/* AEO Recommendation */}
                      <div>
                        <h4 className="font-medium text-white mb-2 flex items-center gap-2">
                          <Bot className="h-4 w-4 text-purple-400" />
                          🤖 AEO Rec
                        </h4>
                        <div className="bg-gray-700 p-3 rounded-lg">
                          {page.aeoRecommendation ? (
                            <p className="text-gray-300">{page.aeoRecommendation}</p>
                          ) : (
                            <div className="flex items-center gap-2 text-gray-400">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Generating AEO recommendations...
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Best Query Info */}
                      <div>
                        <h4 className="font-medium text-white mb-2">Best Query</h4>
                        <Badge variant="outline">{page.bestQuery}</Badge>
                      </div>

                      {/* Other Queries */}
                      {page.otherQueries.length > 0 && (
                        <div>
                          <h4 className="font-medium text-white mb-2">Other Top Queries</h4>
                          <div className="flex flex-wrap gap-2">
                            {page.otherQueries.map((query, qIndex) => (
                              <Badge key={qIndex} variant="secondary" className="text-xs">
                                {query}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {filteredPages.length === 0 && (
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-8 text-center">
            <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No Top Gainers Found</h3>
            <p className="text-gray-400 mb-4">
              No pages found with positive click growth in the selected criteria.
            </p>
            <Button onClick={loadTopGainersData}>
              Refresh Data
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default TopGainersContent; 