import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { cn, getRedirectUrl } from '@/lib/utils';
import { Menu, X, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from "@/hooks/use-toast";
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

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLogin = async () => {
    try {
      const redirectUrl = `${getRedirectUrl()}/dashboard`;
      console.log('Login redirect URL:', redirectUrl);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      });

      if (error) throw error;

      // The redirect will happen automatically
    } catch (error) {
      console.error('Error during login:', error);
      toast({
        title: "Login Error",
        description: error instanceof Error ? error.message : "Failed to login",
        variant: "destructive"
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
            
            {auth.user ? (
              <DropdownMenu>
                <DropdownMenuTrigger className="focus:outline-none">
                  <Avatar className="h-8 w-8 hover:ring-2 hover:ring-white/20 transition-all">
                    <AvatarImage src={auth.user.avatar_url || `https://avatar.vercel.sh/${auth.user.email}`} />
                    <AvatarFallback>{auth.user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/dashboard')}>
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
          
          {auth.user ? (
            <>
              <div className="flex items-center space-x-3 py-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={auth.user.avatar_url || `https://avatar.vercel.sh/${auth.user.email}`} />
                  <AvatarFallback>{auth.user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-white font-medium">{auth.user.name}</span>
                  <span className="text-gray-400 text-sm">{auth.user.email}</span>
                </div>
              </div>
              <button
                onClick={() => {
                  navigate('/dashboard');
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
