import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { SubscriptionProvider } from "./contexts/SubscriptionContext";
import { Suspense, useEffect, useState, lazy } from "react";
import Index from "./pages/Index";
import Waitlist from "./pages/Waitlist";
import LifetimeDeal from "./pages/LifetimeDeal";
import ThankYou from "./pages/ThankYou";
import NotFound from "./pages/NotFound";
import AccountDashboard from "./pages/AccountDashboard";
import AboutUs from "./pages/AboutUs";
import ContactUs from "./pages/ContactUs";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import RefundPolicy from "./pages/RefundPolicy";
import TermsOfService from "./pages/TermsOfService";
import Support from "./pages/Support";
import GoogleSheetsAddon from "./pages/GoogleSheetsAddon";
import QuickStartGuide from './pages/support/QuickStartGuide';
import SettingUpGSC from './pages/support/SettingUpGSC';
import GoogleAddon from './pages/support/GoogleAddon';
import FirstDataExport from "./pages/support/FirstDataExport";
import Documentation from "./pages/Documentation";
import Pricing from "./pages/Pricing";
import { DevNavPanel } from "./components/DevNavPanel";
import { supabase } from "./lib/supabaseClient";
import './App.css';
import { GoogleCallback } from '@/pages/GoogleCallback';
import TestGSC from './pages/TestGSC';

// Lazy load the new dashboard pages
const Dashboard = lazy(() => import('./pages/Dashboard'));
const RankTracker = lazy(() => import('./pages/RankTracker'));
const Settings = lazy(() => import('./pages/Settings'));
const SharedReportPage = lazy(() => import('./pages/SharedReportPage'));
const ClickGapIntelligence = lazy(() => import('./pages/ClickGapIntelligence'));
const CustomAIDashboard = lazy(() => import('./pages/CustomAIDashboard'));

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

const App = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasCheckedSession, setHasCheckedSession] = useState(false);
  const [showDevPanel, setShowDevPanel] = useState(false);

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
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/waitlist" element={<Waitlist />} />
                  <Route path="/lifetimedeal" element={<LifetimeDeal />} />
                  <Route path="/thank-you" element={<ThankYou />} />
                  <Route path="/about" element={<AboutUs />} />
                  <Route path="/contact" element={<ContactUs />} />
                  <Route path="/privacy" element={<PrivacyPolicy />} />
                  <Route path="/refund" element={<RefundPolicy />} />
                  <Route path="/terms" element={<TermsOfService />} />
                  <Route path="/google-sheets-addon" element={<GoogleSheetsAddon />} />
                  <Route path= "/support" element={<Support />} />
                  <Route path= "/support/quick-start-guide" element={<QuickStartGuide />} />
                  <Route path= "/support/setting-up-gsc" element={<SettingUpGSC />} />
                  <Route path= "/support/google-addon" element={<GoogleAddon />} />
                  <Route path= "/support/google-sheets-addon" element={<GoogleAddon />} />
                  <Route path= "/support/first-data-export" element={<FirstDataExport />} />
                  <Route path="/documentation" element={<Documentation />} />
                  <Route path="/pricing" element={<Pricing />} />
                  <Route path="/upgrade" element={<Pricing />} />
                  
                  {/* Account and New Dashboard Routes */}
                  <Route path="/account" element={<AccountDashboard />} />
                  <Route path="/account-dashboard" element={<AccountDashboard />} />
                  
                  {/* Ensure dashboard route uses the new Dashboard component */}
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/click-gap-intelligence" element={<ClickGapIntelligence />} />
                  <Route path="/rank-tracker" element={<RankTracker />} />
                  <Route path="/keyword-analysis" element={<Dashboard />} />
                  <Route path="/gap-analysis" element={<Dashboard />} />
                  <Route path="/keyword-clustering" element={<Dashboard />} />
                  <Route path="/reports" element={<Dashboard />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/settings/accountdashboard" element={<Settings />} />
                  <Route path="/settings/googlesearchconsole" element={<Settings />} />
                  <Route path="/settings/accountsettings" element={<Settings />} />
                  <Route path="/settings/notifications" element={<Settings />} />
                  <Route path="/settings/keywordstype" element={<Settings />} />
                  <Route path="/settings/keywordscategory" element={<Settings />} />
                  
                  <Route path="/auth/google/callback" element={<GoogleCallback />} />
                  <Route path="/auth/google/callback" element={<GoogleCallback />} />
                  <Route path="/test-gsc" element={<TestGSC />} />
                  <Route path="/share/:token" element={<SharedReportPage />} />
                  
                  <Route path="/custom-ai-dashboard" element={<CustomAIDashboard />} />
                  
                  <Route path="*" element={<NotFound />} />
                </Routes>
                
                {/* Development Navigation Panel (only visible in dev mode) */}
                <DevNavPanel />
              </TooltipProvider>
            </SubscriptionProvider>
          </AuthProvider>
        </Suspense>
      </BrowserRouter>
      <Toaster />
      <Sonner />
    </QueryClientProvider>
  );
};

export default App;
