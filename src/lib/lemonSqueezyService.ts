import { lemonSqueezySetup, createCheckout, getSubscription, getCustomer } from '@lemonsqueezy/lemonsqueezy.js';

// Initialize LemonSqueezy
const apiKey = import.meta.env.VITE_LEMONSQUEEZY_API_KEY;
if (!apiKey) {
  throw new Error('LemonSqueezy API key is required');
}

lemonSqueezySetup({
  apiKey: apiKey,
});

export interface CheckoutData {
  checkoutUrl: string;
  checkoutId: string;
}

export interface PlanConfig {
  name: string;
  variantId: string;
  price: number;
  billing: 'lifetime' | 'monthly';
}

export const PLANS: Record<string, PlanConfig> = {
  lifetime: {
    name: 'Lifetime Deal',
    variantId: import.meta.env.VITE_LEMONSQUEEZY_VARIANT_LIFETIME,
    price: 49.99,
    billing: 'lifetime'
  },
  monthly: {
    name: 'Monthly Pro',
    variantId: import.meta.env.VITE_LEMONSQUEEZY_VARIANT_MONTHLY,
    price: 9.99,
    billing: 'monthly'
  }
};

// Debug logging for environment variables
console.log('🔍 LemonSqueezy Environment Variables:', {
  lifetimeVariant: import.meta.env.VITE_LEMONSQUEEZY_VARIANT_LIFETIME || 'MISSING',
  monthlyVariant: import.meta.env.VITE_LEMONSQUEEZY_VARIANT_MONTHLY || 'MISSING',
  storeId: import.meta.env.VITE_LEMONSQUEEZY_STORE_ID || 'MISSING',
  productId: import.meta.env.VITE_LEMONSQUEEZY_PRODUCT_ID || 'MISSING',
  apiKeyPresent: !!import.meta.env.VITE_LEMONSQUEEZY_API_KEY
});

export class LemonSqueezyService {
  private static instance: LemonSqueezyService;
  private productId: string;
  private storeId: string;
  private backendUrl: string;

  private constructor() {
    this.productId = import.meta.env.VITE_LEMONSQUEEZY_PRODUCT_ID;
    this.storeId = import.meta.env.VITE_LEMONSQUEEZY_STORE_ID;
    
    // Use local backend in development, Vercel API in production
    const isDev = import.meta.env.DEV;
    this.backendUrl = isDev 
      ? 'http://localhost:5001' 
      : (import.meta.env.VITE_BACKEND_URL || 'https://app.datapulsify.com/api');
    
    console.log('🏪 LemonSqueezy Service initialized with:', {
      productId: this.productId,
      storeId: this.storeId,
      backendUrl: this.backendUrl,
      isDev: isDev,
      apiKeyPresent: !!import.meta.env.VITE_LEMONSQUEEZY_API_KEY,
      lifetimeVariant: import.meta.env.VITE_LEMONSQUEEZY_VARIANT_LIFETIME,
      monthlyVariant: import.meta.env.VITE_LEMONSQUEEZY_VARIANT_MONTHLY
    });
    
    if (!this.productId) {
      throw new Error('LemonSqueezy Product ID is required');
    }
    if (!this.storeId) {
      throw new Error('LemonSqueezy Store ID is required');
    }
  }

  static getInstance(): LemonSqueezyService {
    if (!LemonSqueezyService.instance) {
      LemonSqueezyService.instance = new LemonSqueezyService();
    }
    return LemonSqueezyService.instance;
  }

