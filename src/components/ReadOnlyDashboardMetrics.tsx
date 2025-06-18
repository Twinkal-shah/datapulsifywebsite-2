import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface ReadOnlyDashboardMetricsProps {
  gscProperty: string;
  metrics: {
    totalClicks: number;
    totalImpressions: number;
    avgCtr: number;
    avgPosition: number;
    clicksChange: number;
    impressionsChange: number;
    ctrChange: number;
    positionChange: number;
  };
}

export function ReadOnlyDashboardMetrics({ gscProperty, metrics }: ReadOnlyDashboardMetricsProps) {
  const formatMetric = (value: number, isPercentage = false) => {
    if (isPercentage) {
      return value.toFixed(1) + '%';
    }
    return value >= 1000 ? value.toLocaleString() : value.toString();
  };

  const renderChange = (change: number, inverse = false) => {
    const isPositive = inverse ? change < 0 : change > 0;
    const Icon = isPositive ? TrendingUp : TrendingDown;
    const colorClass = isPositive ? 'text-green-500' : 'text-red-500';

    return (
      <div className={`flex items-center ${colorClass}`}>
        <Icon className="h-4 w-4 mr-1" />
        <span>{Math.abs(change).toFixed(1)}%</span>
      </div>
    );
  };

  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-400">Total Clicks</CardTitle>
          {renderChange(metrics.clicksChange)}
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-300">{formatMetric(metrics.totalClicks)}</div>
        </CardContent>
      </Card>

      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-400">Total Impressions</CardTitle>
          {renderChange(metrics.impressionsChange)}
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-300">{formatMetric(metrics.totalImpressions)}</div>
        </CardContent>
      </Card>

      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-400">Average CTR</CardTitle>
          {renderChange(metrics.ctrChange)}
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-300">{formatMetric(metrics.avgCtr * 100, true)}</div>
        </CardContent>
      </Card>

      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-400">Average Position</CardTitle>
          {renderChange(metrics.positionChange, true)}
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-300">{formatMetric(metrics.avgPosition, false)}</div>
        </CardContent>
      </Card>
    </div>
  );
} 