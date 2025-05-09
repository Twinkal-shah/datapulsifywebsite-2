import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Waitlist from "./pages/Waitlist";
import LifetimeDeal from "./pages/LifetimeDeal";
import NotFound from "./pages/NotFound";
import AccountDashboard from "./pages/AccountDashboard";
import AddonRedirect from "./pages/AddonRedirect";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/waitlist" element={<Waitlist />} />
          <Route path="/lifetimedeal" element={<LifetimeDeal />} />
          <Route path="/dashboard" element={<AccountDashboard />} />
          <Route path="/addon-redirect" element={<AddonRedirect />} />

          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
