import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabaseAuth } from '@/lib/supabase';
import { setTrialStatus as setGlobalTrialStatus } from '@/lib/supabaseClientWrapper';
import { toast } from '@/hooks/use-toast';

export interface TrialStatus {
  isExpired: boolean;
  daysLeft: number;
  isLoading: boolean;
}

export function useTrialStatus() {
  const auth = useAuth();
  const [trialStatus, setTrialStatus] = useState<TrialStatus>({
    isExpired: false,
    daysLeft: 0,
    isLoading: true
  });

  const checkTrialStatus = async () => {
    if (!auth.user?.email) return;

    try {
      // Use supabaseAuth for checking trial status to avoid recursion
      const { data, error } = await supabaseAuth
        .from('user_installations')
        .select('created_at, subscription_type')
        .eq('email', auth.user.email)
        .single();

      if (error) throw error;

      if (data) {
        // If user is on monthly_pro plan, they're not in trial
        if (data.subscription_type === 'monthly_pro') {
          setTrialStatus({
            isExpired: false,
            daysLeft: 0,
            isLoading: false
          });
          setGlobalTrialStatus(false);
          return;
        }

        const createdAt = new Date(data.created_at);
        const now = new Date();
        const daysSinceCreation = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
        const isExpired = daysSinceCreation >= 3 && data.subscription_type === 'Free Plan';
        const daysLeft = Math.max(0, 3 - daysSinceCreation);

        // Update global trial status
        setGlobalTrialStatus(isExpired);
        
        // Update local state
        setTrialStatus({
          isExpired,
          daysLeft,
          isLoading: false
        });

        // Show notification if trial just expired
        if (isExpired) {
          toast({
            title: "Trial Expired",
            description: "Your free trial has expired. Upgrade to continue using the features.",
            variant: "destructive",
            duration: Infinity // Keep showing until user dismisses
          });
        }
      }
    } catch (error) {
      console.error('Error checking trial status:', error);
      setTrialStatus(prev => ({ ...prev, isLoading: false }));
    }
  };

  useEffect(() => {
    checkTrialStatus();
    
    // Set up real-time subscription for trial status changes
    const subscription = supabaseAuth
      .channel('trial_status_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_installations',
        filter: `email=eq.${auth.user?.email}`
      }, () => {
        checkTrialStatus();
      })
      .subscribe();

    // Check status every minute
    const interval = setInterval(checkTrialStatus, 60000);

    return () => {
      subscription.unsubscribe();
      clearInterval(interval);
    };
  }, [auth.user?.email]);

  return trialStatus;
} 