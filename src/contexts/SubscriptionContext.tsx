import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { addDays, isAfter, differenceInDays } from 'date-fns';

interface SubscriptionContextType {
  isSubscriptionActive: boolean;
  subscriptionEndDate: Date | null;
  isLoading: boolean;
  isInTrialPeriod: boolean;
  trialDaysLeft: number;
  subscriptionType: string | null;
  keywordLimit: number;
  checkSubscriptionStatus: () => Promise<void>;
  isPremiumFeature: (feature: string) => boolean;
  canTrackMoreKeywords: (currentKeywordCount: number) => boolean;
  paymentStatus: string | null;
  subscriptionStatus: string | null;
  nextBillingDate: Date | null;
}

const SubscriptionContext = createContext<SubscriptionContextType>({
  isSubscriptionActive: false,
  subscriptionEndDate: null,
  isLoading: true,
  isInTrialPeriod: false,
  trialDaysLeft: 0,
  subscriptionType: null,
  keywordLimit: 0,
  checkSubscriptionStatus: async () => {},
  isPremiumFeature: () => false,
  canTrackMoreKeywords: () => false,
  paymentStatus: null,
  subscriptionStatus: null,
  nextBillingDate: null,
});

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};

interface SubscriptionProviderProps {
  children: React.ReactNode;
}

export const SubscriptionProvider: React.FC<SubscriptionProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [isSubscriptionActive, setIsSubscriptionActive] = useState(false);
  const [subscriptionEndDate, setSubscriptionEndDate] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInTrialPeriod, setIsInTrialPeriod] = useState(false);
  const [trialDaysLeft, setTrialDaysLeft] = useState(0);
  const [subscriptionType, setSubscriptionType] = useState<string | null>(null);
  const [keywordLimit, setKeywordLimit] = useState(0);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);
  const [nextBillingDate, setNextBillingDate] = useState<Date | null>(null);

  const checkSubscriptionStatus = async () => {
    if (!user?.email) {
      setIsSubscriptionActive(false);
      setSubscriptionEndDate(null);
      setIsInTrialPeriod(false);
      setTrialDaysLeft(0);
      setSubscriptionType(null);
      setKeywordLimit(0);
      setPaymentStatus(null);
      setSubscriptionStatus(null);
      setNextBillingDate(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const { data: installationData, error } = await supabase
        .from('user_installations')
        .select(`
          subscription_type, 
          subscription_start_date, 
          subscription_end_date, 
          created_at, 
          lifetime_deal_status,
          lemonsqueezy_customer_id,
          lemonsqueezy_subscription_id,
          payment_status,
          subscription_status,
          next_billing_date
        `)
        .eq('email', user.email)
        .single();

      if (error) throw error;

      if (installationData) {
        const now = new Date();
        
        // Set LemonSqueezy fields
        setPaymentStatus(installationData.payment_status);
        setSubscriptionStatus(installationData.subscription_status);
        setNextBillingDate(installationData.next_billing_date ? new Date(installationData.next_billing_date) : null);
        
        // Determine subscription status with LemonSqueezy integration
        const isLifetime = installationData.subscription_type === 'lifetime' && 
                          (installationData.lifetime_deal_status === 'active' || installationData.payment_status === 'paid');
        const isMonthlyPro = installationData.subscription_type === 'monthly_pro';
        const endDate = installationData.subscription_end_date 
          ? new Date(installationData.subscription_end_date)
          : null;
        
        // Set subscription type
        setSubscriptionType(installationData.subscription_type);

        // Set keyword limit based on subscription type
        if (isLifetime) {
          setKeywordLimit(100);
        } else if (isMonthlyPro) {
          setKeywordLimit(1000); // Unlimited keywords for monthly pro
        } else {
          setKeywordLimit(10); // Free plan limit
        }

        // Determine if subscription is active using both legacy and LemonSqueezy data
        let isActive = false;
        
        if (isLifetime) {
          // Lifetime is active if payment is paid OR legacy lifetime_deal_status is active
          isActive = installationData.payment_status === 'paid' || installationData.lifetime_deal_status === 'active';
        } else if (isMonthlyPro) {
          // Monthly pro is active if:
          // 1. LemonSqueezy subscription_status is 'active', OR
          // 2. Legacy check: subscription_end_date is in the future
          isActive = installationData.subscription_status === 'active' || 
                    (endDate && now < endDate);
        }
        
        // Check trial status - only if not on monthly pro or lifetime
        const createdAt = new Date(installationData.created_at);
        const daysSinceCreation = differenceInDays(now, createdAt);
        const trialPeriodDays = 3; // 3-day trial period
        const isInTrial = !isMonthlyPro && !isLifetime && daysSinceCreation < trialPeriodDays;
        const daysLeft = Math.max(0, trialPeriodDays - daysSinceCreation);

        setIsSubscriptionActive(isActive);
        setSubscriptionEndDate(endDate);
        setIsInTrialPeriod(isInTrial);
        setTrialDaysLeft(daysLeft);
      } else {
        setIsSubscriptionActive(false);
        setSubscriptionEndDate(null);
        setIsInTrialPeriod(false);
        setTrialDaysLeft(0);
        setSubscriptionType(null);
        setKeywordLimit(10); // Free plan limit
        setPaymentStatus(null);
        setSubscriptionStatus(null);
        setNextBillingDate(null);
      }
    } catch (error) {
      console.error('Error checking subscription status:', error);
      setIsSubscriptionActive(false);
      setSubscriptionEndDate(null);
      setIsInTrialPeriod(false);
      setTrialDaysLeft(0);
      setSubscriptionType(null);
      setKeywordLimit(10); // Free plan limit
      setPaymentStatus(null);
      setSubscriptionStatus(null);
      setNextBillingDate(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Premium features list
  const PREMIUM_FEATURES = [
    'rank_tracker_filters',
    'rank_tracker_analytics',
    'rank_tracker_export',
    'rank_tracker_unlimited_keywords',
    'dashboard_filters',
    'dashboard_analytics',
    'dashboard_export'
  ];

  const isPremiumFeature = (feature: string): boolean => {
    // Feature is accessible if:
    // 1. It's not a premium feature, OR
    // 2. User has an active subscription (monthly pro or lifetime), OR
    // 3. User is in trial period
    return PREMIUM_FEATURES.includes(feature) && !isSubscriptionActive && !isInTrialPeriod;
  };

  const canTrackMoreKeywords = (currentKeywordCount: number): boolean => {
    return currentKeywordCount < keywordLimit;
  };

  useEffect(() => {
    checkSubscriptionStatus();
  }, [user]);

  const value = {
    isSubscriptionActive,
    subscriptionEndDate,
    isLoading,
    isInTrialPeriod,
    trialDaysLeft,
    subscriptionType,
    keywordLimit,
    checkSubscriptionStatus,
    isPremiumFeature,
    canTrackMoreKeywords,
    paymentStatus,
    subscriptionStatus,
    nextBillingDate,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}; 