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
                    window.location.pathname.startsWith('/settings') ||
                    window.location.pathname.startsWith('/auth/')
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
    console.log(`🔄 Redirecting to app subdomain:`, {
      from: window.location.href,
      to: this.getAppUrl(path)
    });
    window.location.href = this.getAppUrl(path);
  }

  redirectToMarketing(path = ''): void {
    console.log(`🔄 Redirecting to marketing subdomain:`, {
      from: window.location.href,
      to: this.getMarketingUrl(path)
    });
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
      '/top-gainers-report',
      '/auth/google/callback',
      '/auth/callback'
    ];

    // First check if path is an app path
    const isAppPath = appPaths.some(appPath => path.startsWith(appPath));
    console.log('🔍 shouldBeOnApp - Path check:', {
      currentPath: path,
      isAppPath,
      appPaths
    });
    
    if (isAppPath) {
      console.log('✅ shouldBeOnApp: TRUE (app path)');
      return true;
    }

    // If not an app path, check if user has a session
    try {
      const authToken = localStorage.getItem('sb-yevkfoxoefssdgsodtzd-auth-token');
      const hasSession = !!authToken;
      
      console.log('🔍 shouldBeOnApp - Session check:', {
        hasSession,
        authToken: authToken ? 'exists' : 'missing'
      });
      
      // If user has a session and is not on a marketing-only path, they should be on app
      if (hasSession) {
        const marketingOnlyPaths = ['/', '/pricing', '/features', '/about', '/contact', '/privacy', '/terms'];
        const isMarketingPath = marketingOnlyPaths.some(mPath => path === mPath);
        
        console.log('🔍 shouldBeOnApp - Marketing path check:', {
          currentPath: path,
          isMarketingPath,
          marketingOnlyPaths
        });
        
        const result = !isMarketingPath;
        console.log(result ? '✅ shouldBeOnApp: TRUE (authenticated, not marketing path)' : '❌ shouldBeOnApp: FALSE (marketing path)');
        return result;
      }
    } catch (error) {
      console.warn('❌ Error checking auth session:', error);
    }

    console.log('❌ shouldBeOnApp: FALSE (no session)');
    return false;
  }

  // Check if current page should be on marketing subdomain
  shouldBeOnMarketing(): boolean {
    return !this.shouldBeOnApp();
  }

  // Helper to ensure user is on correct subdomain based on current path
  enforceCorrectSubdomain(): void {
    const isProduction = this.config.hostname.includes('datapulsify.com');
    
    // Only enforce in production
    if (!isProduction) return;

    const shouldBeApp = this.shouldBeOnApp();
    const isCurrentlyApp = this.config.isApp;
    const currentPath = window.location.pathname;
    const currentSearch = window.location.search;

    console.log('🔍 Enforcing subdomain:', {
      shouldBeApp,
      isCurrentlyApp,
      currentPath,
      hasSession: !!localStorage.getItem('sb-yevkfoxoefssdgsodtzd-auth-token')
    });

    if (shouldBeApp && !isCurrentlyApp) {
      // Should be on app, but currently on marketing
      this.redirectToApp(currentPath + currentSearch);
    } else if (!shouldBeApp && isCurrentlyApp) {
      // Should be on marketing, but currently on app
      this.redirectToMarketing(currentPath + currentSearch);
    }
  }
}

// Create singleton instance
export const subdomainService = new SubdomainService();
export const subdomainConfig = subdomainService.getConfig(); 