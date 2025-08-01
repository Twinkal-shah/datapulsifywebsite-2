import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

console.log('🔧 Initializing Supabase client...', {
  hasUrl: !!supabaseUrl,
  hasKey: !!supabaseAnonKey,
  urlPreview: supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'missing',
  keyPreview: supabaseAnonKey ? supabaseAnonKey.substring(0, 10) + '...' : 'missing'
});

// Validate env vars
if (!supabaseUrl || !supabaseAnonKey) {
  const missingVars = [];
  if (!supabaseUrl) missingVars.push('VITE_SUPABASE_URL');
  if (!supabaseAnonKey) missingVars.push('VITE_SUPABASE_ANON_KEY');
  
  console.error('❌ Supabase configuration error - missing variables:', missingVars);
  throw new Error(`Supabase configuration is incomplete. Missing: ${missingVars.join(', ')}. Check your environment variables.`);
}

// Validate URL format
if (!supabaseUrl.startsWith('https://') || !supabaseUrl.includes('.supabase.co')) {
  console.error('❌ Invalid Supabase URL format:', supabaseUrl);
  throw new Error('Invalid Supabase URL format. Expected: https://your-project.supabase.co');
}

// Determine the environment and configure accordingly
const isDev = import.meta.env.DEV;
const isProduction = window.location.hostname.includes('datapulsify.com');
const currentPort = window.location.port || '5173';

console.log('🌍 Environment configuration:', {
  isDev,
  isProduction,
  hostname: window.location.hostname,
  port: currentPort
});

// Set redirect URL - always redirect to app subdomain for OAuth callbacks
let redirectUrl: string;
if (isDev) {
  redirectUrl = `http://localhost:${currentPort}/auth/google/callback`;
} else {
  // Use environment variable for production redirect URL
  redirectUrl = import.meta.env.VITE_GOOGLE_REDIRECT_URI || 'https://app.datapulsify.com/auth/google/callback';
}

console.log('🔄 Auth redirect URL:', redirectUrl);

// Create Supabase client with environment-aware configuration
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    debug: isDev,
    // Configure cookies for cross-subdomain access in production
    ...(isProduction && {
      cookieOptions: {
        domain: '.datapulsify.com',
        path: '/',
        sameSite: 'lax',
        secure: true,
        httpOnly: false // Allow JavaScript access for cross-domain sync
      }
    })
  },
  global: {
    headers: {
      'X-Client-Info': 'datapulsify-web',
      // Add origin header for CORS
      ...(isProduction && {
        'Origin': window.location.origin,
        'X-Supabase-Auth-Flow': 'pkce'
      })
    },
  },
});

// Enhanced session management with manual refresh
let refreshTimer: NodeJS.Timeout | null = null;

const scheduleTokenRefresh = (expiresAt: number) => {
  if (refreshTimer) {
    clearTimeout(refreshTimer);
  }
  
  // Refresh 5 minutes before expiry
  const refreshTime = (expiresAt * 1000) - Date.now() - (5 * 60 * 1000);
  
  if (refreshTime > 0) {
    refreshTimer = setTimeout(async () => {
      console.log('Attempting scheduled token refresh...');
      try {
        const { data, error } = await supabase.auth.refreshSession();
        if (error) {
          console.error('Scheduled refresh failed:', error);
          // Clear session if refresh fails
          await supabase.auth.signOut();
        } else if (data.session) {
          console.log('Token refreshed successfully');
          scheduleTokenRefresh(data.session.expires_at!);
        }
      } catch (error) {
        console.error('Token refresh exception:', error);
        await supabase.auth.signOut();
      }
    }, refreshTime);
  }
};

