import { supabase as originalClient } from './supabaseClient';
import { supabaseWrapper } from './supabaseClientWrapper';

// Export the wrapped version as the default Supabase client
export const supabase = supabaseWrapper;

// Export the original client for auth and trial status checks
export const supabaseAuth = originalClient; 