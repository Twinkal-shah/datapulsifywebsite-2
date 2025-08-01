import React, { useEffect } from 'react';
import Navbar from '@/components/Navbar';
import HeroSection from '@/components/HeroSection';
import ProblemSolutionSection from '@/components/ProblemSolutionSection';
import FeaturesSection from '@/components/FeaturesSection';
import HowItWorksSection from '@/components/HowItWorksSection';
import BenefitsSection from '@/components/BenefitsSection';
import TabsSection from '@/components/TabsSection';
import SocialProofSection from '@/components/SocialProofSection';
import PricingSection from '@/components/PricingSection';
import FaqSection from '@/components/FaqSection';
import FinalCtaSection from '@/components/FinalCtaSection';
import Footer from '@/components/Footer';
import { toast } from '@/components/ui/use-toast';

const Index = () => {
  // Check for login errors and show user feedback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    const loginAttemptFrom = sessionStorage.getItem('login_attempt_from');
    const loginAttemptTimestamp = sessionStorage.getItem('login_attempt_timestamp');
    
    // Check for quick redirects (less than 5 seconds) which indicate config issues
    const timeSinceAttempt = loginAttemptTimestamp ? Date.now() - parseInt(loginAttemptTimestamp) : null;
    const isQuickRedirect = timeSinceAttempt && timeSinceAttempt < 5000; // Less than 5 seconds
    
    if (error === 'login_failed' || (loginAttemptFrom && isQuickRedirect)) {
      console.log('🔍 Detected login issue:', {
        error,
        attemptFrom: loginAttemptFrom,
        attemptTimestamp: loginAttemptTimestamp,
        timeSinceAttempt,
        isQuickRedirect
      });
      
      let title = "Login Issue Detected";
      let description = "We're having trouble connecting to Google. Please check the browser console for details and try again.";
      
      if (isQuickRedirect && !error) {
        title = "Quick Redirect Detected";
        description = "You were redirected back very quickly, which usually indicates a configuration issue. Press Ctrl+Shift+D to run diagnostics, or check the browser console for more details.";
      }
      
      toast({
        title,
        description,
        variant: "destructive",
        duration: 12000 // Longer duration for better visibility
      });
      
      // Clean up the URL and session storage
      if (error) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
      sessionStorage.removeItem('login_attempt_from');
      sessionStorage.removeItem('login_attempt_timestamp');
    }
    
    // Also check for successful authentication from app subdomain
    const authSuccess = sessionStorage.getItem('auth_success');
    if (authSuccess === 'true') {
      console.log('✅ Detected successful authentication');
      toast({
        title: "Welcome back!",
        description: "You've been successfully logged in.",
        variant: "default",
        duration: 3000
      });
      sessionStorage.removeItem('auth_success');
    }
  }, []);

  // This effect helps with the scroll animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-fade-in');
          }
        });
      },
      {
        root: null,
        rootMargin: '0px',
        threshold: 0.1,
      }
    );

    const hiddenElements = document.querySelectorAll('.opacity-0');
    hiddenElements.forEach((el) => observer.observe(el));

    return () => {
      hiddenElements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col w-full">
      <Navbar />
      <main>
        <HeroSection />
        <ProblemSolutionSection />
        <FeaturesSection />
        <HowItWorksSection />
        <BenefitsSection />
        <TabsSection />
        <SocialProofSection />
        <PricingSection />
        <FaqSection />
        <FinalCtaSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
