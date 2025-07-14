import { Report, ExportOptions } from '@/types/aiReports';
import { supabase } from './supabaseClient';

export class ExportService {
  private userId: string;
  private planType: string;

  constructor(userId: string, planType: string) {
    this.userId = userId;
    this.planType = planType;
  }

  async canExport(): Promise<boolean> {
    try {
      const { data: usage } = await supabase
        .from('report_usage')
        .select('exports_this_month')
        .eq('user_id', this.userId)
        .single();

      if (!usage) return false;

      const exportLimits = {
        free: 0,
        lifetime: 2,
        monthly_pro: 5
      };

      const limit = exportLimits[this.planType as keyof typeof exportLimits] || 0;
      return usage.exports_this_month < limit;
    } catch (error) {
      console.error('Error checking export capability:', error);
      return false;
    }
  }

  async exportToCSV(report: Report, options: ExportOptions = { format: 'csv' }): Promise<string> {
    if (!await this.canExport()) {
      throw new Error('Export limit reached for your plan');
    }

    const csvContent = this.generateCSVContent(report, options);
    
    // Update export count
    await this.incrementExportUsage(report.id);
    
    return csvContent;
  }

  async exportToGoogleSheets(report: Report, options: ExportOptions = { format: 'google_sheets' }): Promise<string> {
    if (!await this.canExport()) {
      throw new Error('Export limit reached for your plan');
    }

    // This would integrate with Google Sheets API
    // For now, return a placeholder URL
    const sheetsUrl = await this.createGoogleSheet(report, options);
    
    // Update export count
    await this.incrementExportUsage(report.id);
    
    return sheetsUrl;
  }

  private generateCSVContent(report: Report, options: ExportOptions): string {
    const headers = this.getCSVHeaders(report.reportType);
    const rows = this.getCSVRows(report);
    
    let csvContent = headers.join(',') + '\n';
    
    // Add summary if requested
    if (options.includeAEO && report.reportType === 'bofu_pages') {
      csvContent += '\n# AI Summary\n';
      csvContent += `"${report.aiSummary.replace(/"/g, '""')}"\n\n`;
    }
    
    // Add data rows
    rows.forEach(row => {
      csvContent += row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',') + '\n';
    });
    
