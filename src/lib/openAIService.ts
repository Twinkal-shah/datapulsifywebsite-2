import { ReportType, Report, LLMSimulation, ReportError, AEOScore } from '@/types/aiReports';
import { GSCDataPoint } from '@/lib/gscService';
import { CacheManager } from './cacheManager';

interface OpenAIConfig {
  apiKey: string;
  model: string;
  maxTokensPerPrompt: number;
  rateLimit: number;
  temperature: number;
}

export class OpenAIService {
  private config: OpenAIConfig;
  private cache: CacheManager;
  private requestQueue: Array<{ request: () => Promise<any>; resolve: (value: any) => void; reject: (error: any) => void }> = [];
  private isProcessingQueue = false;
  private requestCount = 0;
  private windowStart = Date.now();

  constructor() {
    this.config = {
      apiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
      model: import.meta.env.VITE_OPENAI_MODEL || 'gpt-4',
      maxTokensPerPrompt: parseInt(import.meta.env.VITE_OPENAI_MAX_TOKENS || '4000'),
      rateLimit: parseInt(import.meta.env.VITE_OPENAI_RATE_LIMIT || '60'),
      temperature: 0.7
    };

    this.cache = new CacheManager();

    if (!this.config.apiKey) {
      throw new Error('OpenAI API key is required. Please set VITE_OPENAI_API_KEY environment variable.');
    }
  }

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
      // Check rate limit
      const now = Date.now();
      if (now - this.windowStart >= 60000) {
        this.requestCount = 0;
        this.windowStart = now;
      }

      if (this.requestCount >= this.config.rateLimit) {
        const waitTime = 60000 - (now - this.windowStart);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        this.requestCount = 0;
        this.windowStart = Date.now();
      }

      const { request, resolve, reject } = this.requestQueue.shift()!;

