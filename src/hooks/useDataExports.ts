import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';

export interface DataExportStats {
  totalExports: number;
  limit: number;
  remaining: number;
  percentageUsed: number;
}

export const useDataExports = () => {
  const { user } = useAuth();
  const { isSubscriptionActive, subscriptionType } = useSubscription();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DataExportStats>({
    totalExports: 0,
    limit: getExportLimit(isSubscriptionActive, subscriptionType),
    remaining: getExportLimit(isSubscriptionActive, subscriptionType),
    percentageUsed: 0
  });

  // Helper function to get export limit based on subscription
  function getExportLimit(isActive: boolean, type: string | null): number {
    if (!isActive) return 5; // Free plan
    switch (type) {
      case 'monthly_pro':
        return Infinity; // Unlimited for monthly pro
      case 'lifetime':
        return 5; // 5 exports for lifetime
      default:
        return 50; // Default for other active subscriptions
    }
  }

  // Fetch total exports for the current month
  const fetchExportStats = async () => {
    if (!user?.email) return;

    try {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count, error } = await supabase
        .from('data_exports')
        .select('id', { count: 'exact' })
        .eq('user_email', user.email)
        .gte('created_at', startOfMonth.toISOString());

      if (error) throw error;

      const totalExports = count || 0;
      const limit = getExportLimit(isSubscriptionActive, subscriptionType);
      const remaining = limit === Infinity ? Infinity : Math.max(0, limit - totalExports);
      const percentageUsed = limit === Infinity ? 0 : (totalExports / limit) * 100;

      setStats({
        totalExports,
        limit,
        remaining,
        percentageUsed
      });
    } catch (error) {
      console.error('Error fetching export stats:', error);
    } finally {
      setLoading(false);
    }
  };

  // Track a new export
  const trackExport = async (exportType: string): Promise<boolean> => {
    if (!user?.email) {
      toast({
        title: "Authentication Error",
        description: "Please make sure you're logged in",
        variant: "destructive",
      });
      return false;
    }

    // For Monthly Pro users, always allow exports
    if (subscriptionType === 'monthly_pro') {
      try {
        const { error } = await supabase
          .from('data_exports')
          .insert({
            user_email: user.email,
            export_type: exportType
          });

        if (error) throw error;

        // Update stats
        setStats(prev => ({
          ...prev,
          totalExports: prev.totalExports + 1,
          remaining: Infinity,
          percentageUsed: 0
        }));

        return true;
      } catch (error) {
        console.error('Error tracking export:', error);
        toast({
          title: "Export Tracking Failed",
          description: "Failed to track the export. Please try again.",
          variant: "destructive",
        });
        return false;
      }
    }

    // For non-Monthly Pro users (including lifetime), check limits
    if (stats.remaining <= 0) {
      toast({
        title: "Export Limit Reached",
        description: `You can only perform ${stats.limit} exports per month with your current plan`,
        variant: "destructive",
      });
      return false;
    }

    try {
      const { error } = await supabase
        .from('data_exports')
        .insert({
          user_email: user.email,
          export_type: exportType
        });

      if (error) throw error;

      // Update stats immediately
      setStats(prev => ({
        ...prev,
        totalExports: prev.totalExports + 1,
        remaining: Math.max(0, prev.remaining - 1),
        percentageUsed: ((prev.totalExports + 1) / prev.limit) * 100
      }));

      return true;
    } catch (error) {
      console.error('Error tracking export:', error);
      toast({
        title: "Export Tracking Failed",
        description: "Failed to track the export. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  // Initialize stats
  useEffect(() => {
    fetchExportStats();
  }, [user?.email, isSubscriptionActive, subscriptionType]);

  return {
    loading,
    stats,
    trackExport,
    refreshStats: fetchExportStats
  };
}; 