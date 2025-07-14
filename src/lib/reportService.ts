import { supabase } from './supabaseClient';
import { openAIService } from './openAIService';
import { gscService } from './gscService';
import { 
  ReportType, 
  Report, 
  ReportUsage, 
  ReportError, 
  ReportTemplate,
  TopGainersReport,
  UnderperformingPagesReport,
  EmergingKeywordsReport,
  BofuPagesReport,
  RankingVolatilityReport,
  QuickWinsReport
} from '@/types/aiReports';
import { GSCDataPoint } from './gscService';

// Report templates configuration
export const REPORT_TEMPLATES: Record<ReportType, ReportTemplate> = {
  top_gainers: {
    type: 'top_gainers',
    title: 'Top Gainers Report',
    description: 'Identify your best performing pages with the biggest improvements in clicks and CTR',
    icon: 'TrendingUp',
    features: [
      'Biggest click improvements',
      'CTR growth analysis',
      'Success pattern insights',
      'Replication strategies'
    ],
    hasAEO: false,
    minDataPoints: 10
  },
  underperforming_pages: {
    type: 'underperforming_pages',
    title: 'Underperforming Pages',
    description: 'Find pages with high impressions but low CTR that need optimization',
    icon: 'AlertTriangle',
    features: [
      'High impression, low CTR pages',
      'Title & meta optimization',
      'Quick win suggestions',
      'CTR improvement tactics'
    ],
    hasAEO: false,
    minDataPoints: 15
  },
  emerging_keywords: {
    type: 'emerging_keywords',
    title: 'Emerging Keywords',
    description: 'Discover new keyword opportunities that are starting to gain traction',
    icon: 'Search',
    features: [
      'New ranking keywords',
      'Growth potential analysis',
      'Content gap identification',
      'Opportunity prioritization'
    ],
    hasAEO: false,
    minDataPoints: 20
  },
  bofu_pages: {
    type: 'bofu_pages',
    title: 'BoFu Pages + AEO Analysis',
    description: 'Analyze bottom-funnel pages with AI/LLM optimization insights',
    icon: 'Target',
    features: [
      'Bottom-funnel page analysis',
      'LLM visibility simulation',
      'AEO score assessment',
      'AI optimization recommendations'
    ],
    hasAEO: true,
    minDataPoints: 5
  },
  ranking_volatility: {
    type: 'ranking_volatility',
    title: 'Ranking Volatility',
    description: 'Identify pages with unstable rankings and get stabilization strategies',
    icon: 'BarChart3',
    features: [
      'Ranking fluctuation analysis',
      'Volatility pattern detection',
      'Stabilization strategies',
      'Technical SEO insights'
    ],
    hasAEO: false,
    minDataPoints: 25
  },
  quick_wins: {
    type: 'quick_wins',
    title: 'Quick Wins',
    description: 'Find pages ranking 5-20 with optimization opportunities for immediate impact',
    icon: 'Zap',
    features: [
      'Position 5-20 opportunities',
      'Low-hanging fruit identification',
      'Immediate impact suggestions',
      'Featured snippet optimization'
    ],
    hasAEO: false,
    minDataPoints: 10
  }
};

export class ReportService {
  private userId: string;
  private planType: string;
  private lastRequestTime: number = 0;
  private readonly MIN_REQUEST_INTERVAL = 1000; // 1 second minimum between requests

