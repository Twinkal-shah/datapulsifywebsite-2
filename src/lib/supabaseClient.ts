import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

console.log('Initializing Supabase client with URL:', supabaseUrl ? 'URL exists' : 'URL missing');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase configuration error:',
    !supabaseUrl ? 'VITE_SUPABASE_URL is missing' : '',
    !supabaseAnonKey ? 'VITE_SUPABASE_ANON_KEY is missing' : ''
  );
  throw new Error('Supabase configuration is incomplete. Check your environment variables.');
}

// Determine the base URL and redirect URL based on environment
const isDev = import.meta.env.VITE_APP_ENV === 'development';
const baseUrl = isDev ? 'http://localhost:8081' : 'https://app.datapulsify.com';
const marketingUrl = isDev ? 'http://localhost:8081' : 'https://datapulsify.com';
const redirectUrl = `${baseUrl}/dashboard`;

console.log('Auth redirect URL:', redirectUrl);
console.log('Environment:', isDev ? 'development' : 'production');

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storageKey: 'datapulsify_auth',
    storage: window.localStorage,
    flowType: 'pkce',
    debug: isDev
  },
  global: {
    headers: {
      'X-Client-Info': 'datapulsify-web'
    }
  }
});

// Export URLs for use in other components
export const getAppUrl = () => baseUrl;
export const getMarketingUrl = () => marketingUrl;

// Set up auth state change listener
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Supabase Auth State Change:', event, session ? 'Session exists' : 'No session');
}); 