import { Routes, Route } from "react-router-dom";
import Index from "@/pages/Index";
import Waitlist from "@/pages/Waitlist";
import LifetimeDeal from "@/pages/LifetimeDeal";
import ThankYou from "@/pages/ThankYou";
import NotFound from "@/pages/NotFound";
import AboutUs from "@/pages/AboutUs";
import ContactUs from "@/pages/ContactUs";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import RefundPolicy from "@/pages/RefundPolicy";
import TermsOfService from "@/pages/TermsOfService";
import Support from "@/pages/Support";
import GoogleSheetsAddon from "@/pages/GoogleSheetsAddon";
import QuickStartGuide from '@/pages/support/QuickStartGuide';
import SettingUpGSC from '@/pages/support/SettingUpGSC';
import GoogleAddon from '@/pages/support/GoogleAddon';
import FirstDataExport from "@/pages/support/FirstDataExport";
import Documentation from "@/pages/Documentation";
import Pricing from "@/pages/Pricing";
import { GoogleCallback } from '@/pages/GoogleCallback';
import { lazy, useEffect } from 'react';
import { LazyComponentWrapper } from '@/components/LazyComponentWrapper';

// Marketing site login redirect component
const MarketingLogin = () => {
  useEffect(() => {
    console.log('🔄 MarketingLogin: Redirecting to app subdomain...');
    
    // Force redirect to app subdomain
    const appLoginUrl = 'https://app.datapulsify.com/auth/login';
    console.log('🚀 Redirecting to:', appLoginUrl);
    
    // Use replace to avoid back button issues
    window.location.replace(appLoginUrl);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Redirecting to Login
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Taking you to the secure login page...
          </p>
          <div className="mt-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          </div>
          <p className="mt-4 text-xs text-gray-400">
            If you're not redirected automatically, <a href="https://app.datapulsify.com/auth/login" className="text-indigo-600 hover:text-indigo-500">click here</a>
          </p>
        </div>
      </div>
    </div>
  );
};

// Enhanced lazy loading with retry on tab visibility
const createLazyComponent = (importFn: () => Promise<any>) => {
  const LazyComponent = lazy(importFn);
  return (props: any) => (
    <LazyComponentWrapper>
      <LazyComponent {...props} />
    </LazyComponentWrapper>
  );
};

// Lazy load less critical components
const SharedReportPage = createLazyComponent(() => import('@/pages/SharedReportPage'));

export const MarketingRoutes = () => {
  return (
    <Routes>
      {/* Marketing & Public Pages */}
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
      <Route path="/support" element={<Support />} />
      <Route path="/support/quick-start-guide" element={<QuickStartGuide />} />
      <Route path="/support/setting-up-gsc" element={<SettingUpGSC />} />
      <Route path="/support/google-addon" element={<GoogleAddon />} />
      <Route path="/support/google-sheets-addon" element={<GoogleAddon />} />
      <Route path="/support/first-data-export" element={<FirstDataExport />} />
      <Route path="/documentation" element={<Documentation />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/upgrade" element={<Pricing />} />
      
      {/* Authentication routes */}
      <Route path="/auth/login" element={<MarketingLogin />} />
      <Route path="/auth/google/callback" element={<GoogleCallback />} />
      
      {/* Shared reports - available on both subdomains */}
      <Route path="/share/:token" element={<SharedReportPage />} />
      
      {/* Catch-all for 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}; 