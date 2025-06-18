import { supabase } from './supabaseClient';
import { addDays } from 'date-fns';

export interface SubscriptionPurchase {
  email: string;
  subscription_type: 'monthly_pro';
  subscription_start_date: string;
  subscription_end_date: string;
}

export const subscriptionService = {
  async purchaseMonthlyPro(email: string): Promise<void> {
    try {
      const startDate = new Date();
      const endDate = addDays(startDate, 30);

      const { error } = await supabase
        .from('user_installations')
        .update({
          subscription_type: 'monthly_pro',
          subscription_start_date: startDate.toISOString(),
          subscription_end_date: endDate.toISOString()
        })
        .eq('email', email);

      if (error) throw error;
    } catch (error) {
      console.error('Error purchasing subscription:', error);
      throw error;
    }
  },

  async renewSubscription(email: string): Promise<void> {
    try {
      const startDate = new Date();
      const endDate = addDays(startDate, 30);

      const { error } = await supabase
        .from('user_installations')
        .update({
          subscription_start_date: startDate.toISOString(),
          subscription_end_date: endDate.toISOString()
        })
        .eq('email', email)
        .eq('subscription_type', 'monthly_pro');

      if (error) throw error;
    } catch (error) {
      console.error('Error renewing subscription:', error);
      throw error;
    }
  },

  async getSubscriptionStatus(email: string): Promise<{
    isActive: boolean;
    endDate: Date | null;
    type: string | null;
  }> {
    try {
      const { data, error } = await supabase
        .from('user_installations')
        .select('subscription_type, subscription_end_date')
        .eq('email', email)
        .single();

      if (error) throw error;

      if (!data) {
        return {
          isActive: false,
          endDate: null,
          type: null
        };
      }

      const endDate = data.subscription_end_date ? new Date(data.subscription_end_date) : null;
      const isActive = endDate ? new Date() <= endDate : false;

      return {
        isActive,
        endDate,
        type: data.subscription_type
      };
    } catch (error) {
      console.error('Error getting subscription status:', error);
      throw error;
    }
  }
}; 