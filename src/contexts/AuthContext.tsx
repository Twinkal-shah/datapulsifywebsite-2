import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { User as SupabaseUser } from '@supabase/supabase-js';

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
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: false,
  login: () => {},
  logout: () => {},
  isAddonAuthenticated: () => false,
  getGSCToken: () => null,
  getGSCProperty: () => null,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for existing Supabase session
    const checkSession = async () => {
      try {
        console.log('Checking session...');
        setLoading(true);
        
        // Get current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        console.log('Session status:', session ? 'Found session' : 'No session');

        if (session?.user) {
          console.log('User found in session, handling user data...');
          await handleUser(session.user);
        } else {
          console.log('No user in session, setting loading false');
          setLoading(false);
        }
      } catch (error) {
        console.error('Error checking session:', error);
        setLoading(false);
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event);
      
      if (event === 'SIGNED_IN' && session?.user) {
        console.log('User signed in, handling user data...');
        await handleUser(session.user);
      } else if (event === 'SIGNED_OUT') {
        console.log('User signed out, clearing data...');
        setUser(null);
        localStorage.removeItem('user');
        setLoading(false);
      }
    });

    checkSession();

    // Cleanup subscription
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleUser = async (supabaseUser: SupabaseUser) => {
    try {
      console.log('Handling user data for:', supabaseUser.email);
      
      // Get user installation data
      const { data: installationData, error: installationError } = await supabase
        .from('user_installations')
        .select('*')
        .eq('email', supabaseUser.email)
        .single();

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
            avatar_url: supabaseUser.user_metadata?.avatar_url
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
          avatar_url: supabaseUser.user_metadata?.avatar_url
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

  const isAddonAuthenticated = () => {
    return !!localStorage.getItem('gsc_token');
  };

  const getGSCToken = () => {
    return localStorage.getItem('gsc_token');
  };

  const getGSCProperty = () => {
    return localStorage.getItem('gsc_property');
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      login, 
      logout,
      isAddonAuthenticated,
      getGSCToken,
      getGSCProperty
    }}>
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