// Log Supabase auth state changes (for debugging)
supabase.auth.onAuthStateChange((event, session) => {
  console.log('🔄 Supabase Auth State Change:', event, session ? 'Session exists' : 'No session');
  
  if (session) {
    console.log('✅ Session details:', {
      user: session.user.email,
      expiresAt: session.expires_at,
      refreshToken: session.refresh_token ? 'exists' : 'missing',
      accessToken: session.access_token ? 'exists' : 'missing'
    });
  } else {
    console.log('❌ No session available');
    
    // Check what's in localStorage
    const authKeys = Object.keys(localStorage).filter(key => key.includes('auth'));
    console.log('🔍 Auth keys in localStorage:', authKeys);
    
    // Check for session recovery options
    console.log('🔍 Checking for cross-subdomain authentication...');
    setTimeout(async () => {
      try {
        const { data: { session: recoveredSession }, error } = await supabase.auth.getSession();
        if (recoveredSession) {
          console.log('✅ Session recovered:', recoveredSession.user.email);
        } else if (error) {
          console.log('❌ Session recovery failed:', error.message);
        } else {
          console.log('⚠️ No session recovery options available');
        }
      } catch (err) {
        console.log('❌ Session recovery error:', err);
      }
    }, 100);
  }
  
  // Log detailed session information in development
  if (isDev && session) {
    console.log('Session details:', {
      user: session.user.email,
      expiresAt: session.expires_at,
      refreshToken: session.refresh_token ? 'exists' : 'missing'
    });
  }
  
  // Schedule manual token refresh
  if (session && session.expires_at) {
    scheduleTokenRefresh(session.expires_at);
  } else if (refreshTimer) {
    clearTimeout(refreshTimer);
    refreshTimer = null;
  }
  
  // Handle token refresh events
  if (event === 'TOKEN_REFRESHED') {
    if (session) {
      console.log('Token refreshed successfully');
    } else {
      console.warn('Token refresh failed - no session returned');
    }
  }
  
  // Handle sign out events
  if (event === 'SIGNED_OUT') {
    console.log('User signed out, clearing local storage');
    localStorage.removeItem('user');
    localStorage.removeItem('gsc_token');
    localStorage.removeItem('gsc_property');
    sessionStorage.clear();
    
    if (refreshTimer) {
      clearTimeout(refreshTimer);
      refreshTimer = null;
    }
  }
});

// Helper function to manually refresh session if needed
export const refreshSessionIfNeeded = async (): Promise<boolean> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.log('No session to refresh');
      return false;
    }
    
    const now = Date.now() / 1000;
    const expiresAt = session.expires_at || 0;
    
    // Refresh if expires in next 10 minutes
    if (expiresAt - now < 600) {
      console.log('Session expires soon, refreshing...');
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('Session refresh failed:', error);
        return false;
      }
      
      return !!data.session;
    }
    
    return true;
  } catch (error) {
    console.error('Error checking session expiry:', error);
    return false;
  }
};

// Helper function to clear all auth state and start fresh
export const clearAuthState = async (): Promise<void> => {
  console.log('🧹 Clearing all auth state...');
  
  try {
    // Sign out from Supabase
    await supabase.auth.signOut();
    
    // Clear localStorage
    const authKeys = Object.keys(localStorage).filter(key => 
      key.includes('auth') || key.includes('supabase') || key.includes('sb-')
    );
    authKeys.forEach(key => {
      console.log('Removing localStorage key:', key);
      localStorage.removeItem(key);
    });
    
    // Clear sessionStorage
    sessionStorage.clear();
    
    // Clear cookies (in production)
    if (isProduction) {
      // Clear all supabase-related cookies
      const cookies = document.cookie.split(';');
      cookies.forEach(cookie => {
        const cookieName = cookie.split('=')[0].trim();
        if (cookieName.includes('sb-') || cookieName.includes('auth')) {
          console.log('Removing cookie:', cookieName);
          document.cookie = `${cookieName}=; domain=.datapulsify.com; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; secure; samesite=lax`;
          document.cookie = `${cookieName}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
        }
      });
    }
    
    console.log('✅ Auth state cleared');
  } catch (error) {
    console.error('Error clearing auth state:', error);
  }
};
