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

  constructor() {
    this.config = {
      clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      clientSecret: import.meta.env.VITE_GOOGLE_CLIENT_SECRET,
      redirectUri: import.meta.env.VITE_GOOGLE_REDIRECT_URI || `${window.location.origin}/auth/google/callback`,
      scope: ['https://www.googleapis.com/auth/webmasters.readonly', 'https://www.googleapis.com/auth/webmasters']
    };
  }

  async initiateGSCAuth() {
    if (!this.config.clientId) {
      throw new Error('Google Client ID not configured');
    }

    const state = Math.random().toString(36).substring(2);
    localStorage.setItem('oauth_state', state);

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
    try {
      // Verify state to prevent CSRF attacks
      const storedState = localStorage.getItem('oauth_state');
      localStorage.removeItem('oauth_state'); // Clean up stored state regardless of outcome
      
      if (!storedState || state !== storedState) {
        console.error('State mismatch:', { storedState, receivedState: state });
        throw new Error('Invalid authentication state');
      }

      // Exchange code for tokens using fetch
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          code,
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          redirect_uri: this.config.redirectUri,
          grant_type: 'authorization_code',
        }),
      });

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json();
        throw new Error(`Token exchange failed: ${errorData.error_description || errorData.error}`);
      }

      const tokens = await tokenResponse.json();
      
      // Store tokens
      localStorage.setItem('gsc_token', tokens.access_token);
      if (tokens.refresh_token) {
        localStorage.setItem('gsc_refresh_token', tokens.refresh_token);
      }

      return {
        success: true,
        message: 'Authentication successful'
      };
    } catch (error: any) {
      console.error('Error in handleCallback:', error);
      // Clean up any remaining auth state on error
      localStorage.removeItem('gsc_token');
      localStorage.removeItem('gsc_refresh_token');
      throw error;
    }
  }

  clearAuth() {
    if (this.tokenRefreshTimeout) {
      clearTimeout(this.tokenRefreshTimeout);
    }
    localStorage.removeItem('gsc_token');
    localStorage.removeItem('gsc_refresh_token');
    localStorage.removeItem('gsc_property');
  }

  async fetchGSCProperties(): Promise<{ siteUrl: string }[]> {
    const token = localStorage.getItem('gsc_token');
    if (!token) {
      throw new Error('No GSC token available');
    }

    const response = await fetch('https://www.googleapis.com/webmasters/v3/sites', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch GSC properties');
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