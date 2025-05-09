import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface User {
  name: string;
  email: string;
  member_since: string;
  current_plan: string;
  isAddonUser?: boolean;
  gscProperty?: string;
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

// Mock user data for development
const mockUser: User = {
  name: "Demo User",
  email: "demo@example.com",
  member_since: "2024-01-01",
  current_plan: "Professional"
};

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

  useEffect(() => {
    // Check for existing session on mount
    const checkSession = () => {
      const savedUser = localStorage.getItem('user');
      const gscToken = localStorage.getItem('gsc_token');
      
      if (savedUser) {
        const userData = JSON.parse(savedUser);
        setUser(userData);
      } else if (gscToken) {
        // If we have a GSC token but no user, create a temporary user
        setUser({
          name: "GSC User",
          email: "gsc@example.com",
          member_since: new Date().toISOString(),
          current_plan: "GSC Plan",
          isAddonUser: true,
          gscProperty: localStorage.getItem('gsc_property') || undefined
        });
      }
      setLoading(false);
    };
    
    checkSession();
  }, []);

  const login = (userData: User) => {
    const enhancedUserData = {
      ...userData,
      isAddonUser: !!localStorage.getItem('gsc_token'),
      gscProperty: localStorage.getItem('gsc_property') || userData.gscProperty
    };
    setUser(enhancedUserData);
    localStorage.setItem('user', JSON.stringify(enhancedUserData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('gsc_token');
    localStorage.removeItem('gsc_property');
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
  return context;
};