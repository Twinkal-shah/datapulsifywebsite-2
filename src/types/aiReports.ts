import { GSCDataPoint } from '@/lib/gscService';

export type ReportType = 
  | 'top_gainers'
  | 'underperforming_pages'
  | 'emerging_keywords'
  | 'bofu_pages'
  | 'ranking_volatility'
  | 'quick_wins';

export interface AEOScore {
  overall: number;
  factors: {
    contentStructure: number;
    directQuestionAnswering: number;
    clarityOfValueProp: number;
    semanticRelevance: number;
    presenceIn3rdPartyDatasets: number;
  };
  industryAdjustments?: {
    demoVisibility?: number;
    selfServeCTAs?: number;
  };
}

export interface LLMSimulation {
  bofuQuery: string;
  simulatedLlmSummary: string;
  isMentionedInLlmResponse: boolean;
  competitorsLikelyMentioned: string[];
  aeoScore: AEOScore;
  contentImprovementSuggestions: string[];
  outreachTargets: string[];
  misrepresentationFound: boolean;
  fixSuggestions: string[];
}

export interface BaseReport {
  id: string;
  userId: string;
  reportType: ReportType;
  createdAt: string;
  updatedAt: string;
  dateRange: {
    startDate: string;
    endDate: string;
  };
  gscData: GSCDataPoint[];
  aiSummary: string;
  exportCount: number;
  lastRegeneratedAt?: string;
  regenerationsLeft: number;
  status: 'generating' | 'completed' | 'error';
}

export interface TopGainersReport extends BaseReport {
  reportType: 'top_gainers';
  data: {
    summary_heading: string;
    top_pages: Array<{
      url: string;
      clicks: number;
      impressions: number;
      ctr: number;
      position: number;
      seo_recommendation: string;
      aeo_recommendation: string;
    }>;
  };
}

export interface UnderperformingPagesReport extends BaseReport {
  reportType: 'underperforming_pages';
  data: {
    pages: Array<{
      url: string;
      clicks: number;
      impressions: number;
      ctr: number;
      position: number;
      seo_recommendation: string;
      aeo_recommendation: string;
    }>;
  };
}

export interface EmergingKeywordsReport extends BaseReport {
  reportType: 'emerging_keywords';
  data: Array<{
    keyword: string;
    mappedUrl: string;
    ctr: number;
    position: number;
    suggestedAction: string;
  }>;
}

export interface BofuPagesReport extends BaseReport {
  reportType: 'bofu_pages';
  data: Array<{
    url: string;
    clicksChange: number;
    ctrChange: number;
    rankChange: number;
    suggestedFixes: string[];
    llmAnalysis: LLMSimulation;
  }>;
}

export interface RankingVolatilityReport extends BaseReport {
  reportType: 'ranking_volatility';
  data: Array<{
    url: string;
    positionChange: number;
    ctr: number;
    volatilityType: string;
    suggestedAction: string;
  }>;
}

export interface QuickWinsReport extends BaseReport {
  reportType: 'quick_wins';
  data: Array<{
    url: string;
    position: number;
    impressions: number;
    ctr: number;
    opportunityType: string;
    suggestedOptimizations: string[];
  }>;
}

export type Report = 
  | TopGainersReport 
  | UnderperformingPagesReport 
  | EmergingKeywordsReport 
  | BofuPagesReport 
  | RankingVolatilityReport 
  | QuickWinsReport;

export interface ReportUsage {
  userId: string;
  reportsThisMonth: number;
  exportsThisMonth: number;
  lastReportDate: string;
  lastExportDate: string;
  resetDate: string;
}

export enum ReportError {
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  SUBSCRIPTION_LIMIT_REACHED = 'SUBSCRIPTION_LIMIT_REACHED',
  API_ERROR = 'API_ERROR',
  INVALID_DATA = 'INVALID_DATA',
  GENERATION_IN_PROGRESS = 'GENERATION_IN_PROGRESS',
  INSUFFICIENT_DATA = 'INSUFFICIENT_DATA'
}

export interface ReportTemplate {
  type: ReportType;
  title: string;
  description: string;
  icon: string;
  features: string[];
  hasAEO: boolean;
  minDataPoints: number;
}

export interface ExportOptions {
  format: 'csv' | 'google_sheets';
  includeCharts?: boolean;
  includeAEO?: boolean;
  fileName?: string;
} 