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

// Retry queue for failed keyword saves
interface PendingKeyword {
  id: string;
  keyword: string;
  keyword_type: 'branded' | 'non-branded';
  keyword_intent: 'tofu' | 'mofu' | 'bofu' | 'unknown';
  user_email: string;
  timestamp: number;
}

const RETRY_QUEUE_KEY = 'keyword_retry_queue';

const getRetryQueue = (): PendingKeyword[] => {
  try {
    const queue = localStorage.getItem(RETRY_QUEUE_KEY);
    return queue ? JSON.parse(queue) : [];
  } catch {
    return [];
  }
};

const addToRetryQueue = (keyword: PendingKeyword) => {
  const queue = getRetryQueue();
  queue.push(keyword);
  localStorage.setItem(RETRY_QUEUE_KEY, JSON.stringify(queue));
  console.log('Added keyword to retry queue:', keyword.keyword);
};

const removeFromRetryQueue = (keywordId: string) => {
  const queue = getRetryQueue();
  const filtered = queue.filter(k => k.id !== keywordId);
  localStorage.setItem(RETRY_QUEUE_KEY, JSON.stringify(filtered));
  console.log('Removed keyword from retry queue:', keywordId);
};

const clearRetryQueue = () => {
  localStorage.removeItem(RETRY_QUEUE_KEY);
  console.log('Cleared retry queue');
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

  // Process retry queue - attempt to save failed keywords
  const processRetryQueue = async () => {
    if (!user?.email) return;
    
    const queue = getRetryQueue();
    if (queue.length === 0) return;
    
    console.log(`Processing retry queue: ${queue.length} pending keywords`);
    
    const userQueue = queue.filter(k => k.user_email === user.email);
    if (userQueue.length === 0) return;
    
    for (const pendingKeyword of userQueue) {
      try {
        console.log('Retrying save for keyword:', pendingKeyword.keyword);
        
        const { data, error } = await supabase
          .from('tracked_keywords')
          .insert({
            id: pendingKeyword.id,
            user_email: pendingKeyword.user_email,
            keyword: pendingKeyword.keyword,
            keyword_type: pendingKeyword.keyword_type,
            keyword_intent: pendingKeyword.keyword_intent,
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
          console.error('Retry failed for keyword:', pendingKeyword.keyword, error);
          // If it's been more than 1 hour, remove from queue
          if (Date.now() - pendingKeyword.timestamp > 3600000) {
            removeFromRetryQueue(pendingKeyword.id);
            console.log('Removed old pending keyword from queue');
          }
        } else {
          console.log('Successfully saved keyword from retry queue:', pendingKeyword.keyword);
          removeFromRetryQueue(pendingKeyword.id);
          
          // Update local state with saved keyword
          const savedKeyword: TrackedKeyword = {
            id: data.id,
            keyword: data.keyword,
            keyword_type: data.keyword_type,
            keyword_intent: data.keyword_intent,
            current_position: data.current_position,
            previous_position: data.previous_position,
            clicks: data.clicks,
            impressions: data.impressions,
            ctr: data.ctr,
            is_active: data.is_active,
            created_at: data.created_at,
            updated_at: data.updated_at,
            last_updated: data.last_updated
          };
          
          setTrackedKeywords(prev => {
            // Check if keyword already exists to avoid duplicates
            const exists = prev.some(k => k.id === savedKeyword.id);
            if (exists) return prev;
            return [savedKeyword, ...prev];
          });
          
          toast({
            title: "Keyword Saved",
            description: `"${pendingKeyword.keyword}" has been successfully saved`,
            variant: "default",
          });
        }
      } catch (retryError) {
        console.error('Retry attempt failed:', retryError);
      }
    }
  };

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

    // Create temporary keyword for UI update
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

    // IMMEDIATE UI UPDATE - Add to state first for instant feedback
    setTrackedKeywords(prev => [tempKeyword, ...prev]);
    
    // Show immediate success feedback
    toast({
      title: "Keyword Tracked",
      description: `"${keyword}" is now being tracked`,
      variant: "default",
    });

    try {
      // SYNCHRONOUS DATABASE SAVE - Don't use setTimeout, save immediately
      console.log('Saving keyword to database:', keyword);
      console.log('User email:', user.email);
      console.log('Temp keyword ID:', tempKeyword.id);
      
      // Skip problematic session refresh - rely on existing auth context
      console.log('Skipping session refresh, using AuthContext auth...');
      
      console.log('Attempting database insert...');
      
      // Add timeout back to prevent infinite hanging + create fresh client
      const insertPromise = supabase
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
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database insert timeout - client may be hung')), 200)
      );
      
      let data, error;
      try {
        const result = await Promise.race([insertPromise, timeoutPromise]) as any;
        data = result.data;
        error = result.error;
        console.log('Database insert completed normally');
      } catch (timeoutError) {
        console.error('Database insert timed out - client hung after tab switch');
        console.error('Timeout error:', timeoutError);
        
        // Add to retry queue so it gets saved later
        const pendingKeyword: PendingKeyword = {
          id: tempKeyword.id,
          keyword: keyword.trim(),
          keyword_type: type,
          keyword_intent: intent,
          user_email: user.email,
          timestamp: Date.now()
        };
        
        addToRetryQueue(pendingKeyword);
        
        console.log('Added keyword to retry queue - will be saved automatically');
        
        // Show user-friendly guidance
        toast({
          title: "Keyword Queued for Save",
          description: `"${keyword}" added to UI and queued for save. It will be automatically saved when connection recovers.`,
          variant: "default",
          duration: 1000,
        });
        
        // Return true to keep keyword in UI - it will be saved via retry queue
        return true;
      }

      console.log('Insert error:', error);
      console.log('Insert data:', data);

      if (error) {
        console.error('Database save error:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        console.error('Error details:', error.details);
        console.error('Error hint:', error.hint);
        
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
        } else if (error.code === '42501') {
          toast({
            title: "Database Permission Error",
            description: "RLS policy blocking insert. Check Supabase policies.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Save Failed",
            description: `Database error: ${error.message || 'Unknown error'}`,
            variant: "destructive",
          });
        }
        return false; // Return false if database save failed
      }

      // Update with real data from database
      setTrackedKeywords(prev => 
        prev.map(k => k.id === tempKeyword.id ? data : k)
      );
      
      console.log('Keyword tracking saved successfully:', data);
      return true; // Only return true if database save succeeded

    } catch (error) {
      console.error('Failed to save keyword tracking:', error);
      console.error('Error details:', {
        name: error?.name,
        message: error?.message,
        stack: error?.stack
      });
      
      // Remove from UI on failure
      setTrackedKeywords(prev => prev.filter(k => k.id !== tempKeyword.id));
      
      toast({
        title: "Save Failed",
        description: "Failed to save keyword tracking. Please try again.",
        variant: "destructive",
      });
      return false; // Return false if database save failed
    }
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

    try {
      // SYNCHRONOUS DATABASE UPDATE - Don't use setTimeout, update immediately
      console.log('Removing keyword from database:', keywordToRemove.keyword);
      
      // Always refresh session before database operations to handle tab switching
      await supabase.auth.getSession();
      
      const { error } = await supabase
        .from('tracked_keywords')
        .update({ is_active: false })
        .eq('id', keywordId)
        .eq('user_email', user.email);

      if (error) {
        console.error('Database untrack error:', error);
        
        // If update fails, restore the keyword in UI
        setTrackedKeywords(prev => [keywordToRemove, ...prev]);
        
        toast({
          title: "Untrack Failed",
          description: "Failed to remove keyword. Please try again.",
          variant: "destructive",
        });
        return false; // Return false if database update failed
      }

      console.log('Keyword untracking saved successfully');
      return true; // Only return true if database update succeeded

    } catch (error) {
      console.error('Failed to untrack keyword:', error);
      
      // Restore keyword on failure
      setTrackedKeywords(prev => [keywordToRemove, ...prev]);
      
      toast({
        title: "Untrack Failed",
        description: "Failed to remove keyword tracking. Please try again.",
        variant: "destructive",
      });
      return false; // Return false if database update failed
    }
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
    // Also process any pending keywords from retry queue
    setTimeout(() => processRetryQueue(), 1000); // Small delay to ensure proper initialization
  }, [user?.email]);

  // Refresh when tab becomes visible (handles tab switching)
  useEffect(() => {
    if (isVisible && user?.email) {
      // Small delay to ensure session is properly refreshed
      const timer = setTimeout(() => {
        fetchTrackedKeywords(false); // Silent refresh
        // Try to process retry queue when tab becomes visible
        processRetryQueue();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [isVisible, user?.email]);

  // Process retry queue periodically to catch any missed saves
  useEffect(() => {
    if (!user?.email) return;
    
    const interval = setInterval(() => {
      const queue = getRetryQueue();
      if (queue.length > 0) {
        console.log('Periodic retry queue check - processing pending keywords');
        processRetryQueue();
      }
    }, 30000); // Check every 30 seconds
    
    return () => clearInterval(interval);
  }, [user?.email]);

  return {
    trackedKeywords,
    loading,
    stats,
    trackKeyword,
    untrackKeyword,
    isKeywordTracked,
    trackMultipleKeywords,
    refreshTrackedKeywords: (showErrorToast = true) => fetchTrackedKeywords(showErrorToast),
    processRetryQueue, // Manual retry processing
    retryQueueLength: getRetryQueue().length // Show pending saves count
  };
}; 