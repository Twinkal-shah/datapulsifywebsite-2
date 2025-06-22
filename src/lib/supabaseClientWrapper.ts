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
          get(queryTarget, queryProp) {
            const originalMethod = queryTarget[queryProp];
            
            if (typeof originalMethod === 'function') {
              // Only make execution methods async, not builder methods
              const executionMethods = ['then', 'catch', 'finally'];
              const isExecutionMethod = executionMethods.includes(queryProp as string);
              
              if (isExecutionMethod) {
                return async (...args: any[]) => {
                  if (isTrialExpired) {
                    throw new Error('Trial expired. Please upgrade to continue.');
                  }
                  return originalMethod.apply(queryTarget, args);
                };
              } else {
                // For builder methods (select, eq, etc.), return them synchronously
                return (...args: any[]) => {
                  if (isTrialExpired && queryProp !== 'select' && queryProp !== 'eq' && queryProp !== 'neq' && queryProp !== 'gt' && queryProp !== 'gte' && queryProp !== 'lt' && queryProp !== 'lte' && queryProp !== 'like' && queryProp !== 'ilike' && queryProp !== 'is' && queryProp !== 'in' && queryProp !== 'contains' && queryProp !== 'containedBy' && queryProp !== 'rangeGt' && queryProp !== 'rangeGte' && queryProp !== 'rangeLt' && queryProp !== 'rangeLte' && queryProp !== 'rangeAdjacent' && queryProp !== 'overlaps' && queryProp !== 'textSearch' && queryProp !== 'match' && queryProp !== 'not' && queryProp !== 'or' && queryProp !== 'filter') {
                    // Allow query building but check trial on execution
                  }
                  const result = originalMethod.apply(queryTarget, args);
                  
                  // If the result is another query builder, wrap it too
                  if (result && typeof result === 'object' && typeof result.then === 'function') {
                    return new Proxy(result, {
                      get(resultTarget, resultProp) {
                        const resultMethod = resultTarget[resultProp];
                        if (typeof resultMethod === 'function' && executionMethods.includes(resultProp as string)) {
                          return async (...resultArgs: any[]) => {
                            if (isTrialExpired) {
                              throw new Error('Trial expired. Please upgrade to continue.');
                            }
                            return resultMethod.apply(resultTarget, resultArgs);
                          };
                        }
                        return resultMethod;
                      }
                    });
                  }
                  
                  return result;
                };
              }
            }
            
            return originalMethod;
          }
        });
      };
    }

    return target[prop];
  }
}); 