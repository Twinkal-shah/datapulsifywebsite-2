import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Bot,
  FileText,
  Lightbulb,
  Target,
  ExternalLink
} from 'lucide-react';

interface EnhancedTopGainersReportProps {
  report: any;
  selectedPages: Set<string>;
  onPageSelect: (url: string, checked: boolean) => void;
}

export function EnhancedTopGainersReport({ report, selectedPages, onPageSelect }: EnhancedTopGainersReportProps) {
  if (!report?.data) return null;

  return (
    <div className="space-y-6">
      {/* Enhanced Summary Section */}
      {report.data?.summary && (
        <Card className="bg-gray-700 border-gray-600">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-400" />
              Summary Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">{report.data.summary.totalGainerPages}</div>
                <div className="text-sm text-gray-400">Gainer Pages</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">{report.data.summary.netClicksGained.toLocaleString()}</div>
                <div className="text-sm text-gray-400">Net Clicks Gained</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400">
                  {report.data.summary.avgCtrImprovement > 0 ? '+' : ''}{report.data.summary.avgCtrImprovement.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-400">Avg CTR Improvement</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-green-400 font-medium">TOP GAINING PAGE</div>
                {report.data.summary.topGainingPage ? (
                  <>
                    <div className="text-sm font-medium text-white truncate">
                      {report.data.summary.topGainingPage.pageType}
                    </div>
                    <div className="text-xs text-gray-400">
                      +{report.data.summary.topGainingPage.clicksGained} clicks
                    </div>
                  </>
                ) : (
                  <div className="text-sm text-gray-400">No data</div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enhanced Table */}
      <Card className="bg-gray-700 border-gray-600">
        <CardHeader>
          <CardTitle className="text-white">Top Gainers Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-600 hover:bg-gray-600/50">
                  <TableHead className="text-gray-300">Select</TableHead>
                  <TableHead className="text-gray-300">URL</TableHead>
                  <TableHead className="text-gray-300">Type</TableHead>
                  <TableHead className="text-gray-300 text-right">Clicks Gained</TableHead>
                  <TableHead className="text-gray-300 text-right">CTR Improvement</TableHead>
                  <TableHead className="text-gray-300 text-right">Position Change</TableHead>
                  <TableHead className="text-gray-300">Top Query</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.data.top_pages?.map((row: any, index: number) => (
                  <TableRow key={index} className="border-gray-600 hover:bg-gray-600/50">
                    <TableCell>
                      <Checkbox
                        checked={selectedPages.has(row.url)}
                        onCheckedChange={(checked) => onPageSelect(row.url, checked as boolean)}
                      />
                    </TableCell>
                    <TableCell className="font-medium text-white max-w-xs">
                      <a href={row.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline flex items-center gap-1">
                        <span className="truncate">{row.url.replace(/^https?:\/\//, '').replace(/\/$/, '')}</span>
                        <ExternalLink className="h-3 w-3 flex-shrink-0" />
                      </a>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">{row.pageType || 'Content Page'}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="default" className="bg-green-600 text-xs">
                        +{row.clicksGained || 0}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={(row.ctrImprovement || 0) > 0 ? "default" : "destructive"} className="text-xs">
                        {(row.ctrImprovement || 0) > 0 ? '+' : ''}{((row.ctrImprovement || 0) * 100).toFixed(1)}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={(row.positionChange || 0) > 0 ? "default" : "secondary"} className="text-xs">
                        {(row.positionChange || 0) > 0 ? '+' : ''}{(row.positionChange || 0).toFixed(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <span className="text-xs text-blue-400 truncate block">{row.topQuery || 'Loading...'}</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* AI Success Patterns */}
      {(report.data?.aiPatterns || report.data?.nextSteps) && (
        <Card className="bg-gray-700 border-gray-600">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Bot className="h-5 w-5 text-purple-400" />
              AI-Inferred Success Patterns
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {report.data.aiPatterns && report.data.aiPatterns.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-yellow-400" />
                    Identified Success Patterns
                  </h4>
                  <ul className="space-y-2">
                    {report.data.aiPatterns.map((pattern: string, index: number) => (
                      <li key={index} className="flex items-start gap-2 text-gray-300">
                        <span className="text-green-400 mt-1">•</span>
                        <span className="text-sm">{pattern}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {report.data.nextSteps && report.data.nextSteps.length > 0 && (
                <div>
                  <Separator className="bg-gray-600" />
                  <div className="pt-4">
                    <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                      <Target className="h-4 w-4 text-blue-400" />
                      Next Steps Recommendations
                    </h4>
                    <ul className="space-y-2">
                      {report.data.nextSteps.map((step: string, index: number) => (
                        <li key={index} className="flex items-start gap-2 text-gray-300">
                          <span className="text-blue-400 mt-1">{index + 1}.</span>
                          <span className="text-sm">{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default EnhancedTopGainersReport;
