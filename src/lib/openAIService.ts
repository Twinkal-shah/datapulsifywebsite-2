import { ReportType, Report, LLMSimulation, ReportError, AEOScore } from '@/types/aiReports';
import { GSCDataPoint } from '@/lib/gscService';
import { CacheManager } from './cacheManager';

interface OpenAIConfig {
  apiKey: string;
  model: string;
  maxTokensPerPrompt: number;
  rateLimit: number;
  temperature: number;
  maxInputTokens: number;
}

interface ChunkingConfig {
  maxTokensPerChunk: number;
  overlapTokens: number;
  preserveContext: boolean;
}

interface ChunkResult {
  index: number;
  content: string;
  tokens: number;
}

export class OpenAIService {
  private config: OpenAIConfig;
  private chunkingConfig: ChunkingConfig;
  private cache: CacheManager;
  private requestQueue: Array<{ request: () => Promise<any>; resolve: (value: any) => void; reject: (error: any) => void }> = [];
  private isProcessingQueue = false;
  private requestCount = 0;
  private windowStart = Date.now();

  constructor() {
    // First initialize config without maxInputTokens
    this.config = {
      apiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
      model: import.meta.env.VITE_OPENAI_MODEL || 'gpt-4',
      maxTokensPerPrompt: parseInt(import.meta.env.VITE_OPENAI_MAX_TOKENS || '4000'),
      rateLimit: parseInt(import.meta.env.VITE_OPENAI_RATE_LIMIT || '60'),
      temperature: 0.7,
      maxInputTokens: 4000 // Default value
    };

    // Then update maxInputTokens after config is initialized
    this.config.maxInputTokens = this.getModelTokenLimit();

    this.chunkingConfig = {
      maxTokensPerChunk: Math.floor(this.config.maxInputTokens * 0.7), // 70% of max to leave room for system prompt
      overlapTokens: 200,
      preserveContext: true
    };

    this.cache = new CacheManager();

    if (!this.config.apiKey) {
      throw new Error('OpenAI API key is required. Please set VITE_OPENAI_API_KEY environment variable.');
    }
  }

  private getModelTokenLimit(): number {
    const model = this.config.model.toLowerCase();
    
    if (model.includes('gpt-4-32k')) return 32000;
    if (model.includes('gpt-4')) return 8000;
    if (model.includes('gpt-3.5-turbo-16k')) return 16000;
    if (model.includes('gpt-3.5')) return 4000;
    
    return 4000; // Default fallback
  }

  private estimateTokens(text: string): number {
    // More accurate token estimation
    // GPT models typically use ~4 characters per token for English text
    // Adjust for special characters and formatting
    const baseTokens = Math.ceil(text.length / 4);
    const jsonPenalty = text.includes('{') || text.includes('[') ? 1.2 : 1;
    return Math.ceil(baseTokens * jsonPenalty);
  }

  private splitTextIntoChunks(text: string, contextPrefix: string = ''): string[] {
    const chunks: string[] = [];
    let currentChunk = contextPrefix;
    let currentTokens = this.estimateTokens(currentChunk);
    
    // Try different splitting strategies
    const splitters = [
      /(?<=[.!?])\s+/g,  // Sentences
      /\n\n/g,           // Paragraphs
      /\n/g,             // Lines
      /\s+/g             // Words (last resort)
    ];

    let segments = [text];
    
    for (const splitter of splitters) {
      const newSegments = [];
      let needsSplitting = false;
      
      for (const segment of segments) {
        if (this.estimateTokens(segment) > this.chunkingConfig.maxTokensPerChunk) {
          newSegments.push(...segment.split(splitter));
          needsSplitting = true;
        } else {
          newSegments.push(segment);
        }
      }
      
      segments = newSegments;
      if (!needsSplitting) break;
    }

    // Build chunks
    for (const segment of segments) {
      const segmentTokens = this.estimateTokens(segment);
      
      if (currentTokens + segmentTokens > this.chunkingConfig.maxTokensPerChunk) {
        // Save current chunk if it has content
        if (currentTokens > this.estimateTokens(contextPrefix)) {
          chunks.push(currentChunk);
        }
        
        // Start new chunk
        currentChunk = contextPrefix + segment;
        currentTokens = this.estimateTokens(currentChunk);
      } else {
        // Add to current chunk
        currentChunk += (currentChunk === contextPrefix ? '' : ' ') + segment;
        currentTokens += segmentTokens;
      }
    }
    
    // Add final chunk
    if (currentTokens > this.estimateTokens(contextPrefix)) {
      chunks.push(currentChunk);
    }
    
    return chunks;
  }

