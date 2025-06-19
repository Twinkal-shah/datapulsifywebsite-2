import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { GoogleAuthService } from '@/lib/googleAuthService';

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
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const navigate = useNavigate();
  const googleAuthService = new GoogleAuthService();

  useEffect(() => {
    const checkSession = async () => {
      try {
        console.log('Checking session...');
        setLoading(true);
        
        // Try to get session from localStorage first
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          console.log('Found stored user data');
          const userData = JSON.parse(storedUser);
          setUser(userData);
        }
        
        // Get current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        console.log('Session status:', session ? 'Found session' : 'No session');
        
        if (session?.user) {
          console.log('User found in session, handling user data...');
          await handleUser(session.user);
        } else {
          // Try to refresh session if no active session
          const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
          if (refreshError) {
            console.error('Failed to refresh session:', refreshError);
            // Clear stored data if refresh fails
            setUser(null);
            localStorage.removeItem('user');
            localStorage.removeItem('gsc_token');
            localStorage.removeItem('gsc_property');
          } else if (refreshedSession?.user) {
            console.log('Session refreshed successfully');
            await handleUser(refreshedSession.user);
          } else {
            console.log('No user in session, setting loading false');
            setLoading(false);
          }
        }
      } catch (error) {
        console.error('Error checking session:', error);
        // Clear stored data on error
        setUser(null);
        localStorage.removeItem('user');
        localStorage.removeItem('gsc_token');
        localStorage.removeItem('gsc_property');
        setLoading(false);
      } finally {
        setIsInitialLoad(false);
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event);
      
      if (event === 'SIGNED_IN' && session?.user) {
        console.log('User signed in, handling user data...');
        await handleUser(session.user);
        
        // Only redirect to dashboard if this is a fresh login (not initial page load)
        // and we're coming from login flow (home page or callback)
        if (!isInitialLoad && (window.location.pathname === '/' || window.location.pathname === '/auth/google/callback')) {
          console.log('Redirecting to dashboard after fresh login...');
          navigate('/dashboard');
        }
      } else if (event === 'SIGNED_OUT') {
        console.log('User signed out, clearing data...');
        setUser(null);
        localStorage.removeItem('user');
        localStorage.removeItem('gsc_token');
        localStorage.removeItem('gsc_property');
        setLoading(false);
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
  };

  const logout = async () => {
    try {
      console.log('Logging out...');
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setUser(null);
      localStorage.removeItem('user');
      localStorage.removeItem('gsc_token');
      localStorage.removeItem('gsc_property');
      navigate('/');
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

      // Update Supabase
      if (user?.id) {
        const { error } = await supabase
          .from('user_installations')
          .update({
            gsc_connected: false,
            gsc_connected_at: null
          })
          .eq('user_id', user.id);

        if (error) throw error;
      }

      // Force reload if on dashboard
      if (location.pathname === '/dashboard') {
        window.location.reload();
      }
    } catch (error) {
      console.error('Error disconnecting GSC:', error);
      throw error;
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
    disconnectGSC
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
