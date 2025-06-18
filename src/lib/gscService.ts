import { CacheManager } from './cacheManager';
import { GoogleAuthService } from './googleAuthService';

// Types
interface GSCSearchAnalyticsParams {
  startDate: string;
  endDate: string;
  dimensions?: string[];
  rowLimit?: number;
  siteUrl: string;
  searchType?: 'web' | 'image' | 'video' | 'news' | 'discover' | 'googleNews';
  dimensionFilterGroups?: any[];
  startRow?: number;
}

interface GSCDataRow {
  keys: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface GSCDataPoint {
  query: string;
  page?: string;
  device?: string;
  country?: string;
  date?: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  intent?: string;
  type?: string;
}

export class GSCService {
  private cache: CacheManager;
  private requestQueue: any[] = [];
  private isProcessingQueue = false;
  private readonly RATE_LIMIT = 10; // requests per second
  private isTestMode = false;
  private googleAuthService: GoogleAuthService;
  
  constructor() {
    this.cache = new CacheManager();
    this.googleAuthService = new GoogleAuthService();
  }

  private async getToken(): Promise<string | null> {
    // Use validateAndRefreshToken to ensure we have a valid token
    const validToken = await this.googleAuthService.validateAndRefreshToken();
    if (!validToken) {
      console.error('Failed to get valid GSC token');
      throw new Error('Invalid or expired GSC token. Please reconnect to Google Search Console.');
    }
    return validToken;
  }

  // Updated to accept siteUrl parameter or fallback to localStorage for backward compatibility
  private async getSiteUrl(siteUrl?: string): Promise<string | null> {
    if (siteUrl) {
      return siteUrl;
    }
    return localStorage.getItem('gsc_property');
  }

  private validateMetrics(metrics: any) {
    if (!metrics || typeof metrics !== 'object') {
      throw new Error('Invalid metrics data structure');
    }

    if (metrics.totalClicks < 0 || metrics.totalImpressions < 0) {
      throw new Error('Invalid metrics: negative values detected');
    }

    if (metrics.totalImpressions < metrics.totalClicks) {
      throw new Error('Invalid metrics: clicks exceed impressions');
    }

    if (metrics.avgCtr < 0 || metrics.avgCtr > 1) {
      throw new Error('Invalid CTR value: must be between 0 and 1');
    }

    if (metrics.avgPosition < 0 || metrics.avgPosition > 100) {
      throw new Error('Invalid position value: must be between 0 and 100');
    }

    return metrics;
  }

  private validateSearchAnalyticsData(data: GSCDataPoint[]) {
    if (!Array.isArray(data)) {
      throw new Error('Invalid data structure: expected array');
    }

    return data.map((item, index) => {
      // Create a new object to avoid mutating the original
      const validatedItem = { ...item };

      // Validate and fix impressions/clicks
      if (validatedItem.impressions < validatedItem.clicks) {
        console.warn(`Data validation warning: clicks exceed impressions for item ${index}`);
        validatedItem.impressions = Math.max(validatedItem.clicks, validatedItem.impressions);
      }

      // Validate and fix CTR
      if (validatedItem.ctr < 0 || validatedItem.ctr > 1) {
        console.warn(`Data validation warning: invalid CTR for item ${index}`);
        validatedItem.ctr = validatedItem.impressions > 0 ? 
          validatedItem.clicks / validatedItem.impressions : 0;
      }

      // Validate and fix position
      if (validatedItem.position < 1 || validatedItem.position > 100 || !Number.isFinite(validatedItem.position)) {
        console.warn(`Data validation warning: invalid position for item ${index}`);
        // Set to a reasonable default (100 is the worst possible position)
        validatedItem.position = 100;
      }

      return validatedItem;
    });
  }

