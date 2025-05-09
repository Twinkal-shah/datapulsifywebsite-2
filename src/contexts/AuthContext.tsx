import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface User {
  name: string;
  email: string;
  member_since: string;
  current_plan: string;
  isAddonUser?: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (userData: User) => void;
  logout: () => void;
  isAddonAuthenticated: () => boolean;
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
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on mount
    const checkSession = () => {
      const savedUser = localStorage.getItem('user');
      const addonToken = localStorage.getItem('addon_token');
      
      if (savedUser) {
        const userData = JSON.parse(savedUser);
        setUser(userData);
      } else if (addonToken) {
        // If we have an addon token but no user, create a temporary user
        setUser({
          name: "Add-on User",
          email: "addon@example.com",
          member_since: new Date().toISOString(),
          current_plan: "Add-on Plan",
          isAddonUser: true
        });
      }
      setLoading(false);
    };
    
    checkSession();
  }, []);

  const login = (userData: User) => {
    const enhancedUserData = {
      ...userData,
      isAddonUser: !!localStorage.getItem('addon_token')
    };
    setUser(enhancedUserData);
    localStorage.setItem('user', JSON.stringify(enhancedUserData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('addon_token');
    localStorage.removeItem('addon_state');
  };

  const isAddonAuthenticated = () => {
    return !!localStorage.getItem('addon_token');
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      login, 
      logout,
      isAddonAuthenticated
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  return context;
};