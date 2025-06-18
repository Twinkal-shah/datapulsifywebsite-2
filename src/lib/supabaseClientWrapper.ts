import { supabase } from './supabaseClient';
import { PostgrestFilterBuilder } from '@supabase/postgrest-js';

let isTrialExpired = false;

export const setTrialStatus = (expired: boolean) => {
  isTrialExpired = expired;
};

// Create a proxy around the Supabase client
export const supabaseWrapper = new Proxy(supabase, {
  get(target, prop) {
    // Allow auth-related operations
    if (prop === 'auth') {
      return target[prop];
    }

    // For database operations, check trial status
    if (prop === 'from') {
      return (...args: any[]) => {
        const query = target.from(...args);
        
        // Wrap the query builder methods
        return new Proxy(query, {
          get(target, prop) {
            const originalMethod = target[prop];
            
            if (typeof originalMethod === 'function') {
              return async (...args: any[]) => {
                if (isTrialExpired) {
                  throw new Error('Trial expired. Please upgrade to continue.');
                }
                return originalMethod.apply(target, args);
              };
            }
            
            return originalMethod;
          }
        });
      };
    }

    return target[prop];
  }
}); 