  /**
   * Create a checkout session for a specific plan
   */
  async createCheckoutSession(
    planType: 'lifetime' | 'monthly',
    userEmail: string,
    customData?: Record<string, any>
  ): Promise<CheckoutData> {
    try {
      console.log('🛒 Creating checkout session for:', { 
        planType, 
        userEmail: userEmail || 'Anonymous (will be collected by LemonSqueezy)', 
        isAnonymous: !userEmail 
      });
      
      const plan = PLANS[planType];
      if (!plan) {
        throw new Error(`Invalid plan type: ${planType}`);
      }

      if (!plan.variantId) {
        console.error('❌ Missing variant ID for plan:', {
          planType,
          plan,
          availablePlans: Object.keys(PLANS),
          environmentVariables: {
            lifetimeVariant: import.meta.env.VITE_LEMONSQUEEZY_VARIANT_LIFETIME || 'MISSING',
            monthlyVariant: import.meta.env.VITE_LEMONSQUEEZY_VARIANT_MONTHLY || 'MISSING'
          }
        });
        throw new Error(`No variant ID found for plan: ${planType}. Please check environment variable VITE_LEMONSQUEEZY_VARIANT_${planType.toUpperCase()}`);
      }

      console.log('📋 Plan details:', {
        name: plan.name,
        variantId: plan.variantId,
        price: plan.price,
        billing: plan.billing
      });

      console.log('🔧 Creating checkout with parameters:', {
        storeId: this.storeId,
        variantId: plan.variantId,
        planType,
        userEmail: userEmail || 'Anonymous',
        isAnonymous: !userEmail
      });

      // Use backend API instead of direct LemonSqueezy API call
      console.log('📤 Sending checkout request to backend...');
      
      const isDev = import.meta.env.DEV;
      const requestBody: {
        variantId: string;
        email: string;
        planType: 'lifetime' | 'monthly';
        customData?: Record<string, any>;
        storeId?: string;
        apiKey?: string;
        productionUrl?: string;
        isAnonymous?: boolean;
      } = {
        variantId: plan.variantId,
        email: userEmail, // Can be empty string for anonymous purchases
        planType: planType,
        customData: customData,
        isAnonymous: !userEmail, // Flag to indicate anonymous purchase
      };

      // Only pass LemonSqueezy configuration in production (Vercel API)
      if (!isDev) {
        requestBody.storeId = this.storeId;
        requestBody.apiKey = import.meta.env.VITE_LEMONSQUEEZY_API_KEY;
        requestBody.productionUrl = import.meta.env.VITE_PRODUCTION_URL || 'https://app.datapulsify.com';
      }
      
      const response = await fetch(`${this.backendUrl}/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Backend API Error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        throw new Error(`Backend API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      console.log('📥 Backend response:', {
        hasError: !!result.error,
        hasUrl: !!result.url,
        fullResponse: result
      });

      if (result.error) {
        console.error('❌ Backend API Error:', result.error);
        throw new Error(`Checkout creation failed: ${result.error}`);
      }

      if (!result.url) {
        console.error('❌ Invalid response structure from backend:', {
          hasUrl: !!result.url,
          fullResponse: result
        });
        throw new Error('Invalid response from payment processor - no checkout URL received');
      }

      const checkoutData = {
        checkoutUrl: result.url,
        checkoutId: result.checkoutId || ''
      };

      console.log('✅ Checkout session created successfully:', checkoutData);
      return checkoutData;
      
    } catch (error) {
      console.error('💥 Error in createCheckoutSession:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace',
        planType,
        userEmail
      });
      throw error;
    }
  }

  /**
   * Get subscription details
   */
  async getSubscriptionDetails(subscriptionId: string) {
    try {
      const response = await getSubscription(subscriptionId);
      if (response.error) {
        throw new Error(`Failed to get subscription: ${response.error.message}`);
      }
      return response.data;
    } catch (error) {
      console.error('Error getting subscription details:', error);
      throw error;
    }
  }

  /**
   * Get customer details
   */
  async getCustomerDetails(customerId: string) {
    try {
      const response = await getCustomer(customerId);
      if (response.error) {
        throw new Error(`Failed to get customer: ${response.error.message}`);
      }
      return response.data;
    } catch (error) {
      console.error('Error getting customer details:', error);
      throw error;
    }
  }

  /**
   * Validate webhook signature
   */
  static validateWebhookSignature(payload: string, signature: string, secret: string): boolean {
    try {
      const crypto = require('crypto');
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(payload, 'utf8')
        .digest('hex');
      
      return `sha256=${expectedSignature}` === signature;
    } catch (error) {
      console.error('Error validating webhook signature:', error);
      return false;
    }
  }

  /**
   * Generate direct checkout URL for quick access
   */
  getQuickCheckoutUrl(planType: 'lifetime' | 'monthly', userEmail?: string): string {
    const plan = PLANS[planType];
    const baseUrl = 'https://klientsgrowth.lemonsqueezy.com/checkout';
    const params = new URLSearchParams({
      custom: '1',
    });

    if (userEmail) {
      params.append('email', userEmail);
    }

    return `${baseUrl}?${params.toString()}`;
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(subscriptionId: string): Promise<void> {
    try {
      const response = await fetch(`https://api.lemonsqueezy.com/v1/subscriptions/${subscriptionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/vnd.api+json',
          'Content-Type': 'application/vnd.api+json'
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Failed to cancel subscription: ${JSON.stringify(error)}`);
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      throw error;
    }
  }
  
}
console.log('🏪 LemonSqueezy Service initialized with:', {
  lifetimeVariant: import.meta.env.VITE_LEMONSQUEEZY_VARIANT_LIFETIME,
});


// Export singleton instance
export const lemonSqueezyService = LemonSqueezyService.getInstance(); 