import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

console.log('Initializing Supabase client with URL:', supabaseUrl ? 'URL exists' : 'URL missing');

// Validate env vars
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase configuration error:',
    !supabaseUrl ? 'VITE_SUPABASE_URL is missing' : '',
    !supabaseAnonKey ? 'VITE_SUPABASE_ANON_KEY is missing' : ''
  );
  throw new Error('Supabase configuration is incomplete. Check your environment variables.');
}

// Determine the environment and configure accordingly
const isDev = import.meta.env.DEV;
const currentPort = window.location.port || '8095';
const baseUrl = isDev ? `http://localhost:${currentPort}` : 'https://app.datapulsify.com';
const redirectUrl = `${baseUrl}/dashboard`;

console.log('Auth redirect URL:', redirectUrl);
console.log('Environment:', isDev ? 'development' : 'production');

// Create Supabase client with environment-aware configuration
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    debug: isDev,
    storage: {
      getItem: (key) => {
        const item = localStorage.getItem(key);
        console.log('Getting auth item:', key, item ? 'exists' : 'missing');
        return item;
      },
      setItem: (key, value) => {
        console.log('Setting auth item:', key);
        localStorage.setItem(key, value);
      },
      removeItem: (key) => {
        console.log('Removing auth item:', key);
        localStorage.removeItem(key);
      }
    }
  },
  global: {
    headers: {
      'X-Client-Info': 'datapulsify-web',
    },
  },
});

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
});
