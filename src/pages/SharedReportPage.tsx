import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { ReadOnlyDashboardMetrics } from '@/components/ReadOnlyDashboardMetrics';
import { ReadOnlyPerformanceTrend } from '@/components/ReadOnlyPerformanceTrend';
import { formatGSCPropertyUrl } from '@/lib/utils';
// Import your actual dashboard components or simplified read-only versions
// e.g., import { ReadOnlyDashboardMetrics } from '@/components/ReadOnlyDashboardMetrics';
// e.g., import { ReadOnlyRankTrackerView } from '@/components/ReadOnlyRankTrackerView';

interface SharedReportFilters {
  dateRange: { startDate: string; endDate: string };
  comparisonRange: { startDate: string; endDate: string };
  selectedRange: string;
  keywordTypeFilter: string;
  keywordCategoryFilter: string;
  countryFilter: string;
  deviceFilter: string;
  selectedUrlFilter: string | null;
  // Add other filter types here if they were included during link generation
  // performanceTrendGranularity?: string;
  // chartMetric?: string;
  // rankingTimeView?: string;
}

interface SharedReportConfig {
  gscProperty: string;
  components: string[];
  filters: SharedReportFilters;
  created_at: string;
  gscData: {
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
    performanceTrend: {
      labels: string[];
      clicks: number[];
      impressions: number[];
      ctr: number[];
      position: number[];
    };
  };
}

