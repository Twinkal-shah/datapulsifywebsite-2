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

// Determine the environment (for logging/debugging purposes)
const isDev = import.meta.env.VITE_APP_ENV === 'development';
const baseUrl = isDev ? 'http://localhost:8081' : 'https://app.datapulsify.com';
const redirectUrl = `${baseUrl}/dashboard`;

console.log('Auth redirect URL:', redirectUrl);
console.log('Environment:', isDev ? 'development' : 'production');

// ✅ Create Supabase client with cookie-based session for cross-subdomain login
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    debug: true,
    cookieOptions: {
      domain: '.datapulsify.com', // ✅ required for cross-subdomain cookies
      path: '/',
      sameSite: 'Lax',
      secure: true,               // ✅ required for HTTPS
      maxAge: 60 * 60 * 24 * 7,   // 7 days
    },
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
});
