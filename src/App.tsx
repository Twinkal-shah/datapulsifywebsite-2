import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { Suspense, useEffect, useState } from "react";
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
import { supabase } from "./lib/supabaseClient";

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
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/waitlist" element={<Waitlist />} />
                <Route path="/lifetimedeal" element={<LifetimeDeal />} />
                <Route path="/thank-you" element={<ThankYou />} />
                <Route path= "/aboutus" element={<AboutUs />} />
                <Route path= "/contactus" element={<ContactUs />} />
                <Route path= "/privacypolicy" element={<PrivacyPolicy />} />
                <Route path= "/refundpolicy" element={<RefundPolicy />} />
                <Route path= "/termsofservice" element={<TermsOfService />} />
                <Route 
                  path="/dashboard" 
                  element={
                    <Suspense fallback={<LoadingFallback />}>
                      <AccountDashboard />
                    </Suspense>
                  } 
                />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </TooltipProvider>
          </AuthProvider>
        </Suspense>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
