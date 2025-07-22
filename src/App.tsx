import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { SubscriptionProvider } from "./contexts/SubscriptionContext";
import { Suspense, useEffect, useState } from "react";
import { DevNavPanel } from "./components/DevNavPanel";
import { supabase } from "./lib/supabaseClient";
import { subdomainService } from "./config/subdomainConfig";
import { MarketingRoutes } from "./components/routing/MarketingRoutes";
import { AppRoutes } from "./components/routing/AppRoutes";
import { DashboardLayout } from "./components/DashboardLayout";
import { navigationOptimizer } from './utils/navigationOptimizer';
import './App.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Loading component
const LoadingFallback = () => (
  <div className="min-h-screen bg-gradient-to-br from-gray-900 via-[#0f1115] to-gray-900 flex items-center justify-center">
    <div className="text-white text-xl flex items-center gap-3">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
      Loading...
    </div>
  </div>
);

// Subdomain Router Component
const SubdomainRouter = () => {
  const config = subdomainService.getConfig();
  
  // Check if user is on wrong subdomain and redirect if needed
  useEffect(() => {
    try {
      // Enforce correct subdomain in production
      subdomainService.enforceCorrectSubdomain();
      
      console.log('Subdomain routing initialized:', {
        hostname: config.hostname,
        isApp: config.isApp,
        isMarketing: config.isMarketing,
        path: window.location.pathname
      });
    } catch (error) {
      console.error('Subdomain routing error:', error);
    }
  }, [config]);
  
  // Additional check: if user has session but is on marketing site with app path, redirect
  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      if (config.isMarketing && subdomainService.shouldBeOnApp()) {
        console.log('User on marketing site but should be on app, checking session...');
        
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            console.log('User has session and should be on app, redirecting...');
            subdomainService.redirectToApp(window.location.pathname + window.location.search);
            return;
          }
        } catch (error) {
          console.error('Error checking session for subdomain redirect:', error);
        }
      }
    };
    
    checkAuthAndRedirect();
  }, [config]);
  
  // Render appropriate routes based on subdomain
  return config.isApp ? <AppRoutes /> : <MarketingRoutes />;
};

const App = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasCheckedSession, setHasCheckedSession] = useState(false);
  const [sessionCheckRetries, setSessionCheckRetries] = useState(0);

  // Initialize navigation optimizer
  useEffect(() => {
    console.log('Navigation optimizer initialized');
  }, []);

  useEffect(() => {
    const checkSession = async () => {
      try {
        console.log('Initial session check starting...');
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error checking session:', error);
          
          // If we're on app subdomain and can't get session, might be a cross-domain issue
          const config = subdomainService.getConfig();
          if (config.isApp && config.hostname.includes('datapulsify.com') && sessionCheckRetries < 1) {
            console.log('App subdomain session check failed, attempting recovery...');
            setSessionCheckRetries(prev => prev + 1);
            
            // Try refreshing the session
            try {
              const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
              if (refreshError || !refreshData.session) {
                console.log('Session refresh failed, redirecting to marketing site...');
                // Clear any stored auth data
                localStorage.clear();
                sessionStorage.clear();
                // Redirect to marketing site for re-authentication
                subdomainService.redirectToMarketing('/');
                return;
              }
              console.log('Session recovered successfully');
            } catch (refreshError) {
              console.error('Session recovery failed:', refreshError);
              subdomainService.redirectToMarketing('/');
              return;
            }
          }
        }
        
        console.log('Initial session check:', session ? 'Session exists' : 'No session');
        
        // If we have a session but user is on marketing site trying to access app routes
        if (session) {
          const config = subdomainService.getConfig();
          const shouldBeOnApp = subdomainService.shouldBeOnApp();
          
          if (config.isMarketing && shouldBeOnApp) {
            console.log('User has session but is on marketing site for app route, redirecting...');
            subdomainService.redirectToApp(window.location.pathname + window.location.search);
            return;
          }
          
          // Also check if user is on marketing site with dashboard-like paths
          if (config.isMarketing && (
            window.location.pathname === '/dashboard' ||
            window.location.pathname.startsWith('/account') ||
            window.location.pathname.startsWith('/settings')
          )) {
            console.log('Authenticated user on marketing site with app path, redirecting to app...');
            subdomainService.redirectToApp(window.location.pathname + window.location.search);
            return;
          }
        }
        
      } catch (error) {
        console.error('Failed to check session:', error);
        
        // If critical error, clear everything and start fresh
        if (sessionCheckRetries >= 2) {
          console.log('Multiple session check failures, clearing all data...');
          localStorage.clear();
          sessionStorage.clear();
        }
      } finally {
        setHasCheckedSession(true);
        setIsLoading(false);
      }
    };

    checkSession();
  }, [sessionCheckRetries]);

  // Show loading state while checking session
  if (isLoading || !hasCheckedSession) {
    return <LoadingFallback />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Suspense fallback={<LoadingFallback />}>
          <AuthProvider>
            <SubscriptionProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                
                {/* Render routes based on subdomain */}
                <SubdomainRouter />
                
                {/* Development Navigation Panel (only visible in dev mode) */}
                <DevNavPanel />
              </TooltipProvider>
            </SubscriptionProvider>
          </AuthProvider>
        </Suspense>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
