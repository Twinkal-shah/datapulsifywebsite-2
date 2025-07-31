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
import { lazy } from 'react';
import { LazyComponentWrapper } from '@/components/LazyComponentWrapper';

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
      
      {/* Authentication callback - available on both subdomains */}
      <Route path="/auth/google/callback" element={<GoogleCallback />} />
      
      {/* Shared reports - available on both subdomains */}
      <Route path="/share/:token" element={<SharedReportPage />} />
      
      {/* Catch-all for 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}; 