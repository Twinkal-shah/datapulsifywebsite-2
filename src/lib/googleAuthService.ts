interface GoogleAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scope: string[];
}

interface AuthResult {
  success: boolean;
  error?: string;
  guidance?: string;
  recoveryAction?: string;
}

export class GoogleAuthService {
  private config: GoogleAuthConfig;
  private tokenRefreshTimeout: NodeJS.Timeout | null = null;
  private isProcessingCallback = false;

  constructor() {
    this.config = {
      clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      clientSecret: import.meta.env.VITE_GOOGLE_CLIENT_SECRET,
      redirectUri: import.meta.env.VITE_GSC_REDIRECT_URI || (
        import.meta.env.DEV 
          ? `http://localhost:${window.location.port}/auth/google/callback`
          : 'https://app.datapulsify.com/auth/google/callback'
      ),
      scope: ['https://www.googleapis.com/auth/webmasters.readonly', 'https://www.googleapis.com/auth/webmasters']
    };
    
    this.validateConfig();
  }

  // Validate OAuth configuration
  private validateConfig() {
    const required = ['clientId', 'clientSecret', 'redirectUri'];
    const missing = required.filter(key => !this.config[key as keyof GoogleAuthConfig]);
    
    if (missing.length > 0) {
      console.error('❌ Missing OAuth configuration:', missing);
      throw new Error(`Missing OAuth configuration: ${missing.join(', ')}`);
    }
    
    console.log('✅ OAuth configuration validated');
  }

  // Enhanced auth state checking with timestamp validation
  isAuthInProgress(): boolean {
    const inProgress = sessionStorage.getItem('gsc_auth_in_progress') === 'true';
    const timestamp = sessionStorage.getItem('gsc_oauth_timestamp');
    
    if (!inProgress) {
      return false;
    }
    
    if (!timestamp) {
      // If flag exists but no timestamp, clear stale state
      console.log('🧹 Clearing auth state without timestamp');
      this.clearAuthState();
      return false;
    }
    
    const now = Date.now();
    const authTime = parseInt(timestamp);
    const fiveMinutes = 5 * 60 * 1000;
    
    // If auth is older than 5 minutes, clear stale state
    if (now - authTime > fiveMinutes) {
      console.log('🧹 Clearing stale auth state (>5 minutes old)');
      this.clearAuthState();
      return false;
    }
    
    console.log('⏳ Valid auth in progress', {
      startTime: new Date(authTime).toISOString(),
      elapsed: Math.round((now - authTime) / 1000) + 's'
    });
    
    return true;
  }

