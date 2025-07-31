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
import { LoginDiagnostics } from '@/components/LoginDiagnostics';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
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
    // Check for login errors from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const loginError = urlParams.get('error');
    
    if (loginError === 'login_failed') {
      toast({
        title: "Login Failed",
        description: "Unable to connect to Google. Please try again.",
        variant: "destructive",
        duration: 5000
      });
      
      // Clean up URL
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    }
  }, [toast]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl+Shift+D to open diagnostics
      if (event.ctrlKey && event.shiftKey && event.key === 'D') {
        event.preventDefault();
        setShowDiagnostics(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLogin = async () => {
    try {
      console.log('🚀 Navbar: Login button clicked', {
        hostname: window.location.hostname,
        isProduction: window.location.hostname.includes('datapulsify.com'),
        timestamp: new Date().toISOString()
      });

      // Determine the correct app login URL based on environment
      const isProduction = window.location.hostname.includes('datapulsify.com');
      const appLoginUrl = isProduction 
        ? 'https://app.datapulsify.com/auth/login'
        : 'http://localhost:8081/auth/login';
      
      console.log('🔄 Redirecting to app login URL:', appLoginUrl);
      
      toast({
        title: "Connecting to Google",
        description: "Redirecting to secure authentication...",
        duration: 3000
      });
      
      // Store a flag to track login attempt
      sessionStorage.setItem('login_attempt_from', window.location.href);
      sessionStorage.setItem('login_attempt_timestamp', Date.now().toString());
      
      // Direct redirect to app subdomain login page
      window.location.href = appLoginUrl;
      
    } catch (error) {
      console.error('❌ Error during login redirect:', error);
      const errorMessage = error instanceof Error ? error.message : "Failed to redirect to login";
      
      toast({
        title: "Login Error",
        description: errorMessage,
        variant: "destructive",
        duration: 5000
      });
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
      
      {/* Login Diagnostics Modal */}
      {showDiagnostics && (
        <LoginDiagnostics onClose={() => setShowDiagnostics(false)} />
      )}
    </nav>
  );
};

export default Navbar;
