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
    const shouldRedirect = () => {
      // In production, enforce subdomain separation
      if (config.hostname.includes('datapulsify.com')) {
        if (config.isMarketing && subdomainService.shouldBeOnApp()) {
          subdomainService.redirectToApp(window.location.pathname);
          return true;
        }
        if (config.isApp && subdomainService.shouldBeOnMarketing()) {
          subdomainService.redirectToMarketing(window.location.pathname);
          return true;
        }
      }
      return false;
    };
    
    if (shouldRedirect()) {
      console.log('Redirecting to correct subdomain...');
    }
  }, [config]);
  
  // Render appropriate routes based on subdomain
  return config.isApp ? <AppRoutes /> : <MarketingRoutes />;
};

const App = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasCheckedSession, setHasCheckedSession] = useState(false);

  // Initialize navigation optimizer
  useEffect(() => {
    console.log('Navigation optimizer initialized');
  }, []);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error checking session:', error);
        }
        console.log('Initial session check:', session ? 'Session exists' : 'No session');
      } catch (error) {
        console.error('Failed to check session:', error);
      } finally {
        setHasCheckedSession(true);
        setIsLoading(false);
      }
    };

    checkSession();
  }, []);

  if (isLoading) {
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
