import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

interface ReadOnlyPerformanceTrendProps {
  gscProperty: string;
  data: {
    labels: string[];
    clicks: number[];
    impressions: number[];
    ctr: number[];
    position: number[];
  };
}

export function ReadOnlyPerformanceTrend({ gscProperty, data }: ReadOnlyPerformanceTrendProps) {
  // Transform the data for the chart
  const chartData = data.labels.map((label, index) => ({
    date: label,
    clicks: data.clicks[index],
    impressions: data.impressions[index],
    ctr: data.ctr[index],
    position: data.position[index]
  }));

  return (
    <Card className="bg-gray-800/50 border-gray-700">
      <CardHeader>
        <CardTitle className="text-lg font-medium text-gray-300">Performance Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="date" 
                stroke="#9CA3AF"
                tick={{ fill: '#9CA3AF' }}
              />
              <YAxis 
                stroke="#9CA3AF"
                tick={{ fill: '#9CA3AF' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937',
                  border: '1px solid #374151',
                  borderRadius: '0.375rem'
                }}
                labelStyle={{ color: '#D1D5DB' }}
                itemStyle={{ color: '#D1D5DB' }}
              />
              <Legend 
                wrapperStyle={{ color: '#D1D5DB' }}
              />
              <Line 
                type="monotone" 
                dataKey="clicks" 
                stroke="#3B82F6" 
                strokeWidth={2}
                dot={false}
              />
              <Line 
                type="monotone" 
                dataKey="impressions" 
                stroke="#10B981" 
                strokeWidth={2}
                dot={false}
              />
              <Line 
                type="monotone" 
                dataKey="ctr" 
                stroke="#F59E0B" 
                strokeWidth={2}
                dot={false}
              />
              <Line 
                type="monotone" 
                dataKey="position" 
                stroke="#EF4444" 
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
} 