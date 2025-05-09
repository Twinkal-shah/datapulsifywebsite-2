import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getRedirectUrl } from './utils';

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

const redirectUrl = `${getRedirectUrl()}/dashboard`;
console.log('Auth redirect URL:', redirectUrl);

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storageKey: 'datapulsify_auth',
    storage: window.localStorage,
    flowType: 'pkce',
    debug: true
  },
  global: {
    headers: {
      'X-Client-Info': 'datapulsify-web'
    }
  }
});

// Set up auth state change listener
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Supabase Auth State Change:', event, session ? 'Session exists' : 'No session');
}); 