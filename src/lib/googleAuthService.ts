import { GoogleAuth } from 'google-auth-library';
import { OAuth2Client } from 'google-auth-library';

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

      // Exchange code for tokens
      const oauth2Client = new OAuth2Client({
        clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        clientSecret: import.meta.env.VITE_GOOGLE_CLIENT_SECRET,
        redirectUri: import.meta.env.VITE_GOOGLE_REDIRECT_URI,
      });

      const { tokens } = await oauth2Client.getToken(code);
      
      // Store tokens
      localStorage.setItem('gsc_token', tokens.access_token!);
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

  async validateAndRefreshToken(): Promise<string | null> {
    try {
      const token = localStorage.getItem('gsc_token');
      const refreshToken = localStorage.getItem('gsc_refresh_token');

      if (!token) {
        console.log('No token found');
        return null;
      }

      // Create OAuth2 client
      const oauth2Client = new OAuth2Client({
        clientId: this.config.clientId,
        clientSecret: this.config.clientSecret,
        redirectUri: this.config.redirectUri,
      });

      // Set credentials
      oauth2Client.setCredentials({
        access_token: token,
        refresh_token: refreshToken || undefined
      });

      try {
        // Verify the token
        const tokenInfo = await oauth2Client.getTokenInfo(token);
        
        // If token is still valid, return it
        if (tokenInfo.expiry_date && tokenInfo.expiry_date > Date.now()) {
          return token;
        }
      } catch (error) {
        console.log('Token validation failed, attempting refresh');
      }

      // If we have a refresh token, try to refresh
      if (refreshToken) {
        try {
          const { credentials } = await oauth2Client.refreshToken(refreshToken);
          
          if (credentials.access_token) {
            localStorage.setItem('gsc_token', credentials.access_token);
            if (credentials.refresh_token) {
              localStorage.setItem('gsc_refresh_token', credentials.refresh_token);
            }
            return credentials.access_token;
          }
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          this.clearAuth();
          return null;
        }
      }

      // If we get here, we couldn't validate or refresh the token
      this.clearAuth();
      return null;
    } catch (error) {
      console.error('Error in validateAndRefreshToken:', error);
      this.clearAuth();
      return null;
    }
  }
} 