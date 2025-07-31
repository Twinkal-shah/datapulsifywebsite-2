import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { cn, getSupabaseRedirectUrl } from '@/lib/utils';
import { Menu, X, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from "@/hooks/use-toast";
import { subdomainService } from '@/config/subdomainConfig';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();
  const auth = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsScrolled(scrollPosition > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Check for login errors from URL parameters or sessionStorage
    const urlParams = new URLSearchParams(window.location.search);
    const loginError = urlParams.get('login_error');
    
    // Also check sessionStorage for OAuth errors
    const storedError = sessionStorage.getItem('oauth_error');
    
    // Check localStorage for persistent debugging errors
    const persistentError = localStorage.getItem('oauth_error_persistent');
    const debugLogs = localStorage.getItem('oauth_debug_logs');
    
    if (loginError) {
      console.error('🔴 Login error from URL:', loginError);
      toast({
        title: "Login Failed",
        description: decodeURIComponent(loginError),
        variant: "destructive",
        duration: 8000
      });
      
      // Clean up URL
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    } else if (storedError) {
      try {
        const errorData = JSON.parse(storedError);
        console.error('🔴 Login error from storage:', errorData);
        
        toast({
          title: "Login Failed",
          description: errorData.error || "Authentication failed. Please try again.",
          variant: "destructive",
          duration: 8000
        });
        
        // Clear the stored error
        sessionStorage.removeItem('oauth_error');
      } catch (error) {
        console.warn('Failed to parse stored error:', error);
        sessionStorage.removeItem('oauth_error');
      }
    } else if (persistentError) {
      try {
        const errorData = JSON.parse(persistentError);
        console.error('🔴 Persistent login error found:', errorData);
        
        // Show detailed error for debugging
        toast({
          title: "🚨 DEBUG: Persistent Login Error Detected",
          description: `Error: ${errorData.error}. Check browser console for details.`,
          variant: "destructive",
          duration: 10000
        });
        
        console.group('🐛 PERSISTENT OAUTH ERROR DEBUG INFO');
        console.log('Error Data:', errorData);
        if (debugLogs) {
          console.log('Debug Logs:', JSON.parse(debugLogs));
        }
        console.groupEnd();
        
        // Don't auto-clear persistent errors - leave for debugging
      } catch (error) {
        console.warn('Failed to parse persistent error:', error);
        localStorage.removeItem('oauth_error_persistent');
      }
    }
  }, [toast]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLogin = async () => {
    try {
      console.log('🚀 Login button clicked', {
        hostname: window.location.hostname,
        pathname: window.location.pathname,
        timestamp: new Date().toISOString()
      });

      // Clear any previous errors
      sessionStorage.removeItem('oauth_error');
      sessionStorage.removeItem('oauth_error_persistent');
      localStorage.removeItem('oauth_error_persistent');
      
      // Get the current URL's port for development
      const currentPort = window.location.port;
      
      // Check if we're on the marketing site and need to redirect to app subdomain first
      const isOnMarketingSite = window.location.hostname === 'datapulsify.com';
      const isOnLocalMarketingSite = window.location.hostname === 'localhost' && currentPort === '8081';
      
      if (isOnMarketingSite || isOnLocalMarketingSite) {
        // If we're on the marketing site, redirect to app subdomain to initiate OAuth
        // This ensures the code verifier is stored in the same domain as the callback
        const appLoginUrl = isOnLocalMarketingSite 
          ? `http://localhost:${currentPort}/auth/login`
          : `https://app.datapulsify.com/auth/login`;
          
        console.log('🔄 Marketing site detected - redirecting to app subdomain for OAuth initiation:', appLoginUrl);
        
        toast({
          title: "Redirecting...",
          description: "Taking you to the secure login page...",
          duration: 3000
        });
        
        // Add a small delay to ensure the toast is visible, then redirect
        setTimeout(() => {
          console.log('🚀 Executing redirect to:', appLoginUrl);
          try {
            window.location.href = appLoginUrl;
          } catch (redirectError) {
            console.error('❌ Redirect failed, trying replace method:', redirectError);
            window.location.replace(appLoginUrl);
          }
        }, 500);
        
        return;
      }
      
      // If we're already on the app subdomain, initiate OAuth directly
      console.log('🏠 Already on app subdomain, initiating OAuth directly');
      
      // Always redirect to the OAuth callback endpoint, which will then handle the session
      const redirectUrl = import.meta.env.DEV
        ? `http://localhost:${currentPort}/auth/google/callback`
        : 'https://app.datapulsify.com/auth/google/callback';
      
      console.log('🚀 Starting OAuth flow from app subdomain, redirect URL:', redirectUrl);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          },
          skipBrowserRedirect: false
        }
      });

      if (error) {
        console.error('❌ OAuth error in handleLogin:', error);
        throw error;
      }

      console.log('✅ OAuth initiated successfully from Navbar');

      // The redirect will happen automatically
    } catch (error) {
      console.error('💥 Error during login from Navbar:', error);
      const errorMessage = error instanceof Error ? error.message : "Failed to login";
      
      toast({
        title: "Login Error",
        description: errorMessage,
        variant: "destructive",
        duration: 6000
      });
      
      // Store error for potential debugging
      sessionStorage.setItem('oauth_error', JSON.stringify({
        error: errorMessage,
        timestamp: new Date().toISOString(),
        location: 'Navbar'
      }));
    }
  };

  const handleLogout = async () => {
    try {
      await auth.logout();
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
    } catch (error) {
      console.error('Error during logout:', error);
      toast({
        title: "Logout Error",
        description: error instanceof Error ? error.message : "Failed to logout",
        variant: "destructive"
      });
    }
  };

  return (
    <nav
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        isScrolled ? 'bg-black/90 backdrop-blur-md py-3 shadow-lg' : 'bg-transparent py-5'
      )}
    >
      <div className="container mx-auto px-4 md:px-8">
        <div className="flex justify-between items-center">
          <Link to="/" className="flex items-center">
            <img
              src="/lovable-uploads/1b2fd219-c2a6-4b45-bc39-d48916e8e3f5.png"
              alt="Datapulsify Logo"
              className="h-10 md:h-12 w-auto transform scale-150"
              style={{ transform: 'scale(3.7)', transformOrigin: 'left' }}
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="/#features" className="text-gray-300 hover:text-white transition-colors">Features</a>
            <a href="/#how-it-works" className="text-gray-300 hover:text-white transition-colors">How It Works</a>
            <a href="/#pricing" className="text-gray-300 hover:text-white transition-colors">Pricing</a>
            <Link to="/privacy" className="text-gray-300 hover:text-white transition-colors">Privacy Policy</Link>

            {auth.user ? (
              <DropdownMenu>
                <DropdownMenuTrigger className="focus:outline-none">
                  <div className="relative">
                    <Avatar className="h-8 w-8 hover:ring-2 hover:ring-white/20 transition-all bg-gray-900">
                      <AvatarImage
                        src={auth.user.avatar_url}
                        alt={auth.user.name}
                        referrerPolicy="no-referrer"
                        className="object-cover"
                      />
                      <AvatarFallback className="bg-gray-800 text-gray-200">{auth.user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => {
                    console.log('🖱️ Dashboard clicked from navbar');
                    console.log('🔍 Current state:', {
                      hostname: window.location.hostname,
                      pathname: window.location.pathname,
                      userLoggedIn: !!auth.user,
                      userEmail: auth.user?.email
                    });
                    
                    const config = subdomainService.getConfig();
                    console.log('🔍 Subdomain config:', config);
                    
                    if (config.isMarketing && config.hostname.includes('datapulsify.com')) {
                      const redirectUrl = subdomainService.getAppUrl('/dashboard');
                      console.log('🔄 Redirecting to app subdomain:', {
                        from: window.location.href,
                        to: redirectUrl
                      });
                      window.location.href = redirectUrl;
                    } else {
                      console.log('🔄 Using React Router navigation to /dashboard');
                      navigate('/dashboard');
                    }
                  }}>
                    <User className="mr-2 h-4 w-4" />
                    Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-red-400 hover:text-red-300 hover:bg-red-950/30"
                  >
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <button
                onClick={handleLogin}
                className="bg-white text-black px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Login with Google
              </button>
            )}
            <Link
              to="/LifetimeDeal"
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:opacity-90 transition-colors"
            >
              Claim Lifetime Deal
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden text-white" onClick={toggleMenu}>
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div
        className={cn(
          'md:hidden absolute w-full bg-black/95 backdrop-blur-md transition-all duration-300 overflow-hidden',
          isMenuOpen ? 'max-h-[500px] py-4 border-t border-gray-800' : 'max-h-0'
        )}
      >
        <div className="container mx-auto px-4 flex flex-col space-y-4">
          <a href="/#features" className="text-gray-300 hover:text-white py-2 transition-colors" onClick={toggleMenu}>
            Features
          </a>
          <a href="/#how-it-works" className="text-gray-300 hover:text-white py-2 transition-colors" onClick={toggleMenu}>
            How It Works
          </a>
          <a href="/#pricing" className="text-gray-300 hover:text-white py-2 transition-colors" onClick={toggleMenu}>
            Pricing
          </a>
          <Link to="/privacy-policy" className="text-gray-300 hover:text-white py-2 transition-colors" onClick={toggleMenu}>
            Privacy Policy
          </Link>

          {auth.user ? (
            <>
              <div className="flex items-center space-x-3 py-2">
                <Avatar className="h-10 w-10 bg-gray-900">
                  <AvatarImage
                    src={auth.user.avatar_url}
                    alt={auth.user.name}
                    referrerPolicy="no-referrer"
                    className="object-cover"
                  />
                  <AvatarFallback className="bg-gray-800 text-gray-200">{auth.user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="text-gray-400 text-sm">{auth.user.email}</span>
              </div>
              <button
                onClick={() => {
                  const config = subdomainService.getConfig();
                  if (config.isMarketing && config.hostname.includes('datapulsify.com')) {
                    window.location.href = subdomainService.getAppUrl('/dashboard');
                  } else {
                    navigate('/dashboard');
                  }
                  toggleMenu();
                }}
                className="text-gray-300 hover:text-white py-2 transition-colors text-left"
              >
                Dashboard
              </button>
              <button
                onClick={() => {
                  handleLogout();
                  toggleMenu();
                }}
                className="text-red-400 hover:text-red-300 py-2 transition-colors text-left"
              >
                Logout
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                handleLogin();
                toggleMenu();
              }}
              className="bg-white text-black px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors w-full"
            >
              Login with Google
            </button>
          )}
          <Link
            to="/LifetimeDeal"
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:opacity-90 transition-colors text-center"
            onClick={toggleMenu}
          >
            Claim Lifetime Deal
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
