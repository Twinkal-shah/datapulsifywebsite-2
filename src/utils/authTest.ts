import { supabase } from '@/lib/supabaseClient';

export const testAuth = async () => {
  console.group('🔍 Authentication Test');
  
  try {
    // Test 1: Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    console.log('Current session:', session ? 'Found' : 'None', sessionError ? `(Error: ${sessionError.message})` : '');
    
    // Test 2: Check local storage
    const storedUser = localStorage.getItem('user');
    const gscToken = localStorage.getItem('gsc_token');
    const gscProperty = localStorage.getItem('gsc_property');
    
    console.log('Local storage status:');
    console.log('- User data:', storedUser ? 'exists' : 'missing');
    console.log('- GSC token:', gscToken ? 'exists' : 'missing');
    console.log('- GSC property:', gscProperty || 'missing');
    
    // Test 3: Environment check
    const isDev = import.meta.env.DEV;
    const hostname = window.location.hostname;
    const port = window.location.port;
    
    console.log('Environment:');
    console.log('- Mode:', isDev ? 'development' : 'production');
    console.log('- Hostname:', hostname);
    console.log('- Port:', port);
    
    // Test 4: Supabase config check
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    
    console.log('Configuration:');
    console.log('- Supabase URL:', supabaseUrl ? 'configured' : 'missing');
    console.log('- Supabase Key:', supabaseKey ? 'configured' : 'missing');
    console.log('- Google Client ID:', googleClientId ? 'configured' : 'missing');
    
    // Test 5: Session details
    if (session) {
      console.log('Session details:');
      console.log('- User email:', session.user.email);
      console.log('- Expires at:', new Date(session.expires_at! * 1000).toLocaleString());
      console.log('- Refresh token:', session.refresh_token ? 'present' : 'missing');
    }
    
    return {
      hasSession: !!session,
      hasUser: !!storedUser,
      hasGscToken: !!gscToken,
      configComplete: !!(supabaseUrl && supabaseKey && googleClientId),
      environment: { isDev, hostname, port }
    };
    
  } catch (error) {
    console.error('Auth test failed:', error);
    return {
      error: error instanceof Error ? error.message : 'Unknown error',
      hasSession: false,
      hasUser: false,
      hasGscToken: false,
      configComplete: false
    };
  } finally {
    console.groupEnd();
  }
};

export const clearAllAuth = () => {
  console.log('Clearing all authentication data...');
  
  // Clear localStorage
  localStorage.removeItem('user');
  localStorage.removeItem('gsc_token');
  localStorage.removeItem('gsc_property');
  localStorage.removeItem('gsc_oauth_state');
  localStorage.removeItem('gsc_oauth_timestamp');
  
  // Clear sessionStorage
  sessionStorage.removeItem('gsc_oauth_state');
  sessionStorage.removeItem('gsc_oauth_timestamp');
  sessionStorage.removeItem('gsc_auth_in_progress');
  sessionStorage.removeItem('gsc_auth_pending');
  sessionStorage.removeItem('gsc_callback_processing');
  
  // Sign out from Supabase
  supabase.auth.signOut();
  
  console.log('All authentication data cleared');
}; 