import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, refreshSessionIfNeeded } from '@/lib/supabaseClient';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { GoogleAuthService } from '@/lib/googleAuthService';
import { subdomainService } from '@/config/subdomainConfig';

// Development mode helper - creates a mock user for development
const DEV_MODE = import.meta.env.DEV;
const createDevUser = (gscProperty?: string) => ({
  id: 'dev-user-id',
  email: 'dev@example.com',
  name: 'Development User',
  member_since: new Date().toISOString(),
  current_plan: 'Free Plan',
  isAddonUser: true,
  gscProperty: gscProperty || 'example.com',
  avatar_url: 'https://avatar.vercel.sh/dev@example.com'
});

interface User {
  id: string;
  email: string;
  name: string;
  member_since: string;
  current_plan: string;
  isAddonUser?: boolean;
  gscProperty?: string;
  avatar_url?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (userData: User) => void;
  logout: () => void;
  isAddonAuthenticated: () => boolean;
  getGSCToken: () => string | null;
  getGSCProperty: () => string | null;
  connectGSC: () => Promise<void>;
  disconnectGSC: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: false,
  login: () => {},
  logout: () => {},
  isAddonAuthenticated: () => false,
  getGSCToken: () => null,
  getGSCProperty: () => null,
  connectGSC: async () => {},
  disconnectGSC: async () => {},
  refreshSession: async () => false,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [sessionRetries, setSessionRetries] = useState(0);
  const navigate = useNavigate();
  const googleAuthService = new GoogleAuthService();

  // Helper function to clear stored session data
  const clearStoredSession = () => {
    console.log('Clearing stored session data...');
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('gsc_token');
    localStorage.removeItem('gsc_property');
    // Clear any other auth-related storage
    sessionStorage.removeItem('gsc_auth_in_progress');
    sessionStorage.removeItem('gsc_auth_pending');
    sessionStorage.removeItem('sb-access-token');
    sessionStorage.removeItem('sb-refresh-token');
    setLoading(false);
    setSessionRetries(0);
  };

  // Enhanced session refresh with retry logic
  const refreshSession = async (): Promise<boolean> => {
    try {
      console.log('Manual session refresh requested...');
      const success = await refreshSessionIfNeeded();
      
      if (!success && sessionRetries < 2) {
        console.log(`Session refresh failed, retrying... (${sessionRetries + 1}/2)`);
        setSessionRetries(prev => prev + 1);
        
        // Try to refresh session directly
        const { data, error } = await supabase.auth.refreshSession();
        if (error) {
          console.error('Direct session refresh failed:', error);
          return false;
        }
        
        if (data.session) {
          console.log('Direct session refresh successful');
          await handleUser(data.session.user);
          setSessionRetries(0);
          return true;
        }
      }
      
      return success;
    } catch (error) {
      console.error('Session refresh error:', error);
      return false;
    }
  };

