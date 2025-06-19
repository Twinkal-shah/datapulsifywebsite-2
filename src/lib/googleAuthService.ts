import { GoogleAuth } from 'google-auth-library';

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

    const stateData = {
      value: Math.random().toString(36).substring(2),
      timestamp: Date.now()
    };
    localStorage.setItem('gsc_auth_state', JSON.stringify(stateData));

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${this.config.clientId}` +
      `&redirect_uri=${encodeURIComponent(this.config.redirectUri)}` +
      `&scope=${encodeURIComponent(this.config.scope.join(' '))}` +
      `&response_type=code` +
      `&state=${stateData.value}` +
      `&access_type=offline` +
      `&prompt=consent`;

    window.location.href = authUrl;
  }

  async handleCallback(): Promise<AuthResult> {
    try {
      // Get the authorization code from URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');

      // Verify state to prevent CSRF attacks
      const savedState = localStorage.getItem('gsc_auth_state');
      if (!savedState || !state) {
        return { success: false, error: 'Invalid state parameter' };
      }

      const savedStateData = JSON.parse(savedState);
      if (savedStateData.value !== state) {
        return { success: false, error: 'State mismatch' };
      }

      if (!code) {
        return { success: false, error: 'No authorization code received' };
      }

      // Exchange the authorization code for tokens
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
        return { success: false, error: errorData.error_description || 'Failed to exchange authorization code' };
      }

      const tokenData = await tokenResponse.json();
      
      // Store the access token and refresh token
      localStorage.setItem('gsc_token', tokenData.access_token);
      if (tokenData.refresh_token) {
        localStorage.setItem('gsc_refresh_token', tokenData.refresh_token);
      }

      return { success: true, token: tokenData.access_token };
    } catch (error) {
      console.error('Error in handleCallback:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'An unknown error occurred' 
      };
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
} 