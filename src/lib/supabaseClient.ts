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
        name: 'sb-yevkfoxoefssdgsodtzd-auth-token',
        domain: '.datapulsify.com',
        path: '/',
        sameSite: 'lax',
        secure: true,
        httpOnly: false // Allow JavaScript access for cross-domain sync
      }
    }),
    storage: {
      getItem: (key) => {
        try {
          // First try localStorage
          let item = localStorage.getItem(key);
          
          // If not found in localStorage and we're in production, try cookies
          if (!item && isProduction) {
            const cookieName = key.includes('auth-token') ? key : `sb-${key.replace(/[^a-zA-Z0-9]/g, '-')}`;
            const cookies = document.cookie.split(';');
            const cookie = cookies.find(c => c.trim().startsWith(`${cookieName}=`));
            if (cookie) {
              item = decodeURIComponent(cookie.split('=')[1]);
              // Sync back to localStorage for faster access
              if (item) {
                localStorage.setItem(key, item);
              }
            }
          }
          
          console.log('Getting auth item:', key, item ? 'exists' : 'missing', {
            localStorage: !!localStorage.getItem(key),
            cookieExists: isProduction ? !!document.cookie.split(';').find(c => c.trim().includes(key)) : false
          });
          return item;
        } catch (error) {
          console.error('Error getting auth item:', error);
          return null;
        }
      },
      setItem: (key, value) => {
        try {
          console.log('Setting auth item:', key);
          
          // Always set in localStorage for current domain
          localStorage.setItem(key, value);
          sessionStorage.setItem(key, value);
          
          // In production, also set as cookie for cross-subdomain access
          if (isProduction) {
            const cookieName = key.includes('auth-token') ? key : `sb-${key.replace(/[^a-zA-Z0-9]/g, '-')}`;
            const expires = new Date();
            expires.setDate(expires.getDate() + 7); // 7 days
            
            document.cookie = `${cookieName}=${encodeURIComponent(value)}; domain=.datapulsify.com; path=/; expires=${expires.toUTCString()}; secure; samesite=lax`;
            
            console.log('Set cookie:', {
              key: cookieName,
              value: value ? 'exists' : 'missing',
              domain: '.datapulsify.com'
            });
          }
        } catch (error) {
          console.error('Error setting auth item:', error);
        }
      },
      removeItem: (key) => {
        try {
          console.log('Removing auth item:', key);
          
          // Remove from localStorage and sessionStorage
          localStorage.removeItem(key);
          sessionStorage.removeItem(key);
          
          // In production, also remove cookie
          if (isProduction) {
            const cookieName = key.includes('auth-token') ? key : `sb-${key.replace(/[^a-zA-Z0-9]/g, '-')}`;
            document.cookie = `${cookieName}=; domain=.datapulsify.com; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; secure; samesite=lax`;
            
            console.log('Removed cookie:', {
              key: cookieName,
              domain: '.datapulsify.com'
            });
          }
        } catch (error) {
          console.error('Error removing auth item:', error);
        }
      }
    }
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
  console.log('Supabase Auth State Change:', event, session ? 'Session exists' : 'No session');
  
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