  private splitJSONDataIntoChunks(data: any[], contextPrefix: string = ''): string[] {
    const chunks: string[] = [];
    let currentBatch: any[] = [];
    let currentTokens = this.estimateTokens(contextPrefix);
    
    for (const item of data) {
      const itemTokens = this.estimateTokens(JSON.stringify(item));
      
      if (currentTokens + itemTokens > this.chunkingConfig.maxTokensPerChunk && currentBatch.length > 0) {
        // Save current batch
        chunks.push(contextPrefix + JSON.stringify(currentBatch, null, 2));
        currentBatch = [item];
        currentTokens = this.estimateTokens(contextPrefix) + itemTokens;
      } else {
        currentBatch.push(item);
        currentTokens += itemTokens;
      }
    }
    
    // Add final batch
    if (currentBatch.length > 0) {
      chunks.push(contextPrefix + JSON.stringify(currentBatch, null, 2));
    }
    
    return chunks;
  }

  private async processChunkedRequest(
    chunks: string[],
    systemPrompt: string,
    reportType: ReportType,
    useCache: boolean = true
  ): Promise<string> {
    console.log(`Processing ${chunks.length} chunks for ${reportType} report`);
    
    const chunkResults: ChunkResult[] = [];
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const chunkSystemPrompt = this.buildChunkSystemPrompt(systemPrompt, i + 1, chunks.length, reportType);
      
      try {
        const result = await this.makeOpenAIRequestInternal(chunk, chunkSystemPrompt, useCache);
        chunkResults.push({
          index: i,
          content: result,
          tokens: this.estimateTokens(result)
        });
      } catch (error) {
        console.error(`Error processing chunk ${i + 1}:`, error);
        // Continue with other chunks, handle partial results
        chunkResults.push({
          index: i,
          content: `Error processing chunk ${i + 1}: ${error}`,
          tokens: 0
        });
      }
    }
    
