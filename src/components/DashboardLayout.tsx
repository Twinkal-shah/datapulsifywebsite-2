import { ReactNode, useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { UpgradeOverlay } from './UpgradeOverlay';
import { useTrialStatus } from '@/hooks/useTrialStatus';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useTabVisibility } from '@/hooks/useTabVisibility';
import { useComponentPreloader } from '@/hooks/useComponentPreloader';
import { toast } from '@/hooks/use-toast';

import { 
  LayoutDashboard, 
  TrendingUp, 
  KeyRound, 
  Network, 
  FileBarChart2, 
  FileDown, 
  Settings, 
  Menu, 
  X,
  Target,
  Sparkles
} from 'lucide-react';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import { ScrollArea } from './ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { cn } from '@/lib/utils';
import { PropertySelector } from './PropertySelector';

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
  fullScreen?: boolean;
  comparisonText?: string;
  navigationItems?: Array<{
    title: string;
    href: string;
    active: boolean;
    onClick?: () => void;
  }>;
  onNavigate?: (section: string) => void;
}

type SidebarItem = {
  title: string;
  icon: React.ReactNode;
  href: string;
  active?: boolean;
  badge?: string;
  onClick?: () => void;
  key?: string;
};

export function DashboardLayout({ children, title, fullScreen = false, comparisonText, navigationItems, onNavigate }: DashboardLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isExpired, daysLeft, isLoading } = useTrialStatus();
  const { isSubscriptionActive } = useSubscription();
  const authLoadingTimeoutRef = useRef<NodeJS.Timeout>();
  
  // Preload components for faster navigation after tab switching
  useComponentPreloader();

  // Handle prolonged auth loading states (potential stuck loading after tab switch)
  useEffect(() => {
    if (auth.loading) {
      // Set a shorter timeout to automatically refresh if auth loading is stuck
      authLoadingTimeoutRef.current = setTimeout(() => {
        console.warn('Auth loading has been stuck for 15 seconds, automatically refreshing...');
        // Automatically refresh the page to recover from stuck loading
        window.location.reload();
      }, 2000); // 15 second timeout - only for truly stuck states
    } else {
      // Clear timeout if auth loading finishes
      if (authLoadingTimeoutRef.current) {
        clearTimeout(authLoadingTimeoutRef.current);
      }
    }

    return () => {
      if (authLoadingTimeoutRef.current) {
        clearTimeout(authLoadingTimeoutRef.current);
      }
    };
  }, [auth.loading]);

  // Add tab visibility handling - but only for truly stuck states
  useTabVisibility({
    onVisible: () => {
      // Only intervene if auth has been loading for a long time
      if (auth.loading) {
        console.log('Tab became visible while auth loading');
        // Only refresh if auth has been loading for more than 10 seconds
        setTimeout(() => {
          if (auth.loading) {
            console.log('Auth still loading after 10 seconds of tab visibility - refreshing page');
            window.location.reload();
          }
        }, 10000); // 10 second delay - only for truly stuck cases
      }
    }
  });
  
  // Format the property name for display
  const formatPropertyTitle = (property: string | null) => {
    if (!property) return title;
    // Remove protocol, trailing slash, and sc-domain: prefix
    const cleanProperty = property
      .replace(/^https?:\/\//i, '')
      .replace(/\/+$/, '')
      .replace(/^sc-domain:/i, '');
    // Get the first part of the domain (before the dot)
    const domainName = cleanProperty.split('.')[0];
    // Capitalize first letter
    const capitalizedProperty = domainName.charAt(0).toUpperCase() + domainName.slice(1);
    return `${capitalizedProperty} Performance Dashboard`;
  };

  // Get the current GSC property
  const gscProperty = auth.getGSCProperty?.();
  const displayTitle = formatPropertyTitle(gscProperty);

  // Show trial status in header only if not on Monthly Pro Plan
  const renderTrialStatus = () => {
    if (isLoading || isSubscriptionActive) return null;
    
    if (isExpired) {
      return (
        <div className="text-red-400 text-sm font-medium">
          Trial Expired
        </div>
      );
    }
    
    if (daysLeft > 0) {
      return (
        <div className="text-yellow-400 text-sm font-medium">
          Trial ends in {daysLeft} day{daysLeft !== 1 ? 's' : ''}
        </div>
      );
    }
    
    return null;
  };

  // Navigation items - use provided items or default
  const getIcon = (title: string) => {
    switch (title) {
      case 'Dashboard':
        return <LayoutDashboard className="h-5 w-5" />;
      case 'Click Gap Intelligence':
        return <Target className="h-5 w-5" />;
      case 'Custom AI Dashboard':
        return <Sparkles className="h-5 w-5" />;
      case 'Rank Tracker':
        return <TrendingUp className="h-5 w-5" />;
      case 'Settings':
        return <Settings className="h-5 w-5" />;
      default:
        return <LayoutDashboard className="h-5 w-5" />;
    }
  };

  // Memoize navigation items to prevent blinking during page transitions
  const items: SidebarItem[] = useMemo(() => {
    if (navigationItems) {
      return navigationItems.map(item => ({
        title: item.title,
        icon: getIcon(item.title),
        href: item.href,
        active: item.active,
        onClick: item.onClick
      }));
    }
    
    return [
      {
        title: 'Dashboard',
        icon: <LayoutDashboard className="h-5 w-5" />,
        href: '/dashboard',
        active: location.pathname === '/dashboard',
        key: 'nav-dashboard'
      },
      {
        title: 'Click Gap Intelligence',
        icon: <Target className="h-5 w-5" />,
        href: '/click-gap-intelligence',
        active: location.pathname === '/click-gap-intelligence',
        key: 'nav-click-gap'
      },
      {
        title: 'Custom AI Dashboard',
        icon: <Sparkles className="h-5 w-5" />,
        href: '/custom-ai-dashboard',
        active: location.pathname === '/custom-ai-dashboard',
        key: 'nav-custom-ai'
      },
      {
        title: 'Rank Tracker',
        icon: <TrendingUp className="h-5 w-5" />,
        href: '/rank-tracker',
        active: location.pathname === '/rank-tracker',
        key: 'nav-rank-tracker'
      },
      {
        title: 'Settings',
        icon: <Settings className="h-5 w-5" />,
        href: '/settings',
        active: location.pathname === '/settings' || location.pathname.startsWith('/settings/'),
        key: 'nav-settings'
      }
    ];
  }, [location.pathname, navigationItems]);
  
  // Check if user is authenticated
  useEffect(() => {
    // In development mode, we always have a mock user
    const isDevelopment = import.meta.env.DEV;
    if (isDevelopment) {
      console.log('Development mode: Skipping auth check in DashboardLayout');
      return; // Skip auth check in development
    }
    
    // Only redirect in production
    if (!auth.loading && !auth.user) {
      // Redirect to login if not authenticated
      navigate('/');
    }
  }, [auth.loading, auth.user, navigate]);
  
  // Handle logout
  const handleLogout = async () => {
    try {
      await auth.logout();
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };
  
  // If still loading or no user, show loading or login prompt (but only for initial loading, not during navigation)
  // Prevent loading state from showing during navigation by checking if we already have a user
  if (auth.loading && !auth.user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-[#0f1115] to-gray-900 flex items-center justify-center">
        <div className="text-white text-xl flex items-center gap-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
          Loading user data...
        </div>
      </div>
    );
  }
  
  if (!auth.user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-[#0f1115] to-gray-900 flex items-center justify-center">
        <div className="text-white text-xl flex flex-col items-center gap-3">
          <div>Authentication required</div>
          <Button onClick={() => navigate('/')} variant="default">
            Return to Login
          </Button>
        </div>
      </div>
    );
  }

  // Sidebar content component to avoid duplication
  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-gray-800 border-r border-gray-700">
      <div className="flex items-center justify-between h-16 px-6 border-b border-gray-700">
        <h1 className="text-xl font-bold text-blue-400">Datapulsify</h1>
      </div>
      
      <ScrollArea className="flex-1 py-4">
        {/* Property Selector - temporarily commented out */}
        {/* <div className="mb-4">
          <PropertySelector />
        </div> */}
        
        <nav className="space-y-1 px-4">
          {items.map((item, index) => (
            <div key={item.key || `nav-${index}`} className="relative">
              <Button
                variant={item.active ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start gap-2 mb-1 font-normal transition-colors duration-150",
                  item.active 
                    ? "bg-blue-900/30 text-blue-400 hover:bg-blue-800/50 hover:text-blue-300" 
                    : "text-gray-300 hover:bg-gray-700 hover:text-gray-100"
                )}
                onClick={() => item.onClick ? item.onClick() : navigate(item.href)}
              >
                {item.icon}
                <span className="flex-1 text-left">{item.title}</span>
                {item.badge && (
                  <Badge 
                    variant="outline" 
                    className="text-xs border-yellow-600 text-yellow-400 bg-yellow-900/20 ml-auto"
                  >
                    {item.badge}
                  </Badge>
                )}
              </Button>
            </div>
          ))}
        </nav>
      </ScrollArea>
      
      <div className="p-4 border-t border-gray-700">
        <div className="flex items-center gap-3 mb-4">
          <Avatar className="h-9 w-9">
            <AvatarImage src={auth.user.avatar_url} />
            <AvatarFallback className="bg-gray-700 text-gray-300">{auth.user.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-200">{auth.user.name}</span>
            <span className="text-xs text-gray-400">{auth.user.email}</span>
          </div>
        </div>
        <Button variant="outline" className="w-full text-black border-gray-700 hover:bg-gray-700 hover:text-white" onClick={handleLogout}>
          Sign out
        </Button>
      </div>
    </div>
  );
  
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-900 via-[#0f1115] to-gray-900">
      {/* Desktop Sidebar */}
      <aside className={`hidden md:flex md:w-64 md:flex-col ${isExpired ? 'blur-sm pointer-events-none' : ''}`}>
        <SidebarContent />
      </aside>
      
      {/* Mobile Sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={`md:hidden fixed top-4 left-4 z-40 text-white hover:bg-gray-800 ${isExpired ? 'blur-sm pointer-events-none' : ''}`}
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className={`p-0 w-64 bg-gray-800 border-r-gray-700 ${isExpired ? 'blur-sm pointer-events-none' : ''}`} onInteractOutside={() => setMobileOpen(false)}>
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between h-16 px-6 border-b border-gray-700">
              <h1 className="text-xl font-bold text-blue-400">Datapulsify</h1>
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-300 hover:bg-gray-700"
                onClick={() => setMobileOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <ScrollArea className="flex-1 py-4">
              {/* Property Selector - temporarily commented out */}
              {/* <div className="mb-4">
                <PropertySelector />
              </div> */}
              
              <nav className="space-y-1 px-4">
                {items.map((item, index) => (
                  <div key={item.key || `mobile-nav-${index}`} className="relative">
                    <Button
                      variant={item.active ? "default" : "ghost"}
                      className={cn(
                        "w-full justify-start gap-2 mb-1 font-normal transition-colors duration-150",
                        item.active 
                          ? "bg-blue-900/30 text-blue-400 hover:bg-blue-800/50 hover:text-blue-300" 
                          : "text-gray-300 hover:bg-gray-700 hover:text-gray-100"
                      )}
                      onClick={() => {
                        if (item.onClick) {
                          item.onClick();
                        } else {
                          navigate(item.href);
                        }
                        setMobileOpen(false);
                      }}
                    >
                      {item.icon}
                      <span className="flex-1 text-left">{item.title}</span>
                      {item.badge && (
                        <Badge 
                          variant="outline" 
                          className="text-xs border-yellow-600 text-yellow-400 bg-yellow-900/20 ml-auto"
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </Button>
                  </div>
                ))}
              </nav>
            </ScrollArea>
            <div className="p-4 border-t border-gray-700">
              <div className="flex items-center gap-3 mb-4">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={auth.user.avatar_url} />
                  <AvatarFallback className="bg-gray-700 text-gray-300">{auth.user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-200">{auth.user.name}</span>
                  <span className="text-xs text-gray-400">{auth.user.email}</span>
                </div>
              </div>
              <Button variant="outline" className="w-full text-gray-300 border-gray-700 hover:bg-gray-700 hover:text-gray-100" onClick={handleLogout}>
                Sign out
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
      
      {/* Main Content */}
      <main className={`flex-1 flex flex-col min-w-0 overflow-hidden ${isExpired ? 'blur-sm pointer-events-none' : ''}`}>
        {/* Header */}
        <header className="bg-gray-800 border-b border-gray-700 h-16 flex items-center justify-between px-6 md:px-8">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-semibold text-white">{displayTitle}</h1>
            {renderTrialStatus()}
          </div>
          {comparisonText && (
            <div className="text-right">
              <p className="text-gray-400 text-sm">{comparisonText}</p>
            </div>
          )}
        </header>
        
        {/* Content */}
        <div className={cn("flex-1 overflow-auto text-gray-200", fullScreen ? "p-0" : "p-0")}>
          {children}
        </div>
      </main>

      {/* Upgrade Overlay */}
      <UpgradeOverlay isVisible={isExpired} />
    </div>
  );
} 