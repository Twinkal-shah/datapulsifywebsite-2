interface GoogleAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scope: string[];
}

interface AuthResult {
  success: boolean;
  error?: string;
  token?: string;
  message?: string;
}

export class GoogleAuthService {
  private config: GoogleAuthConfig;
  private tokenRefreshTimeout: NodeJS.Timeout | null = null;
  private isProcessingCallback = false;

  constructor() {
    this.config = {
      clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      clientSecret: import.meta.env.VITE_GOOGLE_CLIENT_SECRET,
      redirectUri: import.meta.env.VITE_GOOGLE_REDIRECT_URI || (
        import.meta.env.DEV 
          ? `http://localhost:${window.location.port}/auth/google/callback`
          : 'https://app.datapulsify.com/auth/google/callback'
      ),
      scope: ['https://www.googleapis.com/auth/webmasters.readonly', 'https://www.googleapis.com/auth/webmasters']
    };
    
    // Validate required configuration
    if (!this.config.clientId) {
      console.error('VITE_GOOGLE_CLIENT_ID not configured');
    }
    if (!this.config.clientSecret) {
      console.error('VITE_GOOGLE_CLIENT_SECRET not configured');
    }
  }

  async initiateGSCAuth() {
    if (!this.config.clientId) {
      throw new Error('Google Client ID not configured');
    }

    // Generate a more robust state parameter with additional entropy
    const timestamp = Date.now().toString(36);
    const random1 = Math.random().toString(36).substring(2);
    const random2 = Math.random().toString(36).substring(2);
    const state = `${timestamp}-${random1}-${random2}`;
    
    // Store state in both localStorage and sessionStorage for redundancy
    const stateKey = 'gsc_oauth_state';
    const timestampKey = 'gsc_oauth_timestamp';
    
    localStorage.setItem(stateKey, state);
    localStorage.setItem(timestampKey, Date.now().toString());
    sessionStorage.setItem(stateKey, state);
    sessionStorage.setItem(timestampKey, Date.now().toString());
    
    // Store a flag to indicate auth is in progress
    sessionStorage.setItem('gsc_auth_in_progress', 'true');

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${this.config.clientId}` +
      `&redirect_uri=${encodeURIComponent(this.config.redirectUri)}` +
      `&scope=${encodeURIComponent(this.config.scope.join(' '))}` +
      `&response_type=code` +
      `&state=${state}` +
      `&access_type=offline` +
      `&prompt=consent`;
    window.location.href = authUrl;
  }

  async handleCallback(code: string, state: string): Promise<AuthResult> {
    // Prevent concurrent callback processing with global flag
    const globalFlag = 'gsc_callback_processing';
    if (this.isProcessingCallback || sessionStorage.getItem(globalFlag) === 'true') {
      throw new Error('Authentication already in progress');
    }
    
    this.isProcessingCallback = true;
    sessionStorage.setItem(globalFlag, 'true');
    
    try {
      
      // Verify state to prevent CSRF attacks - check both localStorage and sessionStorage
      const stateKey = 'gsc_oauth_state';
      const timestampKey = 'gsc_oauth_timestamp';
      
      let storedState = localStorage.getItem(stateKey) || sessionStorage.getItem(stateKey);
      let stateTimestamp = localStorage.getItem(timestampKey) || sessionStorage.getItem(timestampKey);
      
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
          console.warn('STATE VALIDATION BYPASSED IN DEVELOPMENT MODE');
        } else {
          // Clear any pending auth flags on error
          sessionStorage.removeItem('gsc_auth_pending');
          
          // Provide more detailed error message with troubleshooting steps
          let errorMessage = 'Authentication state validation failed. ';
          
          if (!storedState) {
            errorMessage += 'No stored authentication state found. This usually happens when:\n';
            errorMessage += '• The authentication was started in a different browser tab or window\n';
            errorMessage += '• Browser storage was cleared during the authentication process\n';
            errorMessage += '• The browser was closed and reopened during authentication\n';
            errorMessage += '• You waited too long to complete the authentication';
          } else if (state !== storedState) {
            errorMessage += 'Authentication state mismatch detected. This may indicate:\n';
            errorMessage += '• Multiple authentication attempts were made simultaneously\n';
            errorMessage += '• The authentication flow was corrupted or tampered with\n';
            errorMessage += '• A security issue (CSRF attack attempt)';
          }
          
          errorMessage += '\n\nPlease try the following:\n';
          errorMessage += '1. Close all browser tabs and start fresh\n';
          errorMessage += '2. Clear your browser cache and cookies for this site\n';
          errorMessage += '3. Try connecting from the Settings page again\n';
          errorMessage += '4. Make sure you complete the authentication in the same browser tab';
          
          throw new Error(errorMessage);
        }
      }
      
      console.log('State validation successful, proceeding with token exchange...');

      // Exchange code for tokens using fetch
      // Exchange code for tokens - simplified approach 
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
        
        let errorMessage = 'Token exchange failed';
        if (errorData.error_description) {
          errorMessage += `: ${errorData.error_description}`;
        } else if (errorData.error) {
          errorMessage += `: ${errorData.error}`;
        } else {
          errorMessage += `: ${tokenResponse.statusText}`;
        }
        
        // Add specific guidance for common OAuth errors
        if (errorData.error === 'invalid_grant') {
          errorMessage += '\n\nThis usually means:\n• The authorization code has expired (try connecting again)\n• The redirect URI doesn\'t match your Google Console configuration\n• The code has already been used';
        } else if (errorData.error === 'invalid_client') {
          errorMessage += '\n\nThis usually means:\n• The client ID or client secret is incorrect\n• The OAuth app is not configured properly in Google Console';
        } else if (tokenResponse.status === 400) {
          errorMessage += '\n\nPossible causes:\n• OAuth configuration mismatch\n• Expired authorization code\n• Incorrect redirect URI\n• Missing or invalid client credentials';
        }
        
        throw new Error(errorMessage);
      }

      const tokens = await tokenResponse.json();
      
      if (!tokens.access_token) {
        throw new Error('Token exchange completed but no access token received');
      }
      
      // Store tokens
      localStorage.setItem('gsc_token', tokens.access_token);
      if (tokens.refresh_token) {
        localStorage.setItem('gsc_refresh_token', tokens.refresh_token);
      }
      
      // Verify storage
      const storedToken = localStorage.getItem('gsc_token');
      if (!storedToken) {
        throw new Error('Failed to store authentication token');
      }

      this.isProcessingCallback = false;
      sessionStorage.removeItem('gsc_callback_processing');
      
      return {
        success: true,
        message: 'Authentication successful'
      };
    } catch (error: any) {
      // Clean up any remaining auth state on error
      this.isProcessingCallback = false;
      sessionStorage.removeItem('gsc_callback_processing');
      
      localStorage.removeItem('gsc_token');
      localStorage.removeItem('gsc_refresh_token');
      sessionStorage.removeItem('gsc_auth_pending');
      
      // Re-throw with enhanced context
      throw new Error(`Authentication failed: ${error.message}`);
    }
  }

  clearAuth() {
    if (this.tokenRefreshTimeout) {
      clearTimeout(this.tokenRefreshTimeout);
    }
    
    // Clear all GSC-related storage items
    localStorage.removeItem('gsc_token');
    localStorage.removeItem('gsc_refresh_token');
    localStorage.removeItem('gsc_property');
    localStorage.removeItem('gsc_oauth_state');
    localStorage.removeItem('gsc_oauth_timestamp');
    
    // Clear session storage items
    sessionStorage.removeItem('gsc_oauth_state');
    sessionStorage.removeItem('gsc_oauth_timestamp');
    sessionStorage.removeItem('gsc_auth_in_progress');
    sessionStorage.removeItem('gsc_auth_pending');
  }

  // Add a method to check if authentication is in progress
  isAuthInProgress(): boolean {
    return sessionStorage.getItem('gsc_auth_in_progress') === 'true';
  }

  // Clear auth state (useful for troubleshooting)
  clearAuthState() {
    localStorage.removeItem('gsc_oauth_state');
    localStorage.removeItem('gsc_oauth_timestamp');
    sessionStorage.removeItem('gsc_oauth_state');
    sessionStorage.removeItem('gsc_oauth_timestamp');
    sessionStorage.removeItem('gsc_auth_in_progress');
    sessionStorage.removeItem('gsc_auth_pending');
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