  // Add this function at the top of the class
  private formatSiteUrlForApi(siteUrl: string): string {
    if (!siteUrl) return '';
    
    // Remove any protocol prefix if it exists
    let cleanUrl = siteUrl.replace(/^https?:\/\//, '');
    
    // If it's in sc-domain: format
    if (cleanUrl.startsWith('sc-domain:')) {
      return cleanUrl; // Return as is, without any protocol prefix
    }
    
    // For regular URLs, ensure they start with https://
    return `https://${cleanUrl}`;
  }

  // Add this method before fetchSearchAnalyticsData
  private generateCacheKey(params: GSCSearchAnalyticsParams): string {
    const filterKey = params.dimensionFilterGroups ? 
      `:filters:${JSON.stringify(params.dimensionFilterGroups)}` : '';
    return `gsc:${params.siteUrl}:${params.startDate}:${params.endDate}:${params.dimensions?.join(',')}${filterKey}`;
  }

  // Enhanced fetch method with retries and rate limiting
  async fetchSearchAnalyticsData(params: GSCSearchAnalyticsParams): Promise<GSCDataPoint[]> {
    try {
      const cacheKey = this.generateCacheKey(params);
      
      const cachedData = await this.cache.get(cacheKey) as GSCDataPoint[] | null;
      
      if (cachedData) {
        return this.validateSearchAnalyticsData(cachedData);
      }

      const token = await this.getToken();
      if (!token) {
        throw new Error('Authentication token not found');
      }

      // Format the site URL correctly for the API
      const formattedSiteUrl = this.formatSiteUrlForApi(params.siteUrl);
      console.log('Raw site URL:', params.siteUrl);
      console.log('Formatted site URL for API:', formattedSiteUrl);

      // Don't encode the URL for sc-domain: format
      const apiUrl = formattedSiteUrl.startsWith('sc-domain:') 
        ? `https://www.googleapis.com/webmasters/v3/sites/${formattedSiteUrl}/searchAnalytics/query`
        : `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(`https://${formattedSiteUrl}`)}/searchAnalytics/query`;

      console.log('Final API URL:', apiUrl);

      const result = await this.queueRequest(async () => {
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            startDate: params.startDate,
            endDate: params.endDate,
            dimensions: params.dimensions || ['query'],
            rowLimit: params.rowLimit || 25000,
            searchType: params.searchType || 'web',
            dimensionFilterGroups: params.dimensionFilterGroups || [],
            startRow: params.startRow || 0
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('GSC API Error Details:', errorData);
          throw new Error(`GSC API Error: ${errorData.error?.message || response.statusText}`);
        }

        const data = await response.json();
        if (!data.rows) {
          console.warn('No data returned from GSC API');
          return [];
        }

        return this.transformSearchAnalyticsData(data.rows, params.dimensions || ['query']);
      });

      // Cache the result
      await this.cache.set(cacheKey, result); // Cache for 1 hour (TTL is handled by CacheManager)

      return this.validateSearchAnalyticsData(result);
    } catch (error) {
      console.error('Error fetching search analytics data:', error);
      throw error;
    }
  }

  // Queue manager for rate limiting
  private async queueRequest<T>(request: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({ request, resolve, reject });
      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.isProcessingQueue || this.requestQueue.length === 0) return;
    
    this.isProcessingQueue = true;
    
    while (this.requestQueue.length > 0) {
      const { request, resolve, reject } = this.requestQueue.shift()!;
      
      try {
        const result = await request();
        resolve(result);
      } catch (error) {
        reject(error);
      }
      
      // Rate limiting delay
      await new Promise(resolve => setTimeout(resolve, 1000 / this.RATE_LIMIT));
    }
    
    this.isProcessingQueue = false;
  }

  private transformSearchAnalyticsData(rows: GSCDataRow[], dimensions: string[]): GSCDataPoint[] {
    return rows.map(row => {
      const dataPoint: GSCDataPoint = {
        query: '',
        clicks: row.clicks,
        impressions: row.impressions,
        ctr: row.ctr,
        position: row.position
      };

      // Map dimensions to their respective fields
      dimensions.forEach((dimension, index) => {
        switch (dimension) {
          case 'query':
            dataPoint.query = row.keys[index];
            break;
          case 'page':
            dataPoint.page = row.keys[index];
            break;
          case 'device':
            dataPoint.device = row.keys[index];
            break;
          case 'country':
            dataPoint.country = row.keys[index];
            break;
          case 'date':
            dataPoint.date = row.keys[index];
            break;
        }
      });

      return dataPoint;
    });
  }

  // Remove Supabase-related methods
  async getTopQueries(
    siteUrl: string,
    startDate: string,
    endDate: string,
    limit: number = 10
  ): Promise<GSCDataPoint[]> {
    try {
      const data = await this.fetchSearchAnalyticsData({
        siteUrl,
        startDate,
        endDate,
        dimensions: ['query'],
        rowLimit: limit
      });
      
      return data.sort((a, b) => b.clicks - a.clicks).slice(0, limit);
    } catch (error) {
      console.error('Error fetching top queries:', error);
      throw error;
    }
  }

  async getAggregatedMetrics(
    siteUrl: string,
    startDate: string,
    endDate: string
  ): Promise<{
    totalClicks: number;
    totalImpressions: number;
    avgCtr: number;
    avgPosition: number;
  }> {
    try {
      const data = await this.fetchSearchAnalyticsData({
        siteUrl,
        startDate,
        endDate
      });

      const metrics = {
        totalClicks: data.reduce((sum, item) => sum + item.clicks, 0),
        totalImpressions: data.reduce((sum, item) => sum + item.impressions, 0),
        avgCtr: data.reduce((sum, item) => sum + item.ctr, 0) / data.length,
        avgPosition: data.reduce((sum, item) => sum + item.position, 0) / data.length
      };

      return this.validateMetrics(metrics);
    } catch (error) {
      console.error('Error fetching aggregated metrics:', error);
      throw error;
    }
  }