  useEffect(() => {
    const checkSession = async (isBackgroundRefresh = false) => {
      try {
        console.log('Checking session...', isBackgroundRefresh ? '(background)' : '(initial)');
        // Only set loading to true if this is not a background refresh
        if (!isBackgroundRefresh) {
          setLoading(true);
        }
        
        // Try to get session from localStorage first for immediate UI feedback
        const storedUser = localStorage.getItem('user');
        if (storedUser && !user) {
          console.log('Found stored user data');
          try {
            const userData = JSON.parse(storedUser);
            setUser(userData);
          } catch (parseError) {
            console.error('Failed to parse stored user data:', parseError);
            localStorage.removeItem('user');
          }
        }
        
        // Get current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          console.error('Session error:', sessionError);
          
          // If we're on the app subdomain and session failed, try refreshing once
          const config = subdomainService.getConfig();
          if (config.isApp && sessionRetries < 1) {
            console.log('App subdomain session error, attempting refresh...');
            setSessionRetries(prev => prev + 1);
            
            const refreshSuccess = await refreshSession();
            if (!refreshSuccess) {
              clearStoredSession();
            }
            return;
          }
          
          clearStoredSession();
          return;
        }

        console.log('Session status:', session ? 'Found session' : 'No session');
        
        if (session?.user) {
          console.log('User found in session, handling user data...');
          await handleUser(session.user);
          setSessionRetries(0); // Reset retry counter on success
        } else {
          // Check if we should try to refresh the session
          const hasStoredUser = !!localStorage.getItem('user');
          const hasRefreshToken = !!localStorage.getItem('sb-refresh-token') || 
                                  !!sessionStorage.getItem('sb-refresh-token');
          
          if ((hasStoredUser || hasRefreshToken) && sessionRetries < 2) {
            console.log('Attempting session recovery...');
            setSessionRetries(prev => prev + 1);
            
            try {
              const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
              if (refreshError) {
                console.error('Failed to refresh session:', refreshError);
                
                // If we're on app subdomain and can't refresh, might be a cross-domain issue
                const config = subdomainService.getConfig();
                if (config.isApp && refreshError.message?.includes('session')) {
                  console.log('Cross-domain session issue detected, redirecting to marketing site for re-auth...');
                  clearStoredSession();
                  subdomainService.redirectToMarketing('/');
                  return;
                }
                
                clearStoredSession();
              } else if (refreshedSession?.user) {
                console.log('Session refreshed successfully');
                await handleUser(refreshedSession.user);
                setSessionRetries(0);
              } else {
                console.log('No user after refresh, clearing session');
                clearStoredSession();
              }
            } catch (refreshError) {
              console.error('Session refresh exception:', refreshError);
              clearStoredSession();
            }
          } else {
            console.log('No session recovery options available');
            clearStoredSession();
          }
        }
      } catch (error) {
        console.error('Error checking session:', error);
        clearStoredSession();
      } finally {
        setIsInitialLoad(false);
        if (!isBackgroundRefresh) {
          setLoading(false);
        }
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event);
      
      if (event === 'SIGNED_IN' && session?.user) {
        console.log('User signed in, handling user data...');
        await handleUser(session.user);
        setSessionRetries(0); // Reset retry counter on successful sign in
        
        // Only redirect to dashboard if this is a fresh login (not initial page load)
        // and we're coming from login flow (home page or callback)
        if (!isInitialLoad && (window.location.pathname === '/' || window.location.pathname.includes('/auth/'))) {
          console.log('Redirecting to dashboard after fresh login...');
          
          // Redirect to app subdomain if we're on marketing site
          const config = subdomainService.getConfig();
          if (config.isMarketing && config.hostname.includes('datapulsify.com')) {
            subdomainService.redirectToApp('/dashboard');
          } else {
            navigate('/dashboard');
          }
        }
      } else if (event === 'SIGNED_OUT') {
        console.log('User signed out, clearing data...');
        clearStoredSession();
      } else if (event === 'TOKEN_REFRESHED') {
        if (session?.user) {
          console.log('Token refreshed, updating user data...');
          await handleUser(session.user);
        }
      }
    });