      try {
        const result = await request();
        resolve(result);
        this.requestCount++;
      } catch (error) {
        reject(error);
      }

      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    this.isProcessingQueue = false;
  }

  private async makeOpenAIRequest(
    prompt: string,
    systemPrompt: string,
    useCache: boolean = true
  ): Promise<string> {
    const cacheKey = `openai:${this.hashString(systemPrompt + prompt)}`;
    
    if (useCache) {
      const cached = await this.cache.get(cacheKey);
      if (cached) {
        return cached as string;
      }
    }

    return this.queueRequest(async () => {
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.config.apiKey}`
          },
          body: JSON.stringify({
            model: this.config.model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: prompt }
            ],
            max_tokens: this.config.maxTokensPerPrompt,
            temperature: this.config.temperature
          })
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({ error: { message: response.statusText } }));
          
          if (response.status === 429) {
            throw new Error(ReportError.RATE_LIMIT_EXCEEDED);
          }
          
          throw new Error(`OpenAI API Error: ${error.error?.message || response.statusText}`);
        }

        const data = await response.json();
        const result = data.choices[0].message.content;

        if (useCache) {
          await this.cache.set(cacheKey, result); // Cache for default duration
        }

        return result;
      } catch (error) {
        console.error('OpenAI API request failed:', error);
        throw error;
      }
    });
  }

  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  async generateReportSummary(
    reportType: ReportType,
    gscData: GSCDataPoint[],
    dateRange: { startDate: string; endDate: string }
  ): Promise<string> {
    const systemPrompt = `You are an expert SEO analyst with deep knowledge of Google Search Console data analysis. 
    Provide clear, actionable insights in a professional, data-driven tone. 
    Focus on the most important trends, opportunities, and specific recommendations.
    Avoid politics, religion, health diagnoses, or financial investment advice.
    Keep responses under 700 tokens and make them accessible to non-SEO users.`;

    const prompt = this.getReportPrompt(reportType, gscData, dateRange);
    return this.makeOpenAIRequest(prompt, systemPrompt);
  }

  async analyzeBofuPage(
    url: string,
    gscData: GSCDataPoint[],
    content?: string
  ): Promise<LLMSimulation> {
    const systemPrompt = `You are an expert in Answer Engine Optimization (AEO) and SEO, 
    specializing in analyzing how content performs in both traditional search and AI language models.
    Provide structured analysis in valid JSON format only.`;

    const prompt = this.getBofuAnalysisPrompt(url, gscData, content);
    const response = await this.makeOpenAIRequest(prompt, systemPrompt, false);
    
    try {
      const parsed = JSON.parse(response);
      return this.validateLLMSimulation(parsed);
    } catch (error) {
      console.error('Failed to parse LLM simulation response:', error);
      throw new Error(ReportError.API_ERROR);
    }
  }

  private validateLLMSimulation(data: any): LLMSimulation {
    // Validate and provide defaults for LLM simulation
    return {
      bofuQuery: data.bofuQuery || 'No query generated',
      simulatedLlmSummary: data.simulatedLlmSummary || 'No summary generated',
      isMentionedInLlmResponse: Boolean(data.isMentionedInLlmResponse),
      competitorsLikelyMentioned: Array.isArray(data.competitorsLikelyMentioned) ? data.competitorsLikelyMentioned : [],
      aeoScore: this.validateAEOScore(data.aeoScore),
      contentImprovementSuggestions: Array.isArray(data.contentImprovementSuggestions) ? data.contentImprovementSuggestions : [],
      outreachTargets: Array.isArray(data.outreachTargets) ? data.outreachTargets : [],
      misrepresentationFound: Boolean(data.misrepresentationFound),
      fixSuggestions: Array.isArray(data.fixSuggestions) ? data.fixSuggestions : []
    };
  }

  private validateAEOScore(score: any): AEOScore {
    return {
      overall: Math.max(1, Math.min(10, score?.overall || 5)),
      factors: {
        contentStructure: Math.max(0, Math.min(10, score?.factors?.contentStructure || 5)),
        directQuestionAnswering: Math.max(0, Math.min(10, score?.factors?.directQuestionAnswering || 5)),
        clarityOfValueProp: Math.max(0, Math.min(10, score?.factors?.clarityOfValueProp || 5)),
        semanticRelevance: Math.max(0, Math.min(10, score?.factors?.semanticRelevance || 5)),
        presenceIn3rdPartyDatasets: Math.max(0, Math.min(10, score?.factors?.presenceIn3rdPartyDatasets || 5))
      },
      industryAdjustments: score?.industryAdjustments || {}
    };
  }

  private getReportPrompt(
    reportType: ReportType,
    gscData: GSCDataPoint[],
    dateRange: { startDate: string; endDate: string }
  ): string {
    const dataStr = JSON.stringify(gscData, null, 2);
    const dateRangeStr = `${dateRange.startDate} to ${dateRange.endDate}`;

    switch (reportType) {
      case 'top_gainers':
        return `You are an expert SEO and LLM optimization strategist.

Analyze the following Google Search Console data and provide actionable recommendations for each page.

IMPORTANT: You must provide specific, actionable recommendations for each page. Do not leave recommendations empty.

For each page, analyze:
- Current performance metrics (clicks, CTR, position)
- Optimization opportunities based on the data
- Specific SEO improvements (title, meta description, content)
- AEO improvements for AI visibility (structured data, direct answers, FAQ format)

Return in JSON format only:

{
  "summary_heading": "Here are X pages winning in Google searches (last 3 months):",
  "top_pages": [
    {
      "url": "string",
      "clicks": number,
      "impressions": number,
      "ctr": number,
      "position": number,
      "seo_recommendation": "Specific SEO action (e.g., 'Optimize title tag to include primary keyword', 'Improve meta description CTR')",
      "aeo_recommendation": "Specific AEO action (e.g., 'Add FAQ section with direct answers', 'Include structured data markup')"
    }
  ]
}

GSC Data from ${dateRangeStr}:
${dataStr}`;

      case 'underperforming_pages':
        return `You are a senior SEO + AEO strategist.

You're analyzing GSC performance data to identify **underperforming pages** — pages with:
- High impressions
- Low CTR (<1%)
- Position between 10–40

Your job:
- Generate an SEO recommendation to improve CTR or rankings
- Generate an AEO recommendation to improve LLM discoverability (ChatGPT, Perplexity, Gemini)

For each page include:
- Clicks, Impressions, CTR, Position
- Actionable SEO recommendation (focus on snippet, title, intent)
- Actionable AEO recommendation (LLM answers, schema, clarity)

Output format:

{
  "pages": [
    {
      "url": "https://example.com/service-page",
      "clicks": 8,
      "impressions": 5900,
      "ctr": 0.0014,
      "position": 24.1,
      "seo_recommendation": "Rewrite meta title to highlight primary keyword with urgency modifier. Use schema for Service.",
      "aeo_recommendation": "Add direct answers like 'Do you offer X?' with FAQ schema and summary bullets."
    }
  ]
}

GSC Data from ${dateRangeStr}:
${dataStr}`;

      case 'emerging_keywords':
        return `Analyze the following GSC data from ${dateRangeStr}:\n\n${dataStr}\n\nIdentify new keywords gaining traction. Provide insights on search intent and content optimization opportunities.`;

      case 'bofu_pages':
        return `Analyze the following GSC data from ${dateRangeStr}:\n\n${dataStr}\n\nIdentify bottom-of-funnel pages and analyze their performance. Focus on conversion optimization opportunities.`;

      case 'ranking_volatility':
        return `Analyze the following GSC data from ${dateRangeStr}:\n\n${dataStr}\n\nIdentify pages with unstable rankings. Provide insights on causes and stabilization strategies.`;

      case 'quick_wins':
        return `Analyze the following GSC data from ${dateRangeStr}:\n\n${dataStr}\n\nIdentify quick optimization opportunities based on current rankings and potential impact.`;

      default:
        throw new Error(`Unsupported report type: ${reportType}`);
    }
  }

  private getBofuAnalysisPrompt(
    url: string,
    gscData: GSCDataPoint[],
    content?: string
  ): string {
    const dataString = JSON.stringify(gscData.slice(0, 20), null, 2);
    
    return `Analyze this bottom-funnel page for AI/LLM optimization:

URL: ${url}
GSC Data: ${dataString}
${content ? `Content Preview: ${content.substring(0, 1000)}...` : ''}

Provide a structured analysis in valid JSON format with these exact fields:
{
  "bofuQuery": "Generate a likely bottom-funnel query this page should target",
  "simulatedLlmSummary": "Simulate how an LLM like ChatGPT would answer this query",
  "isMentionedInLlmResponse": true/false,
  "competitorsLikelyMentioned": ["competitor1", "competitor2"],
  "aeoScore": {
    "overall": 1-10,
    "factors": {
      "contentStructure": 1-10,
      "directQuestionAnswering": 1-10,
      "clarityOfValueProp": 1-10,
      "semanticRelevance": 1-10,
      "presenceIn3rdPartyDatasets": 1-10
    }
  },
  "contentImprovementSuggestions": ["suggestion1", "suggestion2"],
  "outreachTargets": ["platform1", "platform2"],
  "misrepresentationFound": true/false,
  "fixSuggestions": ["fix1", "fix2"]
}

Return only valid JSON, no additional text.`;
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await this.makeOpenAIRequest(
        'Test connection',
        'Respond with "Connection successful"',
        false
      );
      return response.toLowerCase().includes('connection successful');
    } catch (error) {
      console.error('OpenAI connection test failed:', error);
      return false;
    }
  }
}

export const openAIService = new OpenAIService(); 