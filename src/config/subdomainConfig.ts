export interface SubdomainConfig {
  isApp: boolean;
  isMarketing: boolean;
  hostname: string;
  baseUrl: string;
  appUrl: string;
  marketingUrl: string;
}

class SubdomainService {
  private config: SubdomainConfig;

  constructor() {
    const hostname = window.location.hostname;
    const isProduction = hostname.includes('datapulsify.com');
    
    // Determine if we're on the app subdomain
    const isApp = hostname.startsWith('app.') || 
                  (hostname === 'localhost' || hostname.startsWith('localhost:')) && (
                    window.location.pathname.startsWith('/dashboard') ||
                    window.location.pathname.startsWith('/account') ||
                    window.location.pathname.startsWith('/settings')
                  );
    
    const isMarketing = !isApp;

    // Get the current port in development
    const currentPort = window.location.port || '5173';
    
    // Set URLs based on environment
    const baseUrl = isProduction 
      ? `https://${hostname}`
      : `http://localhost:${currentPort}`;
    
    const appUrl = isProduction 
      ? 'https://app.datapulsify.com'
      : `http://localhost:${currentPort}`;
    
    const marketingUrl = isProduction 
      ? 'https://datapulsify.com'
      : `http://localhost:${currentPort}`;

    this.config = {
      isApp,
      isMarketing,
      hostname,
      baseUrl,
      appUrl,
      marketingUrl
    };
  }

  getConfig(): SubdomainConfig {
    return this.config;
  }

  // Helper methods
  isAppSubdomain(): boolean {
    return this.config.isApp;
  }

  isMarketingSubdomain(): boolean {
    return this.config.isMarketing;
  }

  getAppUrl(path = ''): string {
    return `${this.config.appUrl}${path}`;
  }

  getMarketingUrl(path = ''): string {
    return `${this.config.marketingUrl}${path}`;
  }

  // Redirect helpers
  redirectToApp(path = '/dashboard'): void {
    window.location.href = this.getAppUrl(path);
  }

  redirectToMarketing(path = ''): void {
    window.location.href = this.getMarketingUrl(path);
  }

  // Check if current page should be on app subdomain
  shouldBeOnApp(): boolean {
    const path = window.location.pathname;
    const appPaths = [
      '/dashboard',
      '/account',
      '/account-dashboard',
      '/settings',
      '/click-gap-intelligence',
      '/rank-tracker',
      '/custom-ai-dashboard',
      '/keyword-analysis',
      '/gap-analysis',
      '/keyword-clustering',
      '/reports',
      '/top-gainers-report'
    ];
    
    return appPaths.some(appPath => path.startsWith(appPath));
  }

  // Check if current page should be on marketing subdomain
  shouldBeOnMarketing(): boolean {
    return !this.shouldBeOnApp();
  }
}

// Create singleton instance
export const subdomainService = new SubdomainService();
export const subdomainConfig = subdomainService.getConfig(); 