  async getTrendData(
    siteUrl: string,
    startDate: string,
    endDate: string
  ): Promise<{
    labels: string[];
    clicks: number[];
    impressions: number[];
    ctr: number[];
    position: number[];
  }> {
    try {
      const data = await this.fetchSearchAnalyticsData({
        siteUrl,
        startDate,
        endDate,
        dimensions: ['date']
      });

      // Sort data by date
      data.sort((a, b) => (a.date || '').localeCompare(b.date || ''));

      return {
        labels: data.map(item => item.date || ''),
        clicks: data.map(item => item.clicks),
        impressions: data.map(item => item.impressions),
        ctr: data.map(item => item.ctr),
        position: data.map(item => item.position)
      };
    } catch (error) {
      console.error('Error fetching trend data:', error);
      throw error;
    }
  }

  // Updated syncGSCData to require siteUrl parameter
  async syncGSCData(
    startDate: string,
    endDate: string,
    siteUrl?: string
  ): Promise<void> {
    try {
      const targetSiteUrl = await this.getSiteUrl(siteUrl);
      if (!targetSiteUrl) {
        throw new Error('No GSC property specified for sync');
      }

      console.log(`Starting GSC data sync for ${targetSiteUrl} from ${startDate} to ${endDate}`);

      // Fetch comprehensive data with multiple dimensions
      const queries = await this.fetchSearchAnalyticsData({
        siteUrl: targetSiteUrl,
        startDate,
        endDate,
        dimensions: ['query'],
        rowLimit: 25000
      });

      const pages = await this.fetchSearchAnalyticsData({
        siteUrl: targetSiteUrl,
        startDate,
        endDate,
        dimensions: ['page'],
        rowLimit: 25000
      });

      const devices = await this.fetchSearchAnalyticsData({
        siteUrl: targetSiteUrl,
        startDate,
        endDate,
        dimensions: ['device'],
        rowLimit: 1000
      });

      const countries = await this.fetchSearchAnalyticsData({
        siteUrl: targetSiteUrl,
        startDate,
        endDate,
        dimensions: ['country'],
        rowLimit: 1000
      });

      // Fetch daily trend data
      const trendData = await this.getTrendData(targetSiteUrl, startDate, endDate);

      console.log(`Sync completed: ${queries.length} queries, ${pages.length} pages, ${devices.length} devices, ${countries.length} countries`);
      
      // Store sync timestamp
      localStorage.setItem('last_gsc_sync', new Date().toISOString());
      
    } catch (error) {
      console.error('Error syncing GSC data:', error);
      throw error;
    }
  }

  async getTopPages(
    siteUrl: string,
    startDate: string,
    endDate: string,
    limit: number = 10
  ): Promise<GSCDataPoint[]> {
    try {
      const data = await this.fetchSearchAnalyticsData({
        siteUrl,
        startDate,
        endDate,
        dimensions: ['page'],
        rowLimit: limit
      });
      
      return data.sort((a, b) => b.clicks - a.clicks).slice(0, limit);
    } catch (error) {
      console.error('Error fetching top pages:', error);
      throw error;
    }
  }

  async getRankingDistribution(
    siteUrl: string,
    startDate: string,
    endDate: string
  ): Promise<{
    top3: number,
    top10: number,
    top20: number,
    top50: number,
    below50: number
  }> {
    try {
      const data = await this.fetchSearchAnalyticsData({
        siteUrl,
        startDate,
        endDate,
        dimensions: ['query'],
        rowLimit: 25000 // Maximum allowed by GSC API
      });
      
      return {
        top3: data.filter(item => item.position <= 3).length,
        top10: data.filter(item => item.position > 3 && item.position <= 10).length,
        top20: data.filter(item => item.position > 10 && item.position <= 20).length,
        top50: data.filter(item => item.position > 20 && item.position <= 50).length,
        below50: data.filter(item => item.position > 50).length
      };
    } catch (error) {
      console.error('Error fetching ranking distribution:', error);
      throw error;
    }
  }