    checkSession();

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  const handleUser = async (supabaseUser: SupabaseUser) => {
    try {
      console.log('Handling user data for:', supabaseUser.email);
      console.log('User metadata:', supabaseUser.user_metadata);
      
      // IMMEDIATE REDIRECT CHECK - if user is authenticated but on wrong subdomain
      const hostname = window.location.hostname;
      const currentPath = window.location.pathname;
      
      if (hostname === 'datapulsify.com' && currentPath !== '/' && currentPath !== '/pricing' && currentPath !== '/features') {
        console.log('🚨 AUTHENTICATED USER ON MARKETING SITE - IMMEDIATE REDIRECT');
        console.log('Current location:', { hostname, currentPath, fullUrl: window.location.href });
        
        const redirectUrl = `https://app.datapulsify.com${currentPath}${window.location.search}`;
        console.log('🔄 REDIRECTING AUTHENTICATED USER TO:', redirectUrl);
        
        // Force immediate redirect
        window.location.replace(redirectUrl);
        return; // Stop further processing
      }
      
      // Get user installation data
      const { data: installationData, error: installationError } = await supabase
        .from('user_installations')
        .select('*')
        .eq('email', supabaseUser.email)
        .single();

      // Get the avatar URL from various possible sources in Google OAuth metadata
      const avatarUrl = 
        supabaseUser.user_metadata?.picture || // Google OAuth picture
        supabaseUser.user_metadata?.avatar_url || // Supabase avatar
        supabaseUser.user_metadata?.custom_claims?.picture || // Additional Google claims
        `https://avatar.vercel.sh/${supabaseUser.email}`; // Fallback

      console.log('Selected avatar URL:', avatarUrl);

      if (installationError) {
        console.log('Installation error:', installationError.code);
        // If no installation data exists, create it
        if (installationError.code === 'PGRST116') {
          console.log('Creating new installation data...');
          const { data: newInstallation, error: createError } = await supabase
            .from('user_installations')
            .insert({
              user_id: supabaseUser.id,
              email: supabaseUser.email,
              business_type: 'Personal',
              business_size: 'Small',
              subscription_type: 'Free Plan',
              full_name: supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0]
            })
            .select()
            .single();

          if (createError) throw createError;
          
          const userData: User = {
            id: supabaseUser.id,
            email: supabaseUser.email!,
            name: supabaseUser.user_metadata?.full_name || supabaseUser.email!.split('@')[0],
            member_since: newInstallation.created_at,
            current_plan: newInstallation.subscription_type,
            isAddonUser: !!localStorage.getItem('gsc_token'),
            gscProperty: localStorage.getItem('gsc_property') || undefined,
            avatar_url: avatarUrl
          };
          console.log('Setting new user data:', userData);
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
        } else {
          throw installationError;
        }
      } else if (installationData) {
        console.log('Found existing installation data');
        const userData: User = {
          id: supabaseUser.id,
          email: supabaseUser.email!,
          name: installationData.full_name || supabaseUser.user_metadata?.full_name || supabaseUser.email!.split('@')[0],
          member_since: installationData.install_date,
          current_plan: installationData.subscription_type,
          isAddonUser: !!localStorage.getItem('gsc_token'),
          gscProperty: localStorage.getItem('gsc_property') || undefined,
          avatar_url: avatarUrl
        };
        console.log('Setting existing user data:', userData);
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
      }
    } catch (error) {
      console.error('Error handling user data:', error);
      throw error;
    } finally {
      console.log('Setting loading to false');
      setLoading(false);
    }
  };

  const login = async (userData: User) => {
    console.log('Login called with:', userData);
    const enhancedUserData = {
      ...userData,
      isAddonUser: !!localStorage.getItem('gsc_token'),
      gscProperty: localStorage.getItem('gsc_property') || userData.gscProperty
    };
    setUser(enhancedUserData);
    localStorage.setItem('user', JSON.stringify(enhancedUserData));
    
    // Check if user should be redirected to app subdomain
    const config = subdomainService.getConfig();
    if (config.isMarketing && subdomainService.shouldBeOnApp()) {
      console.log('User logged in but on marketing site with app path, redirecting...');
      subdomainService.redirectToApp(window.location.pathname + window.location.search);
    }
  };

  const logout = async () => {
    try {
      console.log('Logging out...');
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      clearStoredSession();
      
      // Redirect to marketing site after logout
      const config = subdomainService.getConfig();
      if (config.isApp && config.hostname.includes('datapulsify.com')) {
        subdomainService.redirectToMarketing('/');
      } else {
        navigate('/');
      }
    } catch (error) {
      console.error('Error during logout:', error);
      throw error;
    }
  };

  const connectGSC = async () => {
    try {
      await googleAuthService.initiateGSCAuth();
    } catch (error) {
      console.error('Error initiating GSC auth:', error);
      throw error;
    }
  };

  const disconnectGSC = async () => {
    try {
      googleAuthService.clearAuth();
      
      // Update user state
      if (user) {
        const updatedUser = {
          ...user,
          isAddonUser: false,
          gscProperty: undefined
        };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }

      // Try to update Supabase (gracefully handle if columns don't exist)
      if (user?.id) {
        try {
          const { error } = await supabase
            .from('user_installations')
            .update({
              gsc_connected: false,
              gsc_connected_at: null
            })
            .eq('user_id', user.id);

          if (error) {
            // Log the error but don't throw it - GSC disconnect should still work
            console.warn('Could not update GSC connection status in database:', error.message || error);
          }
        } catch (dbError) {
          // Database operation failed, but GSC is still disconnected locally
          console.warn('Database update failed during GSC disconnect:', dbError instanceof Error ? dbError.message : dbError);
        }
      }

      // Force reload if on dashboard
      if (window.location.pathname === '/dashboard') {
        window.location.reload();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Error disconnecting GSC:', errorMessage, error);
      throw new Error(`Failed to disconnect GSC: ${errorMessage}`);
    }
  };

  const isAddonAuthenticated = () => {
    return !!localStorage.getItem('gsc_token');
  };

  const getGSCToken = () => {
    return localStorage.getItem('gsc_token');
  };

  const getGSCProperty = () => {
    return localStorage.getItem('gsc_property');
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAddonAuthenticated,
    getGSCToken,
    getGSCProperty,
    connectGSC,
    disconnectGSC,
    refreshSession
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