  // Comprehensive auth state cleanup
  clearAuthState() {
    const authKeys = [
      'gsc_oauth_state', 'gsc_oauth_timestamp', 'gsc_auth_in_progress',
      'gsc_auth_pending', 'gsc_callback_processing'
    ];
    
    authKeys.forEach(key => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
    
    console.log('🧹 Cleared all GSC auth state');
  }

  // Enhanced error handling with user guidance
  private getErrorGuidance(error: string): { message: string; guidance: string; recoveryAction: string } {
    const errorMappings = {
      'invalid_grant': {
        message: 'The authorization code has expired or been used already.',
        guidance: 'This usually happens when:\n• You waited too long to complete authentication\n• You tried to connect multiple times\n• Your browser was closed during authentication',
        recoveryAction: 'clear_and_retry'
      },
      'invalid_client': {
        message: 'OAuth configuration error detected.',
        guidance: 'This indicates a configuration problem:\n• Client ID or secret may be incorrect\n• OAuth app may not be properly configured\n• Contact support if this persists',
        recoveryAction: 'contact_support'
      },
      'access_denied': {
        message: 'You denied access to Google Search Console.',
        guidance: 'To connect GSC, you need to:\n• Grant permission to access your GSC data\n• Make sure you\'re signed into the correct Google account\n• Try the connection process again',
        recoveryAction: 'retry_with_permissions'
      },
      'redirect_uri_mismatch': {
        message: 'OAuth redirect configuration error.',
        guidance: 'This is a technical configuration issue:\n• The redirect URL doesn\'t match Google Console settings\n• Please contact support for assistance',
        recoveryAction: 'contact_support'
      }
    };
    
    return errorMappings[error] || {
      message: 'An unexpected error occurred during authentication.',
      guidance: 'Try the following steps:\n• Clear your browser cache and cookies\n• Make sure you\'re signed into Google\n• Try connecting again\n• Contact support if the problem persists',
      recoveryAction: 'clear_and_retry'
    };
  }

  // Debug logging method
  private logDebugInfo(context: string) {
    console.log(`🔍 GSC Auth Debug (${context}):`, {
      timestamp: new Date().toISOString(),
      authInProgress: this.isAuthInProgress(),
      storedState: localStorage.getItem('gsc_oauth_state'),
      storedTimestamp: localStorage.getItem('gsc_oauth_timestamp'),
      sessionAuthFlag: sessionStorage.getItem('gsc_auth_in_progress'),
      allAuthKeys: Object.keys(localStorage).filter(k => k.includes('gsc')),
      currentUrl: window.location.href,
      userAgent: navigator.userAgent.substring(0, 100) + '...'
    });
  }

  async initiateGSCAuth() {
    this.logDebugInfo('initiate_start');
    
    if (!this.config.clientId) {
      throw new Error('Google Client ID not configured');
    }

    // Clear any previous auth state to prevent conflicts
    this.clearAuthState();

    // Generate a more robust state parameter with additional entropy
    const timestamp = Date.now().toString(36);
    const random1 = Math.random().toString(36).substring(2);
    const random2 = Math.random().toString(36).substring(2);
    const state = `gsc-${timestamp}-${random1}-${random2}`;
    
    // Store state in both localStorage and sessionStorage for redundancy
    const stateKey = 'gsc_oauth_state';
    const timestampKey = 'gsc_oauth_timestamp';
    const currentTime = Date.now().toString();
    
    localStorage.setItem(stateKey, state);
    localStorage.setItem(timestampKey, currentTime);
    sessionStorage.setItem(stateKey, state);
    sessionStorage.setItem(timestampKey, currentTime);
    
    // Store a flag to indicate auth is in progress
    sessionStorage.setItem('gsc_auth_in_progress', 'true');

    console.log('🚀 Starting GSC OAuth flow', {
      state: state.substring(0, 20) + '...',
      redirectUri: this.config.redirectUri,
      timestamp: new Date().toISOString()
    });

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${this.config.clientId}` +
      `&redirect_uri=${encodeURIComponent(this.config.redirectUri)}` +
      `&scope=${encodeURIComponent(this.config.scope.join(' '))}` +
      `&response_type=code` +
      `&state=${state}` +
      `&access_type=offline` +
      `&prompt=consent`;
    
    this.logDebugInfo('initiate_redirect');
    window.location.href = authUrl;
  }

  async handleCallback(code: string, state: string): Promise<AuthResult> {
    this.logDebugInfo('callback_start');
    
    // Prevent concurrent callback processing with global flag
    const globalFlag = 'gsc_callback_processing';
    if (this.isProcessingCallback || sessionStorage.getItem(globalFlag) === 'true') {
      return {
        success: false,
        error: 'Authentication already in progress',
        guidance: 'Please wait for the current authentication to complete.',
        recoveryAction: 'wait_or_refresh'
      };
    }
    
    this.isProcessingCallback = true;
    sessionStorage.setItem(globalFlag, 'true');
    
    try {
      // Verify state to prevent CSRF attacks - check both localStorage and sessionStorage
      const stateKey = 'gsc_oauth_state';
      const timestampKey = 'gsc_oauth_timestamp';
      
      let storedState = localStorage.getItem(stateKey) || sessionStorage.getItem(stateKey);
      let stateTimestamp = localStorage.getItem(timestampKey) || sessionStorage.getItem(timestampKey);
      
      console.log('🔍 State validation:', {
        receivedState: state ? state.substring(0, 20) + '...' : 'missing',
        storedState: storedState ? storedState.substring(0, 20) + '...' : 'missing',
        hasTimestamp: !!stateTimestamp
      });

      // Clean up stored state from both storages
      localStorage.removeItem(stateKey);
      localStorage.removeItem(timestampKey);
      sessionStorage.removeItem(stateKey);
      sessionStorage.removeItem(timestampKey);
      sessionStorage.removeItem('gsc_auth_in_progress');
      
      // Check if state is valid
      if (!storedState || state !== storedState) {
        // Check if we're in development mode and allow bypass for testing
        const isDevelopment = import.meta.env.DEV;
        const allowBypass = isDevelopment && window.location.hostname === 'localhost';
        
        if (allowBypass && code) {
          console.warn('⚠️ STATE VALIDATION BYPASSED IN DEVELOPMENT MODE');
        } else {
          // Clear any pending auth flags on error
          sessionStorage.removeItem('gsc_auth_pending');
          
          let errorType = 'state_validation_failed';
          let errorMessage = 'Authentication state validation failed. ';
          
          if (!storedState) {
            errorType = 'no_stored_state';
            errorMessage += 'No stored authentication state found.';
          } else if (state !== storedState) {
            errorType = 'state_mismatch';
            errorMessage += 'Authentication state mismatch detected.';
          }
          
          const errorInfo = this.getErrorGuidance(errorType);
          
          return {
            success: false,
            error: errorMessage,
            guidance: errorInfo.guidance,
            recoveryAction: errorInfo.recoveryAction
          };
        }
      }
      
      console.log('✅ State validation successful, proceeding with token exchange...');

      // Exchange code for tokens using fetch
      console.log('🔄 Starting token exchange...');
      
      const tokenRequestBody = {
        code,
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        redirect_uri: this.config.redirectUri,
        grant_type: 'authorization_code',
      };
      
      console.log('🔄 Token exchange request:', {
        url: 'https://oauth2.googleapis.com/token',
        method: 'POST',
        body: {
          code: code ? `${code.substring(0, 10)}...` : 'missing',
          client_id: this.config.clientId ? `${this.config.clientId.substring(0, 10)}...` : 'missing',
          client_secret: this.config.clientSecret ? 'present' : 'missing',
          redirect_uri: this.config.redirectUri,
          grant_type: 'authorization_code'
        }
      });
      
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(tokenRequestBody),
      });

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json().catch(() => ({}));
        
        console.error('❌ Token exchange failed:', {
          status: tokenResponse.status,
          statusText: tokenResponse.statusText,
          errorData
        });
        
        const errorType = errorData.error || 'token_exchange_failed';
        const errorInfo = this.getErrorGuidance(errorType);
        
        return {
          success: false,
          error: errorInfo.message,
          guidance: errorInfo.guidance,
          recoveryAction: errorInfo.recoveryAction
        };
      }

      const tokens = await tokenResponse.json();
      
      if (!tokens.access_token) {
        return {
          success: false,
          error: 'No access token received',
          guidance: 'The authentication completed but no access token was provided.\nThis may be a temporary issue with Google\'s servers.',
          recoveryAction: 'retry_later'
        };
      }
      
      // Store tokens
      localStorage.setItem('gsc_token', tokens.access_token);
      if (tokens.refresh_token) {
        localStorage.setItem('gsc_refresh_token', tokens.refresh_token);
      }
      
      // Verify storage
      const storedToken = localStorage.getItem('gsc_token');
      if (!storedToken) {
        return {
          success: false,
          error: 'Failed to store authentication token',
          guidance: 'The token was received but couldn\'t be saved.\nThis may be due to browser storage restrictions.',
          recoveryAction: 'check_storage'
        };
      }

      console.log('✅ GSC authentication successful!', {
        hasAccessToken: !!tokens.access_token,
        hasRefreshToken: !!tokens.refresh_token,
        tokenLength: tokens.access_token?.length || 0
      });

      this.isProcessingCallback = false;
      sessionStorage.removeItem('gsc_callback_processing');
      
      return { 
        success: true,
        guidance: 'Successfully connected to Google Search Console!'
      };
      
    } catch (error) {
      console.error('❌ GSC callback error:', error);
      
      // Clear all auth state on error
      this.clearAuthState();
      sessionStorage.removeItem('gsc_callback_processing');
      this.isProcessingCallback = false;
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      const errorInfo = this.getErrorGuidance('callback_exception');
      
      return {
        success: false,
        error: errorMessage,
        guidance: errorInfo.guidance,
        recoveryAction: errorInfo.recoveryAction
      };
    }
  }

  async fetchGSCProperties(): Promise<{ siteUrl: string }[]> {
    const token = localStorage.getItem('gsc_token');
    if (!token) {
      throw new Error('No GSC token available. Please reconnect to Google Search Console.');
    }

    const response = await fetch('https://www.googleapis.com/webmasters/v3/sites', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Token expired or invalid
        localStorage.removeItem('gsc_token');
        localStorage.removeItem('gsc_refresh_token');
        throw new Error('Your Google Search Console token has expired. Please reconnect your account.');
      }
      
      throw new Error(`Failed to fetch GSC properties: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.siteEntry || [];
  }

  async validateToken(token: string): Promise<boolean> {
    try {
      // Test the token by making a simple API call to GSC
      const response = await fetch('https://www.googleapis.com/webmasters/v3/sites', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      return response.ok;
    } catch (error) {
      console.error('Error validating token:', error);
      return false;
    }
  }

  async validateAndRefreshToken(): Promise<string | null> {
    try {
      const currentToken = localStorage.getItem('gsc_token');
      const refreshToken = localStorage.getItem('gsc_refresh_token');

      if (!currentToken) {
        console.error('No access token found');
        return null;
      }

      // First, try to validate the current token
      const isValid = await this.validateToken(currentToken);
      if (isValid) {
        return currentToken;
      }

      // If current token is invalid, try to refresh it
      if (!refreshToken) {
        console.error('No refresh token available for token refresh');
        return null;
      }

      console.log('Access token invalid, attempting to refresh...');
      
      // Use fetch to refresh the token
      const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          refresh_token: refreshToken,
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          grant_type: 'refresh_token',
        }),
      });

      if (!refreshResponse.ok) {
        const errorData = await refreshResponse.json();
        console.error('Token refresh failed:', errorData);
        throw new Error(`Token refresh failed: ${errorData.error_description || errorData.error}`);
      }

      const tokens = await refreshResponse.json();
      
      if (tokens.access_token) {
        // Store the new access token
        localStorage.setItem('gsc_token', tokens.access_token);
        
        // If we got a new refresh token, store it too
        if (tokens.refresh_token) {
          localStorage.setItem('gsc_refresh_token', tokens.refresh_token);
        }

        console.log('Token refreshed successfully');
        return tokens.access_token;
      } else {
        console.error('Failed to refresh token - no access token in response');
        return null;
      }

    } catch (error) {
      console.error('Error refreshing token:', error);
      // Clear invalid tokens
      localStorage.removeItem('gsc_token');
      localStorage.removeItem('gsc_refresh_token');
      return null;
    }
  }
} 