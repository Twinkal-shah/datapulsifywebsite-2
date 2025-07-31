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
    
    if (error === 'login_failed' && loginAttemptFrom) {
      console.log('🔍 Detected login failure redirect:', {
        error,
        attemptFrom: loginAttemptFrom,
        attemptTimestamp: loginAttemptTimestamp,
        timeSinceAttempt: loginAttemptTimestamp ? Date.now() - parseInt(loginAttemptTimestamp) : 'unknown'
      });
      
      toast({
        title: "Login Issue Detected",
        description: "We're having trouble connecting to Google. Please check the browser console for details and try again. If the issue persists, please contact support.",
        variant: "destructive",
        duration: 10000
      });
      
      // Clean up the URL and session storage
      window.history.replaceState({}, document.title, window.location.pathname);
      sessionStorage.removeItem('login_attempt_from');
      sessionStorage.removeItem('login_attempt_timestamp');
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
