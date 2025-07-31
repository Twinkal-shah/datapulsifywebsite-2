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
                    window.location.pathname.startsWith('/auth/') ||
                    window.location.pathname.startsWith('/click-gap') ||
                    window.location.pathname.startsWith('/rank-tracker') ||
                    window.location.pathname.startsWith('/custom-ai') ||
                    window.location.pathname.startsWith('/top-gainers')
                  );
    
    const isMarketing = !isApp;

    // Explicitly set current port for consistency
    const currentPort = '8081';
    
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
      '/top-gainers-report',
      '/auth/google/callback',
      '/auth/callback',
      '/auth/gsc/callback'
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
      // Check both localStorage and cookies for auth token
      const authToken = localStorage.getItem('sb-yevkfoxoefssdgsodtzd-auth-token') || 
                       document.cookie.split(';').find(c => c.trim().startsWith('sb-yevkfoxoefssdgsodtzd-auth-token='));
      const hasSession = !!authToken;
      
      console.log('🔍 shouldBeOnApp - Session check:', {
        hasSession,
        authToken: authToken ? 'exists' : 'missing',
        localStorage: !!localStorage.getItem('sb-yevkfoxoefssdgsodtzd-auth-token'),
        cookieExists: !!document.cookie.split(';').find(c => c.trim().startsWith('sb-yevkfoxoefssdgsodtzd-auth-token='))
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

    // Don't redirect during any authentication processes
    if (currentPath.includes('/auth/') || 
        currentPath.includes('/callback') ||
        currentPath === '/auth/login') {
      return;
    }

    // Don't redirect if we're in the middle of an OAuth flow
    if (currentSearch.includes('code=') || currentSearch.includes('state=')) {
      return;
    }

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