  constructor(userId: string, planType: string) {
    if (!userId || userId.trim() === '') {
      throw new Error('User ID is required for ReportService');
    }
    this.userId = userId;
    this.planType = planType;
  }

  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.MIN_REQUEST_INTERVAL) {
      const waitTime = this.MIN_REQUEST_INTERVAL - timeSinceLastRequest;
      console.log(`Rate limiting: waiting ${waitTime}ms before next request`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastRequestTime = Date.now();
  }

  async canGenerateReport(): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .rpc('can_generate_report', {
          user_uuid: this.userId,
          plan_type: this.planType
        });

      if (error) {
        console.error('Error checking report generation capability:', error);
        return false;
      }

      return data;
    } catch (error) {
      console.error('Error in canGenerateReport:', error);
      return false;
    }
  }

  async getReportUsage(): Promise<ReportUsage | null> {
    try {
      // Enforce rate limiting
      await this.enforceRateLimit();
      
      console.log('Fetching report usage for user:', this.userId);
      
      // Add timeout to prevent hanging requests
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 10000); // 10 second timeout
      });
      
      const requestPromise = supabase
        .from('report_usage')
        .select('*')
        .eq('user_id', this.userId)
        .single();
      
      const { data, error } = await Promise.race([requestPromise, timeoutPromise]) as any;

      if (error && error.code !== 'PGRST116') {
        console.error('Database error fetching report usage:', error);
        // Try to initialize usage record if there's an error
        try {
          await supabase.rpc('initialize_user_report_usage', {
            user_uuid: this.userId
          });
          console.log('Successfully initialized user report usage');
        } catch (initError) {
          console.error('Error initializing user report usage:', initError);
        }
        
        // Return default usage stats instead of throwing
        return {
          userId: this.userId,
          reportsThisMonth: 0,
          exportsThisMonth: 0,
          lastReportDate: '',
          lastExportDate: '',
          resetDate: new Date().toISOString()
        };
      }

      if (!data) {
        console.log('No usage data found, initializing...');
        // Initialize usage record
        try {
          await supabase.rpc('initialize_user_report_usage', {
            user_uuid: this.userId
          });
          console.log('Successfully initialized user report usage');
        } catch (initError) {
          console.error('Error initializing user report usage:', initError);
        }

        return {
          userId: this.userId,
          reportsThisMonth: 0,
          exportsThisMonth: 0,
          lastReportDate: '',
          lastExportDate: '',
          resetDate: new Date().toISOString()
        };
      }

      console.log('Successfully fetched report usage:', data);
      return {
        userId: data.user_id,
        reportsThisMonth: data.reports_this_month,
        exportsThisMonth: data.exports_this_month,
        lastReportDate: data.last_report_date || '',
        lastExportDate: data.last_export_date || '',
        resetDate: data.reset_date
      };
    } catch (error) {
      console.error('Unexpected error getting report usage:', error);
      
      // Always return default usage stats instead of null to prevent UI errors
      return {
        userId: this.userId,
        reportsThisMonth: 0,
        exportsThisMonth: 0,
        lastReportDate: '',
        lastExportDate: '',
        resetDate: new Date().toISOString()
      };
    }
  }

  async generateReport(
    reportType: ReportType,
    dateRange: { startDate: string; endDate: string },
    gscProperty: string,
    onProgress?: (progress: number, message?: string) => void
  ): Promise<Report> {
    try {
      onProgress?.(0, 'Checking permissions...');

      // Check if user can generate report
      const canGenerate = await this.canGenerateReport();
      if (!canGenerate) {
        throw new Error(ReportError.SUBSCRIPTION_LIMIT_REACHED);
      }

      onProgress?.(10, 'Fetching GSC data...');

      // Fetch GSC data
      const gscData = await this.fetchGSCDataForReport(reportType, dateRange, gscProperty, onProgress);

      if (gscData.length < REPORT_TEMPLATES[reportType].minDataPoints) {
        throw new Error(ReportError.INSUFFICIENT_DATA);
      }

      onProgress?.(60, 'Processing data...');

      // Process data based on report type
      const processedData = await this.processReportData(reportType, gscData, dateRange);

      onProgress?.(80, 'Generating AI insights...');

      // Generate AI summary
      const aiSummary = await openAIService.generateReportSummary(reportType, gscData, dateRange);

      onProgress?.(90, 'Saving report...');

      // Create report record
      const report = await this.createReportRecord(reportType, dateRange, gscData, aiSummary, processedData);

      onProgress?.(95, 'Updating usage...');

      // Update usage
      await supabase.rpc('increment_report_usage', {
        user_uuid: this.userId
      });

      onProgress?.(100, 'Report generated successfully!');

      return report;
    } catch (error) {
      console.error('Error generating report:', error);
      throw error;
    }
  }

  private async fetchGSCDataForReport(
    reportType: ReportType,
    dateRange: { startDate: string; endDate: string },
    gscProperty: string,
    onProgress?: (progress: number, message?: string) => void
  ): Promise<GSCDataPoint[]> {
    const dimensions = this.getDimensionsForReportType(reportType);
    const rowLimit = this.getRowLimitForReportType(reportType);

    return await gscService.fetchSearchAnalyticsData({
      siteUrl: gscProperty,
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      dimensions,
      rowLimit
    }, (progress, message) => {
      onProgress?.(10 + (progress * 0.5), message);
    });
  }

  private getDimensionsForReportType(reportType: ReportType): string[] {
    switch (reportType) {
      case 'top_gainers':
      case 'underperforming_pages':
      case 'bofu_pages':
      case 'ranking_volatility':
        return ['page'];
      case 'emerging_keywords':
      case 'quick_wins':
        return ['query', 'page'];
      default:
        return ['page'];
    }
  }

  private getRowLimitForReportType(reportType: ReportType): number {
    switch (reportType) {
      case 'bofu_pages':
        return 100;
      case 'quick_wins':
        return 500;
      case 'emerging_keywords':
        return 1000;
      default:
        return 250;
    }
  }

  private async processReportData(
    reportType: ReportType,
    gscData: GSCDataPoint[],
    dateRange: { startDate: string; endDate: string }
  ): Promise<any> {
    switch (reportType) {
      case 'top_gainers':
        return this.processTopGainersData(gscData, dateRange);
      case 'underperforming_pages':
        return this.processUnderperformingPagesData(gscData);
      case 'emerging_keywords':
        return this.processEmergingKeywordsData(gscData);
      case 'bofu_pages':
        return this.processBofuPagesData(gscData, dateRange);
      case 'ranking_volatility':
        return this.processRankingVolatilityData(gscData, dateRange);
      case 'quick_wins':
        return this.processQuickWinsData(gscData);
      default:
        throw new Error(`Unsupported report type: ${reportType}`);
    }
  }

  private async processTopGainersData(gscData: GSCDataPoint[], dateRange: { startDate: string; endDate: string }) {
    const aiResponse = await openAIService.generateReportSummary('top_gainers', gscData, dateRange);
    
    try {
      const parsedResponse = JSON.parse(aiResponse);
      return {
        summary_heading: parsedResponse.summary_heading,
        top_pages: parsedResponse.top_pages.map(page => ({
          url: page.url,
          clicks: page.clicks,
          impressions: page.impressions,
          ctr: page.ctr,
          position: page.position,
          seo_recommendation: page.seo_recommendation,
          aeo_recommendation: page.aeo_recommendation
        }))
      };
    } catch (error) {
      console.error('Error parsing AI response:', error);
      // Fallback to basic processing if AI response parsing fails
      return {
        summary_heading: "Here are the top performing pages (last 3 months):",
        top_pages: gscData
          .sort((a, b) => b.clicks - a.clicks)
          .slice(0, 5)
          .map(item => ({
            url: item.page || item.query,
            clicks: item.clicks,
            impressions: item.impressions,
            ctr: item.ctr,
            position: item.position,
            seo_recommendation: "Optimize title and meta description for better CTR.",
            aeo_recommendation: "Add direct answers and structured content for AI visibility."
          }))
      };
    }
  }

  private async processUnderperformingPagesData(gscData: GSCDataPoint[]) {
    const aiResponse = await openAIService.generateReportSummary('underperforming_pages', gscData, { startDate: '', endDate: '' });
    
    try {
      const parsedResponse = JSON.parse(aiResponse);
      return {
        pages: parsedResponse.pages.map(page => ({
          url: page.url,
          clicks: page.clicks,
          impressions: page.impressions,
          ctr: page.ctr,
          position: page.position,
          seo_recommendation: page.seo_recommendation,
          aeo_recommendation: page.aeo_recommendation
        }))
      };
    } catch (error) {
      console.error('Error parsing AI response:', error);
      // Fallback to basic processing if AI response parsing fails
      const underperformingPages = gscData
        .filter(item => item.impressions > 100 && item.ctr < 0.01 && item.position >= 10 && item.position <= 40)
        .sort((a, b) => b.impressions - a.impressions)
        .slice(0, 10);

      return {
        pages: underperformingPages.map(item => ({
          url: item.page || item.query,
          clicks: item.clicks,
          impressions: item.impressions,
          ctr: item.ctr,
          position: item.position,
          seo_recommendation: "Rewrite meta title to highlight primary keyword with urgency modifier. Optimize meta description for better CTR.",
          aeo_recommendation: "Add FAQ section with direct answers. Include structured data markup for better AI visibility."
        }))
      };
    }
  }

  private async processEmergingKeywordsData(gscData: GSCDataPoint[]) {
    return gscData
      .filter(item => item.position <= 50 && item.impressions > 10)
      .sort((a, b) => a.position - b.position)
      .slice(0, 20)
      .map(item => ({
        keyword: item.query,
        mappedUrl: item.page || '',
        ctr: item.ctr,
        position: item.position,
        suggestedAction: this.getSuggestedAction(item)
      }));
  }

  private async processBofuPagesData(gscData: GSCDataPoint[], dateRange: { startDate: string; endDate: string }) {
    const bofuPages = gscData
      .filter(item => this.isBofuPage(item))
      .slice(0, 10);

    const processedData = [];
    for (const item of bofuPages) {
      let llmAnalysis;
      try {
        llmAnalysis = await openAIService.analyzeBofuPage(item.page || item.query, [item]);
      } catch (error) {
        console.error('Error analyzing BoFu page:', error);
        llmAnalysis = this.getDefaultLLMAnalysis();
      }

      processedData.push({
        url: item.page || item.query,
        clicksChange: item.clicks, // Would need historical comparison
        ctrChange: item.ctr, // Would need historical comparison
        rankChange: item.position, // Would need historical comparison
        suggestedFixes: this.getSuggestedFixes(item),
        llmAnalysis
      });
    }

    return processedData;
  }

  private async processRankingVolatilityData(gscData: GSCDataPoint[], dateRange: { startDate: string; endDate: string }) {
    // This would need historical position data to calculate volatility
    // For now, return pages with positions that might be volatile
    return gscData
      .filter(item => item.position > 5 && item.position < 30)
      .slice(0, 15)
      .map(item => ({
        url: item.page || item.query,
        positionChange: 0, // Would calculate from historical data
        ctr: item.ctr,
        volatilityType: this.getVolatilityType(item),
        suggestedAction: this.getVolatilityAction(item)
      }));
  }

  private async processQuickWinsData(gscData: GSCDataPoint[]) {
    return gscData
      .filter(item => item.position >= 5 && item.position <= 20 && item.impressions > 50)
      .sort((a, b) => b.impressions - a.impressions)
      .slice(0, 20)
      .map(item => ({
        url: item.page || item.query,
        position: item.position,
        impressions: item.impressions,
        ctr: item.ctr,
        opportunityType: this.getOpportunityType(item),
        suggestedOptimizations: this.getSuggestedOptimizations(item)
      }));
  }

  private getSuggestedFix(item: GSCDataPoint): string {
    if (item.ctr < 0.01) return 'Improve title tag and meta description';
    if (item.position > 20) return 'Optimize content for target keywords';
    return 'Review and improve page relevance';
  }

  private getSuggestedAction(item: GSCDataPoint): string {
    if (item.position <= 10) return 'Optimize for featured snippets';
    if (item.position <= 20) return 'Improve content depth and quality';
    return 'Build topical authority and backlinks';
  }

  private isBofuPage(item: GSCDataPoint): boolean {
    const bofuKeywords = ['buy', 'price', 'cost', 'purchase', 'order', 'vs', 'versus', 'compare', 'best'];
    const query = (item.query || '').toLowerCase();
    const page = (item.page || '').toLowerCase();
    
    return bofuKeywords.some(keyword => query.includes(keyword) || page.includes(keyword));
  }

  private getSuggestedFixes(item: GSCDataPoint): string[] {
    const fixes = [];
    if (item.ctr < 0.02) fixes.push('Improve title and meta description');
    if (item.position > 10) fixes.push('Optimize content for conversion');
    fixes.push('Add customer testimonials and social proof');
    return fixes;
  }

  private getDefaultLLMAnalysis() {
    return {
      bofuQuery: 'Unable to generate query',
      simulatedLlmSummary: 'Unable to generate simulation',
      isMentionedInLlmResponse: false,
      competitorsLikelyMentioned: [],
      aeoScore: {
        overall: 5,
        factors: {
          contentStructure: 5,
          directQuestionAnswering: 5,
          clarityOfValueProp: 5,
          semanticRelevance: 5,
          presenceIn3rdPartyDatasets: 5
        }
      },
      contentImprovementSuggestions: ['Unable to generate suggestions'],
      outreachTargets: [],
      misrepresentationFound: false,
      fixSuggestions: ['Unable to generate fixes']
    };
  }

  private getVolatilityType(item: GSCDataPoint): string {
    if (item.position <= 10) return 'Top 10 fluctuation';
    if (item.position <= 20) return 'Page 2 volatility';
    return 'General ranking instability';
  }

  private getVolatilityAction(item: GSCDataPoint): string {
    return 'Monitor for technical issues and content freshness';
  }

  private getOpportunityType(item: GSCDataPoint): string {
    if (item.position <= 10) return 'Top 10 optimization';
    if (item.position <= 15) return 'Page 2 breakthrough';
    return 'Position improvement';
  }

  private getSuggestedOptimizations(item: GSCDataPoint): string[] {
    const optimizations = [];
    if (item.ctr < 0.03) optimizations.push('Improve title tag click-through appeal');
    if (item.position > 10) optimizations.push('Enhance content comprehensiveness');
    optimizations.push('Optimize for featured snippets');
    return optimizations;
  }

  private async createReportRecord(
    reportType: ReportType,
    dateRange: { startDate: string; endDate: string },
    gscData: GSCDataPoint[],
    aiSummary: string,
    processedData: any
  ): Promise<Report> {
    const { data, error } = await supabase
      .from('reports')
      .insert({
        user_id: this.userId,
        report_type: reportType,
        date_range: dateRange,
        gsc_data: gscData,
        ai_summary: aiSummary,
        report_data: processedData,
        status: 'completed'
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create report: ${error.message}`);
    }

    return {
      id: data.id,
      userId: data.user_id,
      reportType: data.report_type,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      dateRange: data.date_range,
      gscData: data.gsc_data,
      aiSummary: data.ai_summary,
      exportCount: data.export_count,
      lastRegeneratedAt: data.last_regenerated_at,
      regenerationsLeft: data.regenerations_left,
      status: data.status,
      data: data.report_data
    } as Report;
  }

  async getReports(): Promise<Report[]> {
    try {
      // Enforce rate limiting
      await this.enforceRateLimit();
      
      console.log('Fetching reports for user:', this.userId);
      
      // Add timeout to prevent hanging requests
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 10000); // 10 second timeout
      });
      
      const requestPromise = supabase
        .from('reports')
        .select('*')
        .eq('user_id', this.userId)
        .order('created_at', { ascending: false });
      
      const { data, error } = await Promise.race([requestPromise, timeoutPromise]) as any;

      if (error) {
        throw new Error(`Failed to fetch reports: ${error.message}`);
      }

      return data.map(item => ({
        id: item.id,
        userId: item.user_id,
        reportType: item.report_type,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        dateRange: item.date_range,
        gscData: item.gsc_data,
        aiSummary: item.ai_summary,
        exportCount: item.export_count,
        lastRegeneratedAt: item.last_regenerated_at,
        regenerationsLeft: item.regenerations_left,
        status: item.status,
        data: item.report_data
      })) as Report[];
    } catch (error) {
      console.error('Error fetching reports:', error);
      return []; // Return empty array on error
    }
  }

  async deleteReport(reportId: string): Promise<void> {
    const { error } = await supabase
      .from('reports')
      .delete()
      .eq('id', reportId)
      .eq('user_id', this.userId);

    if (error) {
      throw new Error(`Failed to delete report: ${error.message}`);
    }
  }
}

export const createReportService = (userId: string, planType: string) => {
  return new ReportService(userId, planType);
}; 