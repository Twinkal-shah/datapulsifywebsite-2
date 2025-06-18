import { ReactNode, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { UpgradeOverlay } from './UpgradeOverlay';
import { useTrialStatus } from '@/hooks/useTrialStatus';
import { useSubscription } from '@/contexts/SubscriptionContext';
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
}

type SidebarItem = {
  title: string;
  icon: React.ReactNode;
  href: string;
  active?: boolean;
  badge?: string;
};

export function DashboardLayout({ children, title, fullScreen = false, comparisonText }: DashboardLayoutProps) {
  const navigate = useNavigate();
  const auth = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isExpired, daysLeft, isLoading } = useTrialStatus();
  const { isSubscriptionActive } = useSubscription();
  
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

  // Navigation items
  const items: SidebarItem[] = [
    {
      title: 'Dashboard',
      icon: <LayoutDashboard className="h-5 w-5" />,
      href: '/dashboard',
      active: location.pathname === '/dashboard'
    },
    {
      title: 'Click Gap Intelligence',
      icon: <Target className="h-5 w-5" />,
      href: '/click-gap-intelligence',
      active: location.pathname === '/click-gap-intelligence'
    },
    {
      title: 'Custom AI Dashboard',
      icon: <Sparkles className="h-5 w-5" />,
      href: '/custom-ai-dashboard',
      active: location.pathname === '/custom-ai-dashboard',
      badge: '🧪 Coming Soon'
    },
    {
      title: 'Rank Tracker',
      icon: <TrendingUp className="h-5 w-5" />,
      href: '/rank-tracker',
      active: location.pathname === '/rank-tracker'
    },
    // {
    //   title: 'Keyword Analysis',
    //   icon: <KeyRound className="h-5 w-5" />,
    //   href: '/keyword-analysis',
    //   active: location.pathname === '/keyword-analysis'
    // },
    // {
    //   title: 'Gap Analysis',
    //   icon: <Network className="h-5 w-5" />,
    //   href: '/gap-analysis',
    //   active: location.pathname === '/gap-analysis'
    // },
    // {
    //   title: 'Keyword Clustering',
    //   icon: <FileBarChart2 className="h-5 w-5" />,
    //   href: '/keyword-clustering',
    //   active: location.pathname === '/keyword-clustering'
    // },
    // {
    //   title: 'Reports',
    //   icon: <FileDown className="h-5 w-5" />,
    //   href: '/reports',
    //   active: location.pathname === '/reports'
    // },
    {
      title: 'Settings',
      icon: <Settings className="h-5 w-5" />,
      href: '/settings',
      active: location.pathname === '/settings'
    }
  ];
  
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
  
  // If still loading or no user, show loading or login prompt
  if (auth.loading) {
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
            <div key={index} className="relative">
              <Button
                variant={item.active ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start gap-2 mb-1 font-normal",
                  item.active 
                    ? "bg-blue-900/30 text-blue-400 hover:bg-blue-800/50 hover:text-blue-300" 
                    : "text-gray-300 hover:bg-gray-700 hover:text-gray-100"
                )}
                onClick={() => navigate(item.href)}
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
                  <div key={index} className="relative">
                    <Button
                      variant={item.active ? "default" : "ghost"}
                      className={cn(
                        "w-full justify-start gap-2 mb-1 font-normal",
                        item.active 
                          ? "bg-blue-900/30 text-blue-400 hover:bg-blue-800/50 hover:text-blue-300" 
                          : "text-gray-300 hover:bg-gray-700 hover:text-gray-100"
                      )}
                      onClick={() => {
                        navigate(item.href);
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