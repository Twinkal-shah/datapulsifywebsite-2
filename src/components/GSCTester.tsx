import React, { useState } from 'react';
import { GSCService, GSCDataPoint } from '@/lib/gscService';

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'error';
  data?: any;
  error?: string;
  duration?: number;
}

export const GSCTester: React.FC = () => {
  const [results, setResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  const addResult = (result: TestResult) => {
    setResults(prev => [...prev, result]);
  };

  const updateResult = (index: number, update: Partial<TestResult>) => {
    setResults(prev => {
      const newResults = [...prev];
      newResults[index] = { ...newResults[index], ...update };
      return newResults;
    });
  };

  const runTests = async () => {
    setIsRunning(true);
    setResults([]);
    const gscService = new GSCService();
    gscService['isTestMode'] = true;

    // Test 1: Authentication
    addResult({ name: 'Authentication Check', status: 'pending' });
    try {
      const startTime = performance.now();
      const token = await gscService['getToken']();
      const siteUrl = await gscService['getSiteUrl']();
      const duration = performance.now() - startTime;

      if (!token || !siteUrl) {
        throw new Error('Missing authentication or site URL');
      }

      addResult({
        name: 'Authentication Check',
        status: 'success',
        data: { hasToken: !!token, siteUrl },
        duration
      });
    } catch (error) {
      addResult({
        name: 'Authentication Check',
        status: 'error',
        error: error.message
      });
      setIsRunning(false);
      return;
    }

    // Test 2: Top Queries
    const queriesIndex = results.length;
    addResult({ name: 'Top Queries Test', status: 'pending' });
    try {
      const startTime = performance.now();
      const siteUrl = await gscService['getSiteUrl']();
      const queries = await gscService.getTopQueries(
        siteUrl!,
        startDate,
        endDate
      );
      const duration = performance.now() - startTime;

      if (!queries || queries.length === 0) {
        throw new Error('No queries returned');
      }

      // Check for realistic data patterns
      const hasRealisticData = queries.some(q => 
        q.clicks > 0 && q.impressions > q.clicks && q.ctr <= 1
      );

      if (!hasRealisticData) {
        throw new Error('WARNING: Data patterns look unrealistic!');
      }

      updateResult(queriesIndex, {
        status: 'success',
        data: {
          queryCount: queries.length,
          sampleQueries: queries.slice(0, 3),
          totalClicks: queries.reduce((sum, q) => sum + q.clicks, 0),
          totalImpressions: queries.reduce((sum, q) => sum + q.impressions, 0)
        },
        duration
      });
    } catch (error) {
      updateResult(queriesIndex, {
        status: 'error',
        error: error.message
      });
    }

    // Test 3: Metrics
    const metricsIndex = results.length;
    addResult({ name: 'Metrics Test', status: 'pending' });
    try {
      const startTime = performance.now();
      const siteUrl = await gscService['getSiteUrl']();
      const metrics = await gscService.getAggregatedMetrics(
        siteUrl!,
        startDate,
        endDate
      );
      const duration = performance.now() - startTime;

      if (metrics.totalClicks === 0 && metrics.totalImpressions === 0) {
        throw new Error('Metrics returned zero values - possible mock data');
      }

      updateResult(metricsIndex, {
        status: 'success',
        data: {
          ...metrics,
          avgCtr: (metrics.avgCtr * 100).toFixed(2) + '%',
          avgPosition: metrics.avgPosition.toFixed(2)
        },
        duration
      });
    } catch (error) {
      updateResult(metricsIndex, {
        status: 'error',
        error: error.message
      });
    }

    // Test 4: Trend Data
    const trendIndex = results.length;
    addResult({ name: 'Trend Data Test', status: 'pending' });
    try {
      const startTime = performance.now();
      const siteUrl = await gscService['getSiteUrl']();
      const trends = await gscService.getTrendData(
        siteUrl!,
        startDate,
        endDate
      );
      const duration = performance.now() - startTime;

      if (!trends.labels.length) {
        throw new Error('No trend data returned');
      }

      // Check for realistic data patterns
      const hasVariation = trends.clicks.some((val, i) => 
        i > 0 && val !== trends.clicks[i-1]
      );

      if (!hasVariation) {
        throw new Error('WARNING: Data looks suspicious (no variation in values)');
      }

      updateResult(trendIndex, {
        status: 'success',
        data: {
          daysCount: trends.labels.length,
          dateRange: `${trends.labels[0]} to ${trends.labels[trends.labels.length-1]}`,
          totalClicks: trends.clicks.reduce((sum, val) => sum + val, 0),
          totalImpressions: trends.impressions.reduce((sum, val) => sum + val, 0),
          avgCtr: (trends.ctr.reduce((sum, val) => sum + val, 0) / trends.ctr.length).toFixed(2) + '%'
        },
        duration
      });
    } catch (error) {
      updateResult(trendIndex, {
        status: 'error',
        error: error.message
      });
    }

    // Test 5: Cache Performance
    const cacheIndex = results.length;
    addResult({ name: 'Cache Performance Test', status: 'pending' });
    try {
      const siteUrl = await gscService['getSiteUrl']();
      
      // First request
      const uncachedStart = performance.now();
      await gscService.getTopQueries(siteUrl!, startDate, endDate);
      const uncachedDuration = performance.now() - uncachedStart;

      // Second request (should be cached)
      const cachedStart = performance.now();
      await gscService.getTopQueries(siteUrl!, startDate, endDate);
      const cachedDuration = performance.now() - cachedStart;

      const improvement = ((uncachedDuration - cachedDuration) / uncachedDuration * 100).toFixed(2);

      updateResult(cacheIndex, {
        status: 'success',
        data: {
          uncachedDuration: `${uncachedDuration.toFixed(2)}ms`,
          cachedDuration: `${cachedDuration.toFixed(2)}ms`,
          improvement: `${improvement}% faster`
        },
        duration: uncachedDuration + cachedDuration
      });
    } catch (error) {
      updateResult(cacheIndex, {
        status: 'error',
        error: error.message
      });
    }

    setIsRunning(false);
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">GSC Implementation Tester</h2>
        <div className="flex gap-4">
          <div>
            <label className="block text-sm text-gray-600">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1 px-2 py-1 border rounded"
              max={endDate}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="mt-1 px-2 py-1 border rounded"
              min={startDate}
              max={new Date().toISOString().split('T')[0]}
            />
          </div>
        </div>
      </div>
      
      <button
        onClick={runTests}
        disabled={isRunning}
        className={`w-full px-4 py-2 rounded-lg text-white font-medium ${
          isRunning 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-blue-500 hover:bg-blue-600'
        }`}
      >
        {isRunning ? 'Running Tests...' : 'Run Tests'}
      </button>

      <div className="mt-6 space-y-4">
        {results.map((result, index) => (
          <div 
            key={index} 
            className={`p-4 rounded-lg ${
              result.status === 'pending' ? 'bg-yellow-50 border border-yellow-200' :
              result.status === 'success' ? 'bg-green-50 border border-green-200' :
              'bg-red-50 border border-red-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-medium">
                {result.name}
              </h3>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                result.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                result.status === 'success' ? 'bg-green-100 text-green-800' :
                'bg-red-100 text-red-800'
              }`}>
                {result.status.toUpperCase()}
                {result.duration && ` (${result.duration.toFixed(0)}ms)`}
              </span>
            </div>
            
            {result.data && (
              <div className="mt-2 bg-white rounded p-2 overflow-x-auto">
                <pre className="text-sm text-gray-700">
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              </div>
            )}
            
            {result.error && (
              <p className="mt-2 text-sm text-red-600">
                ❌ {result.error}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}; 