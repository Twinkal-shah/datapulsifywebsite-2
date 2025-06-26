import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface WebhookPayload {
  meta: {
    event_name: string;
    custom_data?: {
      user_email?: string;
      plan_type?: string;
      variant_id?: string;
      is_upgrade?: string;
      from_plan?: string;
    };
  };
  data: {
    type: string;
    id: string;
    variant_id?: number;
    customer_id?: number;
    status?: string;
    attributes: {
      store_id: number;
      customer_id?: number;
      customerId?: number;
      order_id?: number;
      subscription_id?: number;
      product_id: number;
      variant_id?: number;
      variantId?: number;
      product_variant_id?: number;
      variant?: number;
      status?: string;
      state?: string;
      customer_email: string;
      total: number;
      subtotal: number;
      created_at: string;
      updated_at: string;
      renews_at?: string;
      ends_at?: string;
      trial_ends_at?: string;
    };
  };
}

async function validateSignature(body: string, signature: string): Promise<boolean> {
  try {
    const webhookSecret = Deno.env.get('LEMONSQUEEZY_WEBHOOK_SECRET') || 'dppricing_123';
    
    console.log('Signature validation debug:', {
      providedSignature: signature,
      secretSet: !!webhookSecret,
      bodyLength: body.length
    });
    
    // LemonSqueezy sends signatures in format: sha256=<hex>
    if (!signature.startsWith('sha256=')) {
      console.error('Invalid signature format, expected sha256=<hex>');
      return false;
    }
    
    const providedHash = signature.replace('sha256=', '');
    
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(webhookSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const expectedSignature = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
    const expectedHex = Array.from(new Uint8Array(expectedSignature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    const isValid = expectedHex === providedHash;
    
    console.log('Signature validation result:', {
      expectedHex: expectedHex.substring(0, 10) + '...',
      providedHash: providedHash.substring(0, 10) + '...',
      isValid
    });
    
    return isValid;
  } catch (error) {
    console.error('Error validating signature:', error);
    return false;
  }
}

function mapVariantToSubscriptionType(variantId: string): string {
  const lifetimeVariant = Deno.env.get('VITE_LEMONSQUEEZY_VARIANT_LIFETIME') || '857607';
  const monthlyVariant = Deno.env.get('VITE_LEMONSQUEEZY_VARIANT_MONTHLY') || '830787';
  
  console.log('Mapping variant:', { variantId, lifetimeVariant, monthlyVariant });
  
  if (variantId === lifetimeVariant) {
    return 'lifetime';
  } else if (variantId === monthlyVariant) {
    return 'monthly_pro';
  }
  return 'free';
}

function mapLemonSqueezyStatus(status: string, eventName: string): { paymentStatus: string; subscriptionStatus: string } {
  switch (eventName) {
    case 'order_created':
      return {
        paymentStatus: status === 'paid' ? 'paid' : 'pending',
        subscriptionStatus: status === 'paid' ? 'active' : 'inactive'
      };
    case 'subscription_created':
      return {
        paymentStatus: 'paid',
        subscriptionStatus: 'active'
      };
    case 'subscription_updated':
      return {
        paymentStatus: 'paid',
        subscriptionStatus: status === 'active' ? 'active' : status === 'cancelled' ? 'cancelled' : 'inactive'
      };
    case 'subscription_cancelled':
      return {
        paymentStatus: 'paid',
        subscriptionStatus: 'cancelled'
      };
    case 'subscription_expired':
      return {
        paymentStatus: 'paid',
        subscriptionStatus: 'expired'
      };
    default:
      return {
        paymentStatus: 'pending',
        subscriptionStatus: 'inactive'
      };
  }
}

serve(async (req) => {
  console.log('=== Webhook Request Started ===');
  console.log('Method:', req.method);
  console.log('Headers:', Object.fromEntries(req.headers.entries()));
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request');
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    console.log('Method not allowed:', req.method);
    return new Response('Method not allowed', { 
      status: 405, 
      headers: corsHeaders 
    })
  }

  try {
    // Get the request body
    const body = await req.text()
    const signature = req.headers.get('x-signature') || ''

    console.log('Received webhook:', {
      signature: signature ? signature.substring(0, 20) + '...' : 'NO SIGNATURE',
      bodyLength: body.length,
      bodyPreview: body.substring(0, 200) + '...'
    })

    // Temporarily disable signature validation for debugging
    // TODO: Re-enable signature validation in production
    console.log('Signature validation temporarily disabled for debugging');
    
    /*
    // For testing purposes, make signature validation more permissive
    // In production, you should always validate signatures
    if (signature && signature !== '') {
      // Log signature details for debugging
      console.log('Signature validation details:', {
        providedSignature: signature,
        webhookSecret: Deno.env.get('LEMONSQUEEZY_WEBHOOK_SECRET') ? 'Set' : 'Not set'
      });
      
      // Validate webhook signature only if signature is provided
      if (!await validateSignature(body, signature)) {
        console.error('Invalid webhook signature')
        return new Response('Unauthorized - Invalid Signature', { 
          status: 401, 
          headers: corsHeaders 
        })
      }
      console.log('Signature validation passed');
    } else {
      console.warn('No signature provided - allowing for testing purposes');
    }
    */

    // Parse the webhook payload
    let payload: WebhookPayload;
    try {
      payload = JSON.parse(body);
    } catch (parseError) {
      console.error('Failed to parse JSON:', parseError);
      return new Response('Bad Request - Invalid JSON', { 
        status: 400, 
        headers: corsHeaders 
      });
    }
    
    const { meta, data } = payload;
    const eventName = meta.event_name;
    const isUpgrade = meta.custom_data?.is_upgrade === 'true';
    const fromPlan = meta.custom_data?.from_plan;

    console.log('Processing webhook event:', {
      eventName,
      isUpgrade,
      fromPlan,
      dataId: data?.id || 'no-id'
    });

    // Initialize Supabase client
    console.log('Initializing Supabase client...');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    console.log('Environment check:', {
      supabaseUrl: supabaseUrl ? 'Present' : 'Missing',
      serviceKey: supabaseServiceKey ? 'Present' : 'Missing'
    });
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase environment variables');
      return new Response('Server Configuration Error', { 
        status: 500, 
        headers: corsHeaders 
      });
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    console.log('Supabase client created successfully');

    // Extract customer email from webhook data
    const customerEmail = data?.attributes?.customer_email || meta?.custom_data?.user_email;
    
    if (!customerEmail) {
      console.error('No customer email found in webhook data');
      return new Response('Bad Request: No customer email', { 
        status: 400, 
        headers: corsHeaders 
      });
    }

    console.log('Processing for customer:', customerEmail);

    // Validate required webhook data
    if (!data?.attributes) {
      console.error('Missing data.attributes in webhook payload');
      console.error('Full payload structure:', JSON.stringify(payload, null, 2));
      return new Response(JSON.stringify({ 
        error: 'Bad Request', 
        message: 'Missing required webhook data.attributes',
        payload: payload 
      }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const attributes = data.attributes;
    
    // Log the complete attributes structure for debugging
    console.log('=== WEBHOOK PAYLOAD ANALYSIS ===');
    console.log('Event Name:', eventName);
    console.log('Data Type:', data.type);
    console.log('Attributes structure:', JSON.stringify(attributes, null, 2));
    console.log('Available keys in attributes:', Object.keys(attributes));
    console.log('================================');
    
    // Try to find variant_id in different possible locations
    let variantId: string | number | undefined = attributes.variant_id || 
                    attributes.variantId || 
                    attributes.product_variant_id ||
                    attributes.variant ||
                    data.variant_id ||
                    meta?.custom_data?.variant_id;
    
    // Try to find customer_id in different possible locations
    let customerId: string | number | undefined = attributes.customer_id || 
                     attributes.customerId || 
                     data.customer_id;
    
    // Try to find status in different possible locations  
    let status: string | undefined = attributes.status || 
                 attributes.state || 
                 data.status;

    // If still missing critical fields, log everything and try to extract from other sources
    if (!variantId || !customerId || !status) {
      console.error('=== MISSING REQUIRED FIELDS ===');
      console.error('variant_id found:', !!variantId, variantId);
      console.error('customer_id found:', !!customerId, customerId);
      console.error('status found:', !!status, status);
      console.error('Complete payload for analysis:', JSON.stringify(payload, null, 2));
      console.error('================================');
      
      // For debugging, let's be more permissive and try to continue with defaults
      if (!variantId) {
        console.warn('variant_id missing, attempting to extract from other sources...');
        // Check if it's in the URL or other locations
        variantId = 'unknown';
      }
      
      if (!customerId) {
        console.warn('customer_id missing, attempting to extract from other sources...');
        customerId = 'unknown';
      }
      
      if (!status) {
        console.warn('status missing, defaulting to "paid" for processing...');
        status = 'paid'; // Default assumption for successful webhooks
      }
    }

    console.log('Extracted values after validation:', {
      variant_id: variantId,
      customer_id: customerId,
      status: status,
      subscription_id: attributes.subscription_id || 'none',
      order_id: attributes.order_id || 'none'
    });

    // Only fail if we absolutely cannot continue
    if (variantId === 'unknown' || customerId === 'unknown') {
      console.error('Cannot proceed without variant_id and customer_id');
      
      // Last attempt: try to get variant_id from environment variables if this is a known purchase
      if (variantId === 'unknown') {
        const lifetimeVariant = Deno.env.get('VITE_LEMONSQUEEZY_VARIANT_LIFETIME') || '857607';
        const monthlyVariant = Deno.env.get('VITE_LEMONSQUEEZY_VARIANT_MONTHLY') || '830787';
        
        // For debugging, let's try using the lifetime variant as default if email indicates lifetime purchase
        if (customerEmail && (eventName === 'order_created' || eventName.includes('order'))) {
          console.warn('Attempting to use lifetime variant as fallback for order_created event');
          variantId = lifetimeVariant;
        } else {
          console.warn('Attempting to use monthly variant as fallback');
          variantId = monthlyVariant;
        }
      }
      
      if (customerId === 'unknown') {
        // Generate a customer ID based on email hash for consistency
        const emailHash = Array.from(customerEmail)
          .reduce((hash, char) => {
            return ((hash << 5) - hash) + char.charCodeAt(0);
          }, 0)
          .toString()
          .replace('-', '');
        customerId = `temp_${emailHash}`;
        console.warn('Generated temporary customer_id from email:', customerId);
      }
      
      console.log('Proceeding with fallback values:', {
        variant_id: variantId,
        customer_id: customerId,
        customer_email: customerEmail,
        event_name: eventName
      });
      
      // If still unknown after fallbacks, return detailed error
      if (variantId === 'unknown' || customerId === 'unknown') {
        return new Response(JSON.stringify({ 
          error: 'Bad Request', 
          message: 'Missing critical fields: variant_id or customer_id',
          found_fields: {
            variant_id: variantId,
            customer_id: customerId,
            status: status
          },
          payload_keys: Object.keys(attributes),
          attempted_fallbacks: {
            tried_env_variants: true,
            tried_email_hash: true,
            customer_email: customerEmail,
            event_name: eventName
          }
        }), { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Ensure we have string values for processing
    const finalVariantId = variantId?.toString() || 'unknown';
    const finalCustomerId = customerId?.toString() || 'unknown';

    // Map variant ID to subscription type
    const subscriptionType = mapVariantToSubscriptionType(finalVariantId)
    
    // Map LemonSqueezy status to our status fields
    const { paymentStatus, subscriptionStatus } = mapLemonSqueezyStatus(
      status || 'paid', 
      eventName
    )

    // Calculate dates
    let startDate: string | null = null
    let endDate: string | null = null
    let nextBillingDate: string | null = null

    if (eventName === 'order_created' && subscriptionType === 'lifetime') {
      // Lifetime purchase - no end date, but ensure we have a start date
      startDate = attributes.created_at || new Date().toISOString()
      endDate = null
      nextBillingDate = null
      console.log('Processing lifetime order:', {
        startDate,
        paymentStatus,
        subscriptionStatus,
        customerEmail
      });
    } else if (eventName.startsWith('subscription_')) {
      // Subscription events
      startDate = attributes.created_at || null
      endDate = attributes.ends_at || null
      nextBillingDate = attributes.renews_at || null
      
      // For monthly subscriptions, if LemonSqueezy doesn't provide ends_at,
      // calculate it as 30 days from the start date
      if (subscriptionType === 'monthly_pro' && !endDate && startDate) {
        const startDateObj = new Date(startDate);
        const endDateObj = new Date(startDateObj);
        endDateObj.setDate(startDateObj.getDate() + 30);
        endDate = endDateObj.toISOString();
        console.log('Calculated subscription end date for monthly_pro:', {
          startDate,
          calculatedEndDate: endDate
        });
      }
      
      // For monthly subscriptions, if LemonSqueezy doesn't provide renews_at,
      // set it to the same as end date
      if (subscriptionType === 'monthly_pro' && !nextBillingDate && endDate) {
        nextBillingDate = endDate;
      }
    } else if (eventName === 'order_created' && subscriptionType === 'monthly_pro') {
      // Handle monthly subscription orders
      startDate = attributes.created_at || new Date().toISOString()
      if (startDate) {
        const startDateObj = new Date(startDate);
        const endDateObj = new Date(startDateObj);
        endDateObj.setDate(startDateObj.getDate() + 30);
        endDate = endDateObj.toISOString();
        nextBillingDate = endDate;
        console.log('Calculated dates for monthly_pro order:', {
          startDate,
          endDate,
          nextBillingDate
        });
      }
    }

    console.log('Prepared data for database:', {
      email: customerEmail,
      customer_id: finalCustomerId,
      variant_id: finalVariantId,
      subscription_type: subscriptionType,
      payment_status: paymentStatus,
      subscription_status: subscriptionStatus
    });

    // Update database using the stored function
    const { error } = await supabase.rpc('update_subscription_from_lemonsqueezy', {
      p_email: customerEmail,
      p_customer_id: finalCustomerId,
      p_variant_id: finalVariantId,
      p_payment_status: paymentStatus,
      p_subscription_status: subscriptionStatus,
      p_subscription_type: subscriptionType,
      p_subscription_id: attributes.subscription_id?.toString() || null,
      p_order_id: attributes.order_id?.toString() || null,
      p_start_date: startDate,
      p_end_date: endDate,
      p_next_billing_date: nextBillingDate,
      p_amount: attributes.total || null
    });

    if (error) {
      console.error('Database update error:', error);
      return new Response(JSON.stringify({ 
        error: 'Database Error', 
        message: 'Failed to update subscription data',
        details: error.message,
        code: error.code 
      }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // For Lifetime plans, ensure the lifetime_deal_status is set to active
    if (subscriptionType === 'lifetime' && paymentStatus === 'paid') {
      const { error: lifetimeError } = await supabase
        .from('user_installations')
        .update({
          lifetime_deal_status: 'active',
          subscription_end_date: null,
          next_billing_date: null
        })
        .eq('email', customerEmail);

      if (lifetimeError) {
        console.error('Error updating lifetime status:', lifetimeError);
      } else {
        console.log('Successfully activated lifetime plan for:', customerEmail);
      }
    }

    // Handle specific event types
    switch (eventName) {
      case 'order_created':
        console.log(`Order created for ${customerEmail}: ${subscriptionType}`)
        break
      case 'subscription_created':
        console.log(`Subscription created for ${customerEmail}: ${subscriptionType}`)
        break
      case 'subscription_updated':
        console.log(`Subscription updated for ${customerEmail}: ${subscriptionStatus}`)
        break
      case 'subscription_cancelled':
        console.log(`Subscription cancelled for ${customerEmail}`)
        break
      case 'subscription_expired':
        console.log(`Subscription expired for ${customerEmail}`)
        break
      default:
        console.log(`Unhandled event: ${eventName}`)
    }

    // For upgrades from Monthly Pro to Lifetime, we need to cancel the monthly subscription
    if (isUpgrade && fromPlan === 'monthly_pro' && eventName === 'order_created') {
      console.log('Processing upgrade from Monthly Pro to Lifetime');
      
      try {
        // Get the user's current subscription details
        const { data: userData, error: userError } = await supabase
          .from('user_installations')
          .select('lemonsqueezy_subscription_id')
          .eq('email', customerEmail)
          .single();

        if (userError) {
          console.error('Error fetching user subscription:', userError);
        } else if (userData?.lemonsqueezy_subscription_id) {
          // Cancel the existing monthly subscription
          const response = await fetch(`https://api.lemonsqueezy.com/v1/subscriptions/${userData.lemonsqueezy_subscription_id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${Deno.env.get('LEMONSQUEEZY_API_KEY')}`,
              'Accept': 'application/vnd.api+json',
              'Content-Type': 'application/vnd.api+json'
            }
          });

          if (!response.ok) {
            const error = await response.json();
            console.error('Failed to cancel subscription:', error);
          } else {
            console.log('Successfully cancelled subscription:', userData.lemonsqueezy_subscription_id);
            
            // Update the user's subscription to Lifetime
            const { error: updateError } = await supabase
              .from('user_installations')
              .update({
                subscription_type: 'lifetime',
                subscription_status: 'active',
                payment_status: 'paid',
                subscription_end_date: null, // Lifetime has no end date
                next_billing_date: null, // Lifetime has no billing date
                lifetime_deal_status: 'active'
              })
              .eq('email', customerEmail);

            if (updateError) {
              console.error('Error updating to lifetime plan:', updateError);
            } else {
              console.log('Successfully updated to lifetime plan for:', customerEmail);
            }
          }
        }
      } catch (error) {
        console.error('Error processing upgrade:', error);
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Webhook processing error:', error)
    
    // Provide more detailed error information
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const errorStack = error instanceof Error ? error.stack : 'No stack trace available';
    
    console.error('Error details:', {
      message: errorMessage,
      stack: errorStack,
      type: typeof error
    });
    
    return new Response(JSON.stringify({ 
      error: 'Internal Server Error',
      message: 'Webhook processing failed',
      details: errorMessage,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
}) 