  async getAvailableCountries(
    siteUrl: string,
    startDate: string,
    endDate: string
  ): Promise<Array<{ label: string; value: string }>> {
    console.log('[gscService] getAvailableCountries called with:', { siteUrl, startDate, endDate });
    if (!siteUrl || !startDate || !endDate) {
      console.warn('[gscService] Missing siteUrl, startDate, or endDate for getAvailableCountries. Returning default.');
      return [{ label: 'All Countries', value: 'all' }];
    }

    try {
      let data: GSCDataPoint[] = [];
      let dataForCountryList: GSCDataPoint[] = []; // Use this for countries with >1 impression
      let allAvailableCountryCodes: string[] = []; // Fallback if no countries with >1 impression found

      try {
        console.log('[gscService] Attempting to fetch countries with dimension: [\'country\'] for impression filtering');
        dataForCountryList = await this.fetchSearchAnalyticsData({
          siteUrl,
          startDate,
          endDate,
          dimensions: ['country'],
          rowLimit: 1000, 
        });
        console.log('[gscService] Data from first attempt (country only for impression filtering):', JSON.parse(JSON.stringify(dataForCountryList)));
      } catch (e: any) {
        console.warn('[gscService] Error during first attempt to fetch countries (country only for impression filtering):', e.message);
      }

      // Process dataForCountryList to get countries with > 1 impression
      const countriesWithSufficientImpressions = dataForCountryList
        .filter(item => item.country && item.impressions > 1)
        .map(item => item.country!)
        .filter(Boolean) as string[];
      
      let uniqueCountryCodes = [...new Set(countriesWithSufficientImpressions)]
        .filter(countryCode => 
          typeof countryCode === 'string' && 
          countryCode.length === 3 && 
          countryCode.toLowerCase() !== 'zzz'
        )
        .sort();

      console.log('[gscService] Unique valid country codes with >1 impression:', uniqueCountryCodes);

      // If no countries with >1 impression found, or if the first fetch failed badly, try the broader fetch
      if (uniqueCountryCodes.length === 0) {
        console.log('[gscService] No countries with >1 impression found or first fetch failed. Trying broader fetch for all available country codes.');
        let fallbackData: GSCDataPoint[] = [];
        try {
          fallbackData = await this.fetchSearchAnalyticsData({
            siteUrl,
            startDate,
            endDate,
            dimensions: ['country', 'query'], 
            rowLimit: 5000 
          });
          console.log('[gscService] Data from second attempt (country, query for fallback):', JSON.parse(JSON.stringify(fallbackData)));
        } catch (e: any) {
          console.error('[gscService] Error during second attempt to fetch countries (country, query for fallback):', e.message);
          return [{ label: 'All Countries', value: 'all' }];
        }

        if (!fallbackData || fallbackData.length === 0) {
          console.warn('[gscService] Both attempts yielded no country data. Returning default.');
          return [{ label: 'All Countries', value: 'all' }];
        }
        
        allAvailableCountryCodes = [...new Set(fallbackData.map(item => item.country).filter(Boolean))]
          .filter(countryCode => 
            typeof countryCode === 'string' && 
            countryCode.length === 3 && 
            countryCode.toLowerCase() !== 'zzz'
          )
          .sort();
        
        // Use this list if the impression-filtered list was empty
        if (allAvailableCountryCodes.length > 0 && uniqueCountryCodes.length === 0) {
            uniqueCountryCodes = allAvailableCountryCodes;
            console.log('[gscService] Using fallback list of all unique country codes as no countries met impression threshold:', uniqueCountryCodes);
        } else if (uniqueCountryCodes.length === 0 && allAvailableCountryCodes.length === 0) {
             console.warn('[gscService] No valid unique country codes extracted even from fallback. Returning default.');
            return [{ label: 'All Countries', value: 'all' }];
        }
      }
      
      // If after all attempts, uniqueCountryCodes is still empty, then default.
      if (uniqueCountryCodes.length === 0) {
        console.warn('[gscService] No valid unique country codes to display after all checks. Returning default.');
        return [{ label: 'All Countries', value: 'all' }];
      }

      const countryOptions = [
        { label: 'All Countries', value: 'all' },
        ...uniqueCountryCodes.map(countryCode => {
          let label = countryCode.toUpperCase(); // Default to uppercase code
          try {
            // Attempt to get the full display name
            const displayName = new Intl.DisplayNames(['en'], { type: 'region' }).of(countryCode.toUpperCase());
            if (displayName && displayName !== countryCode.toUpperCase()) {
              label = displayName; // Use display name if successfully retrieved and different from code
            } else {
              // This case means Intl.DisplayNames returned the code itself or was empty, 
              // which can happen for some codes. We already defaulted to the code.
              console.log(`[gscService] Intl.DisplayNames returned the code itself or was empty for ${countryCode}. Using code as label.`);
            }
          } catch (e: any) {
            // Log the specific error but continue with the uppercased code as the label
            console.warn(`[gscService] Error getting display name for country code: ${countryCode}. Error: ${e.message}. Using code as label.`);
          }
          return {
            value: countryCode.toLowerCase(),
            label: label
          };
        })
      ];

      console.log('[gscService] Final country options to be returned:', countryOptions);
      return countryOptions;

    } catch (error: any) {
      console.error('[gscService] Unhandled error in getAvailableCountries:', error.message);
      return [{ label: 'All Countries', value: 'all' }]; // Fallback for any other error
    }
  }

  // Public method to clear cache
  clearCache(prefix?: string): void {
    this.cache.clear(prefix);
  }
}

export const gscService = new GSCService(); 