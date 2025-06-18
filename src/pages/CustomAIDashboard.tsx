import { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Search, 
  Zap, 
  AlertCircle,
  Eye,
  ExternalLink,
  Bell,
  Lightbulb,
  BarChart3,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { RenewalOverlay } from '@/components/RenewalOverlay';

// Mock data for suggested reports
const SUGGESTED_REPORTS = [
  {
    id: 'top-gainers',
    title: 'Top Gainers Report',
    description: 'Pages with highest increase in clicks and CTR over last 3 months',
    icon: <TrendingUp className="h-5 w-5 text-green-400" />,
    category: 'Performance',
    estimatedTime: '2-3 min'
  },
  {
    id: 'underperforming-pages',
    title: 'Underperforming Pages',
    description: 'Pages with high impressions but low CTR and poor position trend',
    icon: <TrendingDown className="h-5 w-5 text-red-400" />,
    category: 'Optimization',
    estimatedTime: '3-4 min'
  },
  {
    id: 'emerging-keywords',
    title: 'Emerging Keywords Insight',
    description: 'Keywords that started getting impressions in last 3 months',
    icon: <Search className="h-5 w-5 text-blue-400" />,
    category: 'Discovery',
    estimatedTime: '2-3 min'
  },
  {
    id: 'bofu-traffic-drop',
    title: 'BoFu Pages with Traffic Drop',
    description: 'Bottom-funnel pages experiencing significant traffic decline',
    icon: <Target className="h-5 w-5 text-orange-400" />,
    category: 'Conversion',
    estimatedTime: '3-5 min'
  },
  {
    id: 'ranking-volatility',
    title: 'Ranking Position Volatility',
    description: 'Pages with unstable ranking positions requiring attention',
    icon: <BarChart3 className="h-5 w-5 text-purple-400" />,
    category: 'Stability',
    estimatedTime: '4-5 min'
  },
  {
    id: 'quick-wins',
    title: 'Quick Wins Report',
    description: 'Low-effort, high-impact optimization opportunities',
    icon: <Zap className="h-5 w-5 text-yellow-400" />,
    category: 'Optimization',
    estimatedTime: '1-2 min'
  }
];

// Mock data for report preview
const MOCK_REPORT_DATA = [
  {
    url: '/blog/guide-to-seo',
    clicks: 110,
    ctr: 3.4,
    position: 14.2,
    action: 'Optimize meta description',
    priority: 'High'
  },
  {
    url: '/product/pricing',
    clicks: 80,
    ctr: 2.1,
    position: 11.7,
    action: 'Review page copy',
    priority: 'Medium'
  },
  {
    url: '/case-study/example',
    clicks: 63,
    ctr: 4.0,
    position: 19.8,
    action: 'Add internal links',
    priority: 'Medium'
  },
  {
    url: '/resources/templates',
    clicks: 45,
    ctr: 1.8,
    position: 8.3,
    action: 'Improve title tag',
    priority: 'High'
  },
  {
    url: '/blog/best-practices',
    clicks: 38,
    ctr: 2.9,
    position: 16.5,
    action: 'Update content',
    priority: 'Low'
  }
];

export default function CustomAIDashboard() {
  const [promptInput, setPromptInput] = useState('');
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [showNotifyModal, setShowNotifyModal] = useState(false);

  const handleUseReport = (reportId: string) => {
    setSelectedReport(reportId);
    // Show tooltip or modal indicating coming soon
  };

  const handleGenerateReport = () => {
    // Show tooltip indicating coming soon
  };

  const handleNotifyMe = () => {
    setShowNotifyModal(true);
    // In real implementation, this would collect email for beta waitlist
  };

  return (
    <DashboardLayout title="Custom AI Dashboard" fullScreen={true}>
      <RenewalOverlay>
        <div className="w-full p-6 space-y-6">
          {/* Coming Soon Banner */}
          <Card className=" from-blue-900/20 to-purple-900/20 border-blue-700/50 bg-[#1f2937]">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4 ">
                <div className="p-2 bg-blue-600/20 rounded-lg">
                  <Sparkles className="h-6 w-6 text-blue-400" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-white mb-2">
                    Custom AI Dashboard is coming soon! 🚀
                  </h2>
                  <p className="text-gray-300 mb-4">
                    Use built-in prompts or describe your own insights—powered by AI. 
                    2 reports per month, tailored to your GSC data.
                  </p>
                  <div className="flex gap-3">
                    <Button 
                      onClick={handleNotifyMe}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Bell className="h-4 w-4 mr-2" />
                      Join Beta Waitlist
                    </Button>
                    <Badge variant="outline" className="border-yellow-600 text-yellow-400 bg-yellow-900/20">
                      🧪 Coming Soon
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Usage Limit Indicator */}
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-medium text-white">Monthly Usage</h3>
                <Badge variant="outline" className="border-gray-600 text-gray-400">
                  0 of 2 reports used
                </Badge>
              </div>
              <Progress value={0} className="h-2 mb-2" />
              <p className="text-sm text-gray-400">
                AI-generated reports are limited to 2 per month to ensure quality insights.
              </p>
            </CardContent>
          </Card>

          {/* Suggested AI Reports */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-400" />
                Suggested AI Reports
              </CardTitle>
              <CardDescription className="text-gray-400">
                Pre-built AI prompts tailored for common SEO analysis needs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {SUGGESTED_REPORTS.map((report) => (
                  <Card 
                    key={report.id} 
                    className="bg-gray-700 border-gray-600 hover:border-gray-500 transition-colors cursor-pointer group"
                    onClick={() => handleUseReport(report.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3 mb-3">
                        {report.icon}
                        <div className="flex-1">
                          <h4 className="font-medium text-white group-hover:text-blue-400 transition-colors">
                            {report.title}
                          </h4>
                          <Badge 
                            variant="outline" 
                            className="text-xs mt-1 border-gray-500 text-gray-400"
                          >
                            {report.category}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-sm text-gray-300 mb-3 leading-relaxed">
                        {report.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">
                          Est. {report.estimatedTime}
                        </span>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="bg-gray-600 border-gray-500 text-gray-300 hover:bg-gray-500 hover:text-white opacity-50 cursor-not-allowed"
                          disabled
                        >
                          <Zap className="h-3 w-3 mr-1" />
                          Use Report
                        </Button>
                      </div>
                      {selectedReport === report.id && (
                        <div className="mt-2 p-2 bg-blue-900/20 border border-blue-700/50 rounded text-xs text-blue-400">
                          Coming soon! This feature is in development.
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Freeform Prompt Section */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-400" />
                Write Your Own Prompt
              </CardTitle>
              <CardDescription className="text-gray-400">
                Describe the insights you want to discover from your GSC data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="e.g. Pages with increasing position but falling CTR, or Keywords that competitors rank for but we don't..."
                value={promptInput}
                onChange={(e) => setPromptInput(e.target.value)}
                className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 min-h-[100px] resize-none"
                disabled
              />
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">
                  Tip: Be specific about metrics, timeframes, and page types
                </span>
                <Button 
                  onClick={handleGenerateReport}
                  disabled
                  className="bg-purple-600 hover:bg-purple-700 text-white opacity-50 cursor-not-allowed"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Report
                </Button>
              </div>
              <div className="p-3 bg-yellow-900/20 border border-yellow-700/50 rounded-lg">
                <div className="flex items-center gap-2 text-yellow-400 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>Custom prompts coming soon! Join the beta waitlist to be notified.</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Mock Report Preview */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Eye className="h-5 w-5 text-green-400" />
                    Preview: Quick Wins Report
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Sample AI-generated report showing optimization opportunities
                  </CardDescription>
                </div>
                <Badge variant="outline" className="border-green-600 text-green-400 bg-green-900/20">
                  Sample Report
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Mock Filters */}
              <div className="flex flex-wrap gap-3 p-3 bg-gray-700/50 rounded-lg border border-gray-600">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-400">Filters:</span>
                  <Badge variant="outline" className="border-gray-500 text-gray-300 opacity-50">
                    Last 30 days
                  </Badge>
                  <Badge variant="outline" className="border-gray-500 text-gray-300 opacity-50">
                    All Keywords
                  </Badge>
                  <Badge variant="outline" className="border-gray-500 text-gray-300 opacity-50">
                    All Categories
                  </Badge>
                </div>
              </div>

              {/* Mock Report Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <Card className="bg-gray-700 border-gray-600">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-green-400 mb-1">12</div>
                    <div className="text-sm text-gray-400">Quick Win Opportunities</div>
                  </CardContent>
                </Card>
                <Card className="bg-gray-700 border-gray-600">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-blue-400 mb-1">+847</div>
                    <div className="text-sm text-gray-400">Potential Monthly Clicks</div>
                  </CardContent>
                </Card>
                <Card className="bg-gray-700 border-gray-600">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-purple-400 mb-1">2.3x</div>
                    <div className="text-sm text-gray-400">Avg. CTR Improvement</div>
                  </CardContent>
                </Card>
              </div>

              {/* Mock Data Table */}
              <div className="rounded-md border border-gray-700 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-700 hover:bg-gray-700/50">
                      <TableHead className="text-gray-300">URL</TableHead>
                      <TableHead className="text-gray-300 text-right">Clicks</TableHead>
                      <TableHead className="text-gray-300 text-right">CTR</TableHead>
                      <TableHead className="text-gray-300 text-right">Position</TableHead>
                      <TableHead className="text-gray-300">Action</TableHead>
                      <TableHead className="text-gray-300">Priority</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {MOCK_REPORT_DATA.map((row, index) => (
                      <TableRow key={index} className="border-gray-700 hover:bg-gray-700/50">
                        <TableCell className="font-medium text-white max-w-xs truncate">
                          {row.url}
                        </TableCell>
                        <TableCell className="text-right text-gray-300">
                          {row.clicks}
                        </TableCell>
                        <TableCell className="text-right text-gray-300">
                          {row.ctr}%
                        </TableCell>
                        <TableCell className="text-right text-gray-300">
                          {row.position}
                        </TableCell>
                        <TableCell className="text-gray-300">
                          {row.action}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "text-xs",
                              row.priority === 'High' && "border-red-600 text-red-400 bg-red-900/20",
                              row.priority === 'Medium' && "border-yellow-600 text-yellow-400 bg-yellow-900/20",
                              row.priority === 'Low' && "border-green-600 text-green-400 bg-green-900/20"
                            )}
                          >
                            {row.priority}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mock Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                <div className="text-sm text-gray-400">
                  AI Analysis completed in 2.3 seconds
                </div>
                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    disabled
                    className="bg-gray-700 border-gray-600 text-gray-300 opacity-50 cursor-not-allowed"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Export Report
                  </Button>
                  <Button 
                    disabled
                    className="bg-blue-600 hover:bg-blue-700 text-white opacity-50 cursor-not-allowed"
                  >
                    View Full Report
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>

              {/* Coming Soon Notice */}
              <div className="p-4 bg-blue-900/20 border border-blue-700/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Sparkles className="h-5 w-5 text-blue-400" />
                  <div>
                    <p className="text-blue-400 font-medium">This is a preview of what's coming!</p>
                    <p className="text-sm text-gray-300 mt-1">
                      Real AI-powered reports will analyze your actual GSC data and provide personalized insights.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </RenewalOverlay>

      {/* Beta Waitlist Modal (simplified) */}
      {showNotifyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="bg-gray-800 border-gray-700 w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle className="text-white">Join Beta Waitlist</CardTitle>
              <CardDescription className="text-gray-400">
                Be the first to know when Custom AI Dashboard launches
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input 
                placeholder="Enter your email address"
                className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
              />
              <div className="flex gap-3">
                <Button 
                  onClick={() => setShowNotifyModal(false)}
                  variant="outline"
                  className="flex-1 bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={() => setShowNotifyModal(false)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Notify Me
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </DashboardLayout>
  );
} 