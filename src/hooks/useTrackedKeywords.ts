import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';
import { useTabVisibility } from './useTabVisibility';

// Generate UUID function
const generateUUID = () => {
  // Use crypto.randomUUID if available (modern browsers)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback UUID v4 generator
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export interface TrackedKeyword {
  id: string;
  keyword: string;
  keyword_type: 'branded' | 'non-branded';
  keyword_intent: 'tofu' | 'mofu' | 'bofu' | 'unknown';
  current_position: number | null;
  previous_position: number | null;
  clicks: number;
  impressions: number;
  ctr: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_updated: string;
}

export interface KeywordTrackingStats {
  totalTracked: number;
  limit: number;
  remaining: number;
  percentageUsed: number;
}

export const useTrackedKeywords = () => {
  const { user } = useAuth();
  const { keywordLimit } = useSubscription();
  const { toast } = useToast();
  const { isVisible } = useTabVisibility();
  
  const [trackedKeywords, setTrackedKeywords] = useState<TrackedKeyword[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<KeywordTrackingStats>({
    totalTracked: 0,
    limit: 0,
    remaining: 0,
    percentageUsed: 0
  });

  // Calculate stats whenever keywords or limit changes
  useEffect(() => {
    const totalTracked = trackedKeywords.filter(k => k.is_active).length;
    const remaining = Math.max(0, keywordLimit - totalTracked);
    const percentageUsed = keywordLimit > 0 ? (totalTracked / keywordLimit) * 100 : 0;
    
    setStats({
      totalTracked,
      limit: keywordLimit,
      remaining,
      percentageUsed
    });
  }, [trackedKeywords, keywordLimit]);

  // Fetch tracked keywords
  const fetchTrackedKeywords = async (showErrorToast: boolean = false) => {
    if (!user?.email) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Try to refresh session in background (non-blocking for tab switching)
      supabase.auth.getSession().catch(err => 
        console.warn('Session refresh failed, but continuing with fetch:', err)
      );
      
      const { data, error } = await supabase
        .from('tracked_keywords')
        .select('*')
        .eq('user_email', user.email)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        // Log the error for debugging
        console.warn('Error fetching tracked keywords:', error);
        
        // Check if it's a table doesn't exist error
        if (error.code === '42P01') {
          console.log('tracked_keywords table does not exist yet - this is normal on first setup');
          setTrackedKeywords([]);
          return;
        }
        
        // Only show error toast if explicitly requested (e.g., manual refresh)
        if (showErrorToast) {
          throw error;
        }
        
        // For silent failures, just set empty array and continue
        setTrackedKeywords([]);
        return;
      }

      setTrackedKeywords(data || []);
    } catch (error) {
      console.error('Error fetching tracked keywords:', error);
      if (showErrorToast) {
        toast({
          title: "Error",
          description: "Failed to load tracked keywords",
          variant: "destructive",
        });
      }
      setTrackedKeywords([]);
    } finally {
      setLoading(false);
    }
  };

  // Add keyword to tracking
  const trackKeyword = async (
    keyword: string, 
    type: 'branded' | 'non-branded' = 'non-branded',
    intent: 'tofu' | 'mofu' | 'bofu' | 'unknown' = 'unknown'
  ): Promise<boolean> => {
    if (!user?.email) {
      toast({
        title: "Authentication Error",
        description: "Please make sure you're logged in",
        variant: "destructive",
      });
      return false;
    }

    if (stats.remaining <= 0 && stats.limit !== Infinity) {
      toast({
        title: "Keyword Limit Reached",
        description: `You can only track ${stats.limit} keywords with your current plan`,
        variant: "destructive",
      });
      return false;
    }

    // Check if keyword is already tracked
    const isAlreadyTracked = trackedKeywords.some(
      k => k.keyword.toLowerCase() === keyword.toLowerCase() && k.is_active
    );

    if (isAlreadyTracked) {
      toast({
        title: "Already Tracked",
        description: "This keyword is already being tracked",
        variant: "default",
      });
      return false;
    }

    // IMMEDIATE UI UPDATE - Add to state first for instant feedback
    const tempKeyword: TrackedKeyword = {
      id: generateUUID(),
      keyword: keyword.trim(),
      keyword_type: type,
      keyword_intent: intent,
      current_position: null,
      previous_position: null,
      clicks: 0,
      impressions: 0,
      ctr: 0,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_updated: new Date().toISOString()
    };

    // Update UI immediately
    setTrackedKeywords(prev => [tempKeyword, ...prev]);
    
    // Show immediate success feedback
    toast({
      title: "Keyword Tracked",
      description: `"${keyword}" is now being tracked`,
      variant: "default",
    });

    // Save to database in the background (non-blocking)
    setTimeout(async () => {
      try {
        // Refresh session if needed (handles tab switching issues)
        await supabase.auth.getSession();
        
        const { data, error } = await supabase
          .from('tracked_keywords')
          .insert({
            id: tempKeyword.id,
            user_email: user.email,
            keyword: keyword.trim(),
            keyword_type: type,
            keyword_intent: intent,
            current_position: null,
            previous_position: null,
            clicks: 0,
            impressions: 0,
            ctr: 0,
            is_active: true
          })
          .select()
          .single();

        if (error) {
          console.error('Background save error:', error);
          
          // If save fails, remove from UI and show error
          setTrackedKeywords(prev => prev.filter(k => k.id !== tempKeyword.id));
          
          // Handle specific errors
          if (error.message?.includes('Keyword limit reached')) {
            toast({
              title: "Keyword Limit Reached",
              description: error.message,
              variant: "destructive",
            });
          } else if (error.code === '23505') {
            toast({
              title: "Already Tracked",
              description: "This keyword was already being tracked",
              variant: "default",
            });
          } else {
            toast({
              title: "Save Failed",
              description: "Keyword tracking failed to save. Please try again.",
              variant: "destructive",
            });
          }
          return;
        }

        // Update with real data from database
        setTrackedKeywords(prev => 
          prev.map(k => k.id === tempKeyword.id ? data : k)
        );
        
        console.log('Keyword tracking saved successfully:', data);

      } catch (error) {
        console.error('Background save failed:', error);
        
        // Remove from UI on failure
        setTrackedKeywords(prev => prev.filter(k => k.id !== tempKeyword.id));
        
        toast({
          title: "Save Failed",
          description: "Failed to save keyword tracking. Please try again.",
          variant: "destructive",
        });
      }
    }, 100); // Small delay to ensure UI update is visible

    return true;
  };

  // Remove keyword from tracking
  const untrackKeyword = async (keywordId: string): Promise<boolean> => {
    if (!user?.email) return false;

    const keywordToRemove = trackedKeywords.find(k => k.id === keywordId);
    if (!keywordToRemove) return false;

    // IMMEDIATE UI UPDATE - Remove from state first for instant feedback
    setTrackedKeywords(prev => prev.filter(k => k.id !== keywordId));
    
    // Show immediate feedback
    toast({
      title: "Keyword Untracked",
      description: "Keyword removed from tracking",
      variant: "default",
    });

    // Update database in background (non-blocking)
    setTimeout(async () => {
      try {
        // Refresh session if needed (handles tab switching issues)
        await supabase.auth.getSession();
        
        const { error } = await supabase
          .from('tracked_keywords')
          .update({ is_active: false })
          .eq('id', keywordId)
          .eq('user_email', user.email);

        if (error) {
          console.error('Background untrack error:', error);
          
          // If update fails, restore the keyword in UI
          setTrackedKeywords(prev => [keywordToRemove, ...prev]);
          
          toast({
            title: "Untrack Failed",
            description: "Failed to remove keyword. Please try again.",
            variant: "destructive",
          });
          return;
        }

        console.log('Keyword untracking saved successfully');

      } catch (error) {
        console.error('Background untrack failed:', error);
        
        // Restore keyword on failure
        setTrackedKeywords(prev => [keywordToRemove, ...prev]);
        
        toast({
          title: "Untrack Failed",
          description: "Failed to remove keyword tracking. Please try again.",
          variant: "destructive",
        });
      }
    }, 100);

    return true;
  };

  // Check if a keyword is being tracked
  const isKeywordTracked = (keyword: string): boolean => {
    return trackedKeywords.some(
      k => k.keyword.toLowerCase() === keyword.toLowerCase() && k.is_active
    );
  };

  // Bulk track keywords
  const trackMultipleKeywords = async (
    keywords: Array<{
      keyword: string;
      type?: 'branded' | 'non-branded';
      intent?: 'tofu' | 'mofu' | 'bofu' | 'unknown';
    }>
  ): Promise<{ success: number; failed: number }> => {
    if (!user?.email) return { success: 0, failed: keywords.length };

    let success = 0;
    let failed = 0;

    for (const { keyword, type = 'non-branded', intent = 'unknown' } of keywords) {
      if (stats.remaining - success <= 0) {
        failed++;
        continue;
      }

      const result = await trackKeyword(keyword, type, intent);
      if (result) {
        success++;
      } else {
        failed++;
      }
    }

    return { success, failed };
  };

  // Initialize and refresh on tab visibility changes
  useEffect(() => {
    fetchTrackedKeywords();
  }, [user?.email]);

  // Refresh when tab becomes visible (handles tab switching)
  useEffect(() => {
    if (isVisible && user?.email) {
      // Small delay to ensure session is properly refreshed
      const timer = setTimeout(() => {
        fetchTrackedKeywords(false); // Silent refresh
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [isVisible, user?.email]);

  return {
    trackedKeywords,
    loading,
    stats,
    trackKeyword,
    untrackKeyword,
    isKeywordTracked,
    trackMultipleKeywords,
    refreshTrackedKeywords: (showErrorToast = true) => fetchTrackedKeywords(showErrorToast)
  };
}; 