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

export class LemonSqueezyService {
  private static instance: LemonSqueezyService;
  private productId: string;
  private storeId: string;

  private constructor() {
    this.productId = import.meta.env.VITE_LEMONSQUEEZY_PRODUCT_ID;
    this.storeId = import.meta.env.VITE_LEMONSQUEEZY_STORE_ID;
    
    console.log('🏪 LemonSqueezy Service initialized with:', {
      productId: this.productId,
      storeId: this.storeId,
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
      console.log('🛒 Creating checkout session for:', { planType, userEmail });
      
      const plan = PLANS[planType];
      if (!plan) {
        throw new Error(`Invalid plan type: ${planType}`);
      }

      if (!plan.variantId) {
        throw new Error(`No variant ID found for plan: ${planType}`);
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
        userEmail
      });

      const checkoutData = {
        productOptions: {
          name: plan.name,
          description: `DataPulsify ${plan.name} - Access to all premium features`,
          media: [],
          redirectUrl: `${import.meta.env.VITE_PRODUCTION_URL}/thank-you?plan=${planType}`,
          receiptButtonText: 'Go to Dashboard',
          receiptLinkUrl: `${import.meta.env.VITE_PRODUCTION_URL}/dashboard`,
        },
        checkoutOptions: {
          embed: false,
          media: true,
          logo: true,
        },
        checkoutData: {
          email: userEmail,
          name: userEmail.split('@')[0], // Use email prefix as name fallback
          custom: {
            user_email: userEmail,
            plan_type: planType,
            ...customData
          }
        },
        expiresAt: null,
        preview: false,
        testMode: false,
      };

      console.log('📤 Sending checkout request to LemonSqueezy...');
      
      const response = await createCheckout(
        this.storeId,
        plan.variantId,
        checkoutData
      );

      console.log('📥 LemonSqueezy response:', {
        hasError: !!response.error,
        hasData: !!response.data,
        dataType: typeof response.data,
        error: response.error
      });

      if (response.error) {
        console.error('❌ LemonSqueezy API Error:', response.error);
        throw new Error(`Checkout creation failed: ${JSON.stringify(response.error)}`);
      }

      if (!response.data?.data?.attributes?.url) {
        console.error('❌ Invalid response structure from LemonSqueezy:', {
          hasData: !!response.data,
          hasDataData: !!response.data?.data,
          hasAttributes: !!response.data?.data?.attributes,
          hasUrl: !!response.data?.data?.attributes?.url,
          fullResponse: response
        });
        throw new Error('Invalid response from payment processor - no checkout URL received');
      }

      const result = {
        checkoutUrl: response.data.data.attributes.url,
        checkoutId: response.data.data.id || ''
      };

      console.log('✅ Checkout session created successfully:', result);
      return result;
      
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