    return csvContent;
  }

  private getCSVHeaders(reportType: string): string[] {
    switch (reportType) {
      case 'top_gainers':
        return ['URL', 'Clicks', 'Impressions', 'CTR', 'Position', 'SEO Recommendation', 'AEO Recommendation'];
      case 'underperforming_pages':
        return ['URL', 'Clicks', 'Impressions', 'CTR', 'Position', 'SEO Recommendation', 'AEO Recommendation'];
      case 'emerging_keywords':
        return ['Keyword', 'Mapped URL', 'CTR', 'Position', 'Suggested Action'];
      case 'bofu_pages':
        return ['URL', 'Clicks Change', 'CTR Change', 'Rank Change', 'Suggested Fixes', 'AEO Score'];
      case 'ranking_volatility':
        return ['URL', 'Position Change', 'CTR', 'Volatility Type', 'Suggested Action'];
      case 'quick_wins':
        return ['URL', 'Position', 'Impressions', 'CTR', 'Opportunity Type', 'Suggested Optimizations'];
      default:
        return ['URL', 'Metric', 'Value'];
    }
  }

  private getCSVRows(report: Report): string[][] {
    switch (report.reportType) {
      case 'top_gainers':
        const topGainersData = (report as any).data.top_pages || [];
        return topGainersData.map((item: any) => [
          item.url,
          item.clicks.toString(),
          item.impressions.toString(),
          (item.ctr * 100).toFixed(2) + '%',
          item.position.toFixed(1),
          item.seo_recommendation,
          item.aeo_recommendation
        ]);
      case 'underperforming_pages':
        const underperformingData = (report as any).data.pages || [];
        return underperformingData.map((item: any) => [
          item.url,
          item.clicks.toString(),
          item.impressions.toString(),
          (item.ctr * 100).toFixed(2) + '%',
          item.position.toFixed(1),
          item.seo_recommendation,
          item.aeo_recommendation
        ]);
      case 'emerging_keywords':
        const emergingData = report.data as any[];
        return emergingData.map(item => [
          item.keyword,
          item.mappedUrl,
          item.ctr.toString(),
          item.position.toString(),
          item.suggestedAction
        ]);
      case 'bofu_pages':
        const bofuData = report.data as any[];
        return bofuData.map(item => [
          item.url,
          item.clicksChange.toString(),
          item.ctrChange.toString(),
          item.rankChange.toString(),
          item.suggestedFixes.join('; '),
          item.llmAnalysis?.aeoScore?.overall?.toString() || 'N/A'
        ]);
      case 'ranking_volatility':
        const volatilityData = report.data as any[];
        return volatilityData.map(item => [
          item.url,
          item.positionChange.toString(),
          item.ctr.toString(),
          item.volatilityType,
          item.suggestedAction
        ]);
      case 'quick_wins':
        const quickWinsData = report.data as any[];
        return quickWinsData.map(item => [
          item.url,
          item.position.toString(),
          item.impressions.toString(),
          item.ctr.toString(),
          item.opportunityType,
          item.suggestedOptimizations.join('; ')
        ]);
      default:
        return [];
    }
  }

  private async createGoogleSheet(report: Report, options: ExportOptions): Promise<string> {
    // This would integrate with Google Sheets API
    // For now, return a placeholder implementation
    
    try {
      // Get Google access token (would need to implement OAuth flow)
      const accessToken = localStorage.getItem('google_sheets_token');
      
      if (!accessToken) {
        throw new Error('Google Sheets access not configured');
      }

      // Create spreadsheet
      const spreadsheetData = {
        properties: {
          title: `${report.reportType} Report - ${new Date(report.createdAt).toLocaleDateString()}`
        },
        sheets: [{
          properties: {
            title: 'Report Data'
          },
          data: [{
            rowData: this.getGoogleSheetsData(report)
          }]
        }]
      };

      const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(spreadsheetData)
      });

      if (!response.ok) {
        throw new Error('Failed to create Google Sheet');
      }

      const result = await response.json();
      return result.spreadsheetUrl;
    } catch (error) {
      console.error('Error creating Google Sheet:', error);
      // Fallback to CSV download
      return 'data:text/csv;charset=utf-8,' + encodeURIComponent(this.generateCSVContent(report, options));
    }
  }

  private getGoogleSheetsData(report: Report): any[] {
    const headers = this.getCSVHeaders(report.reportType);
    const rows = this.getCSVRows(report);
    
    const sheetData = [];
    
    // Add headers
    sheetData.push({
      values: headers.map(header => ({ userEnteredValue: { stringValue: header } }))
    });
    
    // Add data rows
    rows.forEach(row => {
      sheetData.push({
        values: row.map(cell => ({ userEnteredValue: { stringValue: cell } }))
      });
    });
    
    return sheetData;
  }

  private async incrementExportUsage(reportId: string): Promise<void> {
    try {
      // Update export count in reports table
      const { data: currentReport } = await supabase
        .from('reports')
        .select('export_count')
        .eq('id', reportId)
        .eq('user_id', this.userId)
        .single();
      
      if (currentReport) {
        await supabase
          .from('reports')
          .update({ export_count: currentReport.export_count + 1 })
          .eq('id', reportId)
          .eq('user_id', this.userId);
      }

      // Update user export usage
      await supabase.rpc('increment_export_usage', {
        user_uuid: this.userId
      });
    } catch (error) {
      console.error('Error incrementing export usage:', error);
    }
  }

  downloadCSV(content: string, filename: string): void {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  }

  generateFileName(report: Report, format: 'csv' | 'google_sheets'): string {
    const date = new Date(report.createdAt).toISOString().split('T')[0];
    const extension = format === 'csv' ? 'csv' : 'xlsx';
    return `${report.reportType}_report_${date}.${extension}`;
  }
}

export const createExportService = (userId: string, planType: string) => {
  return new ExportService(userId, planType);
}; 