const SharedReportPage = () => {
  const { token } = useParams<{ token: string }>();
  const [reportConfig, setReportConfig] = useState<SharedReportConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError('No share token provided in the URL.');
      setLoading(false);
      return;
    }

    const fetchReportConfig = async () => {
      setLoading(true);
      setError(null);
      try {
        const edgeFunctionUrl = `https://yevkfoxoefssdgsodtzd.supabase.co/functions/v1/get-shared-report-config/${token}`;

        console.log('Fetching shared report config...');

        const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

        const response = await fetch(edgeFunctionUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'apikey': anonKey,
            'Authorization': `Bearer ${anonKey}`
          },
        });

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('This shared report link has expired or is no longer available.');
          } else {
            const errorData = await response.json().catch(() => null);
            throw new Error(errorData?.error || 'Failed to load the shared report. Please try again later.');
          }
        }

        const data = await response.json();
        
        console.log('Received data from API:', data);
        
        if (!data.filters || !data.components || !data.gscProperty) {
          throw new Error('The shared report data is incomplete or corrupted.');
        }

        // Add validation for GSC data
        if (!data.gscData) {
          console.error('Missing GSC data in response:', data);
          throw new Error('The shared report is missing GSC data.');
        }

        if (!data.gscData.metrics || !data.gscData.performanceTrend) {
          console.error('Incomplete GSC data structure:', data.gscData);
          throw new Error('The shared report has incomplete GSC data.');
        }

        setReportConfig({
          ...data,
          gscProperty: data.gscProperty
        });

        console.log('Set report config with data:', data);
      } catch (err: any) {
        console.error("Error:", err);
        setError(err.message || 'An unexpected error occurred while loading the shared report.');
      } finally {
        setLoading(false);
      }
    };

    fetchReportConfig();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-[#0f1115] to-gray-900 flex items-center justify-center text-white">
        <div className="text-xl flex items-center gap-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
          Loading shared report data...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-[#0f1115] to-gray-900 flex items-center justify-center text-white">
        <div className="text-center p-8 bg-red-900/30 border border-red-700 rounded-lg max-w-md">
          <h1 className="text-2xl font-bold mb-4 text-red-400">Access Error</h1>
          <p className="text-red-300 mb-6">{error}</p>
          <a href="/" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium">
            Go to Homepage
          </a>
        </div>
      </div>
    );
  }

  if (!reportConfig) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-[#0f1115] to-gray-900 flex items-center justify-center text-white">
        <p>No report data found for this link.</p>
      </div>
    );
  }

  // The GSC property URL is already formatted at this point
  const formattedGscProperty = reportConfig.gscProperty;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-[#0f1115] to-gray-900 text-white p-4 sm:p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2">Shared Report</h1>
          <p className="text-lg text-gray-400">Viewing data for: <span className="font-semibold text-blue-400">{formattedGscProperty}</span></p>
          <p className="text-xs text-gray-500 mt-1">Generated: {new Date(reportConfig.created_at).toLocaleString()}</p>
        </header>

        <div className="space-y-8">
          {reportConfig.components.length === 0 && (
            <div className="p-6 border border-gray-700 rounded-lg bg-gray-800/50 shadow-xl text-center">
              <h2 className="text-xl font-semibold mb-3 text-yellow-400">No Components Selected</h2>
              <p className="text-gray-400">The creator of this shared link did not select any specific report components to display.</p>
            </div>
          )}

          {reportConfig.components.includes('dashboard') && (
            <section className="space-y-6">
              {reportConfig.gscData ? (
                <>
                  <ReadOnlyDashboardMetrics 
                    gscProperty={formattedGscProperty}
                    metrics={reportConfig.gscData.metrics}
                  />
                  {reportConfig.gscData.performanceTrend && (
                    <ReadOnlyPerformanceTrend
                      gscProperty={formattedGscProperty}
                      data={reportConfig.gscData.performanceTrend}
                    />
                  )}
                </>
              ) : (
                <div className="p-6 border border-red-700 rounded-lg bg-red-900/30 shadow-xl text-center">
                  <h2 className="text-xl font-semibold mb-3 text-red-400">Missing GSC Data</h2>
                  <p className="text-gray-300">The shared report is missing Google Search Console data.</p>
                </div>
              )}
            </section>
          )}

          {reportConfig.components.includes('rankTracker') && (
            <section className="p-6 border border-gray-700 rounded-lg bg-gray-800/50 shadow-xl">
              <h2 className="text-2xl font-semibold mb-4 text-green-400 border-b border-gray-700 pb-2">Rank Tracker (Read-Only)</h2>
              {/* 
                Example: <ReadOnlyRankTrackerView filters={reportConfig.filters} gscProperty={reportConfig.gscProperty} /> 
              */}
              <p className="text-gray-300">Displaying rank tracking data based on the shared filters.</p>
               <div className="mt-3 p-4 bg-gray-900/70 rounded text-sm border border-gray-600">
                <h4 className="font-semibold text-gray-400 mb-1">Shared Filters Also Apply Here:</h4>
                <p className="text-gray-500 text-xs">(Rank Tracker specific views would use these filters)</p>
              </div>
              <p className="mt-4 text-sm text-gray-500 italic">
                (Placeholder: Full Rank Tracker component/data rendering would go here.)
              </p>
            </section>
          )}

          {/* You can add more sections here for other components based on `reportConfig.components` */}
          {/* For example, if you add 'keywordAnalysis' to your ShareReportModal:
          {reportConfig.components.includes('keywordAnalysis') && (
            <section className="p-6 border border-gray-700 rounded-lg bg-gray-800/50 shadow-xl">
              <h2 className="text-2xl font-semibold mb-4 text-purple-400 border-b border-gray-700 pb-2">Keyword Analysis (Read-Only)</h2>
              <p className="text-gray-300">Displaying keyword analysis data.</p>
              <p className="mt-4 text-sm text-gray-500 italic">
                (Placeholder: Full Keyword Analysis component/data rendering.)
              </p>
            </section>
          )}
          */}
        </div>

        <footer className="mt-12 pt-6 border-t border-gray-700 text-center">
          <p className="text-sm text-gray-500">
            This is a read-only shared view. No actions can be performed.
          </p>
          <p className="text-xs text-gray-600 mt-1">
            Report generated via Datapulsify.
          </p>
        </footer>
      </div>
    </div>
  );
};

export default SharedReportPage; 