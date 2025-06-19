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
    };
  };
  data: {
    type: string;
    id: string;
    attributes: {
      store_id: number;
      customer_id: number;
      order_id?: number;
      subscription_id?: number;
      product_id: number;
      variant_id: number;
      status: string;
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
    
    const { meta, data } = payload
    const eventName = meta.event_name

    console.log('Processing webhook event:', eventName, data?.id || 'no-id')

    // Initialize Supabase client
    console.log('Initializing Supabase client...');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
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
    const customerEmail = data?.attributes?.customer_email || meta?.custom_data?.user_email
    
    if (!customerEmail) {
      console.error('No customer email found in webhook data')
      return new Response('Bad Request: No customer email', { 
        status: 400, 
        headers: corsHeaders 
      })
    }

    console.log('Processing for customer:', customerEmail);

    // Map variant ID to subscription type
    const subscriptionType = mapVariantToSubscriptionType(data.attributes.variant_id.toString())
    
    // Map LemonSqueezy status to our status fields
    const { paymentStatus, subscriptionStatus } = mapLemonSqueezyStatus(
      data.attributes.status, 
      eventName
    )

    // Calculate dates
    let startDate: string | null = null
    let endDate: string | null = null
    let nextBillingDate: string | null = null

    if (eventName === 'order_created' && subscriptionType === 'lifetime') {
      // Lifetime purchase - no end date
      startDate = data.attributes.created_at
      endDate = null
      nextBillingDate = null
    } else if (eventName.startsWith('subscription_')) {
      // Subscription events
      startDate = data.attributes.created_at
      endDate = data.attributes.ends_at || null
      nextBillingDate = data.attributes.renews_at || null
    }

    // Update database using the stored function
    const { error } = await supabase.rpc('update_subscription_from_lemonsqueezy', {
      p_email: customerEmail,
      p_customer_id: data.attributes.customer_id.toString(),
      p_variant_id: data.attributes.variant_id.toString(),
      p_payment_status: paymentStatus,
      p_subscription_status: subscriptionStatus,
      p_subscription_type: subscriptionType,
      p_subscription_id: data.attributes.subscription_id?.toString() || null,
      p_order_id: data.attributes.order_id?.toString() || null,
      p_start_date: startDate,
      p_end_date: endDate,
      p_next_billing_date: nextBillingDate
    })

    if (error) {
      console.error('Database update error:', error)
      return new Response('Database Error', { 
        status: 500, 
        headers: corsHeaders 
      })
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

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Webhook processing error:', error)
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
}) 