    return this.combineChunkResults(chunkResults, reportType);
  }

  private buildChunkSystemPrompt(
    originalSystemPrompt: string,
    chunkIndex: number,
    totalChunks: number,
    reportType: ReportType
  ): string {
    let chunkPrompt = originalSystemPrompt;
    
    if (totalChunks > 1) {
      chunkPrompt += `\n\nIMPORTANT: This is chunk ${chunkIndex} of ${totalChunks}. `;
      
      if (chunkIndex === 1) {
        chunkPrompt += "Focus on the beginning of the analysis. ";
      } else if (chunkIndex === totalChunks) {
        chunkPrompt += "Focus on completing the analysis and provide summary insights. ";
      } else {
        chunkPrompt += "Continue the analysis from previous chunks. ";
      }
      
      // Add report-specific chunking instructions
      switch (reportType) {
        case 'top_gainers':
        case 'underperforming_pages':
        case 'bofu_pages':
          chunkPrompt += "Analyze the pages in this chunk and provide individual recommendations for each.";
          break;
        case 'emerging_keywords':
          chunkPrompt += "Focus on the keywords in this chunk and their trends.";
          break;
        case 'ranking_volatility':
          chunkPrompt += "Analyze ranking changes for the pages in this chunk.";
          break;
        case 'quick_wins':
          chunkPrompt += "Identify optimization opportunities for the pages in this chunk.";
          break;
      }
    }
    
    return chunkPrompt;
  }

  private combineChunkResults(chunkResults: ChunkResult[], reportType: ReportType): string {
    const validResults = chunkResults.filter(result => !result.content.includes('Error processing chunk'));
    
    if (validResults.length === 0) {
      throw new Error('All chunks failed to process');
    }
    
    // Try to parse as JSON first
    const jsonResults = validResults.map(result => {
      try {
        return JSON.parse(result.content);
      } catch {
        return null;
      }
    }).filter(Boolean);
    
    if (jsonResults.length === validResults.length) {
      // All results are valid JSON, combine them
      return this.combineJSONResults(jsonResults, reportType);
    } else {
      // Fallback to text combination
      return this.combineTextResults(validResults.map(r => r.content));
    }
  }

  private combineJSONResults(results: any[], reportType: ReportType): string {
    try {
      switch (reportType) {
        case 'top_gainers':
        case 'underperforming_pages':
        case 'bofu_pages':
          return this.combinePageResults(results);
        
        case 'emerging_keywords':
        case 'ranking_volatility':
        case 'quick_wins':
          return this.combineAnalysisResults(results);
        
        default:
          return this.combineGenericResults(results);
      }
    } catch (error) {
      console.error('Error combining JSON results:', error);
      return this.combineTextResults(results.map(r => JSON.stringify(r)));
    }
  }

  private combinePageResults(results: any[]): string {
    const combined = {
      summary_heading: results[0]?.summary_heading || "Combined Analysis Results:",
      top_pages: [],
      pages: []
    };
    
    for (const result of results) {
      if (result.top_pages) {
        combined.top_pages.push(...result.top_pages);
      }
      if (result.pages) {
        combined.pages.push(...result.pages);
      }
    }
    
    // Remove duplicates based on URL
    const seenUrls = new Set();
    combined.top_pages = combined.top_pages.filter(page => {
      if (seenUrls.has(page.url)) return false;
      seenUrls.add(page.url);
      return true;
    });
    
    combined.pages = combined.pages.filter(page => {
      if (seenUrls.has(page.url)) return false;
      seenUrls.add(page.url);
      return true;
    });
    
    // Clean up empty arrays
    if (combined.top_pages.length === 0) delete combined.top_pages;
    if (combined.pages.length === 0) delete combined.pages;
    
    return JSON.stringify(combined, null, 2);
  }

  private combineAnalysisResults(results: any[]): string {
    // For analysis results, concatenate insights
    const combined = {
      insights: [],
      recommendations: [],
      summary: "Combined analysis from multiple data chunks"
    };
    
    for (const result of results) {
      if (result.insights) {
        combined.insights.push(...(Array.isArray(result.insights) ? result.insights : [result.insights]));
      }
      if (result.recommendations) {
        combined.recommendations.push(...(Array.isArray(result.recommendations) ? result.recommendations : [result.recommendations]));
      }
    }
    
    return JSON.stringify(combined, null, 2);
  }

  private combineGenericResults(results: any[]): string {
    // Generic combination for other result types
    if (Array.isArray(results[0])) {
      return JSON.stringify(results.flat(), null, 2);
    } else {
      return JSON.stringify(results, null, 2);
    }
  }

  private combineTextResults(results: string[]): string {
    return results.join('\n\n---\n\n');
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
    const totalTokens = this.estimateTokens(prompt + systemPrompt);
    
    if (totalTokens > this.config.maxInputTokens) {
      console.log(`Large prompt detected (${totalTokens} estimated tokens). Using chunking...`);
      
      // Determine chunking strategy based on content
      let chunks: string[];
      
      if (prompt.includes('GSC Data from') && prompt.includes('[')) {
        // This looks like GSC data, try to extract and chunk the JSON part
        const jsonMatch = prompt.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          try {
            const data = JSON.parse(jsonMatch[0]);
            const contextPrefix = prompt.substring(0, prompt.indexOf(jsonMatch[0])) + '\n';
            chunks = this.splitJSONDataIntoChunks(data, contextPrefix);
          } catch {
            chunks = this.splitTextIntoChunks(prompt);
          }
        } else {
          chunks = this.splitTextIntoChunks(prompt);
        }
      } else {
        chunks = this.splitTextIntoChunks(prompt);
      }
      
      // Determine report type from system prompt
      const reportType = this.detectReportType(systemPrompt, prompt);
      
      return this.processChunkedRequest(chunks, systemPrompt, reportType, useCache);
    }

    return this.makeOpenAIRequestInternal(prompt, systemPrompt, useCache);
  }

  private detectReportType(systemPrompt: string, prompt: string): ReportType {
    const combined = (systemPrompt + ' ' + prompt).toLowerCase();
    
    if (combined.includes('top_gainers') || combined.includes('pages winning')) return 'top_gainers';
    if (combined.includes('underperforming') || combined.includes('low ctr')) return 'underperforming_pages';
    if (combined.includes('bofu') || combined.includes('bottom-of-funnel')) return 'bofu_pages';
    if (combined.includes('emerging') || combined.includes('new keywords')) return 'emerging_keywords';
    if (combined.includes('volatility') || combined.includes('unstable')) return 'ranking_volatility';
    if (combined.includes('quick wins') || combined.includes('optimization opportunities')) return 'quick_wins';
    
    return 'top_gainers'; // Default fallback
  }

  private async makeOpenAIRequestInternal(
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